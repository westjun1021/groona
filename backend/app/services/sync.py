
from ..db import upsert_many,source_update
from ..connectors import busan,ulsan,changwon,safety,benefits
CONNECTORS=[busan,ulsan,changwon,safety]
async def sync_benefits():
    """육아 지원·정책(보조금24). 실패해도 활동 수집에는 영향을 주지 않는다."""
    try:
        rows=await benefits.fetch()
        source_update(benefits.KEY,benefits.NAME,benefits.DESCRIPTION,benefits.PAGE,"ok",len(rows),None)
        return {"key":benefits.KEY,"status":"ok","count":len(rows)}
    except Exception as e:
        source_update(benefits.KEY,benefits.NAME,benefits.DESCRIPTION,benefits.PAGE,"waiting",0,str(e))
        return {"key":benefits.KEY,"status":"waiting","error":str(e)}
async def sync_all():
    result=[]
    for c in CONNECTORS:
        try:
            rows=await c.fetch()
            upsert_many(rows)
            source_update(c.KEY,c.NAME,c.DESCRIPTION,c.PAGE,"ok",len(rows),None)
            result.append({"key":c.KEY,"status":"ok","count":len(rows)})
        except Exception as e:
            source_update(c.KEY,c.NAME,c.DESCRIPTION,c.PAGE,"waiting",0,str(e))
            result.append({"key":c.KEY,"status":"waiting","error":str(e)})
    result.append(await sync_benefits())
    return result
