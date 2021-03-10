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
  resultsTable = `<table><tr><th>Benchmark(${name})</th><th>WebGPU (ms)</th><th>WebGL (ms)</th><th>WebGPU vs. WebGL (%)</th><th>WASM (ms)</th><th>WebGPU vs. WASM (%)</th><th>CPU (ms)</th><th>WebGPU vs. CPU (%)</th></tr>`;
  for (let result of results) {
    let webgpuValue = result[util.backends.indexOf('webgpu') + 1];
    resultsTable += `<tr><td>${result[0]}</td><td>${result[1]}</td>`;
    for (let i = 1; i < util.backends.length; i++) {
      let style = webgpuValue == 0 || result[i + 1] == 0 ? neutralStyle : (webgpuValue < result[i + 1] ? goodStyle : badStyle);
      let percent = 'NA';
      if (result[i + 1] !== 0 && webgpuValue !== 0) {
        percent = parseFloat((result[i + 1] - webgpuValue) / result[i + 1] * 100).toFixed(2);
      }
      resultsTable += `<td>${result[i + 1]}</td><td ${style}>${percent}</td>`;
    }
    resultsTable += '</tr>';
  }
  resultsTable += '</table>';
  return resultsTable;
}

async function report(results, resultsBest, resultsWarmup,  startTime) {
  let timestamp = util.getTimestamp(startTime);

  // style
  const htmlStyle = style.getStyle();

  // resultTable
  let resultsTable = getTableFromResults(results, 'Average') + '<br>';
  resultsTable += getTableFromResults(resultsBest, 'Best') + '<br>';
  resultsTable += getTableFromResults(resultsWarmup, 'Warmup');

  // configTable
  util['duration'] = util.getDuration(startTime, new Date());
  const configTable = style.getConfigTable(util);
  const durationTable = style.getDurationTable(util['duration'] );

  const html = htmlStyle + resultsTable + configTable + durationTable;
  await fs.promises.writeFile(path.join(util.resultsDir, `${timestamp}.html`), html);

  const summary = resultsTable + durationTable;
  return summary;
}

module.exports = report;
