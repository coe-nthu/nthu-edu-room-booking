alter table bookings
  add column recurrence_group_id uuid,
  add column recurrence_frequency text check (
    recurrence_frequency in ('daily', 'weekly')
  ),
  add column recurrence_until timestamp with time zone;

create index idx_bookings_recurrence_group
  on bookings(recurrence_group_id)
  where recurrence_group_id is not null;
