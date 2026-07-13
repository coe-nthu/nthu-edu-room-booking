-- Add room-level booking statistics for admin analytics.
create index if not exists idx_bookings_room_status_start_time
on bookings (room_id, status, start_time);

create or replace view public.room_booking_statistics
with (security_invoker = true)
as
with approved_bookings as (
  select
    id,
    room_id,
    start_time
  from bookings
  where status = 'approved'
),
room_totals as (
  select
    room_id,
    count(*)::integer as total_booking_count,
    count(*) filter (where start_time >= now() - interval '30 days')::integer as bookings_last_30_days,
    count(*) filter (where start_time >= now() - interval '90 days')::integer as bookings_last_90_days,
    min(start_time) as first_booked_at,
    max(start_time) as last_booked_at
  from approved_bookings
  group by room_id
),
weekday_counts as (
  select
    room_id,
    extract(dow from start_time)::integer as weekday,
    count(*)::integer as booking_count,
    row_number() over (
      partition by room_id
      order by count(*) desc, extract(dow from start_time)::integer
    ) as weekday_rank
  from approved_bookings
  group by room_id, extract(dow from start_time)::integer
)
select
  rooms.id as room_id,
  rooms.name as room_name,
  rooms.room_code,
  rooms.floor,
  rooms.room_type,
  rooms.is_active,
  coalesce(room_totals.total_booking_count, 0) as total_booking_count,
  coalesce(room_totals.bookings_last_30_days, 0) as bookings_last_30_days,
  coalesce(room_totals.bookings_last_90_days, 0) as bookings_last_90_days,
  case
    when room_totals.total_booking_count is null then 0::numeric
    else round(
      room_totals.total_booking_count::numeric /
      greatest(
        1,
        ceil(
          greatest(
            1,
            (room_totals.last_booked_at::date - room_totals.first_booked_at::date)
          )::numeric / 30
        )::integer
      ),
      2
    )
  end as average_bookings_per_month,
  room_totals.first_booked_at,
  room_totals.last_booked_at,
  case weekday_counts.weekday
    when 0 then '週日'
    when 1 then '週一'
    when 2 then '週二'
    when 3 then '週三'
    when 4 then '週四'
    when 5 then '週五'
    when 6 then '週六'
    else null
  end as most_booked_weekday,
  coalesce(weekday_counts.booking_count, 0) as most_booked_weekday_count
from rooms
left join room_totals on room_totals.room_id = rooms.id
left join weekday_counts
  on weekday_counts.room_id = rooms.id
  and weekday_counts.weekday_rank = 1;

grant select on public.room_booking_statistics to authenticated;
