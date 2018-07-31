import test from 'ava';

const apiKeys = require('./keys.json');
const Cloud = require('.');

const api = new Cloud({key: apiKeys.key, secret: apiKeys.secret});

test('register a new user', async t => {
  const apiResult = await api.register({email: 'hi@example.com',
                                        password: 'example-password'});
  t.is(apiResult.length, 56);
});

test('login a user', async t => {
  const apiResult = await api.login({email: 'hi@example.com',
                                     password: 'example-password'});
  t.is(apiResult.length, 56);
});

test('create a token', async t => {
  await api.register({email: 'hi@example.com',
                      password: 'example-password'});

  const token = await api.request({action: 'tuya.m.device.token.create',
                                   data: {timeZone: '+08:00'}});

  if (token.secret && token.token) {
    t.pass();
  }
});

test.todo('wait for token');
