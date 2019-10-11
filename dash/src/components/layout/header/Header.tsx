import React from 'react'
import Popup from 'reactjs-popup'
import { Link } from 'react-router-dom'
import styles from './header.module.scss'
import classNames from 'classnames'

const Header: React.FC = (props: any) => {
  const { showWm, setShowWm } = props

  const renderButtons = [
    ['', null], // two placeholder buttons for spacing purposes
    ['', null],
    ['About', '/about'],
    ['Contact us', '/contact'],
    ['Logout', '/landing'],
  ].map(
    ([name, routePath]) =>
      (routePath && name &&(
        <Link to={routePath}>
          <button className={styles.button}>{name}</button>
        </Link>
      )) ||
      (routePath && name && (
        <Popup
          trigger={open => <button className={styles.button}>{name}</button>}
          position='top right'
          on='hover'
          closeOnDocumentClick
        >
          <div>
            <span>At launch, log in will move the blue sky page.</span>
          </div>
        </Popup>
      )) ||
      (!routePath && !name && <div />)
  )
  return (
    <header className={styles.header}>
      {props.showBack && (
        <Link className={classNames(styles.button, styles.back)} to='/alerts'>
          <button className={classNames(styles.button, styles.back)}>
            <i className={classNames('material-icons-outlined')}>arrow_back</i>
            Back to map
          </button>
        </Link>
      )}
      {!props.showBack && (
        // Show settings gear (containing the watermark toggle checkbox) if the
        // "Back to map" button is not being shown in that space.
        <Popup
          trigger={open => <i className='material-icons'>settings</i>}
          position='bottom left'
          on='click'
          arrow={false}
          className='settingsMenu'
          closeOnDocumentClick
        >
          <div className={styles.toggleWatermark}>
            <label>
              <input
                type='checkbox'
                onClick={() => setShowWm(!showWm)}
                checked={showWm}
              />
              Mark pages as test data
            </label>
          </div>
        </Popup>
      )}
      {renderButtons}
    </header>
  )
}

export default Header
