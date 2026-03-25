-- Add CHECK constraints for defense in depth on bookings table
ALTER TABLE bookings
  ADD CONSTRAINT bookings_num_guests_positive CHECK (num_guests > 0),
  ADD CONSTRAINT bookings_total_amount_positive CHECK (total_amount > 0);
