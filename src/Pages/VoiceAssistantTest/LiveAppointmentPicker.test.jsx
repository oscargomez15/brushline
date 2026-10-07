import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LiveAppointmentPicker from "./LiveAppointmentPicker";
afterEach(() => { jest.restoreAllMocks(); });
test("shows only live slots and passes selected ISO time to the assistant", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ slots: [{ start: "2026-10-07T13:00:00.000Z", end: "2026-10-07T13:45:00.000Z", date: "2026-10-07" }] }) });
  const select = jest.fn(); render(<LiveAppointmentPicker bookingToken="test" onSelect={select} onCancel={() => {}} />);
  fireEvent.click(await screen.findByRole("button", { name: "9:00 AM" }));
  fireEvent.click(screen.getByRole("button", { name: "Choose this time" }));
  expect(select).toHaveBeenCalledWith(expect.objectContaining({ start: "2026-10-07T13:00:00.000Z" }));
});
test("calendar errors offer a request fallback without showing invented slots", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Calendar is unavailable" }) });
  const cancel = jest.fn(); render(<LiveAppointmentPicker bookingToken="test" onSelect={() => {}} onCancel={cancel} />);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Calendar is unavailable"));
  expect(screen.queryByRole("button", { name: "Choose this time" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue without booking" })); expect(cancel).toHaveBeenCalled();
});
