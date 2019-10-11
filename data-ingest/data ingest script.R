######################################################################
### Set up ###########################################################
######################################################################

## set your working directory
setwd("/Volumes/GoogleDrive/Shared drives/Talus Current Projects/Measles")

## load required libraries
library(readxl)
library(reshape2)
library(sqldf)
library(rworldmap)
library(RColorBrewer)
library(sqldf); options(sqldf.driver = "SQLite")
library(chron)
library(RPostgres)
library(DBI)
library(gsheet)
library(ggplot2)

######################################################################
### Specify DB info ##################################################
######################################################################

## enter dbname and location here
dbname <- "metric"
host <- "talus-dev.cvsrrvlopzxr.us-west-1.rds.amazonaws.com"
port <- 5432
user <- "talus"

######################################################################
### Specify data proccesing parameters info ##########################
######################################################################

## what is the most recent month and year for which ANY caseload data are available from WHO? 
## this month = the most recent month that ANY 
this_month <- as.Date("2019-08-01")

######################################################################
### Connect to DB ####################################################
######################################################################

## establish connection to the database
con <- dbConnect(RPostgres::Postgres(),
                 dbname = dbname,
                 host = host,
                 port = port,
                 user = user)

######################################################################
### Read in data #####################################################
######################################################################

## metric backup
metric <- dbGetQuery(con, "select * from metric")

## observation backup
observation <- dbGetQuery(con, "select * from observation")

## read in dataset of all places currently in the database (connect to DB to get this info)
place <- dbGetQuery(con, "select * from place")

## read in dataset of all datetimes currently in the database (connect to DB to get this info)
datetime <- dbGetQuery(con, "select * from datetime")
datetime$date <- as.Date(datetime$dt)

## find the max observation id currently in the database (connect to DB to get this info)
max_observation_id <- dbGetQuery(con, "select max(observation_id) from observation")

## read in dataset of countries and codes
codes <- read_excel("Data/Countries and codes.xlsx")
names(codes)[2] <- "country_code"
names(codes)[3] <- "iso2"
names(codes)[4] <- "iso3"

## read in MCV1 and MCV2 data from WHO/UNICEF
who_mcv1 <- read_excel("Data/WHO:UNICEF Estimates of National Immunization Coverage.xls", sheet = "MCV1")
who_mcv2 <- read_excel("Data/WHO:UNICEF Estimates of National Immunization Coverage.xls", sheet = "MCV2")

## read in UN population data, exclude first 11 rows that don't actually contain data
unpop <- read_excel("Data/UN World Population Prospects.xlsx")[-c(1:11),]

## unpop_ages <- 

## update names and then drop first column
names(unpop) <- as.character(unpop[1,]); unpop <- unpop[-1,]

## read in WHO monthly caseload data
## when you download the default version, data are in the second tab, thus sheet = 2
countrycaseload <- read_excel("Data/WHO Measles Caseload.xls", sheet = 2)

## read in JEE deets
jeedeets <- gsheet2tbl("docs.google.com/spreadsheets/d/14inHYg_TbT5EgYL8TPHL3U5EBjZDXuszpvQjqF-sTBA/edit#gid=1720987443")

## read in JEE scores (JEE 1.0)
jee1 <- gsheet2tbl("docs.google.com/spreadsheets/d/14inHYg_TbT5EgYL8TPHL3U5EBjZDXuszpvQjqF-sTBA/edit#gid=1694059117")[-c(1),]

## GDP per capita data
gdp <- read_excel("Data/World Bank GDP.xls")[-c(1,2),]
  
###############################################################################
### Initial processing of UN population data ##################################
###############################################################################

## for now just look at data for countries, not groupings of countries
unpop <- unpop[which(unpop$Type == "Country/Area"),]

## melt data from wide to long
unpoplong <- melt(unpop[,c(3,5,8:78)], id.vars = c("Country code", "Region, subregion, country or area *"), variable.name = "Year", value.name = "value")
names(unpoplong) <- c("country_code", "country", "year", "value")
unpoplong$value <- as.numeric(as.character(unpoplong$value))

