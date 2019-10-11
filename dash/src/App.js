import React from 'react'
import { Route, Switch, BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import Modal from 'reactjs-popup'
import classNames from 'classnames';

// layout
import Logo from './components/layout/logo/Logo'

// map
import Map from './components/map/Map'
import Util from './components/misc/Util.js'

// views
//import Alerts from './components/views/alerts/Alerts.js'
import Details from './components/views/details/Details.js'

// styles
import styles from './App.module.scss'
import 'material-design-icons/iconfont/material-icons.css'

// queries
import ObservationQuery from './components/misc/ObservationQuery.js'

var API_BASE = process.env.REACT_APP_API_BASE_URL
if (typeof API_BASE === 'undefined') {
  API_BASE = 'http://localhost:5002'
}

var DEMO_DATE = process.env.DEMO_DATE
if (typeof DEMO_DATE === 'undefined') {
  DEMO_DATE = '2025-07-04T23:56:00'
}

console.log('DEMO_DATE')
console.log(DEMO_DATE)

//: React.FC
const App = () => {
  console.log('Render App')

  // Track which page is being shown to keep the logo bar updated.
  const [page, setPage] = React.useState('')

  const [showWm, setShowWm] = React.useState(false)

  const [bubbleObservations, setBubbleObservations] = React.useState(() => {
    const initialState = [];
    return initialState;
  });

  const [incidenceObservations, setIncidenceObservations] = React.useState(() => {
    const initialState = [];
    return initialState;
  });

  const [fillObservations, setFillObservations] = React.useState(() => {
    const initialState = [];
    return initialState;
  });

  // Hide the "How to use this map" modal if it has already been displayed
  // once to the user.
  // turning off always until we need interval
  const [shownMapModal, setShownMapModal] = React.useState(true);

  // Track whether the welcome modal has been shown once yet.
  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false)

  // Track whether the component is still loading.
  const [loading, setLoading] = React.useState(true)

  // Track whether navbar loading spinner should show
  const [loadingNav, setLoadingNav] = React.useState(true)

  // Track details component
  const [detailsComponent, setDetailsComponent] = React.useState(null)

  async function getMapObservations() {
    // get the bubble data
    setBubbleObservations(await ObservationQuery(6, 'monthly', Util.formatDatetimeApi(Util.today())));

    // get the incidence data
    setIncidenceObservations(await ObservationQuery(15, 'monthly', Util.formatDatetimeApi(Util.today())));

    // get the fill data
    // TODO make this work the same way as the other "get most recent data queries", since it doesn't seem to
    setFillObservations(await ObservationQuery(4, 'yearly', '2018-01-01'));
    setLoading(false);
  }

  // Track whether the welcome modal has been shown yet. If so, do not show it
  // again.
  let alreadyShowedWelcomeModal = false;
  React.useEffect(() => {
    console.log("Getting map observations")
    getMapObservations()

    // If welcome modal isn't being shown currently and it has not already been
    // shown, show it, and mark it as already shown.
    if (!showWelcomeModal && !alreadyShowedWelcomeModal) {
      setShowWelcomeModal(true);
      alreadyShowedWelcomeModal = true;
    }
  }, [])

  // Functions to render each page's elements.
  const renderMap = loading ? <div /> :
    <Map // map page
      fillObservations={fillObservations} // observation data for map
      bubbleObservations={bubbleObservations} // observation data for map
      incidenceObservations={incidenceObservations} // observation data for map
      shownMapModal={shownMapModal} // don't show help modal more than once
      setShownMapModal={setShownMapModal} // update modal display status
      setLoadingNav={setLoadingNav}
      className={'map'}
      />

  const renderDetails = id => {
    if (loading) {
      return <div />
    }
    else if (detailsComponent === null || (detailsComponent && detailsComponent.props.id !== id)) {
      console.log('No details component, getting data')
      // // if no selected country, load the correct one based on the ID
      // const coverage = fillObservations.find(o => +o.place_id === +id)
      // const cases = bubbleObservations.find(o => +o.place_id === +id)

      // Function to make API calls to get data for the state variables above.
      const getDetailsData = async (country) => {
        var countryPopQ = await ObservationQuery(3, 'yearly', '2018-01-01', '2018-01-01', country);
        const countryPop = countryPopQ[0];
        const countryName = countryPopQ[0]['place_name'];
        const countryIso2 = countryPopQ[0]['place_iso'];

        var countryGDPQ = await ObservationQuery(14, 'yearly', '2018-01-01', '2018-01-01', country);
        const countryGDP = countryGDPQ[0];

        var countryJEEQ = await ObservationQuery(6, 'monthly', '2019-08-01', '2019-08-01', country);
        const countryJEE = countryJEEQ[0];

        const caseHistory = await ObservationQuery(6, 'monthly', '2010-01-01', '2018-01-01', country);

        const coverageHistory = await ObservationQuery(4, 'yearly', '2010-01-01', '2018-01-01', country);

        setDetailsComponent(<Details
          id={country}
          countryPop={countryPop}
          countryName={countryName}
          countryIso2={countryIso2}
          countryGDP={countryGDP}
          countryJEE={countryJEE}
          caseHistory={caseHistory}
          coverageHistory={coverageHistory}
        />);
      }
      getDetailsData(id);
      return <div />;
    } else {
      setLoadingNav(false);
      return detailsComponent;
    }
  }

  // JSX for main app. Switch component allows links in the header to be used to
  // determine main app content.
  return (
    <div className={styles.app}>
      <BrowserRouter>
        <Logo page={page} loadingNav={loadingNav} />
        <Switch>
          <div>
            <Route exact path='/' component={ () => { setPage('map'); setLoadingNav(true); return renderMap; } } />
            <Route exact path='/map' component={ () => { setPage('map'); setLoadingNav(true); return renderMap; } } />
            <Route exact path='/global' component={ () => { setPage('global'); return <div className={'dev global'}>The global page is currently being developed.</div>; } } />
            <Route
              path='/details/:id'
              component={d => {
                setPage('details');
                setLoadingNav(true);
                return renderDetails(d.match.params.id)
              }}
            />
          </div>
        </Switch>
        {
          showWelcomeModal && (
            <Modal
              position="top center"
              on="click"
              closeOnDocumentClick
              defaultOpen={showWelcomeModal}
              modal
            >
              {
                close => (
                  <div className={styles.modal}>
                    <div className={styles.header}>
                      Welcome to the Measles Tracker
                    </div>
                    <div className={styles.content}>
                      <div className={styles.text}>
                        <p>The Measles Tracker integrates, analyzes, and visualizes measles surveillance and vaccination data to provide a comprehensive overview of the current status of the measles outbreak globally, including the populations and regions most at risk. The dashboard was developed by Talus Analytics and is designed to be used in Chrome or Firefox.</p>
                      </div>
                      <button className={classNames('button', 'modal')} onClick={close}>Continue</button>
                    </div>
                  </div>
                )
              }
            </Modal>
          )
        }
      </BrowserRouter>
    </div>
  )
}

export default App
