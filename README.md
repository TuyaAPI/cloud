tuyapi/cloud [![Build Status](https://travis-ci.org/TuyaAPI/cloud.svg?branch=master)](https://travis-ci.org/TuyaAPI/cloud) [![Coverage Status](https://coveralls.io/repos/github/TuyaAPI/cloud/badge.svg?branch=master)](https://coveralls.io/github/TuyaAPI/cloud?branch=master) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)
==============

A NodeJS wrapper for Tuya's [API](https://docs.tuya.com/en/cloudapi/appAPI/index.html).

At the moment, only the [mobile/app API](https://docs.tuya.com/en/cloudapi/appAPI/index.html) is supported as it covers the vast majority of use cases.

## Installation
`npm i @tuyapi/cloud`

## Usage
```javascript
const Cloud = require('@tuyapi/cloud');

let api = new Cloud({key: 'your-api-app-key', secret: 'your-api-app-secret'});

api.register({email: 'example@example.com', password: 'example-password'}).then(async sid => {
  let token = await api.request({action: 'tuya.m.device.token.create', data: {'timeZone': '-05:00'}});

  console.log(token) // => { secret: '0000', token: '01010101' }
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
}
```
3. Create a file called `dev.js` as a playground. Since `dev.js` is in `.gitignore`, it won't be committed.
4. To run tests, run `npm test`.
5. To output coverage, run `npm run cover` (it will exit with an error).
6. To build documentation, run `npm run document`.

[![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com)
