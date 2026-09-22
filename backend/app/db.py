
import sqlite3,json,hashlib,datetime
from .config import settings
def conn():
    c=sqlite3.connect(settings.db_path,timeout=10)
    c.row_factory=sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    c.execute("PRAGMA journal_mode=WAL")   # 읽기-쓰기 동시성 허용
    c.execute("PRAGMA busy_timeout=8000")  # 잠금 시 최대 8초 대기
    return c
SCHEMA="""
CREATE TABLE IF NOT EXISTS activities(
 id TEXT PRIMARY KEY,source_key TEXT,source_name TEXT,source_url TEXT,detail_url TEXT,external_id TEXT,region TEXT,city TEXT,
 title TEXT NOT NULL,provider TEXT,place TEXT,address TEXT,lat REAL,lon REAL,age_min INTEGER DEFAULT 3,age_max INTEGER DEFAULT 12,age_known INTEGER DEFAULT 0,
 category TEXT DEFAULT '사회·생활',skills_json TEXT DEFAULT '[]',fee INTEGER,status TEXT,start_date TEXT,end_date TEXT,
 apply_start TEXT,apply_end TEXT,reservation_method TEXT,phone TEXT,raw_json TEXT,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_act_region ON activities(region);
CREATE INDEX IF NOT EXISTS idx_act_dates ON activities(start_date,end_date);
CREATE TABLE IF NOT EXISTS source_status(
 source_key TEXT PRIMARY KEY,name TEXT,description TEXT,source_url TEXT,last_status TEXT,record_count INTEGER DEFAULT 0,last_sync TEXT,last_error TEXT);
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,deleted_at TEXT);
CREATE TABLE IF NOT EXISTS children(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,name TEXT NOT NULL,age INTEGER NOT NULL,birth_year INTEGER,birth_month INTEGER,region TEXT,interest TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS favorites(user_id INTEGER NOT NULL,activity_id TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,activity_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,child_id INTEGER NOT NULL,activity_id TEXT NOT NULL,category TEXT,completed_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(child_id) REFERENCES children(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS benefits(
 id TEXT PRIMARY KEY,title TEXT NOT NULL,summary TEXT,field TEXT,org TEXT,user_type TEXT,target TEXT,content TEXT,
 how_to TEXT,deadline TEXT,phone TEXT,support_type TEXT,region TEXT,url TEXT,views INTEGER DEFAULT 0,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_benefit_region ON benefits(region);
CREATE INDEX IF NOT EXISTS idx_benefit_views ON benefits(views);
CREATE TABLE IF NOT EXISTS push_tokens(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,token TEXT UNIQUE NOT NULL,platform TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
"""
def init_db():
    c=conn();c.executescript(SCHEMA)
    # 기존 DB 보존형 마이그레이션: 이미 만들어진 activities 에 age_known 을 덧붙인다.
    try:c.execute("ALTER TABLE activities ADD COLUMN age_known INTEGER DEFAULT 0")
    except Exception:pass
    # 같은 자녀·같은 활동의 완료 기록은 1건만 남긴다. 인덱스를 걸기 전에 기존 중복부터
    # 정리해야 하며(중복이 남아 있으면 UNIQUE 생성이 실패한다), 가장 먼저 기록된 행을 보존한다.
    c.execute("DELETE FROM history WHERE id NOT IN (SELECT MIN(id) FROM history GROUP BY child_id,activity_id)")
    c.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_history_child_activity ON history(child_id,activity_id)")
    # 자녀는 나이 대신 출생 연·월로 저장한다(시간이 지나면 만 나이가 자동으로 갱신되도록).
    for sql in ("ALTER TABLE children ADD COLUMN birth_year INTEGER","ALTER TABLE children ADD COLUMN birth_month INTEGER"):
        try:c.execute(sql)
        except Exception:pass
    # 기존 자녀는 저장된 age 로 역산한다. 생일 달을 이번 달로 두면 오늘 기준 나이가 그대로 유지된다.
    c.execute("UPDATE children SET birth_year=CAST(strftime('%Y','now','localtime') AS INTEGER)-age,"
              "birth_month=CAST(strftime('%m','now','localtime') AS INTEGER) WHERE birth_year IS NULL")
    c.commit();c.close()
def make_id(source_key,external_id,title,provider=""):
    return hashlib.sha1(f"{source_key}|{external_id}|{title}|{provider}".encode()).hexdigest()[:24]
ACT_FIELDS=["id","source_key","source_name","source_url","detail_url","external_id","region","city","title","provider","place","address","lat","lon","age_min","age_max","age_known","category","skills_json","fee","status","start_date","end_date","apply_start","apply_end","reservation_method","phone","raw_json"]
UPSERT_ACT="INSERT INTO activities("+",".join(ACT_FIELDS)+") VALUES("+",".join(["?"]*len(ACT_FIELDS))+") ON CONFLICT(id) DO UPDATE SET "+",".join([f"{k}=excluded.{k}" for k in ACT_FIELDS[1:]])+",updated_at=CURRENT_TIMESTAMP"
def upsert_activity(a):
    c=conn();c.execute(UPSERT_ACT,[a.get(k) for k in ACT_FIELDS]);c.commit();c.close()
def upsert_many(rows):
    """수집분을 한 연결·한 트랜잭션으로 반영한다. 행마다 커밋하면 동기화 내내 쓰기 잠금이 반복돼
    같은 시간대의 찜/이력 쓰기가 잠금 대기를 초과해 실패한다."""
    if not rows:return 0
    c=conn()
    try:
        c.execute("BEGIN IMMEDIATE")
        c.executemany(UPSERT_ACT,[[a.get(k) for k in ACT_FIELDS] for a in rows])
        c.commit()
    except Exception:
        c.rollback();raise
    finally:
        c.close()
    return len(rows)
