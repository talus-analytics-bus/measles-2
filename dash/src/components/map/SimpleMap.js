import React from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const SimpleMap = ({ ...props }) => {
  const [longitude, setLongitude] = React.useState(-117.5447)
  const [latitude, setLatitude] = React.useState(33.7438)
  const [zoom, setZoom] = React.useState(11.44)

  const f = props.selectedFacility;

  React.useLayoutEffect(() => {
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN //as string

    const map = new mapboxgl.Map({
      style: 'mapbox://styles/traethethird/cjzfsoegd0nam1cqlrv0imonb',
      container: 'mapbox-container-small',
      center: { lng: f.longitude, lat: f.latitude },
      zoom: zoom,
      attributionControl: false,
    })

    // create a DOM element for the marker
    const marker = {
      // properties: {
      //   iconSize: [10, 10],
      // },
      geometry: {
        coordinates: [f.longitude, f.latitude],
      },
    };
    var el = document.createElement('div');
    el.className = `marker facility-marker ${f.severity}`;

    // add marker to map
    new mapboxgl.Marker(el)
    .setLngLat(marker.geometry.coordinates)
    .addTo(map);

  }, [])



  return (
    <>
      <div
        // style={{ position: 'absolute', top: 0, bottom: 0, width: '100%' }}
        id='mapbox-container-small'
        ref={React.createRef()}
      />
      {/* <div
        className='legend'
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto',
          gridTemplateRows: 'auto',

          width: '200px',
          backgroundColor: '#fff',
          borderRadius: '3px',
          bottom: '60px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.10)',
          font: `12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif`,
          paddingTop: '10px',
          position: 'absolute',
          right: '60px',
          zIndex: 1,
          border: '2px solid grey'
        }}
      >
        <div
          style={{
            justifySelf: 'center',
            padding: '0 10px 0 10px',
            borderRight: '2px solid grey'
          }}
        >
          <h4>Facility status alerts</h4>
          <div>
            <span>Critical Status</span>
          </div>
          <div>
            <span>Alerted Status</span>
          </div>
          <div>
            <span>Stable Status</span>
          </div>
        </div>
        <div style={{ justifySelf: 'center', padding: '0 10px 0 10px' }}>
          <h4>Facility status alerts</h4>
          <div>
            <span>Hospital</span>
          </div>
          <div>
            <span>Large dialysis center</span>
          </div>
          <div>
            <span>Skilled Nursing Home</span>
          </div>
        </div>
      </div> */}
    </>
  )
}

export default SimpleMap
