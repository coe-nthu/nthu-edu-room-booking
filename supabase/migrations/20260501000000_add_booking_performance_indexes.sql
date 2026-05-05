-- Speed up room timetable reads and overlap checks for active bookings.
CREATE INDEX IF NOT EXISTS idx_bookings_room_active_end_time
  ON bookings(room_id, end_time)
  WHERE status IN ('pending', 'approved');

CREATE INDEX IF NOT EXISTS idx_bookings_room_active_time_range
  ON bookings(room_id, start_time, end_time)
  WHERE status IN ('pending', 'approved');

