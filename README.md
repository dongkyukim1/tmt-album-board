# TMT — Topster Maker 🎵

> 취향을 공유하고 싶은 사람들의 커뮤니티 — **토스터(Topster) 메이커**

빈 그리드를 눌러 앨범을 채우고, 한 줄 평과 함께 저장·공유하는 웹 메이커.
앨범 커버·수록곡·장르·발매연도는 **Apple iTunes API**에서 실시간으로 불러옵니다.

**🔗 Live:** https://dongkyukim1.github.io/tmt-album-board/

## ✨ 핵심 플로우 (와이어프레임 기준)

1. **빈 그리드가 첫 화면** — 3×3 · 4×4 · 5×5 크기 선택
2. 빈 칸을 **누르면 검색 오버레이** — 선택하면 그 칸에 바로 들어가고, 다음 빈 칸으로 이어짐
3. 그리드를 **전부 채우고 + 한 줄 평**(가중길이 30 — 한글 15자·라틴 30자, 백엔드 규칙 동일)을 쓰면 **'저장하고 공유하기'** 활성화
4. 비로그인 상태면 **로그인 팝업**(앱과 같은 계정) → 로그인하면 이어서 저장
5. 저장 완료 팝업 — **앱에서 확인하기**(my Topsters 안내 + 공유 링크) / **다운로드**(그리드 + 앨범정보 PNG)

## 🎧 기능

- **토스터 메이커** — 클릭 삽입, 셀 간 드래그 스왑, 채운 칸 클릭 → 앨범 상세(수록곡·교체·제거), 앰비언트 커버 배경, 진행 링 저장 바, 드래프트 자동 보존(localStorage)
- **내 토스터** — 앱 my Topsters와 같은 목록(GET `/me/charts`) · 웹에서 3×3/4×4/5×5 편집(PUT) · 삭제 · 공유 링크
- **다른 사람들의 토스터** — 공개 피드(GET `/charts/public`) 레일 → 공유 페이지로 이동
- **공유 페이지(SSR)** — `/c/:id`(공개 토스터), `/album/:id`(앨범) — Next.js + 동적 OG 카드
- **디자인** — 앱(topster_flutter) 2026-09 리디자인과 동일 토큰(#0A0A0A 딥블랙 캔버스 · #CFF730 라임) + Pretendard · 입술 로고 · 웹 공통 헤더/푸터 — 상세는 [docs/BRAND.md](docs/BRAND.md)

## 🧪 로컬 목 모드 (배포 전 디자인 확인)

백엔드 없이 전체 플로우(검색→채움→로그인→저장→다운로드)를 로컬에서 볼 수 있습니다.

```bash
npm run mock          # → http://localhost:8000/?mock=1
```

- `mock.js`가 `?mock=1`일 때만 `fetch`를 가로채는 MSW 스타일 인터셉터 (의존성 0, 배포 환경에선 비활성)
- 검색어 예: `eminem` · `iu` · `radiohead` / 로그인: 아무 이메일·비번 / 인증코드: `000000`

## 🔐 인증 (자체 발급 JWT — 앱과 공유)

- 이메일+비밀번호 로그인, 코드 인증 3단계 가입, 코드 인증 비밀번호 재설정
- 소스 오브 트루스 = 전용 백엔드 **music-api**. 액세스 토큰(15분)은 `Authorization: Bearer`, 401 시 refresh(30일, 회전) 후 1회 재시도. `localStorage`(`auth_access` 등) 보관

## 🏗 아키텍처 (하이브리드)

```
  웹(SPA + Next.js)            Flutter 앱(Topster)
        │                             │
        │     Bearer JWT + REST/JSON  │
        └──────────────┬──────────────┘
                       ▼
            전용 백엔드 (music-api)
            - Postgres (charts/리뷰/프로필)
            - 자체 JWT 발급·검증 (HS256 + argon2id)
            - iTunes 프록시 / R2 업로드
```

- **SPA** (`index.html`) — 토스터 메이커. **GitHub Pages**(정적) 서빙. 데이터·인증은 백엔드 API(`API_BASE`, 미설정 시 운영 URL 폴백)
- **차트 계약** — `POST/PUT /charts` `{name, comment, rows, cols, style, cells[{index,item}], isPublic}` — 앱 Hive 구조와 동일 와이어 포맷이라 웹 저장분이 앱 my Topsters에 그대로 동기화
- **Next.js(App Router)** — SEO/공유용 SSR 페이지와 동적 OG 이미지. **Vercel** 배포 대상
- **설정 주입** — Vercel에선 `/env.js` 런타임 라우트가 `window.__ENV__` 주입, GitHub Pages에선 정적 `env.js` 폴백

## 🚀 실행

```bash
# 정적 SPA만 (GitHub Pages와 동일)
python3 -m http.server 8000          # http://localhost:8000

# 목 모드 (백엔드 없이 전체 플로우)
npm run mock                         # http://localhost:8000/?mock=1

# Next.js 하이브리드(SSR/OG 포함) — 로컬
cp .env.example .env.local           # 값 채우기(API_BASE_URL)
npm install && npm run dev           # http://localhost:3000
```

> `index.html`·`mock.js`가 SPA 단일 소스이며, Next 빌드 시 `public/`으로 자동 복사됩니다(prebuild).

## 📁 구조

```
index.html              # SPA (토스터 메이커 + 인증 + 다운로드) — 단일 파일, GitHub Pages 서빙
mock.js                 # 로컬 목 모드 (?mock=1 전용 fetch 인터셉터)
.nojekyll               # GitHub Pages Jekyll 우회(정적 서빙)
src/app/album/[id]/     # 앨범 SSR 페이지 + 동적 OG
src/app/c/[id]/         # 공개 토스터 공유 SSR 페이지 + 동적 OG
src/app/env.js/         # 런타임 환경설정 주입 라우트(Vercel)
src/lib/                # iTunes / charts 서버 유틸
next.config.ts          # `/` → SPA 리라이트 등
```

## ⚠️ 참고

- 앨범 데이터·커버·수록곡은 Apple iTunes 공개 API에서 가져오며 저작권은 각 권리자에게 있습니다.
- 이미지 다운로드는 mzstatic이 `Access-Control-Allow-Origin: *`를 반환해 캔버스 오염 없이 동작합니다.

## 📝 라이선스

MIT
