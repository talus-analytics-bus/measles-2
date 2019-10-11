// Libraries
import React from 'react'
import classNames from 'classnames'
import styles from './content.module.scss'
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';

// Utilities (date formatting, etc.)
import Util from '../../../../components/misc/Util.js'

// If DEMO_DATE exists, use it (frames all data in site relative to the demo
// date that is specified). Otherwise, today's date will be used ("now").
var DEMO_DATE = process.env.DEMO_DATE
if (typeof DEMO_DATE === 'undefined') {
  DEMO_DATE = '2025-07-04T23:56:00'
}

// Function to return JSX for content of details page.
// props keys:
  // alertHistory
  // detailsUpdates
const Content = (props: any) => {

  // Get the current facility (facility) and its severity level.
  const facility = props.selectedFacility;

  // Set default sort parameters for tables
  const defaultSorted = [{
    dataField: 'statusDateFmt',
    order: 'desc'
  }];

  // Ignore statuses that are after the demo date or today's date.
  const timeThreshold = DEMO_DATE !== undefined ? new Date(DEMO_DATE) : new Date();
  const statuses = props.detailsUpdates.sort(Util.sortByDetailsId).sort(Util.sortByDatetime);

  // Define sorting function for date columns.
  /**
   * [dateSortFunc description]
   * @method dateSortFunc
   * @param  {[type]}     aTmp  [description]
   * @param  {[type]}     bTmp  [description]
   * @param  {[type]}     order [description]
   * @return {[type]}           [description]
   */
  const dateSortFunc = (aTmp: any, bTmp: any, order: any) => {
    const a: any = new Date(aTmp);
    const b: any = new Date(bTmp);
    if (order === 'desc') {
      return b - a;
    }
    return a - b; // desc
  }

  // Define columns for status table
  const columnsStatuses = [{
    dataField: 'submittedByName',
    text: 'Submitted by',
    sort: true
  }, {
    dataField: 'details',
    text: 'Description',
    sort: true
  }, {
    dataField: 'statusDateFmt',
    text: 'Date / Time',
    sort: true,
    sortFunc: dateSortFunc,
  }];

  // Prepare status data for display in table.
  statuses.forEach((s: any) => {
    console.log(s)
    // If status occurs after the cut-off date for dashboard data, don't show.
    const statusDate = new Date(s.effective_dtm);
    s.display = timeThreshold >= statusDate;

    // Determine name to put in table
    // TODO ensure this works with real data
    s.submittedByName =
      s.submitted_by === 'hospital_employee' ?
        'Hospital employee' : s.submitted_by;

    // Format the status date
    s.statusDateFmt = Util.formatDatetime(statusDate);
  });
  const statusesInTable = statuses.filter((s: any) => s.display);

  // Define status table JSX
  const paginationParams = {
    sizePerPage: 5,
    hideSizePerPage: true,
  }
  const statusTable =
    (<BootstrapTable
      keyField='status_id'
      data={ statusesInTable }
      columns={ columnsStatuses }
      defaultSorted={ defaultSorted }
      pagination={ statusesInTable.length > 5 ?
        paginationFactory(paginationParams) : null
      }
    />);

  // Ignore alerts that are after the demo date or today's date.
  const alerts = props.alertHistory.sort(Util.sortByAlertId).sort(Util.sortByDatetime);
  const columnsAlerts = [{
    dataField: 'severity',
    text: 'Status',
    sort: true
  }, {
    dataField: 'description',
    text: 'Alert description',
    sort: true
  }, {
    dataField: 'active',
    text: 'Active or cleared?',
    sort: true
  }, {
    dataField: 'statusDateFmt', // to format
    text: 'Date / Time',
    sort: true,
    sortFunc: dateSortFunc,
  }];

  // Define classes for rows so that cleared alerts are grayed out.
  const alertRowClasses = (row: any, rowIndex: any) => {
    let classes = null;
    if (row.active === 'Cleared') {
      classes = styles['cleared'];
    }
    return classes;
  };

  // Process alerts data for inclusion in table.
  alerts.forEach((s: any) => {

    // If status date (alert date) occurs after the time threshold for the
    // notional data, then don't display it.
    // TODO ensure this is turned off when real data are used, or that it at
    // least doesn't delete data errantly.
    s.display = true;
    const statusDate = new Date(s.effective_dtm);
    if (timeThreshold < statusDate) s.display = false;

    // True if the alert is active, false if it is cleared.
    const clearedDate = s.cleared_dtm !== null ? new Date(s.cleared_dtm) : Infinity;
    s.active = clearedDate >= timeThreshold ? 'Active' : 'Cleared';

    // Format the status date
    s.statusDateFmt = Util.formatDatetime(statusDate);
  })
  const alertsInTable = alerts.filter((s: any) => s.display);

  // Define status table JSX
  const alertTable =
    (<BootstrapTable
      keyField='alert_id'
      data={ alertsInTable }
      columns={ columnsAlerts }
      defaultSorted={ defaultSorted }
      rowClasses={ alertRowClasses }
      pagination={ alertsInTable.length > 5 ?
        paginationFactory(paginationParams) : null
      }
    />);

  // Get datetime stamp for facility status and other elements.
  const datetimeStamps = props.datetimeStamps;

  // JSX for details page content.
  return (
  <div className={styles.content}>
    <div className={styles.summary}>
      <div>
        <div className={classNames(styles.status, styles[facility.severity])}>
          <p>{facility.severity}</p>
        </div>
        <div>
          <p className={styles.title}>Facility status</p>
          <p className={styles.date}>updated on {datetimeStamps.facilityStatus}</p>
        </div>
      </div>
    </div>
    <div className={styles.detailsUpdates}>
      <p className={classNames(styles.highlighted, styles[facility.severity])}>Status updates</p>
      {statusTable}
    </div>
    <div className={styles.alertHistory}>
      <p className={classNames(styles.highlighted, styles[facility.severity])}>Alert history</p>
      {alertTable}
    </div>
  </div>
)
}

export default Content
