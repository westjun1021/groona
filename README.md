# GROONA 4.0 Commercial Edition

지역 기반 AI 아동 성장·학습 큐레이션 플랫폼의 **상용 출시용 모노레포 골격**입니다.

## 포함
- iOS / Android: Expo Router 기반 네이티브 앱
- Universal Links / Android App Links 구성
- 보호자 회원가입/로그인 API
- 자녀 프로필 / 즐겨찾기 / 활동 기록 / 계정 삭제 API
- 부울경 공공데이터 커넥터
- 자동 동기화 스케줄러
- SEO 공개 웹사이트
- 프로그램별 검색 가능한 고유 URL
- sitemap.xml / robots.txt / canonical / Open Graph
- SoftwareApplication / Event JSON-LD
- 개인정보처리방침·이용약관 초안
- Apple/Google 딥링크 검증 파일 템플릿
- Nginx / systemd 배포 설정
- App Store / Google Play 메타데이터 초안
- 상용 출시 체크리스트

## 중요한 경계
이 패키지는 실제 배포 가능한 코드/설정 골격이지만, 아래는 소유자 계정/키 때문에 자동 완성할 수 없습니다.
- 실제 도메인 구매와 DNS
- 공공데이터 서비스키 발급
- Apple Developer / Google Play Console 계정
- 앱 서명 인증서/Play signing fingerprint
- 실제 개인정보처리방침의 사업자 정보 및 법률 검토
- 스토어 심사 제출
- Google Search Console 소유권 인증

## 빠른 시작
### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8787
```

### Mobile
```bash
cd apps/mobile
npm install
npx expo start
```

상용 배포 전 `docs/COMMERCIAL_LAUNCH_CHECKLIST.md`를 반드시 확인하십시오.
