export interface BookingFormState {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
}

export type BookingFormErrors = Partial<Record<keyof BookingFormState, string>>;

export const validateBookingFormState = (
  state: BookingFormState,
): BookingFormErrors => {
  const errors: BookingFormErrors = {};

  if (!state.title.trim()) {
    errors.title = "Title is required.";
  }

  const startsAt = new Date(state.startsAt);
  const endsAt = new Date(state.endsAt);

  if (!state.startsAt || Number.isNaN(startsAt.getTime())) {
    errors.startsAt = "Start time is required.";
  }

  if (!state.endsAt || Number.isNaN(endsAt.getTime())) {
    errors.endsAt = "End time is required.";
  } else if (!errors.startsAt && endsAt <= startsAt) {
    errors.endsAt = "End time must be after start time.";
  }

  return errors;
};

export const hasBookingFormErrors = (errors: BookingFormErrors) =>
  Object.keys(errors).length > 0;
