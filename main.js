const is = require('is');
const got = require('got');
const randomize = require('randomatic');
const sortObject = require('sort-keys-recursive');
const md5 = require('md5');
const promisePoller = require('promise-poller').default;

// A options.key
// options.secret
// options.deviceID | random
// options.endpoint / options.region (defaults to US)
function TuyaCloud(options) {
  // Set to empty object if undefined
  options = is.undefined(options) ? {} : options;

  // Key and secret
  if (!options.key || !options.secret ||
      options.key.length !== 20 || options.secret.length !== 32) {
    throw new Error('Invalid format for key or secret.');
  } else {
    this.key = options.key;
    this.secret = options.secret;
  }

  // Device ID
  if (is.undefined(options.deviceID)) {
    this.deviceID = randomize('a0', 44, options);
  } else {
    this.deviceID = options.deviceID;
  }

  // Region
  if (is.undefined(options.region) || options.region === 'AZ') {
    this.region = 'AZ';
    this.endpoint = 'https://a1.tuyaus.com/api.json';
  } else if (options.region === 'AY') {
    this.region = 'AY';
    this.endpoint = 'https://a1.tuyacn.com/api.json';
  } else if (options.region === 'EU') {
    this.region = 'EU';
    this.endpoint = 'https://a1.tuyaeu.com/api.json';
  }
}

// A options.requiresSID | true
// options.action
// options.data | {}
TuyaCloud.prototype.request = function (options) {
  // Set to empty object if undefined
  options = is.undefined(options) ? {} : options;

  // Check arguments
  if (is.undefined(options.requiresSID)) {
    options.requiresSID = true;
  }

  if (!options.action) {
    throw new Error('Must specify an action to call.');
  }

  if (!options.data) {
    options.data = {};
  }

  // Must have SID if we need it later
  if (!this.sid && options.requiresSID) {
    throw new Error('Must call login() first.');
  }

  const d = new Date();
  const pairs = {a: options.action,
                 deviceId: this.deviceID,
                 os: 'Linux',
                 v: '1.0',
                 clientId: this.key,
                 lang: 'en',
                 time: Math.round(d.getTime() / 1000),
                 postData: JSON.stringify(options.data)};

  if (options.requiresSID) {
    pairs.sid = this.sid;
  }

  // Generate signature for request
  const valuesToSign = ['a', 'v', 'lat', 'lon', 'lang', 'deviceId', 'imei',
                        'imsi', 'appVersion', 'ttid', 'isH5', 'h5Token', 'os',
                        'clientId', 'postData', 'time', 'n4h5', 'sid', 'sp'];

  const out = [];
  const sortedPairs = sortObject(pairs);

  for (const key in sortedPairs) {
    if (!valuesToSign.includes(key) || is.empty(pairs[key])) {
      continue;
    } else {
      out.push(key + '=' + pairs[key]);
    }
  }

  const strToSign = this.secret + out.join('|');

  pairs.sign = md5(strToSign);

  return new Promise(async (resolve, reject) => {
    try {
      const apiResult = await got(this.endpoint, {query: pairs});
      const data = JSON.parse(apiResult.body);

      if (data.success === false) {
        reject(new Error(data.errorCode));
      }

      resolve(data.result);
    } catch (err) {
      reject(err);
    }
  });
};

// A options.region
// options.email
// options.password
// If email is already registered, try logging in instead
TuyaCloud.prototype.register = async function (options) {
  try {
    const apiResult = await this.request({action: 'tuya.m.user.email.register',
                                          data: {countryCode: this.region,
                                                 email: options.email,
                                                 passwd: md5(options.password)},
                                          requiresSID: false});
    this.sid = apiResult.sid;
    return this.sid;
  } catch (err) {
    if (err.message === 'USER_NAME_IS_EXIST') {
      return this.login(options);
    }
    return err;
  }
};

// A options.region
// options.email
// options.password
TuyaCloud.prototype.login = async function (options) {
  try {
    const apiResult = await this.request({action: 'tuya.m.user.email.password.login',
                                          data: {countryCode: this.region,
                                                 email: options.email,
                                                 passwd: md5(options.password)},
                                          requiresSID: false});
    this.sid = apiResult.sid;
    return this.sid;
  } catch (err) {
    return err;
  }
};

// A options
// options.timeout
// [optional] options.devices // # of devices to wait for
// It's possible to register multiple devices at once,
// so this returns an array. If registering one device
// wanted result is result[0].
TuyaCloud.prototype.waitForToken = function (options) {
  if (!options.devices) {
    options.devices = 1;
  }

  return promisePoller({
    taskFn: (async () => {
      try {
        const tokenResult = await this.request({action: 'tuya.m.device.list.token',
                                                data: {token: options.token}});

        if (tokenResult.length < options.devices) {
          return new Error('Error: Device(s) not yet added');
        }

        return tokenResult;
      } catch (err) {
        return err;
      }
    }),
    interval: 500,
    retries: 150
  });
};

module.exports = TuyaCloud;
