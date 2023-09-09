import styles from './style.module.scss'
import { Lockup } from '@components/svgs'
import { ReactElement } from 'react'

export function Logo(): ReactElement {
  return (
    <div className={styles.logo}>
      <Lockup />
      <span className={styles.label}>Dora Factory</span>
    </div>
  )
}
