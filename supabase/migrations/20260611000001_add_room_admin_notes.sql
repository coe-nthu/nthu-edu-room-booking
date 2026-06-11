-- Add short admin-maintained notes for room booking pages.
alter table rooms
add column if not exists admin_note text;

alter table rooms
drop constraint if exists rooms_admin_note_length;

alter table rooms
add constraint rooms_admin_note_length
check (admin_note is null or char_length(admin_note) <= 200);
