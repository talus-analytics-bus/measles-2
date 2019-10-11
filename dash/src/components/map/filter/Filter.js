import React from 'react'
import classNames from 'classnames'

import styles from './filter.module.scss'

const Filter = (props) => {
  const checkboxList =
  [
    {
      slug: 'hospital', // slug: identifier for mapbox layer ids
      dataname: 'Hospital', // dataname: database name of fac. type
      label: 'Hospital', // label: frontend name of fac. type
      state: React.useState(true) // state: state variables/hooks
    },

    {
      slug: 'dialysis',
      dataname: 'Dialysis Facility',
      label: 'Large dialysis center',
      state: React.useState(true)
    },

    {
      slug: 'nursing',
      dataname: 'Nursing Home',
      label: 'Skilled nursing home',
      state: React.useState(true)
    },
  ];

  // Track whether the options menu is open or closed
  const [open, setOpen] = React.useState(false);

  // JSX of options menu
  return (
    <div
      className={classNames(styles.mapOverlay, styles.filter, {
        [styles.open]: open
      })}
    >
      <div className={styles.toggleButton} onClick={() => setOpen(!open)}>
        <p>Options</p>
        <i
          className={classNames('material-icons-outlined', {
            [styles.open]: open
          })}
        >
          expand_more
        </i>
      </div>
        <div className={styles.contentContainer}>
          <p>Facility types shown</p>
          {checkboxList.map(checkboxItem => (
            <div className={styles.facilityTypeOption}>
              <div
                className={classNames(styles.circle, styles[checkboxItem.label.toLowerCase()])}
              />
              <label>
                <input
                  onChange={(event) => {props.handleCheck(event, checkboxList)}}
                  type="checkbox"
                  name="facilityType"
                  value={checkboxItem.dataname}
                  id={checkboxItem.label}
                  checked={checkboxItem.state[0]}
                /> {checkboxItem.label}
              </label>
            </div>
          ))}
        </div>
    </div>
  )
}
export default Filter
