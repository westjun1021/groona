
import httpx,json
from ..config import settings
from ..db import make_id
from ..services.classifier import classify,age_range,money
from .generic import first_url
KEY="busan_tour_experience";NAME="부산광역시 견학/체험 정보";PAGE="https://www.data.go.kr/data/15034070/openapi.do"
ENDPOINT="https://apis.data.go.kr/6260000/BusanTourExprnInfoService/getTourExprnInfo"
DESCRIPTION="부산시 견학·체험 공식 REST API"
async def fetch():
    if not settings.data_go_key:raise RuntimeError("DATA_GO_KR_SERVICE_KEY 필요")
    out=[];page=1;total=1
    async with httpx.AsyncClient(timeout=30) as client:
      while len(out)<total:
        r=await client.get(ENDPOINT,params={"ServiceKey":settings.data_go_key,"pageNo":page,"numOfRows":100,"resultType":"json"});r.raise_for_status()
        body=r.json().get("response",{}).get("body",{});total=int(body.get("totalCount") or 0);items=body.get("items",{}).get("item",[]) or []
        if isinstance(items,dict):items=[items]
        if not items:break
        for x in items:
          title=str(x.get("exprnNm") or "").strip();provider=str(x.get("resveInsttNm") or "").strip()
          cat,skills=classify(title,provider,str(x.get("adres") or ""));amin,amax=age_range(title)
          out.append({"id":make_id(KEY,str(x.get("exprnNo") or ""),title,provider),"source_key":KEY,"source_name":NAME,"source_url":PAGE,"detail_url":first_url(x),"external_id":str(x.get("exprnNo") or ""),"region":"부산","city":"","title":title,"provider":provider,"place":provider,"address":x.get("adres"),"lat":None,"lon":None,"age_min":amin,"age_max":amax,"category":cat,"skills_json":json.dumps(skills,ensure_ascii=False),"fee":money(x.get("resveCharge")),"status":{"R":"모집중","E":"접수마감","U":"전화접수"}.get(str(x.get("progrsSttus")),"운영정보 확인"),"start_date":str(x.get("exprnBeginDttm") or "")[:10] or None,"end_date":str(x.get("exprnEndDttm") or "")[:10] or None,"apply_start":str(x.get("reqstBeginDttm") or "")[:16] or None,"apply_end":str(x.get("reqstEndDttm") or "")[:16] or None,"reservation_method":{"1":"온라인","2":"방문접수","3":"전화접수"}.get(str(x.get("exprnResveMth")),str(x.get("exprnResveMth") or "")),"phone":x.get("exprnRefrnc"),"raw_json":json.dumps(x,ensure_ascii=False)})
        page+=1
    return out
