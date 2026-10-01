import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SendConfirmationModal from "./SendConfirmationModal";

test("confirmation names the recipient, focuses Done, and supports Escape", () => {
  const close = jest.fn();
  render(<SendConfirmationModal title="Invoice sent" message="Invoice sent to client@example.com." onClose={close} />);
  expect(screen.getByRole("dialog", { name: "Invoice sent" })).toBeTruthy();
  expect(screen.getByText("Invoice sent to client@example.com.")).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Done" }));
  fireEvent.keyDown(document.activeElement, { key: "Escape" });
  expect(close).toHaveBeenCalledTimes(1);
});

test("dismissal restores focus and scrolling", () => {
  const trigger = document.createElement("button");
  document.body.appendChild(trigger);
  trigger.focus();
  const close = jest.fn();
  const { unmount } = render(<SendConfirmationModal message="Estimate sent." onClose={close} />);
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  expect(close).toHaveBeenCalledTimes(1);
  unmount();
  expect(document.activeElement).toBe(trigger);
  expect(document.body.style.overflow).toBe("");
  trigger.remove();
});
