
import asyncio
from apscheduler.schedulers.blocking import BlockingScheduler
from app.db import init_db
from app.services.sync import sync_all
def run():asyncio.run(sync_all())
if __name__=="__main__":
    init_db();run()
    s=BlockingScheduler(timezone="Asia/Seoul")
    for h in (5,13,21):s.add_job(run,"cron",hour=h,minute=10)
    s.start()
