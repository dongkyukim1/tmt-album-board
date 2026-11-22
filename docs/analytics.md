# TMT Insights

`/admin/analytics` queries the real GA4 property through a server-only Google Data API client. No sample data or public report endpoint is included. The existing TMT backend must grant the signed-in account administrator access (`GET /admin/overview`).

## Connected resources

- Firebase project: `tmt-product-analytics` (Spark, no billing enabled)
- GA4 property: `564831213`, reporting timezone UTC+09:00 (`Etc/GMT-9`)
- iOS and Android package: `com.qjc.topster`
- Web measurement ID: `G-RNF13TKBPY` (public identifier)
- Report reader: `tmt-insights-reader@tmt-product-analytics.iam.gserviceaccount.com`, GA4 Viewer only

## Run and deploy

Copy `.env.example` to `.env.local`. Set API_BASE_URL to the production TMT API for existing administrator login, or your local backend. Set GA4_PROPERTY_ID and either GOOGLE_APPLICATION_CREDENTIALS (local file outside the repository) or GOOGLE_ANALYTICS_CREDENTIALS (full service-account JSON in your hosting secret store). Never prefix credentials with NEXT_PUBLIC or commit the key file.

Run `npm ci`, `npm run dev`, then open `/admin/analytics`. Deploy the Next.js app to the existing Vercel project with the same server variables. Root SPA files are copied by prebuild. Public pages collect web analytics only on `tmt-album-board.vercel.app` and `dongkyukim1.github.io`; localhost, preview domains, `?mock`, and admin pages are excluded.

Disable enhanced measurement for the GA4 web stream: page views are sent manually with stable screen names. This avoids duplicate history events and collecting search text, dynamic chart identifiers, or URLs with query parameters. If a custom production domain is added, update the allowlist in `analytics.js`.

## Metric definitions

- Daily reports end yesterday in the GA4 property timezone. A 60-second process cache avoids repeated quota usage; authorization is checked before every response, including cached ones.
- Active users are GA4 active users, not total account registrations. Daily/weekly/monthly cards are distinct users over the preceding 1/7/30 complete days.
- Realtime users are active users in the past 30 minutes; a failed realtime query appears as unavailable, never zero.
- Session engagement is userEngagementDuration / sessions. Screen engagement is userEngagementDuration / activeUsers for that screen. These represent foreground engagement, not time the app spends closed or in the background.
- Retention queries 56 individual firstSessionDate cohorts and displays eight groups of seven days. Dn = sum of daily cohortActiveUsers(n) / sum of daily cohortTotalUsers. A whole week must be mature before showing Dn. Missing rows and thresholded retention remain unavailable. Summary retention is weighted by cohort population.
- Behavior cards show independent event counts. They do not claim a sequential conversion funnel. `share_open` means the share sheet was opened, not that content was successfully shared.
- Reports may lag collection; the dashboard displays source, timezone, latest fetch time, and privacy threshold warnings. Past activity from versions without Firebase cannot be recovered.

## App rollout

Flutter instrumentation lives in the `topster_flutter` milkfish worktree. Firebase is initialized before the app, nested navigator and tab screens have stable names, and native automatic screen tracking is disabled to avoid duplicate UIViewController/Activity views. Firebase manages sessions and engagement. Only an opaque authenticated user ID is sent; email, nickname, comments, chart titles, and search text are not sent as analytics parameters.

Ship a new iOS/Android build to begin collecting users on that version. DebugView validation uses `-FIRDebugEnabled` on iOS or `adb shell setprop debug.firebase.analytics.app com.qjc.topster` on Android. Debug traffic is for diagnostics, not portfolio performance claims.

## Verification

`npm run typecheck`, `npm test`, and `npm run build`. Tests cover cohort maturity/missing rows, weighted retention, timezone boundaries, CSV injection, backend admin checks, CSRF, cookie flags, and credential error redaction. Live GA4 Data API queries were verified for app/iOS/Android/web on 2026-11-17; the new property correctly returned no historical users. The iOS simulator emitted first_open, session_start, screen_view, and user_engagement in Firebase DebugView.

