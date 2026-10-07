import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UpcomingAppointments from "./UpcomingAppointments";
jest.mock("netlify-identity-widget", () => ({ currentUser: () => ({ jwt: async () => "token" }) }));
test("upcoming jobs and estimates are shown and can be filtered by date", async () => {
  const start = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ connected: true, appointments: [{ id: "job", title: "Job — Painting", type: "job", allDay: true, start }, { id: "estimate", title: "Free estimate — Client", type: "estimate", allDay: true, start }] }) });
  render(<MemoryRouter><UpcomingAppointments /></MemoryRouter>);
  await screen.findByText("Job — Painting");
  expect(screen.getByText("Free estimate — Client")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: `${start}, 2 appointments` }));
  expect(screen.getByRole("button", { name: "Show all" })).toBeTruthy();
});
