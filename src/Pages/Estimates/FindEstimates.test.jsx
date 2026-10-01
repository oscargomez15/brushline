import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FindEstimates from "./FindEstimates";

jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock("netlify-identity-widget", () => ({ currentUser: () => ({ jwt: async () => "token" }) }));
const items = [{ id: "one", quoteNumber: "Q-1", clientName: "Customer", jobType: "interior", status: "approved", grandTotal: 100 }];

test("selection starts hidden and can be enabled and dismissed", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ items }) });
  render(<FindEstimates />);
  await screen.findByRole("button", { name: "Select estimates" });
  expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Select estimates" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Select all visible estimates" }));
  expect(screen.getByText("1 selected")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Done selecting" }));
  expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Select estimates" }));
  expect(screen.getByText("0 selected")).toBeTruthy();
});

test("successful forwarding opens a confirmation showing the destination", async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ items }) }).mockResolvedValue({ ok: true, json: async () => ({ sentTo: "other@example.com" }) });
  render(<FindEstimates />);
  await screen.findByRole("button", { name: "Select estimates" });
  fireEvent.click(screen.getByRole("button", { name: "Select estimates" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Select all visible estimates" }));
  fireEvent.click(screen.getByRole("button", { name: "Forward selected" }));
  fireEvent.change(screen.getByLabelText("Recipient email"), { target: { value: "other@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Forward estimates" }));
  await waitFor(() => expect(screen.getByRole("dialog", { name: "Estimates sent" })).toBeTruthy());
  expect(screen.getByText("1 estimate(s) sent to other@example.com, each with a PDF and review link.")).toBeTruthy();
});
