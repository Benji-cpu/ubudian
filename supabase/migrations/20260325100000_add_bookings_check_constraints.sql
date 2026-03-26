-- Add CHECK constraints for defense in depth on bookings table
DO $$ BEGIN
  ALTER TABLE bookings ADD CONSTRAINT bookings_num_guests_positive CHECK (num_guests > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE bookings ADD CONSTRAINT bookings_total_amount_positive CHECK (total_amount > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
