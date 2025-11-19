-- Add rejection_reason to bookings
alter table bookings
  add column rejection_reason text;

-- Update policies to ensure rejection_reason is viewable
-- (Existing policies usually cover SELECT * but good to be aware)

