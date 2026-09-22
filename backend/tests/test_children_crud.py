import datetime
import pytest
from fastapi.testclient import TestClient
from app.config import settings
from app.db import SCHEMA,conn,init_db
@pytest.fixture
def client(tmp_path,monkeypatch):
    monkeypatch.setattr(settings,"db_path",str(tmp_path/"crud.db"))
    init_db()
    c=conn();c.execute("INSERT INTO activities(id,title,category) VALUES('act-sci','테스트','과학·탐구')");c.commit();c.close()
    from app.main import app
    return TestClient(app)
def headers(client,email="a@b.c"):
    return {"Authorization":"Bearer "+client.post("/auth/register",json={"email":email,"password":"pw123456"}).json()["access_token"]}
TODAY=datetime.date.today()
def test_add_child_stores_birth_and_returns_computed_age(client):
    h=headers(client)
    r=client.post("/me/children",json={"name":"짱구","birth_year":TODAY.year-7,"birth_month":TODAY.month},headers=h)
    assert r.status_code==200 and r.json()["age"]==7
    item=client.get("/me/children",headers=h).json()["items"][0]
    assert item["birth_year"]==TODAY.year-7 and item["birth_month"]==TODAY.month and item["age"]==7
def test_age_is_computed_not_stored(client):
    """생일이 아직 안 지난 달이면 한 살 적게 계산된다(저장된 값이 아니라 매번 계산)."""
    h=headers(client)
    later=TODAY.month+1
    if later>12:pytest.skip("12월에는 이 달 기준 검증 불가")
    client.post("/me/children",json={"name":"철수","birth_year":TODAY.year-7,"birth_month":later},headers=h)
    assert client.get("/me/children",headers=h).json()["items"][0]["age"]==6
def test_add_child_validates_age_range(client):
    h=headers(client)
    assert client.post("/me/children",json={"name":"어른","birth_year":TODAY.year-30,"birth_month":1},headers=h).status_code==400
    assert client.post("/me/children",json={"name":"미래","birth_year":TODAY.year+2,"birth_month":1},headers=h).status_code==400
    assert client.post("/me/children",json={"name":"달오류","birth_year":TODAY.year-7,"birth_month":13},headers=h).status_code==400
def test_patch_child_updates_fields_and_recomputes_age(client):
    h=headers(client)
    cid=client.post("/me/children",json={"name":"짱구","birth_year":TODAY.year-7,"birth_month":TODAY.month},headers=h).json()["id"]
    assert client.patch(f"/me/children/{cid}",json={"name":"신짱구","region":"울산"},headers=h).json()=={"ok":True}
    item=client.get("/me/children",headers=h).json()["items"][0]
    assert item["name"]=="신짱구" and item["region"]=="울산" and item["age"]==7   # 이름만 바꿔도 나이는 유지
    client.patch(f"/me/children/{cid}",json={"birth_year":TODAY.year-5},headers=h)
    assert client.get("/me/children",headers=h).json()["items"][0]["age"]==5
def test_patch_rejects_other_users_child(client):
    h1=headers(client,"one@b.c");h2=headers(client,"two@b.c")
    cid=client.post("/me/children",json={"name":"짱구","birth_year":TODAY.year-7,"birth_month":TODAY.month},headers=h1).json()["id"]
    assert client.patch(f"/me/children/{cid}",json={"name":"탈취"},headers=h2).status_code==404
    assert client.delete(f"/me/children/{cid}",headers=h2).status_code==404
    assert client.get("/me/children",headers=h1).json()["items"][0]["name"]=="짱구"
def test_delete_child_cascades_history(client):
    h=headers(client)
    cid=client.post("/me/children",json={"name":"짱구","birth_year":TODAY.year-7,"birth_month":TODAY.month},headers=h).json()["id"]
    client.post("/me/history",json={"activity_id":"act-sci","child_id":cid},headers=h)
    c=conn();assert c.execute("SELECT COUNT(*) FROM history WHERE child_id=?",(cid,)).fetchone()[0]==1;c.close()
    assert client.delete(f"/me/children/{cid}",headers=h).json()=={"ok":True}
    assert client.get("/me/children",headers=h).json()["items"]==[]
    c=conn();assert c.execute("SELECT COUNT(*) FROM history WHERE child_id=?",(cid,)).fetchone()[0]==0;c.close()
def test_migration_preserves_existing_children_age(tmp_path,monkeypatch):
    """birth 컬럼이 없던 DB의 자녀는 저장된 age 를 그대로 유지해야 한다."""
    monkeypatch.setattr(settings,"db_path",str(tmp_path/"legacy.db"))
    legacy=SCHEMA.replace("age INTEGER NOT NULL,birth_year INTEGER,birth_month INTEGER,","age INTEGER NOT NULL,")
    c=conn();c.executescript(legacy)
    c.execute("INSERT INTO users(id,email,password_hash) VALUES(1,'a@b.c','x')")
    for i,(nm,ag) in enumerate([("테스트",8),("철수",5),("짱구",7)],start=1):
        c.execute("INSERT INTO children(id,user_id,name,age) VALUES(?,1,?,?)",(i,nm,ag))
    c.commit();c.close()
    init_db()
    from app.routers.api import child_dict
    c=conn();rows=[child_dict(r) for r in c.execute("SELECT * FROM children ORDER BY id")];c.close()
    assert [(r["name"],r["age"]) for r in rows]==[("테스트",8),("철수",5),("짱구",7)]
    assert all(r["birth_year"]==TODAY.year-r["age"] and r["birth_month"]==TODAY.month for r in rows)
