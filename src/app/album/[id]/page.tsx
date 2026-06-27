import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { lookupAlbum } from '@/lib/itunes'

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

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '48px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {album.artworkUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={album.artworkUrl}
          alt={`${album.collectionName} 앨범 커버`}
          width={300}
          height={300}
          style={{ borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,.5)' }}
        />
      ) : null}

      <h1 style={{ fontSize: 28, margin: '28px 0 6px', letterSpacing: '-0.02em' }}>
        {album.collectionName}
      </h1>
      <p style={{ fontSize: 18, color: '#b8b8bd', margin: 0 }}>{album.artistName}</p>

      <p style={{ fontSize: 14, color: '#88888d', marginTop: 12 }}>
        {[album.genre, album.releaseDate?.slice(0, 4), album.trackCount ? `${album.trackCount}곡` : null]
          .filter(Boolean)
          .join(' · ')}
      </p>

      <a
        href={appLink}
        style={{
          marginTop: 32,
          background: '#f2f2f2',
          color: '#000',
          padding: '14px 28px',
          borderRadius: 12,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        TMT에서 이 앨범 리뷰 보기 →
      </a>
    </main>
  )
}
