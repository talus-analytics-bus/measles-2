import React from 'react'
import ReactMapGL, { Marker, NavigationControl, Popup } from 'react-map-gl'
import * as d3 from 'd3/dist/d3.min';

import 'mapbox-gl/dist/mapbox-gl.css'
import './map.scss'

import initMap from './mapUtils'

import Legend from './legend/Legend'
import ResetZoom from './resetZoom/ResetZoom'
import GeomPopup from './geomPopup/GeomPopup.js'

const TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN

const MiniMap = ({ }) => {

  const defaultViewport = {
    width: '100%',
    height: '100%',
    longitude: 33.73046875000961,
    latitude: 4.418504408489266,
    zoom: 2
  };
  const [viewport, setViewport] = React.useState(defaultViewport);

  let mapRef = React.createRef()

  React.useEffect(() => {
    const map = mapRef.getMap();

    initMap(map, [], [], [], function afterMapLoaded () {});

  }, [])

  const handleStyleLoad = map => (map.resize())

  return (
    <ReactMapGL
      ref={map => { mapRef = map; }}
      mapboxApiAccessToken={TOKEN}
      mapStyle='mapbox://styles/traethethird/ck0ia6pvc2cpc1cpe5nx5b7p5'
      {...viewport}
      maxZoom = {4}
      minZoom = {2}
      onViewportChange={v => {
        // Update viewport.
        setViewport(v);
      }}
      onStyleLoad={handleStyleLoad}
      doubleClickZoom={false} //remove 300ms delay on clicking
    >
    </ReactMapGL>
  )
}

export default MiniMap