GA4 configuration was read back through the Admin API: enhanced measurement is disabled for the web stream; event retention is TWO_MONTHS and user retention is FOURTEEN_MONTHS with reset on new activity. The app/web privacy notice describes the newly enabled analytics and its retention settings. Native advertising ID collection and ad personalization are disabled.

## 2026-11-17 에디토리얼 대시보드

- 승인 디자인: `ANALYTICS_DASHBOARD_DESIGN_2026-11-17.md`, `analytics-dashboard-mockup.html`의 첫 번째 ‘최종’ 탭.
- 이전 동기간 일별 활성 사용자와 `dayOfWeek`·`hour`별 `sessions`를 추가 조회한다. 요일 0은 일요일이며 UI는 월요일부터 표시한다. 시간대는 GA4 속성 기준이다. [GA4 공식 스키마](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema).
- 코호트에 D3를 추가했다. 표는 최근 4주, 요약 D7은 최근 8주 중 관찰 완료 코호트를 인원 가중한다. 누락·미성숙·보호 기준 적용 값은 `null`로 유지한다.
- 세션 추이 점선은 자체 최댓값으로 정규화한다. 활성 사용자 축으로 세션 수를 읽으면 안 된다. 모든 일별 선은 빠진 날짜를 연결하지 않는다.
- KPI 평균 체류는 활성 사용자당, 체류 분포 대체 값은 세션당 포그라운드 참여시간이다. 현재 세션별 구간 분포는 조회할 수 없어 평균과 ‘구간 분포는 준비 중’을 표시한다. 가짜 0 분포를 만들지 않는다.
- 에디터는 `editor_open → album_add → chart_save → chart_complete`의 독립 행동 사용자 수를 표시한다. 인접 행동 간 비율은 순차 전환율이 아니며 100%를 초과할 수 있다. 앱의 `album_add`는 에디터 검색 목록에서 앨범 추가 성공 시 기록하며 제거·실패에는 기록하지 않는다. 이 이벤트는 해당 앱 버전부터 수집된다.
- 운영 보고서 인증·로그인·상태 패널·CSV는 유지한다. CSV에는 D3/D14 및 시간대 집계를 추가했다.

### 로컬 시안 검증

`npm run dev -- --port 3108` 후 `http://localhost:3108/admin/analytics?mock=1`을 연다. `NODE_ENV=development`이면서 localhost/127.0.0.1/::1에서만 허용한다. 화면과 CSV에 모의 데이터 표시가 있으며 운영 빌드와 원격 호스트에서는 인증을 생략하지 않는다. 7/28/90일과 플랫폼 선택에 따라 결정적인 검증 데이터를 생성한다. 모의 분포는 디자인 검증 전용이다.

스크린샷 `screenshots/analytics-1280.png`, `screenshots/analytics-740.png`는 이 로컬 모드의 전체 화면이며 실제 사용자 지표의 증거가 아니다. 실제 GA4 조회는 새 차원·이전 기간·D3를 포함해 정상 응답을 확인했다(현재 0건).

검증 명령: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. ESLint는 기존 Next 15의 `next/core-web-vitals` 규칙을 사용한다. 차트 경계값·누락 날짜·시간대 정렬·모의 데이터 제한·GA4 요청 계약을 추가 테스트한다.

브라우저 검증: 탭 전환, 화면 검색·체류 정렬, iOS/7일 선택, 모의 데이터 표시가 포함된 CSV 다운로드를 확인했다. 1280/740/390px에서 문서 가로 넘침이 없으며 740px에서 히어로 1열·KPI 2열로 전환한다. 폰트는 앱과 같은 Vina Sans 파일이며 OFL 라이선스를 함께 포함한다.

운영 빌드(`next start`)에서도 `?mock=1`은 로그인 화면을 유지하며 비인증 `/api/analytics`는 401로 차단되는 것을 브라우저에서 확인했다. 최종 검증 결과: build/typecheck/lint 통과, 테스트 61개 통과.
