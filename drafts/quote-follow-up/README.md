# Quote follow-up draft

Open `preview.html` to review the three emails. These use the current layout from `netlify/functions/create-quote.js`, with sample customer details. Regenerate with `node drafts/quote-follow-up/generate-preview.cjs`.

This directory is a local design draft. It is not connected to the app, Netlify functions, Resend, or a scheduler. No messages have been sent.

## Proposed workflow for implementation

- Start from a confirmed successful quote email delivery request, not the quote creation date. Record its send time and recipient.
- Show awaiting-response quotes with customer, project, amount, last contact, next follow-up, and contact history.
- Make follow-ups due 3, 7, and 14 days after the initial send. Require review and a manual Send action for the first version.
- Allow Mark replied, Snooze until a chosen date, and Stop follow-ups. A reply should pause the sequence, even when the quote remains awaiting approval.
- Stop for approved, accepted, declined, cancelled, expired, or deleted quotes. Exclude change orders and drafts.
- A view alone does not count as a reply. Existing approval status alone cannot establish that there has been no response.
- Skip missed earlier reminders rather than sending several together; after any contact, defer the next reminder to avoid back-to-back messages.
- Record each successful follow-up and prevent duplicate sends. Failed delivery must not advance the sequence.
- Stop after the final follow-up; do not mark the quote declined merely for lack of response.

Before activation, implement persistent send history and reply/pause controls, confirm the reply mailbox, and verify these stop conditions. Existing quotes need a confirmed last-contact date before enrollment. Customer names, amounts, addresses, and private quote links must come from each actual quote when preparing a message.
