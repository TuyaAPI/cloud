import test from 'ava';

const Cloud = require('./main.js');
const apiKeys = require('./keys.json');

const api = new Cloud({key: apiKeys.key, secret: apiKeys.secret});

test('register a new user', async t => {
  const apiResult = await api.register({email: 'example@example.com',
                                        password: 'example-password'});
  t.is(apiResult.length, 56);
});

test('login a user', async t => {
  const apiResult = await api.login({email: 'example@example.com',
                                     password: 'example-password'});
  t.is(apiResult.length, 56);
});

test.todo('wait for token');
