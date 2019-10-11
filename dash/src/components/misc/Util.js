import * as d3 from 'd3/dist/d3.min';

// Utility functions.
const Util = {};

Util.formatDatetimeApi = (dt) => {
  const year = dt.getFullYear();
  const monthTmp = dt.getMonth() + 1;
  const month = monthTmp > 9 ? ('' + monthTmp) : ('0' + monthTmp);

  const dateTmp = dt.getDate();
  const date = dateTmp > 9 ? ('' + dateTmp) : ('0' + dateTmp);

  // const hoursTmp = dt.getHours();
  // const hours = hoursTmp > 9 ? ('' + hoursTmp) : ('0' + hoursTmp);
  //
  // const minutesTmp = dt.getMinutes();
  // const minutes = minutesTmp > 9 ? ('' + minutesTmp) : ('0' + minutesTmp);
  //
  // const secondsTmp = dt.getSeconds();
  // const seconds = secondsTmp > 9 ? ('' + secondsTmp) : ('0' + secondsTmp);

  const yyyymmdd = `${year}-${month}-${date}`;
  return `${yyyymmdd}`;
  // const hhmmss = `${hours}:${minutes}:${seconds}`;
  // return `${yyyymmdd}T${hhmmss}`;
};

Util.today = () => {
  return new Date(); // TODO put time traveling here if needed
};

Util.getDatetimeStamp = (datum, type = 'year') => {
  if (!datum || datum['value'] === null) return '';

  let datetimeStamp;
  const date_time = datum['date_time'].replace(/-/g, '/');
  if (type === 'month') {
    datetimeStamp = new Date(date_time).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } else if (type === 'year') {
    datetimeStamp = new Date(date_time).toLocaleString('en-US', {
      year: 'numeric',
      timeZone: 'UTC',
    });
  }
  return ` (${datetimeStamp})`;
};

Util.importAll = (r) => {
  let images = {};
  r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
  return images;
}

// Sorting functions to sort alerts and statuses data by datetime and by
// unique ID (sequential relative to submission order).
Util.sortByDatetime = (a, b) => {
  const dateA = new Date(a.effective_dtm);
  const dateB = new Date(b.effective_dtm);
  if (dateA > dateB) return -1;
  if (dateA < dateB) return 1;
  return 0;
};
Util.sortByAlertId = (a, b) => {
  if (a.alert_id > b.alert_id) return -1;
  if (a.alert_id < b.alert_id) return 1;
  return 0;
};
Util.sortByDetailsId = (a, b) => {
  if (a.details_id > b.details_id) return -1;
  if (a.details_id < b.details_id) return 1;
  return 0;
};
Util.sortByName = (a, b) => {
  if (a.name > b.name) return -1;
  if (a.name < b.name) return 1;
  return 0;
};

// Format delta value
Util.percentizeDelta = (deltaTmp) => {
  const delta = Math.abs(deltaTmp);
	const d3Format = d3.format(',.0%');
	const d3FormattedNum = d3Format(delta);

  if (Math.abs(delta) > 2) return '>200%';

	if (d3FormattedNum === "0%" && delta !== 0) {
		return "<1%";
	} else {
		return d3FormattedNum;
	}
};

// Format incidence value
Util.formatIncidence = (inc) => {
  if (inc === 0) return '0';
  else if (inc < 0.001) return '<0.001';
  else return Util.formatSI(inc);
};

// Comma-ize numbers
Util.comma = function(num) {
	const resultTmp = d3.format(',.0f')(num);
	return resultTmp;
};

// Format money as comma number with USD suffix
Util.money = (val) => {
  return Util.comma(val) + ' USD';
}

// Format using standard suffixes
Util.formatSI = (val) => {

  // If zero, just return zero
  if (val === 0) return '0';

  // If 1 or less, return the value with three significant digits. (?)
  else if (val < 1) return d3.format('.3f')(val);

  // If between 1 - 1000, return value with two significant digits.
  else if (val >= 1 && val < 1000) return d3.formatPrefix('.2f', 1)(val); // k

  // If 1k or above, return SI value with two significant digits
  else if (val >= 1000 && val < 1000000) return d3.formatPrefix('.2f', 1000)(val); // k
  else return d3.formatPrefix(',.2s', 1000000)(val); // M
};

/**
 * Capitalizes each word in the input text and returns the result.
 * @method toTitleCase
 * @param  {[string]}    str [Input string.]
 * @return {[string]}        [Capitalized input string]
 */
Util.toTitleCase = (str) => {
  return str.replace(/\w\S*/g, function(txt){
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Formatting functions for dates and datetimes.
Util.formatDatetime = (input) => {
    return input.toLocaleString('en-us', {
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      year: 'numeric',
      day: 'numeric'
    }
  );
}
Util.formatDate = (input) => {
    return input.toLocaleString('en-us', {
      month: 'long',
      year: 'numeric',
      day: 'numeric'
    }
  );
}

export default Util;
