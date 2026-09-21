
from fastapi import APIRouter,Request,Response,HTTPException
from fastapi.responses import HTMLResponse,PlainTextResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
import json,html
from ..db import activity_rows,get_activity
from ..config import settings
BASE=Path(__file__).resolve().parents[3]
templates=Jinja2Templates(directory=str(BASE/"apps"/"web"/"templates"))
router=APIRouter()
def software_ld():
    return {"@context":"https://schema.org","@type":"SoftwareApplication","name":"GROONA","applicationCategory":"EducationalApplication","operatingSystem":"iOS, Android, Web","description":"지역 기반 AI 아동 성장·학습 큐레이션 플랫폼","url":settings.public_base_url}
@router.get("/",response_class=HTMLResponse)
def home(request:Request):
    rows=activity_rows(limit=12)
    return templates.TemplateResponse(request,"index.html",{"rows":rows,"base":settings.public_base_url,"software_json":json.dumps(software_ld(),ensure_ascii=False)})
@router.get("/activity/{aid}",response_class=HTMLResponse)
def activity_page(request:Request,aid:str):
    x=get_activity(aid)
    if not x:raise HTTPException(404)
    event={"@context":"https://schema.org","@type":"Event","name":x["title"],"description":f"{x['category']} 어린이 체험 프로그램. {', '.join(x['skills'])}",
           "url":f"{settings.public_base_url}/activity/{x['id']}","eventStatus":"https://schema.org/EventScheduled"}
    if x.get("start_date"):event["startDate"]=x["start_date"]
    if x.get("end_date"):event["endDate"]=x["end_date"]
    if x.get("place") or x.get("address"):event["location"]={"@type":"Place","name":x.get("place") or x.get("provider"),"address":x.get("address") or x.get("region")}
    return templates.TemplateResponse(request,"activity.html",{"x":x,"base":settings.public_base_url,"event_json":json.dumps(event,ensure_ascii=False)})
@router.get("/privacy",response_class=HTMLResponse)
def privacy(request:Request):return templates.TemplateResponse(request,"privacy.html",{"base":settings.public_base_url})
@router.get("/terms",response_class=HTMLResponse)
def terms(request:Request):return templates.TemplateResponse(request,"terms.html",{"base":settings.public_base_url})
@router.get("/robots.txt",response_class=PlainTextResponse)
def robots():return f"User-agent: *\\nAllow: /\\nDisallow: /api/\\nSitemap: {settings.public_base_url}/sitemap.xml\\n"
@router.get("/sitemap.xml")
def sitemap():
    urls=[settings.public_base_url,settings.public_base_url+"/privacy",settings.public_base_url+"/terms"]+[f"{settings.public_base_url}/activity/{x['id']}" for x in activity_rows(limit=10000)]
    xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f"<url><loc>{html.escape(u)}</loc></url>" for u in urls)+"</urlset>"
    return Response(xml,media_type="application/xml")
