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

test.todo('wait for token');
