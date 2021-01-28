const settings = require('../../config.json');
const platformBrowser = require('../browser.js');
const {chromium} = require('playwright-chromium');
const path = require('path');
const fs = require('fs');

async function runTensorflowTest(workload, backend, inputSize, flags) {
  let args = ['--start-maximized'];
  if (flags !== undefined) {
    args = args.concat(flags);
  }
  platformBrowser.configChromePath(settings);
  const userDataDir = path.join(process.cwd(), 'out', 'userData');
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: settings.chrome_path,
    viewport: null,
    ignoreHTTPSErrors: true,
    args: args
  });
  const page = await browser.newPage();
  browser.setDefaultNavigationTimeout(3 * 60 * 1000);
  await page.goto(workload.url, {waitUntil: 'networkidle'});

  const modelsSelect = await page.$(
      '#gui > ul > li:nth-child(1) > div > ul > li.cr.string > div > div > select');
  console.log(backend + '_' + (workload.name) + '_' + inputSize);
  if (workload.name.indexOf('posenet_resnet_tensor') > -1) {
    await modelsSelect.type(
        'posenet_resnet_q4_s32_input224_tensor', {delay: 100});
  } else if (workload.name.indexOf('posenet_resnet_image') > -1) {
    await modelsSelect.type(
        'posenet_resnet_q4_s32_input224_image', {delay: 100});
  } else if (workload.name.indexOf('posenet_mobilenet_tensor') > -1) {
    await modelsSelect.type(
        'posenet_mobilenet_q2_m75_s16_input513_tensor', {delay: 100});
  } else if (workload.name.indexOf('posenet_mobilenet_image') > -1) {
    await modelsSelect.type(
        'posenet_mobilenet_q2_m75_s16_input513_image', {delay: 100});
  } else if (workload.name.indexOf('bodypix_mobilenet_tensor') > -1) {
    await modelsSelect.type('bodypix_tensor', {delay: 100});
    const modelsArch = await page.$(
        '#gui > ul > li:nth-child(3) > div > ul > li.cr.string > div > div > select');
    await modelsArch.type('MobileNetV1', {delay: 100});
  } else if (workload.name.indexOf('bodypix_mobilenet_image') > -1) {
    await modelsSelect.type('bodypix_image', {delay: 100});
    const modelsArch = await page.$(
        '#gui > ul > li:nth-child(3) > div > ul > li.cr.string > div > div > select');
    await modelsArch.type('MobileNetV1', {delay: 100});
  } else if (workload.name.indexOf('bodypix_resnet_tensor') > -1) {
    await modelsSelect.type('bodypix_tensor', {delay: 100});
    const modelsArch = await page.$(
        '#gui > ul > li:nth-child(3) > div > ul > li.cr.string > div > div > select');
    await modelsArch.type('ResNet50', {delay: 100});
  } else if (workload.name.indexOf('bodypix_resnet_image') > -1) {
    await modelsSelect.type('bodypix_image', {delay: 100});
    const modelsArch = await page.$(
        '#gui > ul > li:nth-child(3) > div > ul > li.cr.string > div > div > select');
    await modelsArch.type('ResNet50', {delay: 100});
  }

  const modelsInputSize = await page.$(
      '#gui > ul > li:nth-child(3) > div > ul > li.cr.number > div > div > select');
  await modelsInputSize.type(inputSize.toString(), {delay: 100});

  const backendSelect = await page.$(
      '#gui > ul > li:nth-child(4) > div > ul > li.cr.string > div > div > select');
  await backendSelect.type(backend, {delay: 100});

  await page.waitForTimeout(3 * 1000);
  // A quick rule-of-thumb is to count the number of await's or then's
  // happening in your code and if there's more than one then you're
  // probably better off running the code inside a page.evaluate call.
  // The reason here is that all async actions have to go back-and-forth
  // between Node's runtime and the browser's, which means all the JSON
  // serialization and deserializiation. While it's not a huge amount of
  // parsing (since it's all backed by WebSockets) it still is taking up
  // time that could better be spent doing something else.

  // When there is input size, it is 5; other 4;?
  await page.evaluate(async () => {
    const runButton =
        document.querySelector('#gui > ul > li:nth-child(5) > div > span');
    runButton.click();
    await new Promise(resolve => setTimeout(resolve, 30 * 1000));
  });
  // Waits for result elements
  await page.waitForSelector(
      '#timings > tbody > tr:nth-child(8) > td:nth-child(2)',
      {timeout: 10 * 60 * 1000});

  const resultElem =
      await page.$('#timings > tbody > tr:nth-child(8) > td:nth-child(2)');
  const result = await resultElem.evaluate(element => element.textContent);
  let results = {};
  console.log(`Result: ${result}`);
  results['Total Score'] = result;

  const resultBody = await page.$('#timings > tbody');
  const resultLength =
      await resultBody.evaluate(element => element.rows.length);
  for (let i = 1; i < resultLength; i++) {
    let typeSelector =
        `#timings > tbody > tr:nth-child(${i}) > td:nth-child(1)`;
    let valueSelector =
        `#timings > tbody > tr:nth-child(${i}) > td:nth-child(2)`;
    const typeElem = await page.$(typeSelector);
    const valueElem = await page.$(valueSelector);
    const type = await typeElem.evaluate(element => element.innerText);
    const value = await valueElem.evaluate(element => element.innerText);
    results[type] = value;
  }

  // console.log('********** Detailed results: **********');
  // console.log(results);

  await browser.close();

  return Promise.resolve({date: Date(), results: results});
}

module.exports = runTensorflowTest;
