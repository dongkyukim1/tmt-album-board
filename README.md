# TMT — Taste My Taste 🎵

> 취향을 공유하고 싶은 사람들의 커뮤니티 — **Album Board** (블라인드 음악 리뷰)

커버만 보고 들어와서, 들어봤으면 별점과 한 줄 평을 남기는 음악 취향 공유 보드.
앨범 커버·수록곡·피처링·장르·발매연도는 **Apple iTunes API**에서 실시간으로 불러옵니다.

**🔗 Live:** https://dongkyukim1.github.io/tmt-album-board/

## ✨ 핵심: 블라인드 리뷰

> **내 평점·평론을 남겨야 다른 사람의 의견이 열린다.**

- 처음에는 평균 평점이 `?.?`로 잠겨 있고, 다른 멤버들의 평론은 블러 처리됩니다.
- 별점(★ 1~5) + 한 줄 평(최소 10자)을 모두 작성해야 `잠금 해제`가 활성화됩니다.
- 제출하면 평균 평점이 공개되고 다른 사람들의 평론이 드러납니다.

## 🎧 기능

- **온보딩** — 장르 → 무드 선택 + 추천 앨범 별점(최소 3개) → 개인화 보드. (localStorage 저장)
- **지역 기반 실시간 차트 / iTunes 검색 / 실시간 메타데이터**(커버·수록곡·피처링·장르·연도)
- **계정 · 공유 리뷰** — 로그인하면 리뷰가 계정에 저장되어 기기 간 동기화되고, 다른 사용자와 공유됩니다.
- **프로필** — 내 평점 통계 + **내 토스터**(앱에서 만든 공개 차트) 표시
- **공유 페이지(SSR)** — `/album/:id`(앨범), `/c/:id`(공개 토스터)에 동적 OG 카드 — 설치 없이 링크로 열람

## 🔐 인증 (Supabase)

- **이메일 + 비밀번호** 회원가입/로그인(기본) + **매직 링크**(보조) 공존.
- 클라이언트는 Supabase 액세스 토큰(JWT)을 받아 백엔드 API 요청에 `Authorization: Bearer`로 전달.
- 인증의 source of truth = Supabase `auth.users`. 도메인 데이터(리뷰/차트)는 전용 백엔드.

## 🏗 아키텍처 (하이브리드)

```
  웹(SPA + Next.js)            Flutter 앱(Topster)
        │   Supabase SDK (인증)        │
        │──────── JWT ─────────────────│
        │     Bearer JWT + REST/JSON   │
        └──────────────┬───────────────┘
                       ▼
            전용 백엔드 (NestJS, music-api)
            - Postgres (리뷰/차트/프로필)
            - Supabase JWT 검증
            - iTunes 프록시 / R2 업로드
```

- **SPA** (`index.html`) — 보드·모달·블라인드 리뷰. **GitHub Pages**(정적)에서 서빙. 데이터는 백엔드 API(`API_BASE`) 설정 시 백엔드, 미설정 시 Supabase 직접호출로 폴백.
- **Next.js(App Router)** — SEO/공유용 **SSR 페이지**(`/album/:id`, `/c/:id`)와 **동적 OG 이미지**. **Vercel** 배포 대상(SSR이 필요해 정적 호스팅 불가).
- **설정 주입** — Vercel에선 `/env.js` 런타임 라우트가 `window.__ENV__`로 주입. 정적 호스팅(GitHub Pages)에선 publishable(anon) 키를 인라인 폴백으로 사용(실시크릿 아님).

## 🚀 실행

```bash
# 정적 SPA만 (GitHub Pages와 동일)
python3 -m http.server 8000          # http://localhost:8000

# Next.js 하이브리드(SSR/OG 포함) — 로컬
cp .env.example .env.local           # 값 채우기(API_BASE_URL)
npm install && npm run dev           # http://localhost:3000
```

> `index.html`이 SPA 단일 소스이며, Next 빌드 시 `public/index.html`로 자동 복사됩니다(prebuild).

## 📁 구조

```
index.html              # SPA (보드 + 블라인드 리뷰 + 인증 + iTunes 로딩) — 단일 파일, GitHub Pages 서빙
.nojekyll               # GitHub Pages Jekyll 우회(정적 서빙)
src/app/album/[id]/     # 앨범 SSR 페이지 + 동적 OG
src/app/c/[id]/         # 공개 토스터 공유 SSR 페이지 + 동적 OG
src/app/env.js/         # 런타임 환경설정 주입 라우트(Vercel)
src/lib/                # iTunes / charts 서버 유틸
next.config.ts          # `/` → SPA 리라이트 등
```

## ⚠️ 참고

- 앨범 데이터·커버·수록곡은 Apple iTunes 공개 API에서 가져오며 저작권은 각 권리자에게 있습니다.
- 공유 리뷰가 아직 없는 앨범은 데모용 시드 평론(collectionId 시드)이 노출될 수 있습니다.

## 📝 라이선스

MIT
