import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const config = {
  runtime: 'edge'
}

const COPY_FALLBACK = {
  title: 'The Digital Infrastructure of Global Hacker Movement',
  desc: 'Dora Factory creates protocols, toolings, and public good infrastructures that help open source communities and frontier tech builders to thrive.'
}
const CHAR_LIMIT = {
  title: 140,
  desc: 280
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = ''
  var bytes = new Uint8Array(buffer)
  var len = bytes.byteLength
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function fetchAssets(): Promise<
  [
    { name: string; data: ArrayBuffer; weight: 400 | 800; style: 'normal' }[],
    string
  ]
> {
  const [publicSans400, publicSans800, bg] = await Promise.all([
    fetch(
      new URL('../../assets/PublicSans-Regular.woff', import.meta.url)
    ).then(res => res.arrayBuffer()),
    fetch(
      new URL('../../assets/PublicSans-ExtraBold.woff', import.meta.url)
    ).then(res => res.arrayBuffer()),
    fetch(new URL('../../assets/og-bg.png', import.meta.url)).then(res =>
      res.arrayBuffer()
    )
  ])
  return [
    [
      {
        name: 'Public Sans',
        data: publicSans400,
        weight: 400,
        style: 'normal'
      },
      {
        name: 'Public Sans',
        data: publicSans800,
        weight: 800,
        style: 'normal'
      }
    ],
    arrayBufferToBase64(bg)
  ]
}

export default async function handler(request: NextRequest) {
  try {
    const [fonts, bg] = await fetchAssets()
    const { searchParams } = new URL(request.url)

    // ?title=<title>
    const hasTitle = searchParams.has('title')
    const title = hasTitle
      ? searchParams.get('title')?.slice(0, CHAR_LIMIT.title)
      : COPY_FALLBACK.title

    const hasDesc = searchParams.has('desc')
    const desc = hasDesc
      ? searchParams.get('desc')?.slice(0, CHAR_LIMIT.desc)
      : COPY_FALLBACK.desc

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: '#111111',
            backgroundImage: `url(data:image/png;base64,${bg})`,
            backgroundSize: '1200px 628px'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '744px',
              margin: '200px 324px 0 132px'
            }}
          >
            <div
              style={{
                color: 'rgba(0, 0, 0, 0)',
                fontFamily: '"Public Sans"',
                fontSize: '54px',
                fontWeight: 800,
                lineHeight: '60px',
                // textWrap: 'wrap',
                backgroundClip: 'text',
                backgroundImage:
                  'linear-gradient(72deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.98) 100%)'
              }}
            >
              {title}
            </div>
            <div
              style={{
                marginTop: '24px',
                color: '#9B9BB0',
                fontFamily: '"Public Sans"',
                fontSize: '24px',
                fontWeight: 400,
                lineHeight: '32px'
              }}
            >
              {desc}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 628,
        fonts
      }
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the OG image`, {
      status: 500
    })
  }
}
