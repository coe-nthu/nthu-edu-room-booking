-- Allow authenticated users to resolve borrower department names in analytics views.
grant usage on schema public to authenticated;
grant select on public.departments to authenticated;

alter table public.departments enable row level security;

drop policy if exists "Authenticated users can view departments" on public.departments;

create policy "Authenticated users can view departments"
on public.departments
for select
to authenticated
using (true);
