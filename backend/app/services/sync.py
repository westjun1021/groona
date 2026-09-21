
from ..db import upsert_activity,source_update
from ..connectors import busan,ulsan,changwon,safety
CONNECTORS=[busan,ulsan,changwon,safety]
async def sync_all():
    result=[]
    for c in CONNECTORS:
        try:
            rows=await c.fetch()
            for a in rows:upsert_activity(a)
            source_update(c.KEY,c.NAME,c.DESCRIPTION,c.PAGE,"ok",len(rows),None)
            result.append({"key":c.KEY,"status":"ok","count":len(rows)})
        except Exception as e:
            source_update(c.KEY,c.NAME,c.DESCRIPTION,c.PAGE,"waiting",0,str(e))
            result.append({"key":c.KEY,"status":"waiting","error":str(e)})
    return result
