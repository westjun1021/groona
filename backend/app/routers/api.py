
from fastapi import APIRouter,HTTPException,Depends
from pydantic import BaseModel,EmailStr
from ..db import activity_rows,get_activity,source_rows,conn
from ..services.auth import create_user,authenticate,issue,current_user
router=APIRouter()
class AuthIn(BaseModel):email:str;password:str
class ChildIn(BaseModel):name:str;age:int;region:str="부산";interest:str="과학·탐구"
class HistoryIn(BaseModel):activity_id:str;child_id:int
class PushIn(BaseModel):token:str;platform:str="unknown"
@router.get("/health")
def health():return {"ok":True,"version":"4.0.0"}
@router.get("/sources")
def sources():return {"items":source_rows()}
@router.get("/activities")
def activities(region:str|None=None,limit:int=200,offset:int=0,hide_ended:bool=True,category:str|None=None,only_free:bool=False,only_open:bool=False,age:int|None=None,q:str|None=None):return {"items":activity_rows(region,min(max(limit,1),1000),max(offset,0),hide_ended,category,only_free,only_open,age,q)}
@router.get("/activities/{aid}")
def activity(aid:str):
    x=get_activity(aid)
    if not x:raise HTTPException(404,"프로그램을 찾을 수 없습니다.")
    return x
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
    c=conn();r=[dict(x) for x in c.execute("SELECT * FROM children WHERE user_id=?",(uid,))];c.close();return {"items":r}
@router.post("/me/children")
def add_child(body:ChildIn,uid:int=Depends(current_user)):
    if body.age<0 or body.age>17:raise HTTPException(400,"연령을 확인하세요.")
    c=conn();cur=c.execute("INSERT INTO children(user_id,name,age,region,interest) VALUES(?,?,?,?,?)",(uid,body.name,body.age,body.region,body.interest));c.commit();cid=cur.lastrowid;c.close();return {"id":cid}
@router.get("/me/favorites")
def favorites(uid:int=Depends(current_user)):
    c=conn();r=[x["activity_id"] for x in c.execute("SELECT activity_id FROM favorites WHERE user_id=?",(uid,))];c.close();return {"items":r}
@router.post("/me/favorites/{aid}")
def favorite(aid:str,uid:int=Depends(current_user)):
    c=conn();exists=c.execute("SELECT 1 FROM favorites WHERE user_id=? AND activity_id=?",(uid,aid)).fetchone()
    if exists:c.execute("DELETE FROM favorites WHERE user_id=? AND activity_id=?",(uid,aid));on=False
    else:c.execute("INSERT INTO favorites(user_id,activity_id) VALUES(?,?)",(uid,aid));on=True
    c.commit();c.close();return {"favorite":on}
@router.post("/me/history")
def history(body:HistoryIn,uid:int=Depends(current_user)):
    c=conn();child=c.execute("SELECT 1 FROM children WHERE id=? AND user_id=?",(body.child_id,uid)).fetchone()
    act=c.execute("SELECT category FROM activities WHERE id=?",(body.activity_id,)).fetchone()
    if not child or not act:c.close();raise HTTPException(404,"자녀 또는 활동 정보를 확인하세요.")
    c.execute("INSERT INTO history(user_id,child_id,activity_id,category) VALUES(?,?,?,?)",(uid,body.child_id,body.activity_id,act["category"]));c.commit();c.close();return {"ok":True}
@router.get("/me/growth")
def growth(uid:int=Depends(current_user)):
    c=conn();r=[dict(x) for x in c.execute("SELECT category,COUNT(*) AS count FROM history WHERE user_id=? GROUP BY category ORDER BY count DESC,category",(uid,))];c.close();return {"items":r}
@router.post("/me/push")
def push(body:PushIn,uid:int=Depends(current_user)):
    t=(body.token or "").strip()
    if not t:raise HTTPException(400,"푸시 토큰이 비어 있습니다.")
    c=conn();c.execute("INSERT INTO push_tokens(user_id,token,platform) VALUES(?,?,?) ON CONFLICT(token) DO UPDATE SET user_id=excluded.user_id,platform=excluded.platform",(uid,t,body.platform));c.commit();c.close();return {"ok":True}
