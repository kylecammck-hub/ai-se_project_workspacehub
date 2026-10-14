import { describe, expect, it } from "vitest";
import {
  validateBookingFormState,
  type BookingFormState,
} from "./bookingValidation";

const validState: BookingFormState = {
  title: "Team sync",
  description: "",
  startsAt: "2026-10-20T10:00",
  endsAt: "2026-10-20T11:00",
};

describe("validateBookingFormState", () => {
  it("returns no errors for a valid booking", () => {
    expect(validateBookingFormState(validState)).toEqual({});
  });

  it("requires a non-blank title", () => {
    const errors = validateBookingFormState({ ...validState, title: "   " });

    expect(errors.title).toBe("Title is required.");
  });

  it("requires start and end times", () => {
    const errors = validateBookingFormState({
      ...validState,
      startsAt: "",
      endsAt: "",
    });

    expect(errors.startsAt).toBe("Start time is required.");
    expect(errors.endsAt).toBe("End time is required.");
  });

  it("requires the end time to be after the start time", () => {
    const errors = validateBookingFormState({
      ...validState,
      endsAt: "2026-10-20T09:00",
    });

    expect(errors).toEqual({ endsAt: "End time must be after start time." });
  });

  it("rejects an end time equal to the start time", () => {
    const errors = validateBookingFormState({
      ...validState,
      endsAt: validState.startsAt,
    });

    expect(errors.endsAt).toBe("End time must be after start time.");
  });
});
