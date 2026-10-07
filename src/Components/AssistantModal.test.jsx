import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Link } from "react-router-dom";
import AssistantModal from "./AssistantModal";
jest.mock("../Pages/VoiceAssistantTest/VoiceAssistantTest", () => () => <div>Assistant conversation</div>);
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
test("opens without navigating, closes on Escape and restores focus and scrolling", async () => {
  render(<MemoryRouter><Link to="/assistant">Talk to assistant</Link><AssistantModal/></MemoryRouter>);
  const link = screen.getByRole("link");
  fireEvent.click(link);
  await screen.findByText("Assistant conversation");
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: true, cancelable: true }));
  expect(screen.queryByText("Assistant conversation")).toBeNull();
  expect(document.body.style.overflow).toBe("");
  expect(document.activeElement).toBe(link);
});
