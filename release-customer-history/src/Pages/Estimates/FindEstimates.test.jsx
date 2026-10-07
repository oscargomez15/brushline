import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FindEstimates from "./FindEstimates";

jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock("netlify-identity-widget", () => ({ currentUser: () => ({ jwt: async () => "token" }) }));
const items = [{ id: "one", quoteNumber: "Q-1", clientName: "Customer", jobType: "interior", status: "approved", grandTotal: 100 }];

test("selection boxes are always available and actions appear only after selecting", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ items }) });
  render(<FindEstimates />);
  await screen.findByRole("checkbox", { name: "Select all estimates shown" });
  expect(screen.queryByRole("region", { name: "Selected estimate actions" })).toBeNull();
  fireEvent.click(screen.getByRole("checkbox", { name: "Select estimate Q-1 for Customer" }));
  expect(screen.getByRole("region", { name: "Selected estimate actions" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Delete", exact: true })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Forward", exact: true })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
  expect(screen.queryByRole("region", { name: "Selected estimate actions" })).toBeNull();
  expect(screen.getByRole("checkbox", { name: "Select estimate Q-1 for Customer" })).toBeTruthy();
});

test("successful forwarding opens a confirmation showing the destination", async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ items }) }).mockResolvedValue({ ok: true, json: async () => ({ sentTo: "other@example.com" }) });
  render(<FindEstimates />);
  await screen.findByRole("checkbox", { name: "Select all estimates shown" });
  fireEvent.click(screen.getByRole("checkbox", { name: "Select all estimates shown" }));
  fireEvent.click(screen.getByRole("button", { name: "Forward", exact: true }));
  fireEvent.change(screen.getByLabelText("Recipient email"), { target: { value: "other@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Forward estimates" }));
  await waitFor(() => expect(screen.getByRole("dialog", { name: "Estimates sent" })).toBeTruthy());
  expect(screen.getByText("1 estimate(s) sent to other@example.com, each with a PDF and review link.")).toBeTruthy();
});

test("bulk delete requires confirmation and removes deleted estimates", async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ items }) }).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  render(<FindEstimates />);
  await screen.findByRole("checkbox", { name: "Select all estimates shown" });
  fireEvent.click(screen.getByRole("checkbox", { name: "Select all estimates shown" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete", exact: true }));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("dialog", { name: "Delete 1 estimate(s)?" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Delete estimates" }));
  await waitFor(() => expect(screen.getByText("1 estimate(s) deleted.")).toBeTruthy());
  expect(screen.queryByRole("checkbox", { name: "Select estimate Q-1 for Customer" })).toBeNull();
});
