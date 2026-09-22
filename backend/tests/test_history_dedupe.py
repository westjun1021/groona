from app.config import settings
from app.db import SCHEMA,conn,init_db
def _legacy_db(tmp_path,monkeypatch):
    """유니크 인덱스가 없던 시절의 DB를 흉내 낸다."""
    monkeypatch.setattr(settings,"db_path",str(tmp_path/"legacy.db"))
    c=conn();c.executescript(SCHEMA)
    c.execute("INSERT INTO users(id,email,password_hash) VALUES(1,'a@b.c','x')")
    c.execute("INSERT INTO children(id,user_id,name,age) VALUES(1,1,'민준',8)")
    c.execute("INSERT INTO children(id,user_id,name,age) VALUES(2,1,'지우',6)")
    for _ in range(3):c.execute("INSERT INTO history(user_id,child_id,activity_id,category) VALUES(1,1,'act1','과학·탐구')")
    c.execute("INSERT INTO history(user_id,child_id,activity_id,category) VALUES(1,1,'act2','창의·예술')")
    c.execute("INSERT INTO history(user_id,child_id,activity_id,category) VALUES(1,2,'act1','과학·탐구')")
    c.commit();c.close()
def test_init_db_dedupes_existing_history(tmp_path,monkeypatch):
    _legacy_db(tmp_path,monkeypatch);init_db()
    c=conn()
    rows={(r[0],r[1]):r[2] for r in c.execute("SELECT child_id,activity_id,COUNT(*) FROM history GROUP BY child_id,activity_id")}
    c.close()
    # 자녀별로는 1건씩 남고, 다른 자녀의 같은 활동은 별개로 보존된다
    assert rows=={(1,"act1"):1,(1,"act2"):1,(2,"act1"):1}
def test_insert_or_ignore_blocks_second_completion(tmp_path,monkeypatch):
    _legacy_db(tmp_path,monkeypatch);init_db()
    c=conn()
    dup=c.execute("INSERT OR IGNORE INTO history(user_id,child_id,activity_id,category) VALUES(1,1,'act1','과학·탐구')")
    assert dup.rowcount==0          # already=True
    new=c.execute("INSERT OR IGNORE INTO history(user_id,child_id,activity_id,category) VALUES(1,1,'act3','언어·독서')")
    assert new.rowcount==1          # already=False
    other=c.execute("INSERT OR IGNORE INTO history(user_id,child_id,activity_id,category) VALUES(1,2,'act2','창의·예술')")
    assert other.rowcount==1        # 다른 자녀는 막히지 않는다
    c.commit();c.close()
def test_init_db_is_idempotent(tmp_path,monkeypatch):
    _legacy_db(tmp_path,monkeypatch);init_db();init_db()
    c=conn();n=c.execute("SELECT COUNT(*) FROM history").fetchone()[0];c.close()
    assert n==3
