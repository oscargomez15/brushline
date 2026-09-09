const MODEL = "gpt-realtime-2.1-mini";

const assistantInstructions = `You are Brushline Services' friendly AI voice assistant. This is currently a demo appointment-request experience.

Follow this order gradually. Ask exactly ONE question per turn, then stop speaking and wait for the answer. Never list several requested details in the same question and never ask the caller to provide all contact information at once. Greet the caller and ask only what service or services they need. After that answer, ask only for a short project description. Then ask only whether the property is residential or commercial. Explain that Brushline offers a free in-home estimate and ask permission to collect contact information. Once they agree, collect each field in its own turn in this order: full name, complete project address including city and ZIP, email, phone, then preferred contact method. Confirm spelling or numbers only when unclear. If more than one service is named, retain every service and classify the main service as "Multiple Services".

Check the city immediately. Brushline does NOT serve Labelle, Lehigh Acres, Immokalee, Ave Maria, Matlacha, Everglades City, or Miami. If the address is in one of these places, promptly explain that Brushline does not serve the area and cannot schedule the estimate, but may try to refer them to a trusted provider if one is available. Ask permission to save their information for a possible referral. Never guarantee a referral.

For an eligible address, explain that displayed times are demo availability and the team must confirm the request. Ask whether they want to choose on screen; if yes call show_appointment_picker. Otherwise ask for a general preferred day/time. Summarize every detail and obtain confirmation, then call capture_lead exactly once. Say the request was sent but is not a confirmed booking.

If the caller asks for or demands a live person at any point, immediately call request_live_human and tell them a call button is being shown. Do not continue unless they ask. Never provide binding prices or legal guarantees. For emergencies, direct them to emergency services. Do not collect financial, medical, or government identification information.`;

const captureLeadTool = {
  type: "function",
  name: "capture_lead",
  description: "Capture the confirmed lead details and appointment request in this internal test page.",
  parameters: {
    type: "object",
    properties: {
      fullName: { type: "string", description: "Customer's full name" },
      phone: { type: "string", description: "Customer's phone number" },
      email: { type: "string", description: "Customer's email address" },
      address: { type: "string", description: "Project street address, city, state, and ZIP" },
      service: { type: "string", description: "Requested service, or exactly Multiple Services if more than one was mentioned" },
      servicesMentioned: { type: "array", items: { type: "string" }, description: "Every service mentioned" },
      projectDetails: { type: "string", description: "Concise description of the work" },
      propertyType: { type: "string", description: "Residential, commercial, or unknown" },
      preferredContact: { type: "string", description: "Phone, email, text, or no preference" },
      preferredAppointment: { type: "string", description: "Preferred appointment date and time, including timezone when known" },
      serviceAreaStatus: { type: "string", enum: ["eligible", "out_of_area", "unknown"] },
      excludedArea: { type: "string", description: "Matched excluded city, otherwise empty" },
      requestedHuman: { type: "boolean" },
    },
    required: ["fullName", "phone", "email", "address", "service", "servicesMentioned", "projectDetails", "propertyType", "preferredContact", "preferredAppointment", "serviceAreaStatus", "excludedArea", "requestedHuman"],
    additionalProperties: false,
  },
};

const appointmentPickerTool = { type: "function", name: "show_appointment_picker", description: "Show the demo appointment calendar after contact details and an eligible address are collected.", parameters: { type: "object", properties: {}, additionalProperties: false } };
const liveHumanTool = { type: "function", name: "request_live_human", description: "Immediately show a call button when the caller wants a live person.", parameters: { type: "object", properties: { reason: { type: "string" } }, additionalProperties: false } };

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const requestHost = String(event.headers?.host || "").split(":")[0].toLowerCase();
  const isLocalDev =
    process.env.CONTEXT === "dev" ||
    process.env.NETLIFY_DEV === "true" ||
    ["localhost", "127.0.0.1", "::1"].includes(requestHost);
  if (!context?.clientContext?.user && !isLocalDev) {
    return json(401, { error: "Unauthorized" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(500, { error: "The voice assistant is not configured yet." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: MODEL,
          instructions: assistantInstructions,
          audio: {
            input: {
              transcription: { model: "gpt-4o-mini-transcribe" },
              noise_reduction: { type: "far_field" },
              turn_detection: {
                type: "server_vad",
                threshold: 0.75,
                prefix_padding_ms: 350,
                silence_duration_ms: 650,
                create_response: true,
                interrupt_response: true,
              },
            },
            output: { voice: "marin" },
          },
          tools: [captureLeadTool, appointmentPickerTool, liveHumanTool],
          tool_choice: "auto",
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Realtime client secret error", response.status, data?.error?.message);
      return json(502, { error: "Unable to start the voice assistant right now." });
    }

    const clientSecret = data?.value || data?.client_secret?.value || data?.client_secret;
    if (!clientSecret) {
      console.error("Realtime response did not include a client secret");
      return json(502, { error: "The voice service returned an unexpected response." });
    }

    return json(200, { clientSecret, model: MODEL });
  } catch (error) {
    console.error("Unable to create realtime session", error);
    return json(500, { error: "Unable to connect to the voice service." });
  }
};
