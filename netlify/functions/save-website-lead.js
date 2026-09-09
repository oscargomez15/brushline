const { Resend } = require("resend");
const { safeStr, getLeadsStore } = require("./_leads");

const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });
const escapeHtml = (value) => safeStr(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  try {
    const input = JSON.parse(event.body || "{}");
    if (safeStr(input.company)) return json(200, { ok: true });

    const required = ["fullName", "phone", "email", "address", "service"];
    if (required.some((key) => !safeStr(input[key]))) return json(400, { error: "The lead is missing required contact details." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeStr(input.email, 254))) return json(400, { error: "The lead email is invalid." });

    const now = new Date().toISOString();
    const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const lead = {
      id,
      createdAt: now,
      updatedAt: now,
      status: "new",
      source: "AI website assistant",
      fullName: safeStr(input.fullName, 140),
      phone: safeStr(input.phone, 60),
      email: safeStr(input.email, 254),
      address: safeStr(input.address, 400),
      service: safeStr(input.service, 300),
      servicesMentioned: Array.isArray(input.servicesMentioned) ? input.servicesMentioned.map((v) => safeStr(v, 100)).filter(Boolean).slice(0, 12) : [],
      projectDetails: safeStr(input.projectDetails, 3000),
      propertyType: safeStr(input.propertyType, 100),
      preferredContact: safeStr(input.preferredContact, 100),
      preferredAppointment: safeStr(input.preferredAppointment, 200),
      serviceAreaStatus: ["eligible", "out_of_area", "unknown"].includes(input.serviceAreaStatus) ? input.serviceAreaStatus : "unknown",
      excludedArea: safeStr(input.excludedArea, 120),
      requestedHuman: Boolean(input.requestedHuman),
      transcript: Array.isArray(input.transcript) ? input.transcript.slice(-80).map((line) => ({ role: line?.role === "assistant" ? "assistant" : "caller", text: safeStr(line?.text, 1000) })).filter((line) => line.text) : [],
    };

    const store = getLeadsStore();
    await store.setJSON(id, lead);

    let emailSent = false;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_NOTIFY_FROM || process.env.APPROVAL_NOTIFY_FROM || process.env.QUOTE_NOTIFY_FROM;
    const to = process.env.CONTACT_NOTIFY_TO || process.env.APPROVAL_NOTIFY_TO;
    if (apiKey && from && to) {
      const rows = [
        ["Customer", lead.fullName], ["Phone", lead.phone], ["Email", lead.email], ["Address", lead.address],
        ["Service", lead.service], ["Appointment request", lead.preferredAppointment || "Not selected"],
        ["Service area", lead.serviceAreaStatus === "out_of_area" ? `Outside area (${lead.excludedArea || "matched excluded area"})` : lead.serviceAreaStatus],
        ["Live human requested", lead.requestedHuman ? "Yes" : "No"],
      ];
      const htmlRows = rows.map(([label, value]) => `<tr><td style="padding:7px;color:#64748b">${escapeHtml(label)}</td><td style="padding:7px;font-weight:600">${escapeHtml(value)}</td></tr>`).join("");
      const { error } = await new Resend(apiKey).emails.send({
        from, to, replyTo: lead.email,
        subject: `New website lead: ${lead.fullName} — ${lead.service}`,
        text: rows.map(([label, value]) => `${label}: ${value}`).concat(["", "Project details:", lead.projectDetails || "Not provided."]).join("\n"),
        html: `<div style="font-family:Arial,sans-serif;background:#f1f5f9;padding:28px"><div style="max-width:680px;margin:auto;background:white;border-radius:16px;overflow:hidden"><div style="background:#101d2d;color:white;padding:24px"><small style="color:#e4b768">BRUSHLINE SERVICES</small><h1 style="margin:6px 0 0;font-size:24px">New website lead</h1></div><div style="padding:22px"><table style="width:100%;border-collapse:collapse">${htmlRows}</table><div style="margin-top:18px;background:#f8fafc;padding:16px;border-radius:10px"><strong>Project details</strong><div style="margin-top:8px;white-space:pre-wrap">${escapeHtml(lead.projectDetails || "Not provided.")}</div></div></div></div></div>`,
      });
      emailSent = !error;
      if (error) console.error("Lead saved, but notification email failed:", error);
    } else {
      console.error("Lead saved, but lead email environment variables are missing.");
    }

    return json(200, { ok: true, id, emailSent });
  } catch (error) {
    console.error("save-website-lead failed:", error);
    return json(500, { error: "The lead could not be saved." });
  }
};
