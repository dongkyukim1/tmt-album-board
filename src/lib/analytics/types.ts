export type Platform = 'app' | 'android' | 'ios' | 'web'
export type MetricSet = { activeUsers: number; newUsers: number; sessions: number; screenPageViews: number; userEngagementDuration: number; engagementRate: number }
export type DailyPoint = MetricSet & { date: string }
export type Screen = { name: string; users: number; views: number; seconds: number }
export type Cohort = { start: string; end: string; users: number; days: Record<string, number | null> }
export type Report = {
  source: 'Google Analytics 4'; fetchedAt: string; timezone: string; start: string; end: string;
  totals: MetricSet; previous: MetricSet; daily: DailyPoint[]; screens: Screen[];
  cohorts: Cohort[]; active: { day: number; week: number; month: number };
  realtime: number | null; events: { name: string; count: number; users: number }[];
  platforms: { name: string; users: number }[]; warnings: string[];
}
export const screenLabels: Record<string, string> = {
  home: '홈', landing: '시작 화면', auth: '로그인·가입', digging: '디깅', topsters: '탑스터', search: '검색', my_tmt: 'My TMT',
  editor: '탑스터 에디터', album_detail: '앨범 상세', public_chart: '탑스터 상세', my_topsters: '내 탑스터',
  taste_onboarding: '취향 온보딩', taste_selection: '취향 설정', profile_edit: '프로필 편집', similar_taste: '비슷한 취향',
  overlay: '모달·시트', notifications: '알림', my_wishlist: '위시리스트', artist_albums: '아티스트 앨범',
}
export const eventLabels: Record<string, string> = { first_open: '첫 실행', session_start: '세션 시작', editor_open: '에디터 열기', chart_save: '탑스터 저장', chart_complete: '탑스터 완성', share_open: '공유 시트 열기', screen_view: '화면 조회' }
