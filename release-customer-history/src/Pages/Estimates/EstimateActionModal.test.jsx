import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EstimateActionModal from "./EstimateActionModal";
import netlifyIdentity from "netlify-identity-widget";

jest.mock("netlify-identity-widget", () => ({ currentUser: jest.fn() }));
const quotes = [{ id: "one", quoteNumber: "Q-1", clientName: "First" }, { id: "two", quoteNumber: "Q-2", clientName: "Second" }];
const response = (ok, data) => ({ ok, json: async () => data });
beforeEach(() => {
  netlifyIdentity.currentUser.mockReturnValue({ jwt: async () => "token" });
  global.fetch = jest.fn();
});
afterEach(() => jest.restoreAllMocks());

test("forwards all selected estimates to the entered email", async () => {
  fetch.mockResolvedValue(response(true, { sentTo: "recipient@example.com" }));
  const complete = jest.fn();
  render(<EstimateActionModal action={{ type: "forward", quotes }} onClose={jest.fn()} onComplete={complete} />);
  fireEvent.change(screen.getByLabelText("Recipient email"), { target: { value: "recipient@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Forward estimates" }));
  await waitFor(() => expect(complete).toHaveBeenCalledWith({ sentTo: "recipient@example.com", forwardedIds: ["one", "two"] }), { timeout: 3000 });
  expect(fetch.mock.calls.map((call) => JSON.parse(call[1].body))).toEqual([
    { quoteId: "one", forwardTo: "recipient@example.com" }, { quoteId: "two", forwardTo: "recipient@example.com" },
  ]);
});

test("partial failure retries only the failed estimate", async () => {
  fetch.mockResolvedValueOnce(response(true, {})).mockResolvedValueOnce(response(false, { error: "Email rejected" })).mockResolvedValueOnce(response(true, {}));
  const complete = jest.fn();
  render(<EstimateActionModal action={{ type: "forward", quotes }} onClose={jest.fn()} onComplete={complete} />);
  fireEvent.change(screen.getByLabelText("Recipient email"), { target: { value: "recipient@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Forward estimates" }));
  const retry = await screen.findByRole("button", { name: "Retry failed estimates" }, { timeout: 3000 });
  expect(complete).not.toHaveBeenCalled();
  fireEvent.click(retry);
  await waitFor(() => expect(complete).toHaveBeenCalled());
  expect(fetch.mock.calls.map((call) => JSON.parse(call[1].body).quoteId)).toEqual(["one", "two", "two"]);
});

test("closing after partial delivery reports the estimates already sent", async () => {
  fetch.mockResolvedValueOnce(response(true, {})).mockRejectedValueOnce(new Error("Network failure"));
  const complete = jest.fn();
  render(<EstimateActionModal action={{ type: "forward", quotes }} onClose={jest.fn()} onComplete={complete} />);
  fireEvent.change(screen.getByLabelText("Recipient email"), { target: { value: "recipient@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Forward estimates" }));
  await screen.findByRole("button", { name: "Retry failed estimates" }, { timeout: 3000 });
  fireEvent.click(screen.getAllByRole("button", { name: "Close", exact: true }).slice(-1)[0]);
  expect(complete).toHaveBeenCalledWith({ sentTo: "recipient@example.com", forwardedIds: ["one"] });
});

