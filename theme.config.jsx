import { useRouter } from 'next/router'
import { useTheme } from 'nextra-theme-docs'
import { Logo } from '@components/logo'
import { Footer } from '@components/footer'
import pages from './.generated/seo.json'
import { normalizeRoute, seoProps } from './lib/seo.mjs'

export default {
  head: () => {
    const { systemTheme, theme } = useTheme()

    // Apple touch icons
    let touchIcon = `/assets/apple-touch-icon-${
      theme === 'system' ? systemTheme : theme
    }.png`

    return (
      <>
        <meta name="apple-mobile-web-app-title" content="DF Docs" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
        <link
          rel="mask-icon"
          href="/assets/favicon-mask.svg"
          type="image/svg+xml"
          color="#FF8533"
        />
        <link rel="apple-touch-icon" href={touchIcon} />

        <link
          rel="manifest"
          href="/assets/manifest.json"
          crossOrigin="use-credentials"
        />
      </>
    )
  },

  logo: <Logo />,
  docsRepositoryBase: 'https://github.com/DoraFactory/df-docs/tree/main',
  sidebar: {
    defaultMenuCollapseLevel: 1
    // autoCollapse: true,
  },
  project: {
    link: 'https://github.com/DoraFactory'
  },

  toc: {
    title: 'On this page',
    backToTop: true
  },

  footer: {
    text: Footer
  },

  useNextSeoProps: () => {
    const { pathname } = useRouter()
    const page = pages[normalizeRoute(pathname)]
    // Error pages have no document metadata; Nextra supplies their own titles.
    if (!page) return { noindex: true }
    return seoProps(page, process.env.NEXT_PUBLIC_SITE_ROOT)
  }
  // ...
}
