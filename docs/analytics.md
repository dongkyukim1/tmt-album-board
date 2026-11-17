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
