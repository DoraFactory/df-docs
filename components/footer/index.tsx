import styles from './style.module.scss'
import Link from 'next/link'
import { ReactElement } from 'react'
import iconTwitter from '/public/assets/icon-twitter.svg'
import iconDiscord from '/public/assets/icon-discord.svg'

// import iconTwitter as any type

const links = [
  {
    name: 'Dora Vota',
    link: 'https://vota.dorafactory.org/'
  },
  // {
  //   name: 'Dear Doge',
  //   link: 'https://deardoge.dorafactory.org/'
  // },
  // {
  //   name: 'Aptos API Service',
  //   link: '/docs/aptos'
  // },
  {
    name: 'QRNG Faucet',
    link: 'https://qrng.dorafactory.org/'
  },
  {
    name: 'Dora-KSM Parachain',
    link: 'https://core-pallet.dorafactory.org/'
  },
  {
    name: 'Dora Research Blog',
    link: 'https://research.dorahacks.io/'
  },
  {
    name: 'DoraHacks',
    link: 'https://dorahacks.io/'
  },
  {
    name: 'Dora Grant DAO',
    link: 'https://dorahacks.io/dora'
  }
]

export function Footer(): ReactElement {
  return (
    <div className={styles.footer}>
      <ul
        className={styles.nav}
        style={{ '--footer-nav-row': '3' } as React.CSSProperties}
      >
        {links.map((item, index) => (
          <li className={styles['nav-item']} key={index}>
            <Link href={item.link} target="_blank">
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.about}>
        <ul className={styles.social}>
          <li className={styles['social-item']}>
            <Link
              className={styles['social-twitter']}
              href={`https://twitter.com/DoraFactory`}
              target="_blank"
              style={{
                maskImage: `url(${iconTwitter.src})`,
                WebkitMaskImage: `url(${iconTwitter.src})`
              }}
            >
              <span>Twitter</span>
            </Link>
          </li>
          <li className={styles['social-item']}>
            <Link
              className={styles['social-discord']}
              href={`https://discord.com/invite/gKT5DsWwQ5`}
              target="_blank"
              style={{
                maskImage: `url(${iconDiscord.src})`,
                WebkitMaskImage: `url(${iconDiscord.src})`
              }}
            >
              <span>Discord</span>
            </Link>
          </li>
        </ul>
        <ul className={styles.info}>
          <li className={styles['info-copyright']}>
            © {new Date().getFullYear()}{' '}
            <Link href={`https://dorafactory.org/`} target="_blank">
              Dora Factory
            </Link>
          </li>
          {/*  <li className={styles['info-item']}>
            <Link href={`https://dorafactory.org/legal/terms/`} target="_blank">
              Terms
            </Link>
          </li>
          <li className={styles['info-item']}>
            <Link
              href={`https://dorafactory.org/lagal/privacy`}
              target="_blank"
            >
              Privacy
            </Link>
          </li> */}
        </ul>
      </div>
    </div>
  )
}
