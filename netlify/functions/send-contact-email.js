const { Resend } = require("resend");

const safeStr = (value, max = 2000) =>
  (value || "").toString().trim().slice(0, max);

const escapeHtml = (value) =>
  safeStr(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const body = JSON.parse(event.body || "{}");
    if (safeStr(body.company)) return json(200, { ok: true });

    const name = safeStr(body.name, 120);
    const email = safeStr(body.email, 254);
    const phone = safeStr(body.phone, 50);
    const address = safeStr(body.address, 300);
    const service = safeStr(body.service, 100);
    const message = safeStr(body.message, 3000);

    if (!name || !email || !phone || !service) {
      return json(400, { error: "Please complete all required fields." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(400, { error: "Please enter a valid email address." });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from =
      process.env.CONTACT_NOTIFY_FROM ||
      process.env.APPROVAL_NOTIFY_FROM ||
      process.env.QUOTE_NOTIFY_FROM;
    const to = process.env.CONTACT_NOTIFY_TO || process.env.APPROVAL_NOTIFY_TO;

    if (!apiKey || !from || !to) {
      console.error("Contact email environment variables are missing.", {
        hasApiKey: !!apiKey,
        hasFrom: !!from,
        hasTo: !!to,
      });
      return json(500, { error: "Contact delivery is not configured." });
    }

    const submittedAt = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const text = [
      "New website estimate request",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Service: ${service}`,
      address ? `Address: ${address}` : null,
      "",
      "Project details:",
      message || "No message provided.",
      "",
      `Submitted: ${submittedAt} ET`,
    ].filter(Boolean).join("\n");

    const html = `
      <div style="background:#f1f5f9;padding:28px;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:640px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:#0f172a;color:#fff;padding:22px 26px;">
            <div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#93c5fd;font-weight:700;">Brushline Services</div>
            <h1 style="font-size:23px;margin:7px 0 0;">New website estimate request</h1>
          </div>
          <div style="padding:24px 26px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:8px 0;color:#64748b;width:120px;">Customer</td><td style="padding:8px 0;font-weight:700;">${escapeHtml(name)}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;">${escapeHtml(phone)}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Service</td><td style="padding:8px 0;">${escapeHtml(service)}</td></tr>
              ${address ? `<tr><td style="padding:8px 0;color:#64748b;">Address</td><td style="padding:8px 0;">${escapeHtml(address)}</td></tr>` : ""}
            </table>
            <div style="margin-top:20px;padding:16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:700;margin-bottom:8px;">Project details</div>
              <div style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(message || "No message provided.")}</div>
            </div>
            <div style="margin-top:18px;color:#94a3b8;font-size:12px;">Submitted ${escapeHtml(submittedAt)} ET</div>
          </div>
        </div>
      </div>`;

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `New ${service} request from ${name}`,
      text,
      html,
    });

    if (error) {
      console.error("Resend contact email failed:", error);
      return json(502, { error: "We could not deliver your request. Please try again." });
    }

    return json(200, { ok: true, id: data?.id || null });
  } catch (error) {
    console.error("send-contact-email failed:", error);
    return json(500, { error: "We could not send your request. Please try again." });
  }
};
