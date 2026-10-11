const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
test('CRM booking restricts token creation and booking to the owner and preserves booking validation', async () => {
  let calls = 0;
  const calendar = { owner: context => Boolean(context?.owner), json: (statusCode, body) => ({ statusCode, body }), issueBookingToken: () => 'signed-session' };
  const booking = { handler: async event => { calls++; assert.equal(event.body, 'unchanged'); return { statusCode: 409 }; } };
  const sandbox = { exports: {}, require: name => name === './_google-calendar' ? calendar : booking };
  vm.runInNewContext(fs.readFileSync('netlify/functions/crm-book-appointment.js', 'utf8'), sandbox);
  const handler = sandbox.exports.handler;
  for (const httpMethod of ['GET', 'POST']) assert.equal((await handler({ httpMethod }, {})).statusCode, 403);
  assert.equal(calls, 0);
  assert.equal((await handler({ httpMethod: 'GET' }, { owner: true })).body.bookingToken, 'signed-session');
  assert.equal((await handler({ httpMethod: 'POST', body: 'unchanged' }, { owner: true })).statusCode, 409);
  assert.equal(calls, 1);
  assert.equal((await handler({ httpMethod: 'DELETE' }, { owner: true })).statusCode, 405);
});
