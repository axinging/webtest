'use strict';

const fs = require('fs');
const path = require('path');
const util = require('./util.js');
const style = require('./style.js');

function getTableFromResults(results, name){
  const goodStyle = 'style="color:green"';
  const badStyle = 'style="color:red"';
  const neutralStyle = 'style="color:black"';
  let resultsTable = '';
  resultsTable = `<table><tr><th>Benchmark(${name})</th><th>WebGPU (ms)</th><th>WebGL (ms)</th><th>WASM (ms)</th><th>CPU (ms)</th></tr>`;
  for (let result of results) {
    let webgpuValue = result[util.backends.indexOf('webgpu') + 1];
    resultsTable += `<tr><td>${result[0]}</td><td>${result[1]}</td>`;
    for (let i = 1; i < util.backends.length; i++) {
      let style = webgpuValue == 0 || result[i + 1] == 0 ? neutralStyle : (webgpuValue < result[i + 1] ? goodStyle : badStyle);
      resultsTable += `<td>${result[i + 1]}</td></td>`;
    }
    resultsTable += '</tr>';
  }
  resultsTable += '</table>';
  return resultsTable;
}

async function report(results, startTime) {
  let timestamp = util.getTimestamp(startTime);

  // style
  const htmlStyle = style.getStyle();

  // resultTable
  let resultsTable = getTableFromResults(results, 'Prediction matches CPU');

  // configTable
  util['duration'] = util.getDuration(startTime, new Date());
  const configTable = style.getConfigTable(util);
  const durationTable = style.getDurationTable(util['duration'] );

  const html = htmlStyle + resultsTable + configTable + durationTable;
  await fs.promises.writeFile(path.join(util.resultsDir, `correctness${timestamp}.html`), html);

  const summary = resultsTable + durationTable;
  return summary;
}

module.exports = report;
