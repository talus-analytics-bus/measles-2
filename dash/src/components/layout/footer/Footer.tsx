import React from 'react'
import styles from './footer.module.scss'

const Footer: React.FC = () => {
  return (
    <div className={styles.footer}>
      <div></div>
      <button>Power PIONEER</button>
      <button><a target="_blank" href="mailto:cote@poweredforpatients.org">cote@poweredforpatients.org</a></button>
      <button>202-810-0125</button>
      <div></div>
    </div>
  )
}

export default Footer
