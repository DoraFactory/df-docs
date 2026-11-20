export const SITE_NAME = 'Dora Factory Documentation'
export const SITE_ROOT = 'https://docs.dorafactory.org'
export const HOME_TITLE = 'The Digital Infrastructure of Global Hacker Movement'
export const HOME_DESCRIPTION =
  'Dora Factory creates protocols, toolings, and public good infrastructures that help open source communities and frontier tech builders to thrive.'

export function normalizeRoute(value = '/') {
  const pathname = value.split(/[?#]/, 1)[0]
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

export function siteOrigin(value = SITE_ROOT) {
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

export function absoluteUrl(path, origin) {
  return new URL(path, `${siteOrigin(origin)}/`).href
}

export function seoProps(page, origin = SITE_ROOT) {
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
      images: [image]
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
  }
}
