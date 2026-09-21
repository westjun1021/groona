
import datetime,jwt
from pwdlib import PasswordHash
from fastapi import HTTPException,Header
from ..config import settings
from ..db import conn
hasher=PasswordHash.recommended()
def create_user(email,password):
    if len(password)<8:raise HTTPException(400,"비밀번호는 8자 이상이어야 합니다.")
    c=conn()
    try:
        cur=c.execute("INSERT INTO users(email,password_hash) VALUES(?,?)",(email.lower().strip(),hasher.hash(password)));c.commit();uid=cur.lastrowid
    except Exception:
        c.close();raise HTTPException(409,"이미 사용 중인 이메일입니다.")
    c.close();return uid
def authenticate(email,password):
    c=conn();u=c.execute("SELECT * FROM users WHERE email=? AND deleted_at IS NULL",(email.lower().strip(),)).fetchone();c.close()
    if not u or not hasher.verify(password,u["password_hash"]):raise HTTPException(401,"이메일 또는 비밀번호를 확인하세요.")
    return u["id"]
def issue(uid):
    exp=datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=30)
    return jwt.encode({"sub":str(uid),"exp":exp},settings.jwt_secret,algorithm="HS256")
def current_user(authorization:str|None=Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):raise HTTPException(401,"로그인이 필요합니다.")
    try:return int(jwt.decode(authorization[7:],settings.jwt_secret,algorithms=["HS256"])["sub"])
    except Exception:raise HTTPException(401,"인증이 만료되었거나 유효하지 않습니다.")
