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

const TrendQuery = async function (metric_id, end, lag=1, country='all') {
  country = typeof country !== 'undefined' ? country : 'all';

  var params = {
    metric_id: metric_id,
    end: end,
    lag: lag
  };

  if (country !== 'all') { params['place_id'] = country};

  const res = await axios(`${API_BASE}/trend`, {
    params
  });

  return res.data.data
};

export default TrendQuery;
