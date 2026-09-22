import datetime
import pytest
from fastapi.testclient import TestClient
from app.config import settings
from app.db import activity_rows,conn,init_db
TODAY=datetime.date.today()
def d(offset):return (TODAY+datetime.timedelta(days=offset)).isoformat()+" 18:00"
@pytest.fixture
def db(tmp_path,monkeypatch):
    monkeypatch.setattr(settings,"db_path",str(tmp_path/"sort.db"))
    init_db()
    c=conn()
    # apply_end: 마감 임박(D-1) / 조금 뒤(D-5) / 이미 지남 / 없음
    rows=[("a-d1","D-1 마감",d(1),"2026-01-01 00:00:00","모집중"),
          ("a-d5","D-5 마감",d(5),"2026-01-02 00:00:00","모집중"),
          ("a-past","지난 마감",d(-3),"2026-01-03 00:00:00","모집중"),
          ("a-none","마감일 없음",None,"2026-01-04 00:00:00","모집중")]
    for aid,title,ae,up,st in rows:
        c.execute("INSERT INTO activities(id,title,category,apply_end,updated_at,status) VALUES(?,?,'과학·탐구',?,?,?)",(aid,title,ae,up,st))
    c.execute("INSERT INTO users(id,email,password_hash) VALUES(1,'a@b.c','x')")
    c.execute("INSERT INTO users(id,email,password_hash) VALUES(2,'b@b.c','x')")
    # 찜: a-none 2개, a-d5 1개, 나머지 0개
    for uid,aid in [(1,"a-none"),(2,"a-none"),(1,"a-d5")]:
        c.execute("INSERT INTO favorites(user_id,activity_id) VALUES(?,?)",(uid,aid))
    c.commit();c.close()
    return True
def ids(**kw):return [r["id"] for r in activity_rows(**kw)]
def test_recent_is_the_default_order(db):
    # 기본값은 기존 정렬(모집중 우선, updated_at 내림차순) 그대로
    assert ids()==["a-none","a-past","a-d5","a-d1"]
    assert ids(sort="recent")==ids()
def test_deadline_puts_soonest_first_and_expired_last(db):
    order=ids(sort="deadline")
    assert order[:2]==["a-d1","a-d5"]              # 남은 마감이 가까운 순
    assert set(order[2:])=={"a-past","a-none"}     # 지났거나 없는 건 뒤로
def test_popular_orders_by_favorite_count(db):
    assert ids(sort="popular")[:2]==["a-none","a-d5"]   # 찜 2개 > 1개
def test_rows_include_fav_count(db):
    counts={r["id"]:r["fav_count"] for r in activity_rows()}
    assert counts=={"a-none":2,"a-d5":1,"a-d1":0,"a-past":0}
def test_unknown_sort_falls_back_to_recent(db):
    assert ids(sort="; DROP TABLE activities")==ids(sort="recent")
    assert ids(sort=None)==ids(sort="recent")
    c=conn();assert c.execute("SELECT COUNT(*) FROM activities").fetchone()[0]==4;c.close()
def test_sort_param_reaches_the_api(db):
    from app.main import app
    client=TestClient(app)
    got=[x["id"] for x in client.get("/activities?sort=deadline&limit=10").json()["items"]]
    assert got[:2]==["a-d1","a-d5"]
    assert "fav_count" in client.get("/activities?limit=1").json()["items"][0]
