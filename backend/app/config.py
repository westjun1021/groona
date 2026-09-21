
from dataclasses import dataclass
import os
from pathlib import Path
try:
    from dotenv import load_dotenv
    # load backend/.env (parent of this app/ folder) if present
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
except Exception:
    pass
@dataclass
class Settings:
    public_base_url:str=os.getenv("GROONA_PUBLIC_BASE_URL","http://127.0.0.1:8787")
    api_base_url:str=os.getenv("GROONA_API_BASE_URL","http://127.0.0.1:8787")
    domain:str=os.getenv("GROONA_DOMAIN","www.YOUR_DOMAIN.kr")
    data_go_key:str=os.getenv("DATA_GO_KR_SERVICE_KEY","")
    ulsan_api_url:str=os.getenv("ULSAN_THEMEPARK_API_URL","")
    changwon_api_url:str=os.getenv("CHANGWON_SCIENCE_API_URL","")
    safety_api_url:str=os.getenv("GYEONGNAM_SAFETY_API_URL","")
    jwt_secret:str=os.getenv("JWT_SECRET","CHANGE_ME")
    db_path:str=os.getenv("DATABASE_PATH","groona4.db")
settings=Settings()
