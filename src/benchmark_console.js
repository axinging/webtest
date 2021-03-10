'use strict';

const {exit} = require('yargs');
const config = require('./config.js');
const fs = require('fs');
const path = require('path');
const util = require('./util.js');

const {chromium} = require('playwright');
const reportConsole = require('./report_console.js')

let results = [];
let successIndex = 0;
let failIndex = 0;
let logEnd = false;

let logStatus = {logEnd: false};

async function waitForCondition(condition) {
  return new Promise(resolve => {
    var start_time = Date.now();
    function checkCondition() {
      if (condition.logEnd == true) {
        console.log('Test end');
        resolve();
      } else if (Date.now() > start_time + 3600 * 1000) {
        console.log('Test time out');
        resolve();
      } else {
        setTimeout(checkCondition, 1000);
      }
    }
    checkCondition();
  });
}

async function runBenchmarkConsole(url) {
  const context = await chromium.launchPersistentContext(util.userDataDir, {
    headless: false,
    executablePath: util['browserPath'],
    viewport: null,
    ignoreHTTPSErrors: true,
    args: util['browserArgs'],
  });
  const page = await context.newPage();
  try {
    await page.goto(url);
  } catch (e) {
    await context.close();
    console.log(`Launch ${url} error: `, e);
    return false;
  }

  page.on('console', msg => {
    let msgStr = ('' + msg.args()[0]).replace('JSHandle@', '');
    if (msgStr.startsWith('SUCCESS')) {
      successIndex++;
    } else if (msgStr.startsWith('FAILED')) {
      results[failIndex] = msgStr;
      failIndex++;
    } else if (msgStr.startsWith('Skipped')) {
      logStatus.logEnd = true;
    } else {
      // Unsupported.
    }
  });
  await waitForCondition(logStatus);
  await context.close();
  return true;
}

async function runBenchmarksConsole(url) {
  let startTime = new Date();

  if (!fs.existsSync(util.resultsDir)) {
    fs.mkdirSync(util.resultsDir, {recursive: true});
  }

  const status = await runBenchmarkConsole(url);
  if (status === false) {
    return null;
  }

  return await reportConsole(results, successIndex, failIndex, startTime);
}

module.exports = {
  runBenchmarks: runBenchmarksConsole
}
