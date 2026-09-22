
import datetime
from fastapi import APIRouter,HTTPException,Depends
from pydantic import BaseModel,EmailStr
from ..db import activity_rows,get_activity,source_rows,benefit_rows,get_benefit,conn
from ..services.auth import create_user,authenticate,issue,current_user
router=APIRouter()
class AuthIn(BaseModel):email:str;password:str
class ChildIn(BaseModel):name:str;birth_year:int;birth_month:int;region:str="부산";interest:str="과학·탐구"
class ChildPatch(BaseModel):name:str|None=None;birth_year:int|None=None;birth_month:int|None=None;region:str|None=None;interest:str|None=None
class HistoryIn(BaseModel):activity_id:str;child_id:int
class PushIn(BaseModel):token:str;platform:str="unknown"
# 2) 만 나이는 저장해 두지 않고 출생 연·월에서 매번 계산한다(해가 바뀌면 자동으로 올라간다).
def age_from_birth(year,month):
    t=datetime.date.today();a=t.year-int(year)
    if month and t.month<int(month):a-=1
    return a
def child_dict(row):
    d=dict(row)
    if d.get("birth_year"):d["age"]=age_from_birth(d["birth_year"],d.get("birth_month"))
    return d
def checked_age(year,month):
    if not 1<=int(month)<=12:raise HTTPException(400,"태어난 달은 1~12 사이여야 합니다.")
    a=age_from_birth(year,month)
    if a<0 or a>17:raise HTTPException(400,"만 나이가 0~17세인 자녀만 등록할 수 있습니다.")
    return a
@router.get("/health")
def health():return {"ok":True,"version":"4.0.0"}
@router.get("/sources")
def sources():return {"items":source_rows()}
@router.get("/activities")
def activities(region:str|None=None,limit:int=200,offset:int=0,hide_ended:bool=True,category:str|None=None,only_free:bool=False,only_open:bool=False,age:int|None=None,q:str|None=None,sort:str="recent"):
    return {"items":activity_rows(region,min(max(limit,1),1000),max(offset,0),hide_ended,category,only_free,only_open,age,q,sort=sort)}
@router.get("/activities/{aid}")
def activity(aid:str):
    x=get_activity(aid)
    if not x:raise HTTPException(404,"프로그램을 찾을 수 없습니다.")
    return x
@router.get("/benefits")
def benefits(region:str|None=None,q:str|None=None,limit:int=50):
    return {"items":benefit_rows(region,q,limit)}
@router.get("/benefits/{bid}")
def benefit(bid:str):
    b=get_benefit(bid)
    if not b:raise HTTPException(404,"지원 정보를 찾을 수 없습니다.")
    return b
@router.post("/auth/register")
def register(body:AuthIn):return {"access_token":issue(create_user(body.email,body.password))}
@router.post("/auth/login")
def login(body:AuthIn):return {"access_token":issue(authenticate(body.email,body.password))}
@router.get("/me")
def me(uid:int=Depends(current_user)):
    c=conn();u=c.execute("SELECT id,email,created_at FROM users WHERE id=? AND deleted_at IS NULL",(uid,)).fetchone();c.close()
    if not u:raise HTTPException(404,"계정이 없습니다.")
    return dict(u)
@router.delete("/me")
def delete_me(uid:int=Depends(current_user)):
    c=conn();c.execute("DELETE FROM users WHERE id=?",(uid,));c.commit();c.close();return {"ok":True}
@router.get("/me/children")
def children(uid:int=Depends(current_user)):
    c=conn();r=[child_dict(x) for x in c.execute("SELECT * FROM children WHERE user_id=? ORDER BY id",(uid,))];c.close();return {"items":r}
@router.post("/me/children")
def add_child(body:ChildIn,uid:int=Depends(current_user)):
    age=checked_age(body.birth_year,body.birth_month)   # age 컬럼은 NOT NULL 이라 계산값을 함께 저장한다
    c=conn();cur=c.execute("INSERT INTO children(user_id,name,age,birth_year,birth_month,region,interest) VALUES(?,?,?,?,?,?,?)",(uid,body.name,age,body.birth_year,body.birth_month,body.region,body.interest));c.commit();cid=cur.lastrowid;c.close()
    return {"id":cid,"age":age}
