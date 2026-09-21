# 배포 순서

1. 도메인 구매 후 DNS:
   - `www` → 웹/API 서버
   - `api` → API 서버
2. 서버에 프로젝트 배치: `/opt/groona`
3. Python 가상환경 생성 및 `backend/requirements.txt` 설치
4. `.env` 작성
5. systemd의 API/Sync 서비스 설치 및 활성화
6. Nginx 설정 적용
7. Let's Encrypt 등으로 HTTPS 적용
8. `.well-known` 파일을 실제 Apple Team ID / Android Play App Signing SHA-256으로 생성해 배포
9. 모바일 `GROONA_DOMAIN`, API URL을 실제 도메인으로 설정
10. EAS production build
11. TestFlight / Play 내부테스트
12. 스토어 심사
13. Search Console 등록 + sitemap 제출
