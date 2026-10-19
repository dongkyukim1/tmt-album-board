import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { lookupAlbum } from '@/lib/itunes'
import styles from './album.module.css'

type Props = { params: Promise<{ id: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const album = await lookupAlbum(id)

  if (!album) {
    return { title: '앨범을 찾을 수 없어요 — TMT' }
  }

  const title = `${album.collectionName} — ${album.artistName}`
  const description = `${album.artistName}의 «${album.collectionName}»${
    album.genre ? ` · ${album.genre}` : ''
  } 블라인드 리뷰를 TMT에서 확인하세요.`
  const url = `${SITE_URL}/album/${album.collectionId}`

  // og:image는 opengraph-image.tsx 파일 컨벤션이 자동 주입한다.
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'music.album' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function AlbumPage({ params }: Props) {
  const { id } = await params
  const album = await lookupAlbum(id)

  if (!album) notFound()

  const appLink = `${SITE_URL}/?album=${album.collectionId}`

  const meta = [album.releaseDate?.slice(0, 4), album.genre, album.trackCount ? `${album.trackCount}곡` : null]
    .filter(Boolean)
    .join(' • ')

  return (
    <main className={styles.screen}>
      {album.artworkUrl ? (
        <div className={styles.backdrop} style={{ backgroundImage: `url("${album.artworkUrl}")` }} aria-hidden="true" />
      ) : null}
      <div className={styles.inner}>
        <div className={styles.hero}>
          {album.artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.cover}
              src={album.artworkUrl}
              alt={`${album.collectionName} 앨범 커버`}
              width={220}
              height={220}
            />
          ) : null}
          <div>
            <div className={styles.kicker}>Album</div>
            <h1 className={styles.title}>{album.collectionName}</h1>
            <p className={styles.artist}>{album.artistName}</p>
            {meta ? <p className={styles.meta}>{meta}</p> : null}
            <a href={appLink} className={`btn-primary ${styles.cta}`}>
              TMT에서 탑스터 만들기
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
