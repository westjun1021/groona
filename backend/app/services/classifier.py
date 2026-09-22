
import re
def classify(title="",provider="",place="",raw=""):
    text=" ".join([title or "",provider or "",place or "",raw or ""]).lower()
    rules=[("과학·탐구",["과학","생태","자연","환경","해양","동물","식물","천문","실험","코딩"," ai ","로봇"]),
    ("창의·예술",["미술","예술","공예","도예","음악","공연","그림","창작","디자인"]),
    ("언어·독서",["책","독서","동화","문학","글쓰기","도서관","이야기"]),
    ("신체·놀이",["놀이","체육","스포츠","모험","물놀이"]),
    ("역사·지역",["역사","박물관","유적","문화재","가야","민속"]),
    ("사회·생활",["안전","재난","화재","직업","진로","교통","생활"])]
    cat="사회·생활"
    for c,ks in rules:
        if any(k in text for k in ks):cat=c;break
    sk={"과학·탐구":["관찰력","탐구력","문제해결"],"창의·예술":["창의성","표현력","감수성"],"언어·독서":["어휘력","상상력","의사소통"],"신체·놀이":["대근육","도전성","사회성"],"역사·지역":["지역이해","역사사고","관찰력"],"사회·생활":["안전판단","자기효능감","사회성"]}[cat]
    return cat,sk
def age_range(text):
    t=(text or "").lower()
    m=re.search(r"(\d{1,2})\s*[~\-–]\s*(\d{1,2})\s*세",t)
    if m:a,b=int(m.group(1)),int(m.group(2));return min(a,b),max(a,b),True
    m=re.search(r"(\d{1,2})\s*세\s*이상",t)
    if m:n=int(m.group(1));return (n,12,True) if n<=12 else (n,n,True)
    if "초등저학년" in t or "초등 저학년" in t:return 7,9,True
    if "초등고학년" in t or "초등 고학년" in t:return 10,12,True
    if "초등" in t:return 7,12,True
    if "유아" in t:return 3,7,True
    ns=[int(x) for x in re.findall(r"(\d{1,2})\s*세",t)]
    return (min(ns),max(ns),True) if ns else (3,12,False)
def money(v):
    if v is None:return None
    s=str(v).replace(",","").replace("원","").strip()
    if "무료" in s or s=="0":return 0
    m=re.search(r"\d+",s);return int(m.group()) if m else None
