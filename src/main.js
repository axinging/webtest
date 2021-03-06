'use strict';

const fs = require('fs');
const runBenchmark = require('./benchmark.js');
const config = require('./config.js');
const report = require('./report.js')
const runUnit = require('./unit.js');
const util = require('./util.js');

util.args = require('yargs')
  .usage('node $0 [args]')
  .option('backend', {
    type: 'string',
    describe: 'backend to run, splitted by comma',
  })
  .option('benchmark', {
    type: 'string',
    describe: 'benchmark to run, splitted by comma',
  })
  .option('browser', {
    type: 'string',
    describe: 'browser path',
  })
  .option('dryrun', {
    type: 'boolean',
    describe: 'dryrun the test',
  })
  .option('email', {
    alias: 'e',
    type: 'string',
    describe: 'email to',
  })
  .option('repeat', {
    type: 'number',
    describe: 'repeat times',
    default: 1,
  })
  .option('run-times', {
    type: 'integer',
    describe: 'run times',
  })
  .option('target', {
    type: 'string',
    describe: 'test target, splitted by comma',
  })
  .option('tfjs-dir', {
    type: 'string',
    describe: 'tfjs dir',
  })
  .option('timestamp', {
    type: 'string',
    describe: 'timestamp format, day or second',
    default: 'second',
  })
  .option('url', {
    type: 'string',
    describe: 'url to test against',
  })
  .option('warmup-times', {
    type: 'integer',
    describe: 'warmup times',
  })
  .example([
    ['node $0 --email <email>', 'send report to <email>'],
  ])
  .help()
  .argv;

function padZero(str) {
  return ('0' + str).slice(-2);
}

function getTimestamp(format) {
  const date = new Date();
  let timestamp = date.getFullYear() + padZero(date.getMonth() + 1) + padZero(date.getDate());
  if (format == 'second') {
    timestamp += padZero(date.getHours()) + padZero(date.getMinutes()) + padZero(date.getSeconds());
  }
  return timestamp;
}

async function main() {
  let browserPath;
  if ('browser' in util.args) {
    browserPath = util.args['browser'];
  } else if (util.platform === 'darwin') {
    browserPath = '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary';
  } else if (util.platform === 'linux') {
    browserPath = '/usr/bin/google-chrome-unstable';
  } else if (util.platform === 'win32') {
    browserPath = `${process.env.LOCALAPPDATA}/Google/Chrome SxS/Application/chrome.exe`;
  }
  util.browserPath = browserPath;

  if ('dryrun' in util.args) {
    util.dryrun = true;
  } else {
    util.dryrun = false;
  }

  if ('url' in util.args) {
    util.url = util.args['url'];
  }

  util.timestamp = getTimestamp(util.args['timestamp']);

  if (!util.dryrun) {
    await config();
  }

  let targets = [];
  if ('target' in util.args) {
    targets = util.args['target'].split(',');
  } else {
    targets = ['conformance', 'performance', 'unit'];
  }

  if (!fs.existsSync(util.resultsDir)) {
    fs.mkdirSync(util.resultsDir, { recursive: true });
  }

  let results = {};
  for (let i = 0; i < util.args['repeat']; i++) {
    if (util.args['repeat'] > 1) {
      console.log(`== Test round ${i + 1}/${util.args['repeat']} ==`);
    }

    for (let target of targets) {
      console.log(`${target} test`);
      if (['conformance', 'performance'].indexOf(target) >= 0) {
        results[target] = await runBenchmark(target);
      } else if (target == 'unit') {
        results[target] = await runUnit();
      }
    }
    await report(results);
  }
}

main();
