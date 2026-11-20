import type { NextSeoProps } from 'next-seo'

export interface DocumentMetadata {
  route: string
  title: string
  description: string
  section: string
  locale: string
}

export interface SharingImage {
  url: string
  width: number
  height: number
  type: 'image/png' | 'image/jpeg' | 'image/webp'
  alt: string
}

export interface SharingPage extends DocumentMetadata {
  image: SharingImage
}

export type SharingManifest = Record<string, SharingPage>

export const SITE_NAME = 'Dora Factory Documentation'
export const SITE_ROOT = 'https://docs.dorafactory.org'
export const HOME_TITLE = 'The Digital Infrastructure of Global Hacker Movement'
export const HOME_DESCRIPTION =
  'Dora Factory creates protocols, toolings, and public good infrastructures that help open source communities and frontier tech builders to thrive.'

export function normalizeRoute(value = '/'): string {
  const pathname = value.split(/[?#]/, 1)[0] || '/'
  const decoded = pathname
    .split('/')
    .map(part => {
      try {
        return decodeURIComponent(part)
      } catch {
        return part
      }
    })
    .join('/')
  return `/${decoded.split('/').filter(Boolean).join('/')}`
}

export function siteOrigin(value: string = SITE_ROOT): string {
  const url = new URL(value || SITE_ROOT)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error('NEXT_PUBLIC_SITE_ROOT must be an HTTP(S) site URL')
  }
  return url.origin
}

export function absoluteUrl(path: string, origin?: string): string {
  return new URL(path, `${siteOrigin(origin)}/`).href
}

export function seoProps(page: SharingPage, origin: string = SITE_ROOT) {
  const canonical = absoluteUrl(page.route, origin)
  const image = {
    ...page.image,
    url: absoluteUrl(page.image.url, origin)
  }
  return {
    title: page.route === '/' ? SITE_NAME : page.title,
    titleTemplate: page.route === '/' ? '%s' : `%s · ${SITE_NAME}`,
    description: page.description,
    canonical,
    openGraph: {
      type: 'website',
      locale: page.locale,
      siteName: SITE_NAME,
      url: canonical,
      title: page.title,
      description: page.description,
      images: [image] as [SharingImage]
    },
    twitter: {
      cardType: 'summary_large_image',
      site: '@DoraFactory',
      handle: '@DoraFactory'
    },
    additionalMetaTags: [
      { name: 'twitter:title', content: page.title },
      { name: 'twitter:description', content: page.description },
      { name: 'twitter:image', content: image.url },
      { name: 'twitter:image:alt', content: image.alt }
    ]
  } satisfies NextSeoProps
}