# 정렬 기준은 화이트리스트로만 받는다(사용자 입력을 SQL 에 그대로 끼워 넣지 않기 위해).
SORTS={
 "recent":"CASE WHEN status='모집중' THEN 0 ELSE 1 END, updated_at DESC",
 # 신청 마감이 남은 건을 가까운 순으로 앞세우고, 이미 지났거나 마감일이 없는 건은 뒤로 보낸다.
 "deadline":"CASE WHEN apply_end IS NOT NULL AND date(substr(apply_end,1,10))>=date('now','localtime') THEN 0 ELSE 1 END,"
            "CASE WHEN apply_end IS NOT NULL AND date(substr(apply_end,1,10))>=date('now','localtime') THEN substr(apply_end,1,10) END ASC,"
            "updated_at DESC",
 # 인기 = 이 앱 사용자들의 실제 찜 수(공공데이터에는 인기 지표가 없다).
 "popular":"fav_count DESC, updated_at DESC",
}
# --- 육아 지원·정책(보조금24) ---
BEN_FIELDS=["id","title","summary","field","org","user_type","target","content","how_to","deadline","phone","support_type","region","url","views"]
UPSERT_BEN="INSERT INTO benefits("+",".join(BEN_FIELDS)+") VALUES("+",".join(["?"]*len(BEN_FIELDS))+") ON CONFLICT(id) DO UPDATE SET "+",".join([f"{k}=excluded.{k}" for k in BEN_FIELDS[1:]])+",updated_at=CURRENT_TIMESTAMP"
def upsert_benefit(b):
    c=conn();c.execute(UPSERT_BEN,[b.get(k) for k in BEN_FIELDS]);c.commit();c.close()
def upsert_benefits(rows):
    """수집분을 한 트랜잭션으로 반영한다(행마다 커밋하면 동기화 내내 쓰기 잠금이 반복된다)."""
    if not rows:return 0
    c=conn()
    try:
        c.execute("BEGIN IMMEDIATE")
        c.executemany(UPSERT_BEN,[[b.get(k) for k in BEN_FIELDS] for b in rows])
        c.commit()
    except Exception:
        c.rollback();raise
    finally:
        c.close()
    return len(rows)
def benefit_rows(region=None,q=None,limit=50):
    c=conn();sql="SELECT * FROM benefits WHERE 1=1";args=[]
    if region:sql+=" AND region=?";args.append(region)
    if q:
        like="%"+q.strip()+"%";sql+=" AND (title LIKE ? OR summary LIKE ? OR org LIKE ?)";args+=[like]*3
    sql+=" ORDER BY views DESC, title LIMIT ?";args.append(max(1,min(int(limit or 50),500)))
    rows=[dict(r) for r in c.execute(sql,args)];c.close();return rows
def get_benefit(bid):
    c=conn();r=c.execute("SELECT * FROM benefits WHERE id=?",(bid,)).fetchone();c.close()
    return dict(r) if r else None
def activity_rows(region=None,limit=200,offset=0,hide_ended=True,category=None,only_free=False,only_open=False,age=None,search=None,sort="recent"):
    c=conn();q="SELECT *,(SELECT COUNT(*) FROM favorites f WHERE f.activity_id=activities.id) AS fav_count FROM activities WHERE 1=1";args=[]
    if region:q+=" AND region=?";args.append(region)
    if hide_ended:q+=" AND (end_date IS NULL OR end_date >= date('now','localtime'))"
    if category:q+=" AND category=?";args.append(category)
    if only_free:q+=" AND fee=0"
    if only_open:q+=" AND status='모집중'"
    # 원천에 연령 정보가 없어 기본값(3~12)으로 채워진 행은 연령 필터에서 제외한다.
    if age is not None:q+=" AND age_known=1 AND age_min<=? AND age_max>=?";args+=[age,age]
    if search:
        like="%"+search.strip()+"%";q+=" AND (title LIKE ? OR provider LIKE ? OR place LIKE ? OR category LIKE ? OR skills_json LIKE ?)";args+=[like]*5
    q+=" ORDER BY "+SORTS.get(sort or "recent",SORTS["recent"])+" LIMIT ? OFFSET ?";args.append(limit);args.append(offset)
    rows=[dict(r) for r in c.execute(q,args).fetchall()];c.close()
    for r in rows:r["skills"]=json.loads(r.pop("skills_json") or "[]");r.pop("raw_json",None)
    return rows
def get_activity(aid):
    c=conn();r=c.execute("SELECT * FROM activities WHERE id=?",(aid,)).fetchone();c.close()
    if not r:return None
    d=dict(r);d["skills"]=json.loads(d.pop("skills_json") or "[]");d.pop("raw_json",None);return d
def source_rows():
    c=conn();r=[dict(x) for x in c.execute("SELECT * FROM source_status ORDER BY source_key")];c.close();return r
def source_update(key,name,description,url,status,count=0,error=None):
    c=conn();c.execute("INSERT INTO source_status(source_key,name,description,source_url,last_status,record_count,last_sync,last_error) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP,?) ON CONFLICT(source_key) DO UPDATE SET name=excluded.name,description=excluded.description,source_url=excluded.source_url,last_status=excluded.last_status,record_count=excluded.record_count,last_sync=CURRENT_TIMESTAMP,last_error=excluded.last_error",(key,name,description,url,status,count,error));c.commit();c.close()
