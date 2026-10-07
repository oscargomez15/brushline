// Local draft generator only. No email transport, scheduler, or production imports.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../netlify/functions/create-quote.js'), 'utf8');
const start = source.indexOf('function buildQuoteEmailHtml(');
const end = source.indexOf('\nasync function sendQuoteEmail', start);
if (start < 0 || end < 0) throw new Error('Existing quote template could not be found');
const render = vm.runInNewContext(`(${source.slice(start, end).trim()})`);
const stages = [
  {
    day: 3,
    subject: 'Any questions about your quote? – Brushline Services',
    heading: 'Hi Sarah, just checking in',
    message: 'Have you had a chance to review your quote? If you have any questions about the work included or the timing, just reply to this email. We’re happy to help.',
  },
  {
    day: 7,
    subject: 'Still thinking about your project? – Brushline Services',
    heading: 'Hi Sarah, how is your project planning going?',
    message: 'We wanted to follow up on your quote and see if you’re still considering the project. If you’d like to talk through the details or discuss your preferred timing, reply here and we can take it from there.',
  },
  {
    day: 14,
    subject: 'Should we keep your quote open? – Brushline Services',
    heading: 'Hi Sarah, one last check-in',
    message: 'Would you like to move forward with your project, or would you prefer to put it on hold? Either way, just reply and let us know. We’ll pause our follow-ups for now, and you’re welcome to reach out whenever you’re ready.',
  },
];
for (const stage of stages) {
  const html = render({companyName: 'Brushline Services', customerName: 'Sarah', address: '123 Sample Street · Example project', total: 4800, deposit: 1920, quoteUrl: '#sample-quote'})
    .replace('Quote Ready', 'Quote Follow-Up')
    .replace('Hi Sarah, your quote is ready', stage.heading)
    .replace('Thanks for the opportunity — you can review the details of your proposal using the button below.', stage.message);
  fs.writeFileSync(path.join(__dirname, `day-${stage.day}.html`), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Day ${stage.day} follow-up draft</title></head><body style="margin:0">${html}</body></html>`);
  fs.writeFileSync(path.join(__dirname, `day-${stage.day}.txt`), `Subject: ${stage.subject}\n\n${stage.heading}\n\n${stage.message}\n\nProject: 123 Sample Street (example)\nTotal: $4,800.00\nDeposit (40%): $1,920.00\n\nView Detailed Quote: [customer’s existing quote link]\n\nQuestions? Reply to this email and we’ll help you out.\nBrushline Services\n`);
}
fs.writeFileSync(path.join(__dirname, 'preview.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Brushline follow-up drafts</title>
<style>body{margin:0;background:#edf0f6;font:15px Arial,sans-serif;color:#0f172a}main{max-width:780px;margin:32px auto;padding:0 16px}h1{font-size:28px}p{line-height:1.6}.badge{display:inline-block;background:#fef3c7;padding:8px 12px;border-radius:8px;font-weight:bold}section{margin:32px 0}h2{font-size:20px}iframe{width:100%;height:830px;border:1px solid #cbd5e1;border-radius:16px;background:white}a{color:#1d4ed8}</style></head>
<body><main><span class="badge">DRAFT · Sending inactive</span><h1>Quote follow-ups</h1><p>Three gentle reminders using the existing Brushline quote email layout. All customer details below are examples. The quote buttons are placeholders.</p>
${stages.map(s => `<section><h2>Day ${s.day} after the quote is sent</h2><p><strong>Subject:</strong> ${s.subject}</p><iframe title="Day ${s.day} email preview" src="day-${s.day}.html"></iframe><p><a href="day-${s.day}.txt">Plain-text version</a></p></section>`).join('')}
</main></body></html>`);
console.log('Generated three HTML drafts, plain-text alternatives, and preview.html. Nothing sent.');
