import React from 'react'
import classNames from 'classnames'
import styles from './legend.module.scss'

const Legend = () => {
  const [open, setOpen] = React.useState(true)

  // Color series used to indicate relative vaccination coverage from least to
  // most vaccinated.
  const vaccinationColors = [
    '#d6f0b2',
    '#b9d7a8',
    '#7fcdbb',
    '#41b6c4',
    '#2c7fb8',
    '#303d91'
  ];
  const noDataColor = '#b3b3b3';

  const vaccinationLegendLabels = (i: any) => {
    switch (i) {
      case 0:
        return 'Low coverage';
      case vaccinationColors.length - 1:
        return 'High coverage';
      default:
        return '';
    }
  };

  return (
    <div
      className={classNames(styles.mapOverlay, styles.legend, {
        [styles.open]: open
      })}
    >
      <div className={styles.toggleButton} onClick={() => setOpen(!open)}>
        <i
          className={classNames('material-icons', {
            [styles.open]: open
          })}
        >
          play_arrow
        </i>
      </div>
      <div className={styles.sections}>
        {
          // Vaccination coverage
          <div className={styles.section}>
            <p className={styles.sectionName}>Vaccination coverage (2018)</p>
            <div className={styles.legendEntryGroups}>
              <div className={styles.legendEntryGroup}>
                {
                  vaccinationColors.map((d,i) =>
                    <div className={styles.legendEntry}>
                      <div className={classNames(styles.legendIcon, styles.rect)} style={ {'backgroundColor': d} } />
                      <div className={styles.legendLabel}>{
                        vaccinationLegendLabels(i)
                      }</div>
                    </div>
                  )
                }
              </div>
              <div className={styles.legendEntryGroup}>
                {
                  <div className={classNames(styles.legendEntry, styles.dataNotAvailable)}>
                    <div className={classNames(styles.legendIcon, styles.rect)} style={ {'backgroundColor': noDataColor} } />
                    <div className={styles.legendLabel}>{
                      'Data not available'
                    }</div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
        {
          // Incidence
          <div className={styles.section}>
            <p className={styles.sectionName}>Incidence of measles (monthly)</p>
            <div className={styles.legendEntryGroups}>
              <div className={styles.legendEntryGroup}>
                {
                  [1,2,3].map((d,i) =>
                    <div className={classNames(styles.legendEntry, styles.circle)}>
                      <div className={classNames(styles.legendIcon, styles.circle)} />
                      {
                        (i === 0) && <div className={styles.legendLabel}>Low<br/>incidence</div>
                      }
                      {
                        (i === 2) && <div className={styles.legendLabel}>High<br/>incidence</div>
                      }
                    </div>
                  )
                }
              </div>
              <div className={styles.legendEntryGroup}>
                {
                  <div className={classNames(styles.legendEntry, styles.dataNotAvailable)}>
                    <div className={classNames(styles.legendIcon, styles.circle)} />
                    <div className={styles.legendLabel}>
                      Data over 3
                      <br/>
                      months old
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  )
}
export default Legend
