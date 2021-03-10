'use strict';

const fs = require('fs');
const path = require('path');
const util = require('./util.js');

async function reportConsole(results, successIndex, failIndex, startTime) {
  let timestamp = util.getTimestamp(startTime);

  // style
  const htmlStyle = '<style> \
		* {font-family: Calibri (Body);} \
	  table {border-collapse: collapse;} \
	  table, td, th {border: 1px solid black;} \
	  th {background-color: #0071c5; color: #ffffff; font-weight: normal;} \
    </style>';

  // resultTable
  let resultsTable = `<table><tr><th>Results (FAILED: ${failIndex}; ALL: ${
      failIndex + successIndex})</th></tr>`;
  const goodStyle = 'style="color:green"';
  const badStyle = 'style="color:red"';
  const neutralStyle = 'style="color:black"';

  for (let result of results) {
    resultsTable += `<tr><td>${result}</td></td>`;
    resultsTable += '</tr>';
  }
  resultsTable += '</table>';

  // configTable
  util['duration'] = util.getDuration(startTime, new Date());
  let configTable = '<br><table><tr><th>Category</th><th>Info</th></tr>';
  for (let category
           of ['duration', 'hostname', 'platform', 'url', 'browserPath',
               'browserArgs', 'cpuName', 'gpuName', 'powerPlan',
               'gpuDriverVersion', 'screenResolution', 'chromeVersion',
               'chromeRevision']) {
    configTable += `<tr><td>${category}</td><td>${util[category]}</td></tr>`;
  }
  configTable += '</table>';

  const html = htmlStyle + resultsTable + configTable;
  await fs.promises.writeFile(
      path.join(util.resultsDir, `${timestamp}.html`), html);

  const summary = resultsTable + `<table><tr><td>duration</td><td>${util['duration']}</td></tr></table>`;
  return summary;
}

module.exports = reportConsole;
