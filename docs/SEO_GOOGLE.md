# Google 검색 노출 운영 가이드

## 구현 완료
- 공개 HTML 홈페이지
- 프로그램별 고유 URL `/activity/{id}`
- 고유 title / meta description / canonical
- Open Graph 기본 태그
- `SoftwareApplication` JSON-LD
- 프로그램 상세의 `Event` JSON-LD
- `/robots.txt`
- DB 기반 동적 `/sitemap.xml`
- 로그인 없이 크롤링 가능한 공개 프로그램 페이지

## 출시 후 해야 할 일
1. 실제 도메인 연결 및 HTTPS
2. Google Search Console 사이트 소유권 확인
3. `https://도메인/sitemap.xml` 제출
4. 대표 프로그램 URL을 URL Inspection으로 테스트
5. Rich Results Test로 JSON-LD 검증
6. 기관/학교/지역 커뮤니티 등 신뢰할 수 있는 외부 링크 확보
7. 만료 프로그램은 삭제만 하기보다 가능하면 종료 상태/대체 프로그램을 제공하고, 완전 삭제 시 적절한 HTTP 상태를 사용
8. 지역별 랜딩 페이지 추가: `/busan`, `/ulsan`, `/gyeongnam`
9. 유용한 원문 설명과 GROONA 고유 큐레이션 설명을 제공 — 원천 데이터 단순 복제 사이트가 되지 않게 함

주의: sitemap과 구조화 데이터는 크롤링/이해를 돕지만 Google 색인 또는 상위 노출을 보장하지 않습니다.
