import datetime
import pytest
from fastapi.testclient import TestClient
from app.config import settings
from app.db import conn,init_db
@pytest.fixture
def client(tmp_path,monkeypatch):
    monkeypatch.setattr(settings,"db_path",str(tmp_path/"api.db"))
    init_db()
    c=conn()
    for aid,cat in [("act-sci","과학·탐구"),("act-art","창의·예술")]:
        c.execute("INSERT INTO activities(id,title,category) VALUES(?,?,?)",(aid,"테스트 "+cat,cat))
    c.commit();c.close()
    # with 문을 쓰지 않으므로 startup(외부 공공데이터 동기화)은 돌지 않는다.
    from app.main import app
    return TestClient(app)
def add_child(client,h,name,age):
    """만 나이 age 가 되는 출생 연·월로 자녀를 만든다(생일 달을 이번 달로 두면 오늘 기준 정확히 age)."""
    t=datetime.date.today()
    return client.post("/me/children",json={"name":name,"birth_year":t.year-age,"birth_month":t.month},headers=h).json()["id"]
def headers(client,email="a@b.c"):
    return {"Authorization":"Bearer "+client.post("/auth/register",json={"email":email,"password":"pw123456"}).json()["access_token"]}
def growth(client,h,child_id=None):
    url="/me/growth"+(f"?child_id={child_id}" if child_id else "")
    return {x["category"]:x["count"] for x in client.get(url,headers=h).json()["items"]}
def test_growth_is_scoped_to_the_selected_child(client):
    """A 에게만 완료하면 A 만 +1 이고 B 는 그대로여야 한다(자녀 탭이 같은 값을 보이던 버그)."""
    h=headers(client)
    A=add_child(client,h,"민준",8)
    B=add_child(client,h,"지우",6)
    assert growth(client,h,A)=={} and growth(client,h,B)=={}
    assert client.post("/me/history",json={"activity_id":"act-sci","child_id":A},headers=h).json()=={"ok":True,"already":False}
    assert growth(client,h,A)=={"과학·탐구":1}
    assert growth(client,h,B)=={}                       # 다른 자녀는 변하지 않는다
    assert growth(client,h)=={"과학·탐구":1}             # child_id 없으면 계정 전체 합산
    client.post("/me/history",json={"activity_id":"act-art","child_id":B},headers=h)
    assert growth(client,h,A)=={"과학·탐구":1}           # B 에 기록해도 A 는 그대로
    assert growth(client,h,B)=={"창의·예술":1}
    assert growth(client,h)=={"과학·탐구":1,"창의·예술":1}
def test_repeated_completion_does_not_inflate_growth(client):
    h=headers(client)
    A=add_child(client,h,"민준",8)
    assert client.post("/me/history",json={"activity_id":"act-sci","child_id":A},headers=h).json()["already"] is False
    for _ in range(3):
        assert client.post("/me/history",json={"activity_id":"act-sci","child_id":A},headers=h).json()["already"] is True
    assert growth(client,h,A)=={"과학·탐구":1}
def test_growth_rejects_other_users_child(client):
    h1=headers(client,"one@b.c");h2=headers(client,"two@b.c")
    mine=add_child(client,h1,"민준",8)
    r=client.get(f"/me/growth?child_id={mine}",headers=h2)
    assert r.status_code==404
def test_completion_changes_only_the_selected_child(client):
    """짱구에만 완료 → 짱구만 +1, 나머지 자녀의 카테고리별 수치는 한 칸도 변하지 않는다."""
    h=headers(client)
    ids={}
    for nm,age in [("테스트",8),("철수",5),("짱구",7)]:
        ids[nm]=add_child(client,h,nm,age)
    client.post("/me/history",json={"activity_id":"act-art","child_id":ids["테스트"]},headers=h)
    before={nm:growth(client,h,cid) for nm,cid in ids.items()}
    client.post("/me/history",json={"activity_id":"act-sci","child_id":ids["짱구"]},headers=h)
    after={nm:growth(client,h,cid) for nm,cid in ids.items()}
    assert after["짱구"]=={**before["짱구"],"과학·탐구":before["짱구"].get("과학·탐구",0)+1}
    assert after["테스트"]==before["테스트"]   # 선택하지 않은 자녀는 불변
    assert after["철수"]==before["철수"]
    assert len({id(v) for v in after.values()})==3 and after["테스트"]!=after["짱구"]
def test_growth_response_echoes_requested_child_id(client):
    """응답이 집계 기준 child_id 를 되돌려줘야 구버전 서버(child_id 무시)를 클라이언트가 감지할 수 있다."""
    h=headers(client)
    A=add_child(client,h,"민준",8)
    assert client.get(f"/me/growth?child_id={A}",headers=h).json()["child_id"]==A
    assert client.get("/me/growth",headers=h).json()["child_id"] is None
