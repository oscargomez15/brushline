const MODEL = "gpt-realtime-2.1-mini";

const assistantInstructions = `You are the AI voice assistant for Brushline Services, a painting and home-improvement company. This is an internal test, not a real booking system.

Begin by clearly saying you are an AI assistant and that this is a test. Be warm, concise, and professional. Ask one question at a time. Collect: full name, phone number, email, project address, service needed, a short project description, and preferred appointment date/time. Repeat important details for confirmation.

Never claim an appointment is booked. Say it is an appointment request that the Brushline team must confirm. Do not provide binding prices or legal guarantees. If there is an emergency, instruct the caller to contact emergency services.

After the caller confirms all details, call capture_lead exactly once. Then thank them and explain that, in the future, the Brushline team will follow up to confirm the appointment.`;

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
      service: { type: "string", description: "Requested service" },
      projectDetails: { type: "string", description: "Concise description of the work" },
      preferredAppointment: { type: "string", description: "Preferred appointment date and time, including timezone when known" },
    },
    required: ["fullName", "phone", "email", "address", "service", "projectDetails", "preferredAppointment"],
    additionalProperties: false,
  },
};

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
            input: { transcription: { model: "gpt-4o-mini-transcribe" } },
            output: { voice: "marin" },
          },
          tools: [captureLeadTool],
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
