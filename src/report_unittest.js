'use strict';

const fs = require('fs');
const path = require('path');
const util = require('./util.js');
const style = require('./style.js');

async function reportUnittest(results, failIndex, startTime) {
  let timestamp = util.getTimestamp(startTime);

  // style
  const htmlStyle = style.getStyle();

  // resultTable
  let resultsTable = `<table><tr><th>WebGPU Unit Test Results (FAILED: ${failIndex})</th></tr>`;

  for (let result of results) {
    resultsTable += `<tr><td>${result}</td></td>`;
    resultsTable += '</tr>';
  }
  resultsTable += '</table>';

  // configTable
  util['duration'] = util.getDuration(startTime, new Date());
  const configTable = style.getConfigTable(util);
  const durationTable = style.getDurationTable(util['duration']);

  const html = htmlStyle + resultsTable + configTable + durationTable;
  await fs.promises.writeFile(
    path.join(util.resultsDir, `yarntest${timestamp}.html`), html);

  const summary = resultsTable + durationTable;
  return summary;
}

module.exports = reportUnittest;
