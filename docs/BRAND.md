# TMT 브랜드 가이드 — 2026-09 리디자인 (딥블랙 · 라임)

> 소스 오브 트루스: 앱 `topster_flutter/lib/core/theme/app_tokens.dart`.
> 웹(`index.html :root` · `src/app/globals.css`)은 이 값을 그대로 미러링한다.
> 값을 바꿀 때는 **앱 토큰을 먼저 바꾸고** 웹 2곳을 따라 맞춘다.
> `admin.html`은 관리자 전용 화면으로 아직 구 "미드나잇 갤러리"(웜 잉크·골드) 토큰이다.

## 아이덴티티

- **브랜드명**: TMT (Taste My Taste) — 탑스터 메이커
- **태그라인**: How Tasty Is Your Taste? / 취향을 기록하고, 나눠요
- **로고**: 라임 입술 마크(`tmt-logo.png`, 앱 `assets/branding/tmt_logo_512.png`에서 여백만 잘라낸 것).
  텍스트 워드마크(구 Song Myung 세리프 "TMT")는 폐기.
- **무드**: 딥블랙 캔버스 위에 앨범 커버가 주인공. UI는 중립 그레이 표면으로 물러나고,
  라임은 CTA·활성 상태에만 쓴다.

## 컬러

| 역할 | 토큰(앱) | 값 | 웹 변수 |
|---|---|---|---|
| 캔버스 | `bg` / `bgDeep` | `#0A0A0A` | `--bg` |
| 캔버스 텍스트 | `onCanvas` | `#EDE7DB` | `--txt` |
| 제목·강조 텍스트 | (화이트) | `#FFFFFF` | `--white` |
| 보조 텍스트 | `onCanvasMuted` | 아이보리 60% | `--muted` |
| 강조 보조 텍스트 | — | 아이보리 76% | `--muted2` |
| 헤어라인 | `hairline` | 아이보리 8% | `--line` |
| 강한 헤어라인(필드·세그먼트) | `hairlineStrong` | 아이보리 16% | `--line2` |
| 카드 표면 | (공개 탑스터 상세) | `#181818` | `--surface-1` |
| 시트·모달 표면 | `sheetSurface` | `#212121` | `--surface-2` |
| 보드·비활성 버튼 | (탑스터 보드) | `#2E2E2E` | `--surface-3` |
| 중립 알약 | `cardSurface` | `#393939` | `--card` |
| 중립 채움(버튼·검색·칩) | 화이트 10% | `rgba(255,255,255,.1)` | `--fill` |
| Primary(CTA·활성) | `primary` / `onPrimary` | `#CFF730` / `#14110D` | `--primary` `--on-primary` |
| 골드(뱃지 보조 강조) | `gold` | `#E3B24E` | `--gold` |
| 서브 레드(파괴적 액션) | `subRed` | `#E83B25` | `--sub-red` |
| 위시 | `secondary` | `#E1738A` | `--secondary` / `--wish` |
| 별점 | `star` | `#F0C24E` | `--star` |
| 위험 | `danger` | `#E5533D` | `--danger` |
| 아트워크 테두리 | `artworkBorder` | 화이트 8% | `--artwork-border` |

**verdict 시맨틱 (앱 앨범 상세 기준)**: 내 취향 = 라임 `#CFF730` · 글쎄요 = `#FF8300` · 취향 존중 = `#FF3BAA`.

금지: 웜 잉크 캔버스(`#14110D`)·웜 차콜 표면(`#1B1712` 계열)·골드 CTA(구 미드나잇 갤러리),
라임 그라데이션 버튼(라임은 항상 플랫), 이모지 아이콘(SVG 사용 — `src/components/icons.tsx`).

> 예외: 탑스터 **데이터**의 `style.backgroundColor` 기본값은 앱과 동일하게 `#14110D`를 유지한다
> (`charts.ts STYLE_DEFAULTS`, 저장 payload). UI 토큰이 아니라 앱과 공유하는 와이어 계약이다.

## 타이포그래피

- **전 화면 Pretendard** (웹: Pretendard Variable, 앱: 번들 Pretendard). 세리프 미사용.
- 페이지 타이틀 30 / 700 / -0.02em · 섹션 타이틀 22 / 600 · 행 제목 15~16 / 500 ·
  본문 14~15 · 캡션 12~13(아이보리 60%). 숫자는 tabular figures.
- 키커(영문 라벨)는 12 / 600 / 대문자 / 라임.

## 형태·간격·모션

- 라운드: 컨트롤 10 · 필드 14 · 카드 16 · 시트/모달 30 · 캡슐 999.
  커버: 편집 그리드 12 · 검색 썸네일 6 · 둘러보기 카드 15 · 상세 커버 22.
- 버튼: 주요 CTA = 라임 캡슐(52~58) · 보조 = 화이트 10% 채움 r10(50) · 세그먼트 = h40 r8, 선택은 아이보리 채움.
- 한줄평 박스: `#181818` + 라임 55% 1px 테두리 + 라임 따옴표 라벨, 카운터 우하단.
- 토스트: 화이트 92% · r12 · 잉크 글자 14/600.
- 간격 스케일: 4 / 8 / 12 / 16 / 20 / 24 / 32
- 모션: 등장·세그먼트 `cubic-bezier(.32,.72,0,1)`(앱 spring), 눌림 scale .97 + `cubic-bezier(.25,1,.5,1)`.
  `prefers-reduced-motion` 항상 준수.
- 최소 터치 타겟 44px, 포커스 링은 라임 2px(캔버스색 2px 오프셋).

## 웹 전용 요소 (앱에 없는 것)

- **상단 네비**(`index.html .nav` / `src/components/SiteHeader.tsx`): 앱 하단 탭바에 대응.
  로고 + 탑스터 · 취향찾기 · 마이, 현재 위치는 라임 점. 블러 22 + 하단 헤어라인.
- **푸터**(`.site-foot` / `SiteFooter.tsx`), **404**(`src/app/not-found.tsx`).
- 호버 상태, 키보드 포커스 링, 드래그 앤 드롭은 웹에서만 제공.
- 커버 색 배경: 앱의 포인트색 그라데이션(팔레트 추출) 대신 커버를 크게 흐려 까는 방식으로 재현
  (메이커 앰비언트·앨범 정보 패널·`/album/:id`).

## 표면별 현황 메모 (2026-10-04)

- SPA(`index.html`)·SSR(`src/`) 전부 위 토큰으로 동기화. admin만 구 토큰.
- OG 카드·파비콘(`icon.tsx`/`apple-icon.tsx`)은 딥블랙 + 라임 "TMT" 텍스트 — 입술 로고 이미지 적용은 미결.
- 미결(에셋 파이프라인 필요): GitHub Pages SPA용 정적 `og-home.png`(1200×630).
