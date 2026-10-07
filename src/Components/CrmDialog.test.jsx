import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import CrmDialogHost, { confirmAction, showNotice } from "./CrmDialog";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
test("destructive confirmations default to Cancel and Escape cancels without approving", async () => {
  render(<CrmDialogHost />);
  let response;
  act(() => { response = confirmAction("Remove this invoice?", { title: "Delete invoice?", confirmLabel: "Delete invoice" }); });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }));
  fireEvent.keyDown(document, { key: "Escape" });
  act(() => jest.runAllTimers());
  expect(await response).toBe(false);
  expect(screen.queryByRole("dialog")).toBeNull();
});
test("queued dialogs keep repeated messages usable and resolve each action only once", async () => {
  render(<CrmDialogHost />);
  let first, second;
  act(() => { first = showNotice("Saved", { title: "Saved", tone: "success" }); second = showNotice("Saved", { title: "Saved", tone: "success" }); });
  fireEvent.click(screen.getByRole("button", { name: "Done" })); act(() => jest.runAllTimers());
  expect(await first).toBe(true);
  expect(screen.getByRole("button", { name: "Done" }).disabled).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Done" })); act(() => jest.runAllTimers());
  expect(await second).toBe(true); expect(screen.queryByRole("dialog")).toBeNull();
});
test("confirmation traps focus and restores scroll when completed", async () => {
  document.body.style.overflow = "auto";
  render(<CrmDialogHost />);
  let answer; act(() => { answer = confirmAction("Discard?", { confirmLabel: "Discard" }); });
  const cancel = screen.getByRole("button", { name: "Cancel" });
  fireEvent.keyDown(cancel, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Discard" }));
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.click(screen.getByRole("button", { name: "Discard" })); act(() => jest.runAllTimers());
  expect(await answer).toBe(true); expect(document.body.style.overflow).toBe("auto");
});
