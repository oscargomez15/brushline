export function createCallCompletion({ sendEvent, endCall, onClosing, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let closing = false, responseId = null, timeout;
  function dispose() { clearTimer(timeout); closing = false; responseId = null; }
  function finish() { dispose(); endCall(); }
  return {
    begin(result) {
      if (closing) return;
      closing = true;
      onClosing();
      sendEvent({ type: "session.update", session: { audio: { input: { turn_detection: null } } } });
      sendEvent({ type: "response.create", response: {
        metadata: { purpose: "brushline_call_complete" },
        instructions: result.appointmentBooked
          ? `Your only task is to say a brief closing message: the free estimate is booked for ${result.preferredAppointment}, thank the client, and explicitly say this call will now end. Mention a confirmation email only if clientEmailSent is true (${Boolean(result.clientEmailSent)}). Do not ask a question, use a tool, or offer another service.`
          : "Your only task is to say a brief closing message: the request was saved and Brushline will follow up to confirm the estimate time. Thank the client and explicitly say this call will now end. Do not say an appointment is booked. Do not ask a question or call a tool.",
      } });
      // The visible closing notice remains available if the voice connection loses its final event.
      timeout = setTimer(finish, 45000);
    },
    handle(event) {
      if (!closing) return;
      if (event.type === "response.created" && event.response?.metadata?.purpose === "brushline_call_complete") responseId = event.response.id;
      if (event.type === "output_audio_buffer.stopped" && responseId && event.response_id === responseId) finish();
    },
    dispose,
  };
}
