-- 1. Add is_active column to rooms table
alter table rooms
  add column is_active boolean default true;

-- 2. Create Storage Bucket for Room Images
insert into storage.buckets (id, name, public)
values ('room-images', 'room-images', true)
on conflict (id) do nothing;

-- 3. Setup Storage Policies

-- Policy: Public can SELECT (View) images
create policy "Give public access to room images"
on storage.objects for select
using ( bucket_id = 'room-images' );

-- Policy: Admins can INSERT (Upload) images
create policy "Admins can upload room images"
on storage.objects for insert
with check (
  bucket_id = 'room-images' AND
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- Policy: Admins can UPDATE images
create policy "Admins can update room images"
on storage.objects for update
using (
  bucket_id = 'room-images' AND
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- Policy: Admins can DELETE images
create policy "Admins can delete room images"
on storage.objects for delete
using (
  bucket_id = 'room-images' AND
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

