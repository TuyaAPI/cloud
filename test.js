import test from 'ava';

const {newAPI, oldAPI} = require('./keys.json');
const Cloud = require('.');

test('register a new user', async t => {
  const api = new Cloud({key: oldAPI.key, secret: oldAPI.secret});

  const apiResult = await api.register({email: 'hi@example.com',
                                        password: 'example-password'});
  t.is(apiResult.length, 56);
});

test('login a user', async t => {
  const api = new Cloud({key: oldAPI.key, secret: oldAPI.secret});

  const apiResult = await api.login({email: 'hi@example.com',
                                     password: 'example-password'});
  t.is(apiResult.length, 56);
});

test('create a token', async t => {
  const api = new Cloud({key: oldAPI.key, secret: oldAPI.secret});

  await api.register({email: 'hi@example.com',
                      password: 'example-password'});

  const token = await api.request({action: 'tuya.m.device.token.create',
                                   data: {timeZone: '+08:00'}});

  if (token.secret && token.token) {
    t.pass();
  }
});

test('New API: register a new user', async t => {
  const api = new Cloud({key: newAPI.key,
                         secret: newAPI.secret,
                         secret2: newAPI.secret2,
                         certSign: newAPI.certSign,
                         apiEtVersion: '0.0.1'});

  const apiResult = await api.register({email: 'hi@example.com',
                                        password: 'example-password'});
  t.is(apiResult.length, 56);
});

test('New API: login a user', async t => {
  const api = new Cloud({key: newAPI.key,
                         secret: newAPI.secret,
                         secret2: newAPI.secret2,
                         certSign: newAPI.certSign,
                         apiEtVersion: '0.0.1'});

  const apiResult = await api.login({email: 'hi@example.com',
                                     password: 'example-password'});
  t.is(apiResult.length, 56);
});

test('New API: loginEx a user', async t => {
  const api = new Cloud({key: newAPI.key,
                         secret: newAPI.secret,
                         secret2: newAPI.secret2,
                         certSign: newAPI.certSign,
                         apiEtVersion: '0.0.1'});

  const apiResult = await api.loginEx({email: 'hi@example.com',
                                       password: 'example-password'});
  t.is(apiResult.length, 56);
});

test.todo('wait for token');
