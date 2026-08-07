/** OG 이미지(Satori)용 한글 폰트 로더.
 *
 * Satori는 폰트를 직접 등록하지 않으면 한글이 두부(□)로 렌더될 수 있다.
 * Google Fonts css2 API에 TTF를 주는 UA로 요청해 필요한 글리프만 서브셋으로 받는다.
 * 실패하면 undefined를 반환해 Satori 기본 폰트로 폴백한다(카드 자체는 항상 뜬다).
 */
type OgFont = {
  name: string
  data: ArrayBuffer
  style: 'normal'
  weight: 400 | 700
}

const TTF_UA =
  'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/109.0'

export async function loadKoreanFont(text: string): Promise<OgFont[] | undefined> {
  try {
    const family = 'Noto+Sans+KR:wght@700'
    const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`
    const css = await (
      await fetch(url, { headers: { 'User-Agent': TTF_UA } })
    ).text()
    const match = css.match(/src:\s*url\((.+?)\)\s*format\('(?:truetype|opentype)'\)/)
    if (!match) return undefined

    const res = await fetch(match[1])
    if (!res.ok) return undefined
    const data = await res.arrayBuffer()
    return [{ name: 'Noto Sans KR', data, style: 'normal', weight: 700 }]
  } catch (error) {
    console.error('OG font load failed, falling back to default:', error)
    return undefined
  }
}
