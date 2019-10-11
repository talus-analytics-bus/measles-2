##
# # API schema
##

# Standard libraries
import functools
from datetime import datetime, timedelta

# Third party libraries
from pony.orm import select

# Local libraries
from .models import db


# Cache responses for API requests that have previously been made so that the
# computation does not need to be repeated.
def cached(func):

    # Cache initially blank.
    cache = {}

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # Get the key corresponding to the request
        key = str(kwargs)

        # If the request has been made before
        if key in cache:

            # Return the cached data for the response to the request
            return cache[key]

        # Otherwise
        # After the request is done, take the results and cache them for next
        # time
        results = func(*args, **kwargs)
        cache[key] = results
        return results

    # Return the function wrapper (for decoration)
    return wrapper


# Define a metric endpoint query.
def getMetrics(filters):

    # Initialize response as empty
    res = None

    # If id param is not in the filters (query params), then return all people
    if 'id' not in filters:
        res = select(m for m in db.Metric)

    # Otherwise, return the person whose id matches the input.
    else:
        res = select(m for m in db.Metric if m.metric_id == filters['id'])

    # Return the query response (sliced)
    return res[:]


def observation_summary(metric_id, t_summary, temp_value, s_summary, spatial_value,
                        min_time, max_time):
    return 'test'

spatial_resolution_error = Exception("Requested spatial resolution is finer than metric's")
temporal_resolution_error = Exception("Requested temporal resolution is finer than metric's")

def get_start(t_rs, end, lag):
    if t_rs == 'yearly':
        print('here: ', end.year, lag)
        start = datetime(end.year - lag, end.month, end.day)
    elif t_rs == 'monthly':
        # Convert the allowed lag value (months) to years and months (usually 0 years
        # and some months).
        years, months = divmod(lag, 12)

        if years == 0:
            if months >= end.month:
                start = datetime(end.year - 1, end.month + 12 - months, end.day)
            else:
                start = datetime(end.year, end.month - months, end.day)
        else:
            if months >= end.month:
                start = datetime(end.year - (years + 1), end.month + 12 - months, end.day)
            else:
                start = datetime(end.year - (years), end.month - months, end.day)
    elif t_rs == 'weekly':
        start = end - timedelta(weeks=lag)
    elif t_rs == 'daily':
        start = end - timedelta(days=lag)

    return start


def manage_lag(metric, null_res, max_time, null_places, observations):

    min_time = get_start(metric.temporal_resolution, max_time, metric.lag_allowed)

    if metric.is_view:
        if len(null_places) > 1:
            place_id_arr = '{' + (', '.join(map(lambda x: str(x), null_places))) + '}'
            place_id_q_str = f"""AND v.place_id = ANY('{place_id_arr}'::int[])"""
        elif len(null_places) == 0:
            place_id_q_str = ''
        else:
            place_id_q_str = f"""AND v.place_id = {null_places[0]}"""

        lag_res_q_str = f"""SELECT v.metric_id, v.data_source, d.dt,
                            m.metric_definition, m.metric_name, v.observation_id,
                            p.fips AS place_fips, p.place_id, p.iso AS place_iso,
                            p.name AS place_name, v.updated_at, v.value::FLOAT
                            FROM {metric.view_name} v
                            LEFT JOIN datetime d ON v.datetime_id = d.dt_id
                            LEFT JOIN place p ON v.place_id = p.place_id
                            LEFT JOIN metric m ON v.metric_id = m.metric_id
                            WHERE
                            d.dt >= '{min_time}'
                            {place_id_q_str}
                            AND d.dt <= '{max_time}'"""
        lag_res = db.select(lag_res_q_str)

    else:
        print('null_places')
        print(null_places)
        if len(null_places) > 1:
            lag_res = select(o for o in observations
                             if o.metric.metric_id == metric.metric_id
                             and o.date_time.datetime >= min_time
                             and o.date_time.datetime <= max_time
                             and o.place.place_id in null_places)
        elif len(null_places) == 0:
            lag_res = select(o for o in observations
                if o.metric.metric_id == metric.metric_id
                and o.date_time.datetime >= min_time
                and o.date_time.datetime <= max_time)
        else:
            lag_res = select(o for o in observations
                             if o.metric.metric_id == metric.metric_id
                             and o.date_time.datetime >= min_time
                             and o.date_time.datetime <= max_time
                             and o.place.place_id == null_places[0])

    latest_observation = {}

    for o in lag_res:
        place_id = o.place_id if metric.is_view else o.place.place_id

        if o.value is not None:
            if place_id in latest_observation:
                obs_dt = o.dt if metric.is_view else o.date_time.datetime
                latest_obs_dt = latest_observation[place_id].dt if metric.is_view else latest_observation[place_id].date_time.datetime
                if obs_dt > latest_obs_dt:
                    latest_observation[place_id] = o
            else:
                latest_observation[place_id] = o

    return latest_observation.values()


