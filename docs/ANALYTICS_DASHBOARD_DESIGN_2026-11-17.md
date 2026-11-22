# /admin/analytics 디자인 스펙 — 에디토리얼 + 차트 (2026-11-17 확정)

승인된 시안: `docs/analytics-dashboard-mockup.html` (첫 탭 "최종"). 브라우저로 열어 보면서 작업할 것.
작업 대상: `src/app/admin/analytics/Dashboard.tsx`, `dashboard.module.css`, `src/lib/analytics/*`.
기존 로그인 패널·상태 패널·CSV 내보내기·접근성(skip link, aria) 로직은 유지한다.

## 1. 토큰 — 앱과 동일 (globals.css 값 사용, 모듈 CSS의 자체 팔레트 제거)

| 역할 | 값 |
|---|---|
| 바탕 | `#0A0A0A` (현재 모듈의 `#10120f` → 교체) |
| 글자 | `#EDE7DB` / 62% / 34% (ink · ink-2 · ink-3) |
| 헤어라인 | `rgba(237,231,219,.10)`, 강조 `.18` |
| 라임 | `#CFF730` (활성 탭 밑줄·주 지표·각 차트 첫 번째 시리즈에만) |
| 라임 틴트 | `rgba(207,247,48,.14)` |
| 증가 / 감소 | `#63C39A` (mint) / `#E1738A` (rose) — 현재 `.positive/.negative` 색 교체 |
| 이전 기간 | ink-3 회색 선 |
| 본문 폰트 | Pretendard (`--sans`) |
| 숫자 디스플레이 | **VinaSans** (앱 TOM 카드 "09 ALBUMS"와 동일 파일 `assets/fonts/VinaSans-Regular.ttf` → `public/fonts/`에 복사, `@font-face`). 웹 폰트 로드 전 폴백 `Anton` 불필요, 시스템 산세리프로. |
| 숫자 | 전부 `font-variant-numeric: tabular-nums` |
| 라운드 | 카드 없음. 칩/필 `999px`, 히트맵 셀 `4px`, 막대 `3px` |

사이드바·카드 배경(`.panel`, `.card`)·그림자·그라디언트는 전부 제거한다. 구획은 헤어라인만으로.

## 2. 레이아웃 (위→아래)

```
header   로고(입술+ "TMT insights") | 탭 오버뷰·리텐션·화면 분석·사용자 행동·데이터 가이드 | 플랫폼 칩 4 + 기간 ⌄ + CSV
hero     [420px] 큰 숫자 1,284 (VinaSans 150px, 마지막 3자리 라임) + 라임 룰 120×3 + 한 줄 요약
         [1fr]   28일 추이 차트 250px
kpis     4칸 헤어라인 띠: 신규(스파크) · 세션(스파크) · 평균 체류(스파크, rose) · 참여율(링)
sect 1   [1.25fr] 코호트 히트맵 + 코호트별 D-곡선 미니 차트  | [1fr] 화면별 평균 체류 가로막대
sect 2   [1.25fr] 요일×시간대 접속 히트맵 7×24              | [1fr] 세션 체류시간 분포 히스토그램 6구간
sect 3   [1.25fr] 에디터 퍼널 4단계                          | [1fr] 플랫폼 도넛 + 이벤트 막대
```

- 좌우 패딩 40px, 섹션은 상하 26px, 왼쪽/오른쪽 칸 사이 세로 헤어라인(간격 34px).
- 사이드바는 없다. `sections` 상태는 유지하되 header 탭으로 전환. 오버뷰가 위 전체이고 리텐션/화면/행동 탭은 해당 섹션만 크게 보여주는 필터로 동작해도 된다.
- 740px 이하: 히어로 1열(숫자 96px), KPI 2×2, 섹션 1열, 시간대 히트맵은 가로 스크롤.

## 3. 섹션별 데이터 매핑 (GA4 Data API)

이미 있는 것은 `Report` 타입 그대로 쓰고, 새로 필요한 쿼리 3개를 `google.ts`에 추가한다.

