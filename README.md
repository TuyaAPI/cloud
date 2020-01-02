tuyapi/cloud [![Build Status](https://travis-ci.org/TuyaAPI/cloud.svg?branch=master)](https://travis-ci.org/TuyaAPI/cloud) [![Coverage Status](https://coveralls.io/repos/github/TuyaAPI/cloud/badge.svg?branch=master)](https://coveralls.io/github/TuyaAPI/cloud?branch=master) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)
==============

A NodeJS wrapper for Tuya's [API](https://docs.tuya.com/en/cloudapi/appAPI/index.html).

At the moment, only the [mobile/app API](https://web.archive.org/web/20180613132925/https://docs.tuya.com/en/cloudapi/appAPI/index.html) (as captured by web.archive.org) is supported as it covers the vast majority of use cases.

There are two modes of operation:
- the 'old' API - described in the docs, using MD5 as a sign mechanism
- the 'new' API - reverse-engineered from the TuyaSmart Android app, using HMAC-SHA256 as a sign mechanism

If you can, use the old API.  Unfortunately, for some `clientId/key`'s you must use the new API (eg. clientId used by TuyaSmart app). To use the the new API, specify `apiEtVersion` as an option in constructor (currently `'0.0.1'`).

Step-by-step instructions for acquiring keys to use with the old API can be found [here](https://tuyaapi.github.io/cloud/apikeys/).

Obtaining keys for new API (additional parameters `secret2` and `certSign` are required) involves disassembling obtained an APK file (either official app or generated "demo" app from iot.tuya.com). For details see [tuya-sign-hacking repo](https://github.com/nalajcie/tuya-sign-hacking).

## Installation
`npm i @tuyapi/cloud`

## Usage
old API (register/login and create token):
```javascript
const Cloud = require('@tuyapi/cloud');

let api = new Cloud({key: 'your-api-app-key', secret: 'your-api-app-secret'});

api.register({email: 'example@example.com', password: 'example-password'}).then(async sid => {
  let token = await api.request({action: 'tuya.m.device.token.create', data: {'timeZone': '-05:00'}});

  console.log(token) // => { secret: '0000', token: '01010101' }
});
```

new API (listing all devices in all groups):
```javascript
const Cloud = require('@tuyapi/cloud');

let api = new Cloud({key: apiKeys.key,
                     secret: apiKeys.secret,
                     secret2: apiKeys.secret2,
                     certSign: apiKeys.certSign,
                     apiEtVersion: '0.0.1',
                     region: 'EU'});

api.loginEx({email: myEmail, password: myPassword}).then(async sid => {
  console.log(sid);

  api.request({action: 'tuya.m.location.list'}).then(async groups => {
    for (const group of groups) {
      api.request({action: 'tuya.m.my.group.device.list', gid: group.groupId}).then(async devicesArr => {
        for (const device of devicesArr) {
           console.log('group: "%s"\tdevice: "%s"\tdevId: "%s"', group.name, device.name, device.devId);
        }
      });
    }
  });
});
```

[Documentation](https://tuyaapi.github.io/cloud/)

## Development
1. After cloning, run `npm i`.
2. Add a file called `keys.json` with the contents
```javascript
{
  "key": "your-api-key",
  "secret": "your-api-secret"
  // for new API: add also secret2 and certSign
}
```
3. Create a file called `dev.js` as a playground. Since `dev.js` is in `.gitignore`, it won't be committed.
4. To run tests, run `npm test`.
5. To output coverage, run `npm run cover` (it will exit with an error).
6. To build documentation, run `npm run document`.

[![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com)
