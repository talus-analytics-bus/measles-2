// import ReactMapGL, { NavigationControl, Popup } from 'react-map-gl'

import circleImg from '../../assets/images/circle@3x.png';
import Util from '../../components/misc/Util.js';
const initMap = (map, fillObservations, bubbleObservations, incidenceObservations, callback) => {

  map.on('load', function() {
    initGeoms(fillObservations, bubbleObservations, incidenceObservations);
  })

  const initGeoms = (fillObservations, bubbleObservations, incidenceObservations) => {

    if (!map.getSource('geoms'))
      map.addSource('geoms', {
        type: 'vector',
        url: 'mapbox://traethethird.4kh7sxxt'
      })

    if (!map.getSource('centroids'))
      map.addSource('centroids', {
        type: 'vector',
        url: 'mapbox://traethethird.9g6e0amc'
        // url: 'mapbox://traethethird.5u7sntcb'
      })

    fillObservations.forEach(( observation) => {
      const value = observation['value'];
      const place_id = observation['place_id']

      map.setFeatureState({source: 'geoms', sourceLayer: 'countries_id_rpr', id: place_id }, {clicked: false});
      if (!value) {
        map.setFeatureState({source: 'geoms', sourceLayer: 'countries_id_rpr', id: place_id }, {value: 0});
      } else {
        //const state = { value: Math.floor(256 * value)};
        const state = { value: value / 100};
        map.setFeatureState({source: 'geoms', sourceLayer: 'countries_id_rpr', id: place_id }, state);
      }
    });

    map.addLayer({
      id: 'geom-fills',
      type: 'fill',
      source: 'geoms',
      'source-layer': 'countries_id_rpr',
      paint: {
        'fill-color': [
          'step',
          ["feature-state", "value"],
              '#b3b3b3',
              0, '#d6f0b2',
              0.35, '#b9d7a8',
              0.5, '#7fcdbb',
              0.65, '#41b6c4',
              0.8, '#2c7fb8',
              0.95, '#303d91'
        ],
        'fill-opacity': 1,
      }
    }, "country-small");

    map.addLayer({
      id: 'geom-line',
      type: 'line',
      source: 'geoms',
      'source-layer': 'countries_id_rpr',
      paint: {
        'line-color': [
          'case',
          ['boolean', ['feature-state', 'clicked'], true], '#ffffff',
          '#d3d3d3'
        ],
        'line-width': [
          'case',
            ['==', ['feature-state', 'clicked'], true],
            3,
            ['==', ['feature-state', 'hover'], true],
            3,
            .5,
          ],
      }
    }, "country-small");

    map.on('render', afterChangeComplete); // warning: this fires many times per second!

    function afterChangeComplete () {
      if (!map.loaded()) { return } // still not loaded; bail out.

      const relatedFeatures = map.querySourceFeatures('geoms', {
        sourceLayer: 'countries_id_rpr',
        //filter: ['has', 'id']
      });

      /**
       * Returns true if datum is 3 or more months old, false otherwise.
       * @method getStaleStatus
       */
      const getStaleStatus = (obs, timeFrame = 'month') => {
        if (obs['stale_flag'] === true) {
          const today = Util.today();
          const date_time = obs['date_time'].replace(/-/g, '/');
          const then = new Date(date_time);
          switch (timeFrame) {
            case 'month':
              if (today.getUTCMonth() - then.getUTCMonth() > 3) return true;
              else return false;
            case 'year':
              if (today.getUTCYear() - then.getUTCYear() > 3) return true;
              else return false;
          }
        } else return false;
      };

      const setupCircleBubbleState = () => {

        incidenceObservations.forEach(( observation) => {
          const value = observation['value'];
          const place_id = +observation['place_id']
          const stale = getStaleStatus(observation, 'month');
          // const stale = observation['stale_flag'] || false;

          if (!value) {
            map.setFeatureState({source: 'centroids', sourceLayer: 'centroids_id_rpr_latlon', id: place_id }, {
              value: 0,
              stale: stale,
            }
          );
          } else {
            const state = {
              value: value,
              stale: stale,
            };
            map.setFeatureState({source: 'centroids', sourceLayer: 'centroids_id_rpr_latlon', id: place_id }, state);
          }
        });
      };
      setupCircleBubbleState();


      // /**
      //  * Draw circles as symbols. Issues: small circles appear pixelated and border thickness differs.
      //  * Potential solution: change native size of circle SVG?
      //  * @method setupSymbolCircles
      //  * @return {[type]}           [description]
      //  */
      // const setupSymbolCircles = () => {
      //
      //   // Load centroids
      //   const centroids = map.querySourceFeatures('centroids', {
      //     sourceLayer: 'centroids_id_rpr_latlon',
      //   });
      //
      //   const markerData = {
      //     type: 'FeatureCollection',
      //     features: [],
      //   };
      //
      //   incidenceObservations.forEach(( observation) => {
      //     const value = observation['value'];
      //     const place_id = +observation['place_id']
      //
      //     if (!value) {
      //       map.setFeatureState({source: 'centroids', sourceLayer: 'centroids_id_rpr_latlon', id: place_id }, {
      //         value: 0,
      //         lat: null,
      //         lon: null,
      //       }
      //     );
      //
      //     } else {
      //
      //       // Get matching centroid's lat/lon to store in state.
      //       const centroidTmp = centroids.find(d => d.id === place_id);
      //       const centroid = centroidTmp ? centroidTmp : {properties: {lat: null, lon: null}};
      //       const state = {
      //         value: value,
      //         lat: centroid.properties.lat,
      //         lon: centroid.properties.lon,
      //       };
      //       map.setFeatureState({source: 'centroids', sourceLayer: 'centroids_id_rpr_latlon', id: place_id }, state);
      //       markerData.features.push(
      //         {
      //           type: 'Feature',
      //           properties: {
      //             'value': value,
      //             'image': 'circle', // TODO set to hatch if applicable
      //           },
      //           geometry: {
      //             type: 'Point',
      //             coordinates: [state.lon, state.lat],
      //           }
      //         }
      //       );
      //     }
      //   });
      //
      //   // Set map symbol data
      //   map.getSource('markers').setData(markerData);
      //
      // };
      // setupSymbolCircles();

      map.off('render', afterChangeComplete); // remove this handler now that we're done.
      callback();
    }

    // Display circles as circle layer.
    const setupCircleBubbles = () => {
      // Add centroids to map so they can be accessed via getSourceFeatures.
      map.addLayer({
        'id': 'metric-bubbles',
        'type': 'circle',
        'source': 'centroids',
        'source-layer': 'centroids_id_rpr_latlon',
        'paint': {
        'circle-radius': [
            'interpolate',
            ['linear'],
            ["feature-state", "value"],
                0, 0,
                0.001, 5,
                100, 150
          ],
          'circle-color': [
              'case',
              ['==', ['feature-state', 'stale'], false],
              '#b02c3a',
              ['==', ['feature-state', 'stale'], true],
              '#b3b3b3',
              'white',
          ],
          'circle-opacity': [
              'case',
              ['==', ['feature-state', 'stale'], null],
              0,
              ['==', ['feature-state', 'clicked'], true],
              1,
              0.85,
          ],
          'circle-stroke-width': [
              'case',
              ['==', ['feature-state', 'stale'], null],
              0,
              ['==', ['feature-state', 'value'], 0],
              0,
              ['==', ['feature-state', 'clicked'], true],
              2,
              ['==', ['feature-state', 'hover'], true],
              2,
              1,
          ],
          'circle-stroke-color': [
              'case',
              ['==', ['feature-state', 'stale'], false],
              '#ffffff',
              '#979797',
          ],
        }
      }, "country-small");
    };

    // Display circles as symbols (warning: issues)
    const setupSymbolCircleLayers = () => {
      // Add circles as symbols. Also uncomment setupSymbolCircles if using this.
      map.addLayer({
        id: "markers",
        type: "symbol",
        // 'source': 'centroids',
        // 'source-layer': 'centroids_id_rpr_latlon',
        source: {
          type: "geojson",
          data: { // placeholder data to start
            type: 'FeatureCollection',
            features: [],
          }
        },
        layout: {
          "icon-image": ["get", "image"],
          "icon-size": [
              'interpolate',
              ['linear'],
              ["get", "value"],
                  0, 0,
                  0.001, 10/100,
                  100, 150/100
            ],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        }
      });
      map.moveLayer('markers', 'country-small');

      // Add centroids to map so they can be accessed via getSourceFeatures.
      map.addLayer({
        'id': 'population',
        'type': 'circle',
        'source': 'centroids',
        'source-layer': 'centroids_id_rpr_latlon',
        'paint': {
        'circle-radius': 0,
          'circle-opacity': 0,
        }
      }, "country-small");
    };
    // setupSymbolCircleLayers();
    setupCircleBubbles();

  }
}

export default initMap
