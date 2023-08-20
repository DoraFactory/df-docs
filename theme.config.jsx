import { useRouter } from 'next/router'
import { Lockup } from '@components/icons'

export default {
  // logo: <span>DF Documentation</span>,
  logo: (
    <span className="nx-text-gray-800 dark:nx-text-gray-200"><Lockup /></span>
  ),
  docsRepositoryBase: 'https://github.com/dorafactory/df-docs/blob/master/pages',
  sidebar: {
    defaultMenuCollapseLevel: 1,
    // autoCollapse: true,
  },
  project: {
    link: 'https://github.com/dorafactory',
  },
  
  toc: {
    title: 'On this page',
  },
  
  footer: {
    text: (
      <div className="flex w-full flex-row gap-2 items-center text-xs">
        <p>© {new Date().getFullYear()} Dora Factory</p>
        <p>·</p>
        <p>Terms</p>
        <p>·</p>
        <p>Privacy</p>
      </div>
    )
  },
  
  useNextSeoProps() {
    const { asPath } = useRouter()
    if (asPath !== '/' && asPath !== '') {
      return {
        titleTemplate: '%s · Dora Factory Documentation',
      }
    } else {
      return {
        titleTemplate: 'Dora Factory Documentation',
      }
    }
  },
  // ...
}
