import { useRouter } from 'next/router'
import { Lockup } from '@components/svgs'
import { Footer } from '@components/footer'

export default {
  // logo: <span>DF Documentation</span>,
  logo: (
    <span className="nx-text-gray-800 dark:nx-text-gray-200">
      <span className="absolute opacity-0">Dora Factory</span>
      <Lockup />
    </span>
  ),
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

  useNextSeoProps() {
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
