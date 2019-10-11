import React from 'react'
import { Bar, defaults } from 'react-chartjs-2'

const green = 'rgba(0, 154, 101, 1)' //'#009a65'
const yellow = 'rgba(249, 193, 59, 1)' //'#f9c13b'
const red = 'rgba(235, 28, 37, 1)' //'#eb1c25'

const options = {
  scales: {
    xAxes: [
      {
        stacked: true,
        gridLines: {
          display: false
        },
        scaleLabel: {
          display: true,
        }
      }
    ],
    yAxes: [
      {
        stacked: true,
        scaleLabel: {
          display: true,
        },
        ticks: {
          beginAtZero: true,
          precision: 0,
          suggestedMax: 4,
        },
      }
    ]
  }
}

const Chart = ({ metric }) => {

  defaults.global.defaultFontFamily = 'Open Sans'

  console.log(metric);

  const data = {
    labels: metric.map(observation => observation.date_time),
    datasets: [{
      label: metric[0].definition,
      data: metric.map(observation => observation.value)
    }]
  }

  console.log(data);

  return <Bar data={data} options={options} />
}

export default Chart
