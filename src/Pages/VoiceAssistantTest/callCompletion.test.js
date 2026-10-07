import { createCallCompletion } from "./callCompletion";
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
test("announces hang-up and ends only when the closing response finishes playback", () => {
  const sendEvent = jest.fn(), endCall = jest.fn(), onClosing = jest.fn();
  const completion = createCallCompletion({ sendEvent, endCall, onClosing });
  completion.begin({ appointmentBooked: true, preferredAppointment: "October 9 at 9 AM Eastern", clientEmailSent: true });
  expect(onClosing).toHaveBeenCalledTimes(1);
  expect(sendEvent.mock.calls[1][0].response.instructions).toContain("this call will now end");
  completion.handle({ type: "output_audio_buffer.stopped", response_id: "old-response" });
  expect(endCall).not.toHaveBeenCalled();
  completion.handle({ type: "response.created", response: { id: "closing", metadata: { purpose: "brushline_call_complete" } } });
  completion.handle({ type: "response.done", response: { id: "closing" } });
  expect(endCall).not.toHaveBeenCalled();
  completion.handle({ type: "output_audio_buffer.stopped", response_id: "closing" });
  expect(endCall).toHaveBeenCalledTimes(1);
  jest.runAllTimers(); expect(endCall).toHaveBeenCalledTimes(1);
});
test("request-only closing does not claim a booking and cleans up its fallback timer", () => {
  const sendEvent = jest.fn(), endCall = jest.fn();
  const completion = createCallCompletion({ sendEvent, endCall, onClosing: () => {} });
  completion.begin({ appointmentBooked: false });
  expect(sendEvent.mock.calls[1][0].response.instructions).toContain("Do not say an appointment is booked");
  completion.dispose(); jest.runAllTimers(); expect(endCall).not.toHaveBeenCalled();
});
