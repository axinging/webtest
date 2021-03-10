'use strict';

const {exit} = require('yargs');
const config = require('./config.js');
const fs = require('fs');
const path = require('path');
const util = require('./util.js');

const {chromium} = require('playwright');
const report = require('./report_yarntest.js')

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

async function runBenchmark(url) {
  const context = await chromium.launchPersistentContext(util.userDataDir, {
    headless: false,
    executablePath: util['browserPath'],
    viewport: null,
    ignoreHTTPSErrors: true,
    args: util['browserArgs'],
  });
  const page = await context.newPage();
  await page.goto(url);

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
}

async function runBenchmarks(url) {
  let startTime = new Date();

  if (!fs.existsSync(util.resultsDir)) {
    fs.mkdirSync(util.resultsDir, {recursive: true});
  }

  await runBenchmark(url);

  await report(results, successIndex, failIndex, startTime);
}

util.args = require('yargs')
                .usage('node $0 [args]')
                .option('backend', {
                  type: 'string',
                  describe: 'backend to run, splitted by comma',
                })
                .option('url', {
                  type: 'string',
                  describe: 'url to test against',
                })
                .option('email', {
                  alias: 'e',
                  type: 'string',
                  describe: 'email to',
                })
                .example([
                  ['node $0 --email <email>', 'send report to <email>'],
                ])
                .help()
                .argv;


async function main() {
  if ('url' in util.args) {
    util.url = util.args['url'];
  } else {
    util.url = 'http://localhost:9876/debug.html';
  }
  await config();
  await runBenchmarks(util.url);
}

main();
