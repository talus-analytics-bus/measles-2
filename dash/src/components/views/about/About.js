import React from 'react'
import styles from './about.module.scss'

// JSX for about page.
const About = () => {

  return (
    <div className={styles.about}>
      <p className={styles.title}>About</p>
      <p>Welcome to the Power PIONEER Dashboard prototype, a powerful new online tool designed to provide government officials and utilities with automated and near real time emergency power system status reports for critical healthcare facilities impacted by disasters.</p>
      <p>Development of this prototype was made possible with funding from the U.S. Department of Homeland Security, Cybersecurity and Infrastructure Security Agency (CISA), National Risk Management Center, through the National Infrastructure Protection Program Security & Resilience Challenge, which is implemented by the National Institute for Hometown Security (NIHS).</p>
      <p>Powered for Patients, a 501c3 non-profit dedicated to safeguarding emergency power and expediting power restoration, received a NIPP Security & Resilience Challenge contract in 2018 to develop this prototype. Powered for Patients enlisted Talus Analytics as its technology partner, charged with developing the prototype Dashboard and the necessary back end analytic tools. Talus Analytics is a women-owned business that specializes in translating complex data into actionable information.</p>
      <p>Going forward, Powered for Patients and Talus Analytics are focused on advancing the Power PIONEER Dashboard beyond the prototype stage into a commercially available product. As this process moves forward, a public facing website for Power PIONEER will be published. In the interim, individuals interested in learning more about the Power PIONEER Dashboard are encouraged to contact Project Director Eric Cote at <a target="_blank" href="mailto:cote@poweredforpatients.org">cote@poweredforpatients.org</a>, or by calling 202-810-0125.</p>
    </div>
  )
}

export default About
