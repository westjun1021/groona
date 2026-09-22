
import httpx,json,os
from ..db import make_id
from ..services.classifier import classify,age_range,money
def first_url(rec):
    for val in rec.values():
        s=str(val or "").strip()
        if s.startswith("http") and "data.go.kr" not in s and "odcloud.kr" not in s:return s
    return ""
async def converted(key,name,page_url,api_url,region,map):
    if not api_url:raise RuntimeError(f"{key} 자동변환 API URL 필요")
    async with httpx.AsyncClient(timeout=40) as c:
        r=await c.get(api_url,params={"page":1,"perPage":1000,"serviceKey":os.getenv("DATA_GO_KR_SERVICE_KEY","")});r.raise_for_status();d=r.json()
    rows=d.get("data") or d.get("response",{}).get("body",{}).get("items",{}).get("item",[]) or []
    if isinstance(rows,dict):rows=[rows]
    out=[]
    for x in rows:
      def v(k):
        for n in map.get(k,[]):
          if x.get(n) not in (None,""):return x[n]
        return None
      title=str(v("title") or "").strip()
      if not title:continue
      provider=str(v("provider") or name);cat,skills=classify(title,provider,str(v("place") or ""),json.dumps(x,ensure_ascii=False));amin,amax,aknown=age_range(str(v("target") or "")+" "+title)
      out.append({"id":make_id(key,str(v("external_id") or ""),title,provider),"source_key":key,"source_name":name,"source_url":page_url,"detail_url":str(v("detail") or first_url(x) or ""),"external_id":str(v("external_id") or ""),"region":region,"city":str(v("city") or ""),"title":title,"provider":provider,"place":str(v("place") or provider),"address":str(v("address") or ""),"lat":None,"lon":None,"age_min":amin,"age_max":amax,"age_known":1 if aknown else 0,"category":cat,"skills_json":json.dumps(skills,ensure_ascii=False),"fee":money(v("fee")),"status":str(v("status") or "운영정보 확인"),"start_date":None,"end_date":None,"apply_start":str(v("apply") or "") or None,"apply_end":None,"reservation_method":str(v("reservation") or ""),"phone":str(v("phone") or ""),"raw_json":json.dumps(x,ensure_ascii=False)})
    return out
