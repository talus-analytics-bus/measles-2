import axios from 'axios'

var API_BASE = process.env.REACT_APP_API_BASE_URL
if (typeof API_BASE === 'undefined') {
  API_BASE = 'http://localhost:5002'
}

/**
 * Get observation data from API. Updates the observation data and loading status
 * when complete.
 * @method getObservations
 */

const ObservationQuery = async function (metric_id, temporal_resolution, start_date, end_date, country) {
  end_date = typeof end_date !== 'undefined' ? end_date : start_date;
  country = typeof country !== 'undefined' ? country : 'all';

  var params = {
    metric_id: metric_id,
    temporal_resolution: temporal_resolution,
    spatial_resolution: 'country',
    start: start_date,
    end: end_date
  };

  if (country !== 'all') { params['place_id'] = country};

  const res = await axios(`${API_BASE}/observations`, {
    params
  });

  return res.data.data
};

export default ObservationQuery;
