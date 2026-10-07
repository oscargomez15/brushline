const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { dateKey, shiftDay, publicPath, summarize } = require('../netlify/functions/_metrics');

test('Eastern date boundaries and calendar arithmetic across DST', () => {
  assert.equal(dateKey('2026-10-03T02:00:00Z'), '2026-10-02');
  assert.equal(dateKey('2026-10-03T05:00:00Z'), '2026-10-03');
  assert.equal(shiftDay('2026-03-09', -1), '2026-03-08');
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28');
});
test('private routes and query strings cannot be collected', () => {
  assert.equal(publicPath('/'), true);
  assert.equal(publicPath('/service-area/naples'), true);
  for (const path of ['/crm/metrics', '/quote/123', '/invoice/123', '/login', '/?email=secret']) assert.equal(publicPath(path), false);
});
test('visitors deduplicate across days while sessions and actions remain distinct', () => {
  const event = { day: '2026-10-02', at: '2026-10-02T15:00:00Z', visitor: 'A', session: 'S1', path: '/', source: 'Direct', device: 'Mobile', type: 'pageview' };
  const rows = [event, { ...event, path: '/painting' }, { ...event, day: '2026-10-03', at: '2026-10-03T15:00:00Z', session: 'S2' }, { ...event, type: 'phone' }, { ...event, type: 'email' }, { ...event, visitor: 'B', type: 'phone' }];
  const result = summarize(rows, '2026-10-02', '2026-10-03');
  assert.equal(result.visitors, 1);
  assert.equal(result.visits, 2);
  assert.equal(result.pageviews, 3);
  assert.equal(result.contactVisitors, 1);
  assert.equal(result.contactRate, 100);
  assert.deepEqual(result.daily.map(day => day.visitors), [1, 1]);
});
function handler(name) {
  const records = new Map();
  const store = { setJSON: async (key, row) => records.set(key, row), get: async key => records.get(key), list: async function* ({prefix}) { yield { blobs: [...records.keys()].filter(key => key.startsWith(prefix)).map(key => ({key})) }; } };
  const box = { exports: {}, console, process: {env: {NETLIFY_SITE_ID: 'site', NETLIFY_AUTH_TOKEN: 'token'}}, require: (id) => id === '@netlify/blobs' ? {getStore: () => store} : id === './_metrics' ? require('../netlify/functions/_metrics') : require(id), URL };
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../netlify/functions', name), 'utf8'), box);
  return { run: box.exports.handler, records };
}
const payload = {path: '/', type: 'pageview', visitor: '12345678-12345678', session: '87654321-87654321', eventId: 'event123-event123', source: 'Direct', device: 'Mobile'};
const event = body => ({httpMethod: 'POST', headers: {origin: 'https://brushlineservices.com', 'user-agent': 'Firefox'}, body: JSON.stringify(body)});
test('collection validates origins and strips visitor identifiers before storage', async () => {
  const h = handler('track-site-event.js');
  assert.equal((await h.run(event(payload))).statusCode, 202);
  assert.equal((await h.run(event(payload))).statusCode, 202);
  assert.equal(h.records.size, 1);
  const row = [...h.records.values()][0];
  assert.notEqual(row.visitor, payload.visitor);
  assert.equal(row.source, 'Direct');
  assert.equal(row.device, 'Mobile');
  assert.equal((await h.run({...event(payload), headers: {origin: 'https://evil.example'}})).statusCode, 403);
  assert.equal((await h.run(event({...payload, path: '/quote/private'}))).statusCode, 400);
});
test('reporting requires authentication and validates reporting periods', async () => {
  const h = handler('get-site-metrics.js');
  assert.equal((await h.run({httpMethod:'GET'},{})).statusCode,401);
  assert.equal((await h.run({httpMethod:'GET',queryStringParameters:{days:'999'}},{clientContext:{user:{sub:'admin'}}})).statusCode,400);
  const response=await h.run({httpMethod:'GET',queryStringParameters:{days:'7'}},{clientContext:{user:{sub:'admin'}}});
  assert.equal(response.statusCode,200);
  assert.equal(JSON.parse(response.body).current.daily.length,7);
  assert.equal(JSON.parse(response.body).current.visitors,0);
});
