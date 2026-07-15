-- Add department-by-room booking statistics for admin analytics.
create or replace view public.room_booking_statistics_by_department
with (security_invoker = true)
as
with approved_bookings as (
  select
    b.room_id,
    b.start_time,
    p.department_id,
    coalesce(d.name, '未設定單位') as department_name
  from bookings b
  left join profiles p on p.id = b.user_id
  left join departments d on d.id = p.department_id
  where b.status = 'approved'
),
department_room_totals as (
  select
    room_id,
    department_id,
    department_name,
    count(*)::integer as total_booking_count,
    count(*) filter (
      where start_time >= now() - interval '30 days'
    )::integer as bookings_last_30_days,
    count(*) filter (
      where start_time >= now() - interval '90 days'
    )::integer as bookings_last_90_days,
    min(start_time) as first_booked_at,
    max(start_time) as last_booked_at
  from approved_bookings
  group by room_id, department_id, department_name
),
weekday_counts as (
  select
    room_id,
    department_id,
    department_name,
    extract(dow from start_time)::integer as weekday,
    count(*)::integer as booking_count,
    row_number() over (
      partition by room_id, department_id
      order by count(*) desc, extract(dow from start_time)::integer
    ) as weekday_rank
  from approved_bookings
  group by
    room_id,
    department_id,
    department_name,
    extract(dow from start_time)::integer
)
select
  rooms.id as room_id,
  rooms.name as room_name,
  rooms.room_code,
  rooms.floor,
  rooms.room_type,
  rooms.is_active,
  department_room_totals.department_id,
  department_room_totals.department_name,
  department_room_totals.total_booking_count,
  department_room_totals.bookings_last_30_days,
  department_room_totals.bookings_last_90_days,
  round(
    department_room_totals.total_booking_count::numeric /
    greatest(
      1,
      ceil(
        greatest(
          1,
          (
            department_room_totals.last_booked_at::date -
            department_room_totals.first_booked_at::date
          )
        )::numeric / 30
      )::integer
    ),
    2
  ) as average_bookings_per_month,
  department_room_totals.first_booked_at,
  department_room_totals.last_booked_at,
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
from department_room_totals
join rooms on rooms.id = department_room_totals.room_id
left join weekday_counts
  on weekday_counts.room_id = department_room_totals.room_id
  and weekday_counts.department_id is not distinct from department_room_totals.department_id
  and weekday_counts.weekday_rank = 1;

grant select on public.room_booking_statistics_by_department to authenticated;
