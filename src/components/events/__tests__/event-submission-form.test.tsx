import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventSubmissionForm } from "../event-submission-form";

// Mock the date/time pickers since they rely on complex UI primitives
vi.mock("@/components/admin/date-picker", () => ({
  DatePicker: ({ onChange }: { value?: Date; onChange: (d: Date) => void; placeholder?: string }) => (
    <input
      type="date"
      aria-label="date-picker"
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  ),
}));

vi.mock("@/components/admin/time-picker", () => ({
  TimePicker: ({ value, onChange }: { value?: string; onChange: (v: string) => void }) => (
    <input
      type="time"
      aria-label="time-picker"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe("EventSubmissionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders the form with submit button", () => {
    render(<EventSubmissionForm />);
    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find((b) => b.textContent?.includes("Submit Event"));
    expect(submitButton).toBeDefined();
  });

  it("renders key input fields by name attribute", () => {
    const { container } = render(<EventSubmissionForm />);
    expect(container.querySelector('input[name="title"]')).toBeInTheDocument();
    expect(container.querySelector('textarea[name="description"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="submitted_by_email"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="organizer_name"]')).toBeInTheDocument();
  });

  it("renders the recurring event checkbox", () => {
    render(<EventSubmissionForm />);
    // Radix Checkbox renders as role="checkbox"
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    render(<EventSubmissionForm />);

    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find((b) => b.textContent?.includes("Submit Event"))!;
    await user.click(submitButton);

    expect(await screen.findByText(/event title is required/i)).toBeInTheDocument();
  });
});
