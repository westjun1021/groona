# GROONA 4.0 상용 출시 체크리스트

## A. 브랜드/사업
- [ ] GROONA 상표 정밀검색 및 출원
- [ ] 실제 사업주체/사업자 정보 확정
- [ ] 도메인 구매
- [ ] 고객지원 이메일/전화 확정
- [ ] 공공데이터 이용조건·출처표시 조건 원천별 검토

## B. 백엔드
- [ ] 운영 서버 또는 클라우드 배포
- [ ] PostgreSQL로 운영 DB 이전 권장
- [ ] HTTPS
- [ ] JWT_SECRET 강한 랜덤값
- [ ] 자동 백업
- [ ] 장애/로그 모니터링
- [ ] 관리자 인증 분리
- [ ] API rate limiting/WAF
- [ ] 수집 실패 알림
- [ ] 만료 프로그램 정리 정책

## C. 개인정보/아동 보호
- [ ] 보호자 가입 구조
- [ ] 자녀 프로필 최소 수집
- [ ] 만 14세 미만 관련 법정대리인 동의/확인 흐름 법률 검토 및 구현
- [ ] 아동용 쉬운 개인정보 안내
- [ ] 개인정보처리방침 확정
- [ ] 이용약관 확정
- [ ] 계정/데이터 삭제 기능
- [ ] 보유기간/파기 정책
- [ ] 위치 권한은 선택적이며 거부해도 핵심 탐색 가능하도록 유지
- [ ] 아동 프로필 기반 맞춤형 광고는 초기 버전에서 사용하지 않는 방향 권장

## D. Apple
- [ ] Apple Developer 계정
- [ ] Bundle ID `kr.co.groona.app`
- [ ] App Store Connect 앱 생성
- [ ] Privacy Nutrition Label을 실제 데이터 흐름과 일치시킴
- [ ] privacy manifest/사용 SDK 점검
- [ ] Associated Domains
- [ ] AASA 배포
- [ ] 심사 계정/설명 준비
- [ ] TestFlight 테스트
- [ ] 접근성 검토(VoiceOver, 큰 글자)

## E. Google Play
- [ ] Play Console 계정
- [ ] 패키지 `kr.co.groona.app`
- [ ] Play App Signing
- [ ] Data safety를 실제 데이터 흐름과 일치시킴
- [ ] 앱 콘텐츠/대상 연령/가족 관련 선언 검토
- [ ] 개인정보처리방침 URL
- [ ] 계정 삭제 URL/앱 내 삭제
- [ ] assetlinks.json 배포
- [ ] 내부/비공개 테스트 후 프로덕션

## F. Google 검색
- [ ] Search Console 연결
- [ ] sitemap.xml 제출
- [ ] robots.txt 확인
- [ ] 프로그램 페이지가 로그인 없이 200 응답
- [ ] canonical 확인
- [ ] Event/SoftwareApplication 구조화 데이터 검사
- [ ] 부산/울산/경남 랜딩페이지 확장
- [ ] 검색 유입용 유용한 설명 콘텐츠 운영
