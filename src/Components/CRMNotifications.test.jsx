import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import CRMNotifications from "./CRMNotifications";
jest.mock("netlify-identity-widget", () => ({ currentUser: () => ({ jwt: async () => "test-token" }) }));
afterEach(() => jest.restoreAllMocks());
test("bell shows unread events, category filters and persists read status", async () => {
  const items = [{ id: "booking-id", type: "booking", title: "New estimate booked", detail: "Test Client · Friday at 9 AM", createdAt: "2026-10-07T12:00:00Z", href: "/crm/leads", read: false }, { id: "quote-id", type: "approval", title: "Quote approved", detail: "Test Client · Q-1", createdAt: "2026-10-07T11:00:00Z", href: "/crm/estimates/find", read: true }];
  global.fetch = jest.fn(async (url, options) => ({ ok: true, json: async () => options.method === "POST" ? { ok: true } : { items } }));
  render(<MemoryRouter><CRMNotifications /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "Notifications, 1 unread" }));
  expect(await screen.findByText("Quote approved")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Bookings", exact: true }));
  expect(screen.queryByText("Quote approved")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Notifications", exact: true })).toBeInTheDocument());
  const post = global.fetch.mock.calls.find(([, options]) => options.method === "POST");
  expect(JSON.parse(post[1].body).ids).toEqual(["booking-id"]);
});
test("a failed feed shows its error instead of an empty success state", async () => {
  global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({ error: "Notifications unavailable" }) }));
  render(<MemoryRouter><CRMNotifications /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "Notifications", exact: true }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Notifications unavailable");
  expect(screen.queryByText("No notifications yet.")).not.toBeInTheDocument();
});
