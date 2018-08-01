const is = require('is');
const got = require('got');
const randomize = require('randomatic');
const sortObject = require('sort-keys-recursive');
const md5 = require('md5');
const delay = require('delay');
const debug = require('debug')('@tuyapi/cloud');

/**
* A TuyaCloud object
* @class
* @param {Object} options construction options
* @param {String} options.key API key
* @param {String} options.secret API secret
* @param {String} [options.region='AZ'] region (AZ=Americas, AY=Asia, EU=Europe)
* @param {String} [options.deviceID] ID of device calling API (defaults to a random value)
* @example
* const api = new Cloud({key: 'your-api-key', secret: 'your-api-secret'})
*/
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

/**
* Slices and dices an MD5 digest
* to conform to Tuya's spec.
* Don't ask why this is needed.
* @param {String} data to hash
* @returns {String} resulting digest
* @private
*/
TuyaCloud.prototype._mobileHash = function (data) {
  const preHash = md5(data);

  return preHash.slice(8, 16) +
         preHash.slice(0, 8) +
         preHash.slice(24, 32) +
         preHash.slice(16, 24);
};

/**
* Sends an API request
* @param {Object} options
* request options
* @param {String} options.action
* API action to invoke (for example, 'tuya.cloud.device.token.create')
* @param {Object} [options.data={}]
* data to send in the request body
* @param {Boolean} [options.requiresSID=true]
* set to false if the request doesn't require a session ID
* @example
* // generate a new token
* api.request({action: 'tuya.m.device.token.create',
*              data: {'timeZone': '-05:00'}}).then(token => console.log(token))
* @returns {Promise<Object>} A Promise that contains the response body parsed as JSON
*/
TuyaCloud.prototype.request = async function (options) {
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
                 lang: 'en',
                 v: '1.0',
                 clientId: this.key,
                 time: Math.round(d.getTime() / 1000),
                 postData: JSON.stringify(options.data)};

  if (options.requiresSID) {
    pairs.sid = this.sid;
  }

  // Generate signature for request
  const valuesToSign = ['a', 'v', 'lat', 'lon', 'lang', 'deviceId', 'imei',
                        'imsi', 'appVersion', 'ttid', 'isH5', 'h5Token', 'os',
                        'clientId', 'postData', 'time', 'n4h5', 'sid', 'sp'];

  const sortedPairs = sortObject(pairs);

  let strToSign = '';

  // Create string to sign
  for (const key in sortedPairs) {
    if (!valuesToSign.includes(key) || is.empty(pairs[key])) {
      continue;
    } else if (key === 'postData') {
      strToSign += key;
      strToSign += '=';
      strToSign += this._mobileHash(pairs[key]);
      strToSign += '||';
    } else {
      strToSign += key;
      strToSign += '=';
      strToSign += pairs[key];
      strToSign += '||';
    }
  }

  // Add secret
  strToSign += this.secret;

  // Sign string
  pairs.sign = md5(strToSign);

  try {
    debug('Sending parameters:');
    debug(pairs);

    const apiResult = await got(this.endpoint, {query: pairs});
    const data = JSON.parse(apiResult.body);

    debug('Received response:');
    debug(apiResult.body);

    if (data.success === false) {
      throw {code: data.errorCode, message: data.errorMsg};
    }

    return data.result;
  } catch (err) {
    throw err;
  }
};

/**
* Helper to register a new user. If user already exists, it instead attempts to log in.
* @param {Object} options
* register options
* @param {String} options.email
* email to register
* @param {String} options.password
* password for new user
* @example
* api.register({email: 'example@example.com',
                password: 'example-password'})
                .then(sid => console.log('Session ID: ', sid))
* @returns {Promise<String>} A Promise that contains the session ID
*/
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
    if (err.code === 'USER_NAME_IS_EXIST') {
      return this.login(options);
    }

    throw err;
  }
};

/**
* Helper to log in a user.
* @param {Object} options
* register options
* @param {String} options.email
* user's email
* @param {String} options.password
* user's password
* @example
* api.login({email: 'example@example.com',
             password: 'example-password'}).then(sid => console.log('Session ID: ', sid))
* @returns {Promise<String>} A Promise that contains the session ID
*/
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
    throw err;
  }
};

/**
* Helper to wait for device(s) to be registered.
* It's possible to register multiple devices at once,
* so this returns an array.
* @param {Object} options
* options
* @param {String} options.token
* token being registered
* @param {Number} [options.devices=1]
* number of devices to wait for
* @example
* api.waitForToken({token: token.token}).then(result => {
*   let device = result[0];
*   console.log('Params:');
*   console.log(JSON.stringify({id: device['id'], localKey: device['localKey']}));
* });
* @returns {Promise<Array>} A Promise that contains an array of registered devices
*/
TuyaCloud.prototype.waitForToken = function (options) {
  if (!options.devices) {
    options.devices = 1;
  }

  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 200; i++) {
      try {
        /* eslint-disable-next-line no-await-in-loop */
        const tokenResult = await this.request({action: 'tuya.m.device.list.token',
                                                data: {token: options.token}});

        if (tokenResult.length >= options.devices) {
          return resolve(tokenResult);
        }

        // Wait for 200 ms
        /* eslint-disable-next-line no-await-in-loop */
        await delay(200);
      } catch (err) {
        reject(err);
      }
    }
    reject(new Error('Timed out wating for device(s) to connect to cloud'));
  });
};

module.exports = TuyaCloud;
