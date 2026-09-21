from .generic import converted
from ..config import settings
KEY='changwon_science';NAME='창원과학체험관 프로그램';PAGE='https://data.go.kr/data/15159436/fileData.do';DESCRIPTION='창원과학체험관 교육프로그램 공개데이터'
async def fetch():
    return await converted(KEY,NAME,PAGE,settings.changwon_api_url,'경남',{'title': ['프로그램명'], 'target': ['대상'], 'fee': ['교육비'], 'apply': ['접수일'], 'reservation': ['세부안내 연결링크'], 'detail': ['세부안내 연결링크']})
