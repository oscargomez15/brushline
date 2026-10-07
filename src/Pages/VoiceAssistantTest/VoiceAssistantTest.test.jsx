import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import VoiceAssistantTest from "./VoiceAssistantTest";
jest.mock("netlify-identity-widget", () => ({ currentUser: jest.fn(() => null) }));
test("a new public conversation never claims a request or booking was sent", () => {
  render(<VoiceAssistantTest publicMode />);
  expect(screen.getByText("No request sent yet")).toBeInTheDocument();
  expect(screen.queryByText("Request sent successfully")).not.toBeInTheDocument();
  expect(screen.queryByText("Your estimate is booked")).not.toBeInTheDocument();
});