## values are reported in thousands, so do the math
unpoplong$valueactual <- unpoplong$value*1000

## just look at dates in 1980 or later
unpoplong$year <- as.numeric(as.character(unpoplong$year))
unpoplong <- unpoplong[which(unpoplong$year >= 1980),]

## align dates to format required by DB
unpoplong$date <-  as.Date(paste(unpoplong$year, "-01-01", sep = ""))

## reformat data into the format required by the DB
## for now, leave out countries that don't have either caseload or vaccination coverage data (change to left join if we want to add them back in the places table)
## excluding: Bonaire, Guadeloupe, Reunion, Tokelau, Martinique, Mayotte, French Guindea, Channel Islands

popdat <- sqldf("select 3 as metric_id,
                  valueactual as value,
                  'UN World Population Prospects' as data_source,
                  '2019-09-12' as updated_at,
                  p.place_id as place_id,
                  datetime.dt_id as datetime_id,
                  NULL as observation_id
                  from unpoplong as un
                  join codes as c 
                  on un.country_code = c.country_code
                  join place as p
                  on p.iso = c.iso3
                  left join datetime on datetime.date = un.date
                  order by un.country")

## check if any places we expect to have population data for from here are missing
#place$name[-which(place$place_id %in% popdat$place_id)]

popdat$observation_id <- (1:nrow(popdat)) + (as.numeric(max_observation_id)+1)

###############################################################################
### Initial processing of GDP data ###########################################
###############################################################################

names(gdp) <- as.character(gdp[1,])
gdp <- gdp[-1,]
names(gdp)[2] <- "code"
names(gdp)[1] <- "country"

## melt data into long format as required by the database
gdplong <- melt(gdp[,-c(3, 4)], id.vars = c("country", "code"), variable.name = "year", value.name = "value")
gdplong$year <- as.numeric(as.character(gdplong$year))
gdplong$value <- as.numeric(as.character(gdplong$value))

## look just at data from 1980 and after
gdplong <- gdplong[which(gdplong$year >= 1980),]

## format dates as required by the database
gdplong$date <- as.Date(paste(gdplong$year, "-01-01", sep = ""))

## round to one decimal value, like WB reports on their wbsite
gdplong$value_rounded <- round(gdplong$value, digits = 1) 

## reformat data into the format required by the DB: total ReadyScore
gdp_db <- sqldf("select 14 as metric_id,
                            g.value_rounded as value,
                            'World Bank Open Data' as data_source,
                            '2019-09-12' as updated_at,
                            place.place_id as place_id,
                            datetime.dt_id as datetime_id,
                            NULL as observation_id
                            from gdplong as g
                            join codes as c on g.code = c.iso3
                            join place on place.iso = c.iso3
                            join datetime on datetime.date = g.date
                            order by place_id, datetime.dt_id")

gdp_db$observation_id <- (1:nrow(gdp_db)) + (as.numeric(max_observation_id)+1)

###############################################################################
### Initial processing of JEE details data ####################################
###############################################################################

## specify row names (first row is just a header, throw it out)
names(jeedeets) <- as.character(jeedeets[1,])
jeedeets <- jeedeets[-1,]
names(jeedeets)[1] <- "country"
names(jeedeets)[2] <- "monthandyear"

## format date
jeedeets$date <- as.Date(paste("01-", jeedeets$monthandyear, sep = ""), format = "%d-%b-%Y")
jeedeets$timestamp <- paste(jeedeets$date, "00:00:00")

###############################################################################
### Initial processing of JEE 1.0 data ########################################
###############################################################################

## add row names
names(jee1) <- c("indicator", as.character(jee1[1,])[-1])

## remove extra first rows
jee1 <- jee1[-c(1,2),]

## melt data from wide to long
jee1long <- melt(jee1[,-c(3, 4)], id.vars = c("indicator"), variable.name = "country", value.name = "value")

## get the ISO code (between parenthesis in country name)
jee1long$iso2 <- unlist(regmatches(jee1long$country, gregexpr("(?<=\\().*?(?=\\))", jee1long$country, perl=T)))

## take the average of all indicators for c
jee1_imm <- sqldf("select country,
                  iso2,
                  avg(value) as value
                  from jee1long
                  where indicator = 'P.7.1 Vaccine coverage (measles) as part of national program' 
                  or indicator = 'P.7.2 National vaccine access and delivery'
                  group by country, iso2")

## reformat data into the format required by the DB: "real time surveillance"
jee1_imm_db <- sqldf("select 16 as metric_id,
                j.value as value,
                'JEE 1.0 mission report' as data_source,
                jd.timestamp as updated_at,
                place.place_id as place_id,
                datetime.dt_id as datetime_id,
                NULL as observation_id
                from jee1_imm as j
                join jeedeets as jd on jd.country = j.country
                join place on place.iso2 = j.iso2
                join datetime on datetime.date = jd.date
                order by place_id, datetime.dt_id")

jee1_imm_db$observation_id <- (1:nrow(jee1_imm_db)) + (as.numeric(max_observation_id)+1)

## take the average of all indicators for "real time surveillance"
jee1_rts <- sqldf("select country,
                  iso2,
                  avg(value) as value
                  from jee1long
                  where indicator = 'D.2.1 Indicator and event based surveillance systems' 
                  or indicator = 'D.2.2 Interoperable, interconnected, electronic real-time reporting system'
                  or indicator = 'D.2.3 Integration and analysis of surveillance data'
                  or indicator = 'D.2.4 Syndromic surveillance systems'
                  group by country, iso2")

## reformat data into the format required by the DB: "real time surveillance"
jee1_rts_db <- sqldf("select 17 as metric_id,
                     j.value as value,
                     'JEE 1.0 mission report' as data_source,
                     jd.timestamp as updated_at,
                     place.place_id as place_id,
                     datetime.dt_id as datetime_id,
                     NULL as observation_id
                     from jee1_rts as j
                     join jeedeets as jd on jd.country = j.country
                     join place on place.iso2 = j.iso2
                     join datetime on datetime.date = jd.date
                     order by place_id, datetime.dt_id")

jee1_rts_db$observation_id <- (1:nrow(jee1_rts_db)) + (as.numeric(max_observation_id)+1)

## take the average of all indicators for "Medical Countermeasures and Personnel Deployment"
jee1_mcm <- sqldf("select country,
                  iso2,
                  avg(value) as value
                  from jee1long
                  where indicator = 'R.4.1 System is in place for sending and receiving medical countermeasures during a public health emergency' 
                  or indicator = 'R.4.2 System is in place for sending and receiving health personnel during a public health emergency'
                  group by country, iso2")

## reformat data into the format required by the DB: "Medical Countermeasures and Personnel Deployment"
jee1_mcm_db <- sqldf("select 18 as metric_id,
                     j.value as value,
                     'JEE 1.0 mission report' as data_source,
                     jd.timestamp as updated_at,
                     place.place_id as place_id,
                     datetime.dt_id as datetime_id,
                     NULL as observation_id
                     from jee1_mcm as j
                     join jeedeets as jd on jd.country = j.country
                     join place on place.iso2 = j.iso2
                     join datetime on datetime.date = jd.date
                     order by place_id, datetime.dt_id")

jee1_mcm_db$observation_id <- (1:nrow(jee1_mcm_db)) + (as.numeric(max_observation_id)+1)

###############################################################################
### Initial processing of WHO/MCV data #######################################
###############################################################################

## take the wide databases and make them long
who_mcv <- melt(who_mcv1, id.vars=c("Region", "ISO_code", "Cname", "Vaccine"), variable.name = "year", value.name = "value")

## create date data element that is the first date of the year
who_mcv$date <- as.Date(paste(who_mcv$year, "-01-01", sep = ""))

## stop rule: stop code is any of the countries don't match existing ISO codes in the place table
if(any(! who_mcv$ISO_code %in% place$iso)) stop ("WHO/UNICEF vaccinataion coverage data include data for a country not currently included in the places table. Please review data before proceeding.")

###############################################################################
### Initial processing of WHO/MCV1 data  ######################################
###############################################################################

## reformat data into the format required by the DB
who_mcv1 <- sqldf("select 4 as metric_id,
            who_mcv.value as value,
           'WHO/UNICEF Estimates of National Immunization Coverage' as data_source,
           '2019-09-10' as updated_at,
            place.place_id as place_id,
            datetime.dt_id as datetime_id,
            NULL as observation_id
            from who_mcv
            left join place on place.iso = who_mcv.ISO_code
            left join datetime on datetime.date = who_mcv.date
            where Vaccine = 'MCV1'
           order by place_id, datetime.dt_id")

## give a unique observation ID that isn't already taken, count upwards sequentially
who_mcv1$observation_id <- (1:nrow(who_mcv1)) + (as.numeric(max_observation_id)+1)

###############################################################################
### Initial processing of WHO caseload data ###################################
###############################################################################

## stop rule: stop code is any of the countries don't match existing ISO codes in the place table
if(any(!countrycaseload$ISO3 %in% place$iso)) stop ("Caseload data include data for a country not currently included in the places table. Please review data before proceeding.")

## treat monthly caseload counts as numbers
countrycaseload[,c(5:ncol(countrycaseload))] <- apply(countrycaseload[,c(5:ncol(countrycaseload))], 2, as.numeric)

## melt data from wide to long
countrycaseloadlong <- melt(countrycaseload, id.vars = c("Region", "ISO3", "Country", "Year"), variable.name = "Month", value.name = "value")

## format dates as required by DB
countrycaseloadlong$date <- as.Date(paste(countrycaseloadlong$Month, "1,", countrycaseloadlong$Year), format = "%B %d, %Y")

## since WHO doesn't distinguish between zero and NA, for the most recent month of data (for whicn not all countries report data)
## treat any values of 0 as NAs since we're not actually sure (this will be updated the following month when data are available)
## also don't report data for any dates in the future
countrycaseloadlong[which(countrycaseloadlong$date == this_month & countrycaseloadlong$value == 0),]$value <- NA
countrycaseloadlong <- countrycaseloadlong[-which(countrycaseloadlong$date > this_month),]

## reformat data into the format required by the DB
ccl <- sqldf("select 6 as metric_id,
                  c.value as value,
                  'WHO Measles Surveillance Data' as data_source,
                  '2019-09-17' as updated_at,
                  place.place_id as place_id,
                  datetime.dt_id as datetime_id,
                  NULL as observation_id
                  from countrycaseloadlong as c
                  left join place on place.iso = c.ISO3
                  left join datetime on datetime.date = c.date
                  order by place_id, datetime.dt_id")

## give a unique observation ID that isn't already taken, count upwards sequentially
ccl$observation_id <- (1:nrow(ccl)) + (as.numeric(max_observation_id)+1)

###############################################################################
### Initial processing of JEE score data ######################################
###############################################################################

#####################################################################################################################
### Analysis: By which % do the number of cases typically change month over month ###################################
#####################################################################################################################

## data for this month, and data for last month lined up
## look at data from January 1, 2011 through June 1, 2019

# analysiscases <- sqldf("select a.place,
#             a.date as date__Date,
#             b.date as last_months_date__Date,
#             a.value as cases,
#             b.value as last_month_cases
#            from ccl as a
#            left join ccl as b
#            on b.observation_id = a.observation_id - 1
#            where a.value > 0",
#            method = "name__class")
# 
# analysiscases <- analysiscases[which(analysiscases$date <= '2019-06-01'),]
# 
# ## percent change in cases from last month
# analysiscases$pctchange <- (analysiscases$cases - analysiscases$last_month_cases)/analysiscases$last_month_cases
# analysiscases$pctchange[which(analysiscases$pctchange == Inf)]  <- NA
# analysiscases$pctchange[which(analysiscases$pctchange == -Inf)]  <- NA
# summary(analysiscases$pctchange * 100)
# 
# hist(log(analysiscases$pctchange + 1), col = "steelblue3",
#      xlab = "Log (% change in caseload from prior month + 1)",
#      ylab = "Number of Country-Months",
#      main = "Distribution of monthly % change in measles caseload (log scale)\nJanuary 2011 through June 2019")
# box()

###############################################################################
### Write WHO MCV1 data #######################################################
###############################################################################

#dbWriteTable(con, "observation", who_mcv1, overwrite = FALSE, append = TRUE, row.names = FALSE)

###############################################################################
### Write JEE 1.0 scores ######################################################
###############################################################################

## immunization
#dbWriteTable(con, "observation", jee1_imm_db, overwrite = FALSE, append = TRUE, row.names = FALSE)

## real-time surveillance
#dbWriteTable(con, "observation", jee1_rts_db, overwrite = FALSE, append = TRUE, row.names = FALSE)

## medical countermeasures and personnel deployment
#dbWriteTable(con, "observation", jee1_mcm_db, overwrite = FALSE, append = TRUE, row.names = FALSE)

###############################################################################
### Write caseload data #######################################################
###############################################################################

#dbWriteTable(con, "observation", ccl, overwrite = FALSE, append = TRUE, row.names = FALSE)

###############################################################################
### Write population size data ################################################
###############################################################################

#dbWriteTable(con, "observation", popdat, overwrite = FALSE, append = TRUE, row.names = FALSE)

###############################################################################
### Write GDP data  ###########################################################
###############################################################################

#dbWriteTable(con, "observation", gdp_db, overwrite = FALSE, append = TRUE, row.names = FALSE)


dat <- dbGetQuery(con, "select p.name as location,
                     max(case when metric_name = 'caseload_totalpop' then value end) as cases_as_of_June2019,
                     max(case when metric_name = 'coverage_mcv1_infant' then value end) as coverage_as_of_2018,
                     max(case when metric_name = 'total_population' then value end) as total_population_2019
                     from observation as o
                     join metric as m
                     on o.metric_id = m.metric_id
                     join place as p
                     on p.place_id = o.place_id
                     join datetime as dt
                     on dt.dt_id = o.datetime_id
                     where 
                     ((o.metric_id = 4 and date = '2018-01-01')
                     or (o.metric_id = 6 and date = '2019-06-01')
                     or (o.metric_id = 3 and date = '2019-01-01'))
                     and value is not null
                     group by p.name
                     order by 2 desc")

cases <- dbGetQuery(con, "select p.name as location,
                    dt.date as date,
                    metric_name,
                    value,
                    unit,
                    data_source
                    from observation as o
                    join metric as m
                    on o.metric_id = m.metric_id
                    join place as p
                    on p.place_id = o.place_id
                    join datetime as dt
                    on dt.dt_id = o.datetime_id
                    where o.metric_id = 6
                    and date >= '2019-05-01' and date < '2019-08-01'
                    order by location, date")



ggplot(dat, aes(x=coverage_as_of_2018, y = cases_as_of_june2019, size = total_population_2019, label = location)) +
  geom_point(alpha=0.65, col = "steelblue") +
  scale_size(range = c(.1, 24), name = "Population size") +
  xlab("Vaccination coverage (as of 2018)") +
  ylab("Cases per month (as of June 2019)") +
  geom_text(size = 2) 

ggplot(dat[(which(dat$cases_as_of_june2019 >= 10)),], aes(y=cases_as_of_june2019, x = location)) +
  geom_bar(fill = "steelblue", stat = "identity") 
  scale_size(range = c(.1, 24), name = "Population size") +
  xlab("Vaccination coverage (as of 2018)") +
  ylab("Cases per month (as of June 2019)") +
  geom_text(size = 2) 


######################################################################
### Disconnect from DB ###############################################
######################################################################

dbDisconnect(con)
