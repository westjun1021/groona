
from app.services.classifier import classify,age_range,money
def test_classifier():
    assert classify("낙동강 생태탐험")[0]=="과학·탐구"
    assert classify("어린이 미술 워크숍")[0]=="창의·예술"
def test_age(): assert age_range("초등 저학년")==(7,9,True)
def test_age_range_first():
    assert age_range("6~7세")==(6,7,True)
    assert age_range("만 3-5세 대상")==(3,5,True)
    assert age_range("(유아6-7세)")==(6,7,True)
def test_age_keyword_not_confused_by_grade():
    assert age_range("초등 1~3학년")==(7,12,True)
def test_age_over():
    assert age_range("4세 이상")==(4,12,True)
    assert age_range("50세 이상")==(50,50,True)
def test_age_single():
    assert age_range("50세 이상")==(50,50,True)
    assert age_range("대상 정보 없음")==(3,12,False)
def test_money(): assert money("무료")==0 and money("5,000원")==5000
def test_age_known_flag():
    # 원천에 연령 단서가 있으면 known=True, 없으면 기본범위 + known=False
    assert age_range("유아 대상 프로그램")[2] is True
    assert age_range("가족 누구나")==(3,12,False)
