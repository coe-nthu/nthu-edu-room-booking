-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  role text default 'user' check (role in ('user', 'admin')),
  student_id text,

  constraint username_length check (char_length(username) >= 3)
);
-- Set up Row Level Security!
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- Rooms table
create table rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  capacity int,
  is_lunch_locked boolean default false,
  equipment jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table rooms enable row level security;

create policy "Rooms are viewable by everyone." on rooms
  for select using (true);

create policy "Admins can insert/update/delete rooms." on rooms
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Bookings table
create type booking_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create table bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  room_id uuid references rooms(id) not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status booking_status default 'pending',
  purpose text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint to ensure end_time > start_time
  constraint valid_time_range check (end_time > start_time)
);

alter table bookings enable row level security;

create policy "Users can view their own bookings." on bookings
  for select using ((select auth.uid()) = user_id);

create policy "Admins can view all bookings." on bookings
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
  
create policy "Everyone can view approved bookings (for timetable)." on bookings
  for select using (status = 'approved');

create policy "Users can insert their own bookings." on bookings
  for insert with check ((select auth.uid()) = user_id);
  
create policy "Users can update their own pending bookings (e.g. cancel)." on bookings
  for update using ((select auth.uid()) = user_id);

create policy "Admins can update all bookings." on bookings
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Function to handle new user signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

