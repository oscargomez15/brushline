const { test } = require('node:test');
const assert = require('node:assert/strict');
const { quoteExpiration } = require('../src/utils/quoteExpiration');
const quote = { createdAt: '2026-03-01T18:00:00Z', validForDays: 30, status: 'awaiting_approval' };
test('valid through the expiration day in Eastern time, including DST', () => {
 const before = quoteExpiration(quote, Date.parse('2026-04-01T03:59:59Z'));
 assert.equal(before.date, '2026-03-31'); assert.equal(before.canApprove, true);
 const after = quoteExpiration(quote, Date.parse('2026-04-01T04:00:00Z'));
 assert.equal(after.expired, true); assert.equal(after.canApprove, false);
});
test('approved quotes stay approved; invalid dates cannot be approved', () => {
 assert.equal(quoteExpiration({...quote, status:'approved'},Date.parse('2027-01-01')).expired,false);
 assert.equal(quoteExpiration({status:'awaiting_approval'}).canApprove,false);
 assert.equal(quoteExpiration({...quote,createdAt:'invalid'}).canApprove,false);
});
test('default validity and zero-day validity are honored', () => {
 assert.equal(quoteExpiration({createdAt:quote.createdAt}).date,'2026-03-31');
 assert.equal(quoteExpiration({...quote,validForDays:0}).date,'2026-03-01');
});
