from .generic import converted
from ..config import settings
KEY='ulsan_daewangbyeol';NAME='울산 대왕별아이누리 놀이체험프로그램';PAGE='https://www.data.go.kr/data/15087229/fileData.do';DESCRIPTION='울산 어린이 놀이체험 공개데이터'
async def fetch():
    return await converted(KEY,NAME,PAGE,settings.ulsan_api_url,'울산',{'title': ['프로그램명'], 'target': ['대상'], 'place': ['코스','장소'], 'fee': ['1인 요금(원)','1인 참가비(원)'], 'reservation': ['개별이용객 체험 가능 여부', '단체 이용 방법']})
