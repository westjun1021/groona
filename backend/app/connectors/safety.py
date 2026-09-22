from .generic import converted
from ..config import settings
KEY='gyeongnam_safety';NAME='경상남도 안전체험관 예약 데이터';PAGE='https://www.data.go.kr/data/15049538/fileData.do';DESCRIPTION='경남 안전체험관 운영 공개데이터'
async def fetch():
    rows=await converted(KEY,NAME,PAGE,settings.safety_api_url,'경남',{'title': ['프로그램'], 'target': ['인원구분', '대상구분'], 'apply': ['운영일자']})
    seen=set()
    return [r for r in rows if not (r['title'] in seen or seen.add(r['title']))]