# Define an observation endpoint query.
def getObservations(filters):
    s_rs = ['planet', 'country', 'state', 'county', 'block_group', 'tract', 'point']
    t_rs = ['yearly', 'monthly', 'weekly', 'daily']

    # Initialize response as empty
    res = None

    metric_id = filters['metric_id']

    # get metric info to check resolutions
    metric = db.Metric[metric_id]

    if 'spatial_resolution' in filters:
        # check that the requested spatial resolution is not higher than
        # the metric's
        if s_rs.index(filters['spatial_resolution']) > s_rs.index(metric.spatial_resolution):
            raise(spatial_resolution_error)
        elif s_rs.index(filters['spatial_resolution']) < s_rs.index(metric.spatial_resolution):
            s_summary = True
            spatial_value = filters['spatial_resolution']
        else:
            s_summary = False
            spatial_value = metric.spatial_resolution

    if 'temporal_resolution' in filters:
        # check that the requested spatial resolution is not higher than
        # the metric's
        if t_rs.index(filters['temporal_resolution']) > t_rs.index(metric.temporal_resolution):
            raise(temporal_resolution_error)
        elif t_rs.index(filters['temporal_resolution']) < t_rs.index(metric.temporal_resolution):
            t_summary = True
            temp_value = filters['temporal_resolution']
        else:
            t_summary = False
            temp_value = metric.temporal_resolution

    if 'start' in filters:
        min_time = datetime.strptime(filters['start'], '%Y-%m-%d')
    else:
        min_time = metric.min_time

    if 'end' in filters:
        max_time = datetime.strptime(filters['end'], '%Y-%m-%d')
    else:
        max_time = metric.max_time

    is_view = metric.is_view

    place_id = None

    # If the metric is a view, then the pool of observations comes from that
    # view. Otherwise, it is simply the "Observations" entity.
    dbEntity = None
    view_q_str =    f"""SELECT v.metric_id, v.data_source, d.dt,
                        m.metric_definition, m.metric_name, v.observation_id,
                        p.fips AS place_fips, p.place_id, p.iso AS place_iso,
                        p.name AS place_name, v.updated_at, v.value::FLOAT
                        FROM {metric.view_name} v
                        LEFT JOIN datetime d ON v.datetime_id = d.dt_id
                        LEFT JOIN place p ON v.place_id = p.place_id
                        LEFT JOIN metric m ON v.metric_id = m.metric_id
                        WHERE
                        d.dt >= '{min_time}'
                        AND d.dt <= '{max_time}'"""
    if is_view:
        observations = db.select(view_q_str)
    else:
        observations = db.Observation

    if t_summary or s_summary:
        return observation_summary(metric_id, t_summary, temp_value, s_summary, spatial_value,
                                   min_time, max_time)

    else:
        if is_view:
            if 'place_id' in filters:
                view_q_str += f" AND p.place_id = {filters['place_id']}"
                place_id = filters['place_id']

                res = db.select(view_q_str)
            else:
                res = db.select(view_q_str)

        else:
            if 'place_id' in filters:
                res = None
                if is_view:
                    res = select(o for o in observations)
                else:
                    res = select(o for o in observations
                        if o.metric.metric_id == metric_id
                        and o.date_time.datetime >= min_time
                        and o.date_time.datetime <= max_time
                        and o.place.place_id == filters['place_id'])

                place_id = filters['place_id']
            else:
                res = select(o for o in observations
                             if o.metric.metric_id == metric_id
                             and o.date_time.datetime >= min_time
                             and o.date_time.datetime <= max_time)

        metric_lag_allowed = metric.lag_allowed != None and metric.lag_allowed > 0
        lag_allowed = True if (metric_lag_allowed and min_time == max_time) else False

        if lag_allowed:
            if place_id is None:
                null_res = []
                null_places = []
                print('res')
                print(res[:])
                for o in res:
                    print('o')
                    print(o)
                    if o.value is None:
                        null_res.append(o)
                        if is_view:
                            null_places.append(o.place_id)
                        else:
                            null_places.append(o.place.place_id)

                lag = manage_lag(metric, null_res, max_time, null_places, observations)
            else:
                print('made it to this place')
                if list(res)[0].value is None:
                    lag = manage_lag(metric, res, max_time, [place_id], observations)

        else:
            lag = None

        return (is_view, res, lag)


# Define a trend endpoint query.
def getTrend(filters):
    # Initialize response as empty
    res = None

    metric_id = filters['metric_id']

    # get metric info to check resolutions
    metric = db.Metric[metric_id]

    end = datetime.strptime(filters['end'], '%Y-%m-%d')
    lag = int(filters['lag'])

    t_rs = metric.temporal_resolution

    start = get_start(t_rs, end, lag)

    print('start, end')
    print(start, end)

    if metric.is_view:
        q_str = f"""SELECT v.metric_id, v.data_source, d.dt,
                m.metric_definition, m.metric_name, v.observation_id,
                p.fips AS place_fips, p.place_id, p.iso AS place_iso,
                p.name AS place_name, v.updated_at, v.value::FLOAT
                FROM {metric.view_name} v
                LEFT JOIN datetime d ON v.datetime_id = d.dt_id
                LEFT JOIN place p ON v.place_id = p.place_id
                LEFT JOIN metric m ON v.metric_id = m.metric_id
                WHERE
                d.dt in ('{start}', '{end}')"""
        if 'place_id' in filters:
            q_str += f" AND p.place_id = {filters['place_id']}"

            res = db.select(q_str)
        else:
            res = db.select(q_str)

        print(res)

        return (True, res, start, end)
    else:
        if 'place_id' in filters:
            res = select(o for o in db.Observation
                         if o.metric.metric_id == metric_id
                         and o.date_time.datetime in (start, end)
                         and o.place.place_id == filters['place_id'])
        else:
            res = select(o for o in db.Observation
                         if o.metric.metric_id == metric_id
                         and o.date_time.datetime in (start, end))

        # Return the query response
        return (False, res, start, end)
