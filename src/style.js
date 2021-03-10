'use strict';

function getConfigTable(util) {
  let configTable = '<table><tr><th>Category</th><th>Info</th></tr>';
  for (let category
    of ['hostname', 'platform', 'url', 'browserPath',
      'browserArgs', 'cpuName', 'gpuName', 'powerPlan',
      'gpuDriverVersion', 'screenResolution', 'chromeVersion',
      'chromeRevision']) {
    configTable += `<tr><td>${category}</td><td>${util[category]}</td></tr>`;
  }
  configTable += '</table>';
  return configTable;
}

function getStyle() {
  const htmlStyle = '<style> \
      * {font-family: Calibri (Body);} \
      table {border-collapse: collapse;} \
      table, td, th {border: 1px solid black;} \
      th {background-color: #0071c5; color: #ffffff; font-weight: normal;} \
      </style>';
  return htmlStyle;
}

function getDurationTable(duration) {
  return `<table><tr><td>duration</td><td>${duration}</td></tr></table>`;
}

module.exports = {
  getConfigTable: getConfigTable,
  getStyle: getStyle,
  getDurationTable: getDurationTable,
};