| 섹션 | 시각 요소 | 데이터 |
|---|---|---|
| 히어로 숫자 | `totals.activeUsers`, delta vs `previous` | 있음 |
| 히어로 차트 | 라임 영역+선 = `daily[].activeUsers`, 점선 = `daily[].sessions`(우측 축 없이 같은 높이로 정규화), 회색 = 이전 동기간 일별 activeUsers | **추가**: 이전 기간 `daily` (`previousDaily: DailyPoint[]`) |
| KPI 스파크 | 신규 `daily[].newUsers`, 세션 `daily[].sessions`, 체류 `daily[].userEngagementDuration / activeUsers` | 있음 |
| 참여율 링 | `totals.engagementRate` | 있음 |
| 코호트 히트맵 | `cohorts[]` D1·D3·D7·D14·D30 (현 week_0..7 → 표시 4주만, 최신 4개) | 있음 (`days` 키에서 1/3/7/14/30 추출) |
| D-곡선 | 각 코호트 `days` 중 null 아닌 값만 선으로 | 있음 |
| 화면 체류 막대 | `screens[]` 정렬: `seconds/users` 내림차순, 상위 6, 라벨 `screenLabels` | 있음 |
| 시간대 히트맵 | 세션 수 7×24 | **추가**: dimensions `dayOfWeek`,`hour` / metrics `sessions` |
| 체류 분포 | 세션 비율 6구간 (~10초, 10–30초, 30초–1분, 1–3분, 3–10분, 10분+) | **추가**: 앱 이벤트 `session_end`에 `engagement_time_msec` 파라미터를 커스텀 디멘션으로 올리거나, 불가하면 이 섹션은 `userEngagementDuration` 평균만 표시하고 "구간 분포는 준비 중"으로 비워 둔다(0으로 그리지 말 것) |
| 퍼널 | 에디터 열기 → 앨범 추가 → 탑스터 저장 → 완성, 사용자 수 + 단계 전환율 | 있음(`events[]` totalUsers: `editor_open`, `chart_save`, `chart_complete`) · **추가** 앱 이벤트 `album_add` (앱 `AppAnalytics.instance.event('album_add')` 에디터 `_toggle`에 1줄) |
| 플랫폼 도넛 | `platforms[]` 라임=iOS, ink=Android, ink-3=Web, 가운데 최대 비율 | 있음 |
| 이벤트 막대 | `events[]` 상위 4, `eventLabels` | 있음 |

## 4. 차트 규칙

- 전부 인라인 SVG, 라이브러리 없음(현 `Trend` 방식 유지). 축 눈금은 0/25/50/75/100% 식으로 **데이터 최대값 기준 반올림**, 모든 눈금 라벨은 실제 도달값.
- 라임은 한 차트에 한 시리즈만. 보조 시리즈는 ink 점선 또는 ink-3.
- 코호트 빈 셀: 점선 테두리 + `–` + `title="데이터 없음(임계값 미달)"`. 0%로 그리지 않는다(현 `parseCohorts`의 null 유지).
- 히트맵 농도: `rgba(207,247,48, 0.06 + v*0.9)`, v = 셀/최대.
- 체류시간 표기 `m:ss` (히어로 요약·KPI·화면 막대 공통).
- 호버: 추이 차트 점 + 캡션(`aria-live`) 현 방식 유지. 각 SVG에 `role="img" aria-label`.
- `<details>` 일별 데이터 표는 유지(접근성·CSV 검증용).

## 5. 카피

- 히어로 요약 한 줄: `↗ 12.4% 이전 동기간 대비. 신규 412명, 세 명 중 한 명이 7일 안에 다시 돌아왔습니다.` (가중 D7이 null이면 뒷문장 생략)
- 섹션 제목은 `h3` 13px ink-2, 오른쪽에 단위/기준(ink). 예: `코호트 리텐션  가입 주 기준 · 우측은 D-곡선`
- 데이터 메모(하단): 일별 보고서 최대 48시간 지연 반영 · 코호트 빈 칸은 0% 아님.

## 6. 완료 조건

- `npm run typecheck && npm run lint && npm test` 통과, 기존 `report.test` 유지.
- 1280 / 740 두 폭에서 스크린샷을 `docs/screenshots/analytics-*.png`로 남길 것.
- 모의 데이터로도 모든 섹션이 그려지는 `?mock=1` 경로(현 `mock.js` 패턴) 제공.
