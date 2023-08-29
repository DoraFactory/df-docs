import { useRouter } from 'next/router'
import { Logo } from '@components/logo'
import { Footer } from '@components/footer'

export default {
  head: () => {
    return (
      <>
        <meta
          name="description"
          content="The Digital Infrastructure of Global Hacker Movement"
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
