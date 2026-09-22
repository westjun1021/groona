import httpx
from ..config import settings
from ..db import upsert_benefits
KEY="gov24_benefits";NAME="정부24 보조금24 공공서비스(보육·교육)"
PAGE="https://www.data.go.kr/data/15113968/openapi.do"
DESCRIPTION="보조금24 공공서비스 목록 중 보육·교육 분야 개인 대상 지원"
ENDPOINT="https://api.odcloud.kr/api/gov24/v3/serviceList"
PER_PAGE=200
MAX_PAGES=12          # 현재 보육·교육은 8페이지(약 1,510행)에서 끝난다. 늘어나도 받도록 여유를 둔다.
# 육아 지원과 무관하거나 민감한 피해자 지원 서비스는 제외한다.
EXCLUDE=["학대","피해","범죄","성폭력","스토킹","인신매매","국선변호사"]
def region_of(org):
    o=str(org or "")
    if "부산" in o:return "부산"
    if "울산" in o:return "울산"
    if "경남" in o or "경상남도" in o:return "경남"
    return "전국"
def to_int(v):
    try:return int(str(v or "0").replace(",","").strip() or 0)
    except Exception:return 0
async def fetch():
    if not settings.data_go_key:raise RuntimeError("DATA_GO_KR_SERVICE_KEY 필요")
    raw=[]
    async with httpx.AsyncClient(timeout=60) as c:
        for p in range(1,MAX_PAGES+1):
            r=await c.get(ENDPOINT,params={"page":p,"perPage":PER_PAGE,"serviceKey":settings.data_go_key,
                "returnType":"JSON","cond[서비스분야::LIKE]":"보육"})   # "보육" substring → "보육·교육" (· 인코딩 회피)
            r.raise_for_status()
            rows=r.json().get("data") or []
            if not rows:break
            raw+=rows
    out=[]
    for x in raw:
        # 응답의 cond 는 신뢰하되, 분야/대상은 파이썬에서 다시 확인한다.
        if str(x.get("서비스분야") or "")!="보육·교육":continue
        if "개인" not in str(x.get("사용자구분") or ""):continue
        title=str(x.get("서비스명") or "").strip()
        if not title or any(b in title for b in EXCLUDE):continue
        sid=str(x.get("서비스ID") or "").strip()
        if not sid:continue
        out.append({"id":sid,"title":title,"summary":str(x.get("서비스목적요약") or ""),
            "field":str(x.get("서비스분야") or ""),"org":str(x.get("소관기관명") or ""),
            "user_type":str(x.get("사용자구분") or ""),"target":str(x.get("지원대상") or ""),
            "content":str(x.get("지원내용") or ""),"how_to":str(x.get("신청방법") or ""),
            "deadline":str(x.get("신청기한") or ""),"phone":str(x.get("전화문의") or ""),
            "support_type":str(x.get("지원유형") or ""),"region":region_of(x.get("소관기관명")),
            "url":str(x.get("상세조회URL") or ""),"views":to_int(x.get("조회수"))})
    seen=set();uniq=[]
    for b in out:
        if b["id"] in seen:continue
        seen.add(b["id"]);uniq.append(b)
    upsert_benefits(uniq)
    return uniq
