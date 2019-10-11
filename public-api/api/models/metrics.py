##
# # API and database setup file.
##

# Standard libraries
from datetime import datetime, date, time

# Third party libraries
from pony.orm import PrimaryKey, Required, Optional, Set
from . import db


class Metric(db.Entity):
    metric_id = PrimaryKey(int, auto=True)
    metric_name = Required(str)
    metric_definition = Optional(str)
    temporal_resolution = Required(str)
    min_time = Required(datetime)
    max_time = Required(datetime)
    spatial_resolution = Required(str)
    spatial_extent = Required(str)
    unit_type = Optional(str)
    unit = Optional(str)
    num_type = Optional(str)
    is_view = Optional(bool)
    view_name = Optional(str)
    lag_allowed = Optional(int)
    observations = Set("Observation")


class DateTime(db.Entity):
    dt_id = PrimaryKey(int, auto=True)
    # date = Required(date)
    # time = Required(time)
    datetime = Required(datetime, column="dt", sql_type='TIMESTAMP WITH TIME ZONE')
    day = Required(bool)
    week_sunday = Required(bool)
    week_monday = Required(bool)
    month = Required(bool)
    year = Required(bool)
    observations = Set("Observation")


class Poly(db.Entity):
    poly_id = PrimaryKey(int, auto=True)
    place = Required("Place", column="place_id")


class Point(db.Entity):
    point_id = PrimaryKey(int, auto=True)
    place = Required("Place", column="place_id")


class Place(db.Entity):
    place_id = PrimaryKey(int, auto=True)
    name = Required(str)
    description = Optional(str)
    fips = Optional(str)
    iso = Optional(str)
    iso2 = Optional(str)
    place_type = Required(str)
    poly = Optional("Poly", column="poly_id")
    point = Optional("Point", column="point_id")
    observations = Set("Observation")


class Observation(db.Entity):
    observation_id = PrimaryKey(int, auto=True)
    metric = Required("Metric", column="metric_id")
    date_time = Required("DateTime", column="datetime_id")
    place = Required("Place", column="place_id")
    value = Required(float)
    data_source = Optional(str)
    updated_at = Optional(datetime)
