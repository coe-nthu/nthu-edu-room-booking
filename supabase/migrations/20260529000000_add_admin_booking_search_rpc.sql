create or replace function public.search_admin_bookings(
  p_status text default 'pending',
  p_search text default null,
  p_include_history boolean default false,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  user_id uuid,
  room_id uuid,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  status text,
  purpose text,
  created_at timestamp with time zone,
  recurrence_group_id uuid,
  recurrence_frequency text,
  recurrence_until timestamp with time zone,
  room jsonb,
  user_profile jsonb,
  recurring_slots jsonb,
  total_count bigint
)
language sql
security definer
set search_path = public
as $$
  with normalized as (
    select
      nullif(btrim(p_search), '') as search_term,
      greatest(1, least(coalesce(p_limit, 50), 100)) as page_limit,
      greatest(coalesce(p_offset, 0), 0) as page_offset
  ),
  matched as (
    select
      b.id,
      b.user_id,
      b.room_id,
      b.start_time,
      b.end_time,
      b.status::text as status,
      b.purpose,
      b.created_at,
      b.recurrence_group_id,
      b.recurrence_frequency,
      b.recurrence_until,
      jsonb_build_object(
        'name', r.name,
        'room_code', r.room_code
      ) as room,
      jsonb_build_object(
        'full_name', p.full_name,
        'student_id', p.student_id,
        'username', p.username,
        'department',
          case
            when d.id is null then null
            else jsonb_build_object('name', d.name)
          end
      ) as user_profile,
      coalesce(b.recurrence_group_id, b.id) as logical_group_id
    from public.bookings b
    left join public.rooms r on r.id = b.room_id
    left join public.profiles p on p.id = b.user_id
    left join public.departments d on d.id = p.department_id
    cross join normalized n
    where
      case
        when p_status in ('pending', 'approved', 'rejected')
          then b.status::text = p_status
        else b.status::text in ('pending', 'approved', 'rejected')
      end
      and (
        n.search_term is null
        or r.name ilike '%' || n.search_term || '%'
        or r.room_code ilike '%' || n.search_term || '%'
        or p.full_name ilike '%' || n.search_term || '%'
        or p.student_id ilike '%' || n.search_term || '%'
        or b.purpose ilike '%' || n.search_term || '%'
      )
  ),
  slots as (
    select
      logical_group_id,
      max(end_time) as latest_end_time,
      count(*) as slot_count,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'start_time', start_time,
          'end_time', end_time,
          'status', status
        )
        order by start_time
      ) as recurring_slots
    from matched
    group by logical_group_id
  ),
  representatives as (
    select distinct on (logical_group_id)
      *
    from matched
    order by logical_group_id, start_time
  ),
  logical_bookings as (
    select
      r.*,
      case when s.slot_count > 1 then s.recurring_slots else null end as recurring_slots,
      count(*) over () as total_count
    from representatives r
    join slots s on s.logical_group_id = r.logical_group_id
    where p_include_history or s.latest_end_time >= now()
  )
  select
    logical_bookings.id,
    logical_bookings.user_id,
    logical_bookings.room_id,
    logical_bookings.start_time,
    logical_bookings.end_time,
    logical_bookings.status,
    logical_bookings.purpose,
    logical_bookings.created_at,
    logical_bookings.recurrence_group_id,
    logical_bookings.recurrence_frequency,
    logical_bookings.recurrence_until,
    logical_bookings.room,
    logical_bookings.user_profile,
    logical_bookings.recurring_slots,
    logical_bookings.total_count
  from logical_bookings, normalized
  order by
    case when logical_bookings.status = 'pending' then 0 else 1 end,
    logical_bookings.start_time
  limit (select page_limit from normalized)
  offset (select page_offset from normalized);
$$;

revoke all on function public.search_admin_bookings(
  text,
  text,
  boolean,
  integer,
  integer
) from public;
grant execute on function public.search_admin_bookings(
  text,
  text,
  boolean,
  integer,
  integer
) to service_role;