@router.patch("/me/children/{cid}")
def update_child(cid:int,body:ChildPatch,uid:int=Depends(current_user)):
    f=body.model_dump(exclude_unset=True)
    c=conn()
    try:
        c.execute("BEGIN IMMEDIATE")
        row=c.execute("SELECT * FROM children WHERE id=? AND user_id=?",(cid,uid)).fetchone()
        if not row:raise HTTPException(404,"자녀 정보를 확인하세요.")
        cur=dict(row)
        y=f.get("birth_year",cur.get("birth_year"));m=f.get("birth_month",cur.get("birth_month"))
        if y:f["age"]=checked_age(y,m or 1)   # 출생 연·월이 바뀌면 저장된 age 도 함께 맞춘다
        keys=[k for k in ("name","birth_year","birth_month","region","interest","age") if k in f]
        if keys:c.execute("UPDATE children SET "+",".join(k+"=?" for k in keys)+" WHERE id=? AND user_id=?",[f[k] for k in keys]+[cid,uid])
        c.commit()
    except Exception:
        c.rollback();raise
    finally:
        c.close()
    return {"ok":True}
@router.delete("/me/children/{cid}")
def delete_child(cid:int,uid:int=Depends(current_user)):
    c=conn()
    try:
        c.execute("BEGIN IMMEDIATE")
        if not c.execute("SELECT 1 FROM children WHERE id=? AND user_id=?",(cid,uid)).fetchone():raise HTTPException(404,"자녀 정보를 확인하세요.")
        c.execute("DELETE FROM children WHERE id=? AND user_id=?",(cid,uid))   # history 는 ON DELETE CASCADE
        c.commit()
    except Exception:
        c.rollback();raise
    finally:
        c.close()
    return {"ok":True}
@router.get("/me/favorites")
def favorites(uid:int=Depends(current_user)):
    c=conn();r=[x["activity_id"] for x in c.execute("SELECT activity_id FROM favorites WHERE user_id=?",(uid,))];c.close();return {"items":r}
@router.post("/me/favorites/{aid}")
def favorite(aid:str,uid:int=Depends(current_user)):
    c=conn()
    try:
        c.execute("BEGIN IMMEDIATE")  # 읽고 나서 쓰면 잠금 승격이 대기 없이 실패한다
        exists=c.execute("SELECT 1 FROM favorites WHERE user_id=? AND activity_id=?",(uid,aid)).fetchone()
        if exists:c.execute("DELETE FROM favorites WHERE user_id=? AND activity_id=?",(uid,aid));on=False
        else:c.execute("INSERT INTO favorites(user_id,activity_id) VALUES(?,?)",(uid,aid));on=True
        c.commit()
    except Exception:
        c.rollback();raise
    finally:
        c.close()
    return {"favorite":on}
@router.post("/me/history")
def history(body:HistoryIn,uid:int=Depends(current_user)):
    c=conn()
    try:
        c.execute("BEGIN IMMEDIATE")
        child=c.execute("SELECT 1 FROM children WHERE id=? AND user_id=?",(body.child_id,uid)).fetchone()
        act=c.execute("SELECT category FROM activities WHERE id=?",(body.activity_id,)).fetchone()
        if not child or not act:raise HTTPException(404,"자녀 또는 활동 정보를 확인하세요.")
        # 같은 자녀가 같은 활동을 다시 체크해도 성장 집계는 1회로 유지한다.
        cur=c.execute("INSERT OR IGNORE INTO history(user_id,child_id,activity_id,category) VALUES(?,?,?,?)",(uid,body.child_id,body.activity_id,act["category"]))
        already=cur.rowcount==0
        c.commit()
    except Exception:
        c.rollback();raise
    finally:
        c.close()
    return {"ok":True,"already":already}
@router.get("/me/growth")
def growth(child_id:int|None=None,uid:int=Depends(current_user)):
    c=conn()
    try:
        if child_id is not None:
            if not c.execute("SELECT 1 FROM children WHERE id=? AND user_id=?",(child_id,uid)).fetchone():
                raise HTTPException(404,"자녀 정보를 확인하세요.")
            q="SELECT category,COUNT(*) AS count FROM history WHERE user_id=? AND child_id=? GROUP BY category ORDER BY count DESC,category";args=(uid,child_id)
        else:
            q="SELECT category,COUNT(*) AS count FROM history WHERE user_id=? GROUP BY category ORDER BY count DESC,category";args=(uid,)
        r=[dict(x) for x in c.execute(q,args)]
    finally:
        c.close()
    # 어떤 자녀 기준으로 집계했는지 되돌려준다. 이 값이 없거나 요청과 다르면
    # 클라이언트가 "구버전 서버가 child_id 를 무시했다"는 것을 바로 알 수 있다.
    return {"child_id":child_id,"items":r}
@router.post("/me/push")
def push(body:PushIn,uid:int=Depends(current_user)):
    t=(body.token or "").strip()
    if not t:raise HTTPException(400,"푸시 토큰이 비어 있습니다.")
    c=conn();c.execute("INSERT INTO push_tokens(user_id,token,platform) VALUES(?,?,?) ON CONFLICT(token) DO UPDATE SET user_id=excluded.user_id,platform=excluded.platform",(uid,t,body.platform));c.commit();c.close();return {"ok":True}
