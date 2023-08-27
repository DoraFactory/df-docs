import Aurora from './aurora'
import styles from './style.module.scss'
import Link from 'next/link'

function LandingPage() {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.hero}>
          <h1 className={styles.title}>
            The Digital Infrastructure of Global Hacker Movement
          </h1>
          <p className={styles.desc}>
            Dora Factory creates protocols, toolings, and public good
            infrastructures that help open source communities and frontier tech
            builders to thrive.
          </p>
          <Link
            className={`${styles.button} button-pill-secondary-md`}
            href="/start"
          >
            Get Started
          </Link>
        </div>
        <figure className={styles.aurora}>
          <Aurora />
        </figure>
      </header>
      <style jsx global>{`
        .nextra-nav-container-blur {
          background-color: rgba(255, 255, 255, 0.15);
          backdrop-filter: saturate(180%) blur(12px);
        }
        :is(html[class~='dark'] .nextra-nav-container-blur) {
          background-color: rgba(17, 17, 17, 0.55) !important;
        }
      `}</style>
    </>
  )
}

export default LandingPage
