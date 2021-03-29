'use strict';

const fs = require('fs');
const { chromium } = require('playwright');
const report = require('./report.js')
const util = require('./util.js')
const reportUnittest = require('./report_unittest.js')

async function runUnittest() {
  if (!fs.existsSync(util.resultsDir)) {
    fs.mkdirSync(util.resultsDir, { recursive: true });
  }

  const { spawnSync } = require('child_process');
  let startTime = new Date();
  let timestamp = util.getTimestamp(startTime);
  const logFile = timestamp + '.txt';
  process.chdir(util.tfjsdir);

  process.env['CHROME_BIN'] = util.browserPath;
  let cmd = spawnSync('cmd', ['/c', `yarn test > ${logFile}`],
    { env: process.env, stdio: [process.stdin, process.stdout, process.stderr] });

  let results = [];
  let failIndex = 0;
  let summary = '';
  var lines = require('fs').readFileSync(logFile, 'utf-8')
    .split('\n')
    .filter(Boolean);

  lines.forEach(function(line) {
    console.log(line);
    if (line.includes('FAILED')) {
      if (failIndex < 20) {
        results[failIndex] = line;
      }
      failIndex++;
    }
    if (line.includes(': Executed')) {
      summary = line;
      // Executed line also include FAILED.
      failIndex--;
    }
  })
  failIndex = failIndex > 0 ? failIndex : 0;
  results[results.length] = summary;

  var unitResultTable = await reportUnittest(results, failIndex, startTime);

  return unitResultTable;
}
module.exports = {
  runUnittest: runUnittest
}
