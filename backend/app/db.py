
import sqlite3,json,hashlib,datetime
from .config import settings
def conn():
    c=sqlite3.connect(settings.db_path);c.row_factory=sqlite3.Row;c.execute("PRAGMA foreign_keys=ON");return c
SCHEMA="""
CREATE TABLE IF NOT EXISTS activities(
 id TEXT PRIMARY KEY,source_key TEXT,source_name TEXT,source_url TEXT,detail_url TEXT,external_id TEXT,region TEXT,city TEXT,
 title TEXT NOT NULL,provider TEXT,place TEXT,address TEXT,lat REAL,lon REAL,age_min INTEGER DEFAULT 3,age_max INTEGER DEFAULT 12,
 category TEXT DEFAULT '사회·생활',skills_json TEXT DEFAULT '[]',fee INTEGER,status TEXT,start_date TEXT,end_date TEXT,
 apply_start TEXT,apply_end TEXT,reservation_method TEXT,phone TEXT,raw_json TEXT,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_act_region ON activities(region);
CREATE INDEX IF NOT EXISTS idx_act_dates ON activities(start_date,end_date);
CREATE TABLE IF NOT EXISTS source_status(
 source_key TEXT PRIMARY KEY,name TEXT,description TEXT,source_url TEXT,last_status TEXT,record_count INTEGER DEFAULT 0,last_sync TEXT,last_error TEXT);
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,deleted_at TEXT);
CREATE TABLE IF NOT EXISTS children(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,name TEXT NOT NULL,age INTEGER NOT NULL,region TEXT,interest TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS favorites(user_id INTEGER NOT NULL,activity_id TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,activity_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,child_id INTEGER NOT NULL,activity_id TEXT NOT NULL,category TEXT,completed_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(child_id) REFERENCES children(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS push_tokens(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,token TEXT UNIQUE NOT NULL,platform TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
"""
def init_db():
    c=conn();c.executescript(SCHEMA);c.commit();c.close()
def make_id(source_key,external_id,title,provider=""):
    return hashlib.sha1(f"{source_key}|{external_id}|{title}|{provider}".encode()).hexdigest()[:24]
def upsert_activity(a):
    fs=["id","source_key","source_name","source_url","detail_url","external_id","region","city","title","provider","place","address","lat","lon","age_min","age_max","category","skills_json","fee","status","start_date","end_date","apply_start","apply_end","reservation_method","phone","raw_json"]
    vals=[a.get(k) for k in fs]
    q="INSERT INTO activities("+",".join(fs)+") VALUES("+",".join(["?"]*len(fs))+") ON CONFLICT(id) DO UPDATE SET "+",".join([f"{k}=excluded.{k}" for k in fs[1:]])+",updated_at=CURRENT_TIMESTAMP"
    c=conn();c.execute(q,vals);c.commit();c.close()
def activity_rows(region=None,limit=200,offset=0,hide_ended=True,category=None,only_free=False,only_open=False,age=None,search=None):
    c=conn();q="SELECT * FROM activities WHERE 1=1";args=[]
    if region:q+=" AND region=?";args.append(region)
    if hide_ended:q+=" AND (end_date IS NULL OR end_date >= date('now','localtime'))"
    if category:q+=" AND category=?";args.append(category)
    if only_free:q+=" AND fee=0"
    if only_open:q+=" AND status='모집중'"
    if age is not None:q+=" AND age_min<=? AND age_max>=?";args+=[age,age]
    if search:
        like="%"+search.strip()+"%";q+=" AND (title LIKE ? OR provider LIKE ? OR place LIKE ? OR category LIKE ? OR skills_json LIKE ?)";args+=[like]*5
    q+=" ORDER BY CASE WHEN status='모집중' THEN 0 ELSE 1 END, updated_at DESC LIMIT ? OFFSET ?";args.append(limit);args.append(offset)
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
