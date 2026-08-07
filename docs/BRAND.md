# TMT 브랜드 가이드 — "미드나잇 갤러리"

> 소스 오브 트루스: 앱 `topster_flutter/lib/core/theme/app_tokens.dart`.
> 웹(`index.html :root` · `src/app/globals.css` · `admin.html :root`)은 이 값을 그대로 미러링한다.
> 값을 바꿀 때는 **앱 토큰을 먼저 바꾸고** 웹 3곳을 따라 맞춘다.

## 아이덴티티

- **브랜드명**: TMT (Taste My Taste) — 탑스터 메이커
- **태그라인**: How Tasty Is Your Taste?
- **무드**: 어두운 갤러리에 앨범 아트를 액자처럼 거는 감성. 캔버스는 따뜻한 잉크,
  글자는 아이보리, 액센트는 절제된 골드. 앨범 커버가 항상 주인공이고 UI는 뒤로 물러난다.

## 컬러

| 역할 | 토큰(앱) | 값 | 웹 변수 |
|---|---|---|---|
| 캔버스 | `bg` | `#14110D` | `--bg` |
| 캔버스 텍스트 | `onCanvas` | `#EDE7DB` | `--txt` |
| 보조 텍스트 | `onCanvasMuted` | 아이보리 62% | `--muted` |
| 강조 보조 텍스트 | — (`muted2` #B8AF9F 대응) | 아이보리 76% | `--muted2` |
| 희미(장식 전용) | `onCanvasFaint` | 아이보리 26% | `--faint` |
| 헤어라인 | `canvasLine` | 아이보리 12% | `--line` |
| 표면 1·2·3 | `surface1~3` | `#1B1712` `#221D16` `#2E271E` | `--surface-1~3` |
| 표면 텍스트 | `text` / `muted` / `muted2` | `#F2ECE1` `#9A9184` `#B8AF9F` | `--s-txt` `--s-muted` `--s-muted2` |
| Primary(CTA) | `primary` / `onPrimary` | `#E3B24E` / `#14110D` | `--primary` `--on-primary` |
| Secondary(개인 영역) | `secondary` | `#E1738A` | `--secondary` |
| Taste | `taste` | `#63C39A` | `--taste` |
| 별점 | `star` | `#F0C24E` | `--star` |
| 위험 | `danger` | `#E5533D` | `--danger` |
| 아트워크 테두리 | `artworkBorder` | 화이트 8% | `--artwork-border` |

**verdict 시맨틱 (전 플랫폼 공통)**: TASTE! = 에메랄드 `#63C39A` · HMM.. = 골드 `#E3B24E` ·
RESPECT = 로즈 `#E1738A` · 위시 = 로즈 · dislike = `#6E6558` · skip = `#4A4338`.

금지: 순수 `#000`/`#FFF` 표면·보더(잉크/아이보리 사용), 차가운 청회색(`#202028` 등),
네온 옐로(구 acid 시스템 — 전부 제거됨).

## 타이포그래피

- **본문(전 플랫폼)**: 시스템 산스 — 웹은 Pretendard Variable, 앱은 SF Pro/Apple SD Gothic Neo.
  **한글 UI 텍스트(버튼·칩·라벨 포함)는 항상 산스.**
- **워드마크 "TMT"**: 앱 = HelveticaNeue Heavy Italic(+SongMyung 한글 폴백),
  웹 = Song Myung 세리프(`--logo`) — 웹에서 Helvetica Neue Heavy Italic을 신뢰할 수 없어
  에디토리얼 세리프로 의도적으로 대체한 것. 세리프는 **라틴 로고/워드마크 전용**.
- 웹 `--pixel`은 `--logo`의 하위 호환 별칭 — 신규 코드는 `--logo`만 사용.

## 형태·간격·모션

- 라운드: 4 / 8 / 14 / 999(pill) + 커버 6 · 카드 12 (앱 `rSm~rPill`, `rCover`, `rCard`)
- 간격 스케일: 4 / 8 / 12 / 16 / 20 / 24 / 32
- 모션: 기본 220ms, 이징 `cubic-bezier(.2,.8,.25,1)` — `prefers-reduced-motion` 항상 준수
- 최소 터치 타겟: 44~48px (앱 `minTouch` 48)

## 표면별 현황 메모 (2026-08-08 정합화 반영)

- SPA(`index.html`)·SSR(`src/`)·admin(`admin.html`) 모두 위 토큰으로 동기화됨.
- OG 카드(`opengraph-image.tsx`)는 잉크 캔버스 + 골드 키커 + Noto Sans KR(런타임 서브셋 로드).
- admin의 바이닐 디스크 브랜드마크는 관리자 전용 서브 마크로 유지(외부 노출 없음).
- 미결(에셋 파이프라인 필요): GitHub Pages SPA용 정적 `og-home.png`(1200×630)와
  `apple-touch-icon.png` — SSR 라우트는 `icon.tsx`/`apple-icon.tsx`로 해결됨.
