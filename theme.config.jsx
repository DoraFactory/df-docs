import { useRouter } from 'next/router'
import { useConfig, useTheme } from 'nextra-theme-docs'
import { Logo } from '@components/logo'
import { Footer } from '@components/footer'

export default {
  head: () => {
    const router = useRouter()
    const { systemTheme = 'system' } = useTheme()
    const { frontMatter } = useConfig()

    const COPY_FALLBACK = {
      title: 'The Digital Infrastructure of Global Hacker Movement',
      desc: 'Dora Factory creates protocols, toolings, and public good infrastructures that help open source communities and frontier tech builders to thrive.'
    }
    const SITE_ROOT = process.env.SITE_ROOT
    const asPath = router.asPath

    let ogTitle = frontMatter.title || COPY_FALLBACK.title
    let ogDesc = frontMatter.desc || COPY_FALLBACK.desc
    let ogUrl = asPath === '/' ? SITE_ROOT : `${SITE_ROOT}${router.asPath}`
    let ogImg = `${SITE_ROOT}/api/og`

    if (asPath !== '/') {
      const encTitle = encodeURIComponent(ogTitle)
      const encDesc = encodeURIComponent(ogDesc)
      ogImg = `${SITE_ROOT}/api/og?title=${encTitle}&desc=${encDesc}`
    }

    return (
      <>
        <meta
          name="description"
          content={frontMatter.desc || COPY_FALLBACK.desc}
        />

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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <link
          rel="manifest"
          href="/assets/manifest.json"
          crossOrigin="use-credentials"
        />

        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en" />
        <meta property="og:site_name" content="Dora Factory Documentation" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDesc} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:image" content={ogImg} />
        <meta property="twitter:image" content={ogImg} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@DoraFactory" />
        <meta name="twitter:creator" content="@DoraFactory" />
      </>
    )
  },

  logo: <Logo />,
  docsRepositoryBase:
    'https://github.com/dorafactory/df-docs/blob/master/pages',
  sidebar: {
    defaultMenuCollapseLevel: 1
    // autoCollapse: true,
  },
  project: {
    link: 'https://github.com/dorafactory'
  },

  toc: {
    title: 'On this page',
    backToTop: true
  },

  footer: {
    text: Footer
  },

  useNextSeoProps: () => {
    const { asPath } = useRouter()
    if (asPath !== '/' && asPath !== '') {
      return {
        titleTemplate: '%s · Dora Factory Documentation'
      }
    } else {
      return {
        titleTemplate: 'Dora Factory Documentation'
      }
    }
  }
  // ...
}
