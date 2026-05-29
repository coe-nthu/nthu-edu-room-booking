alter table rooms
  add column if not exists image_urls jsonb not null default '[]'::jsonb;

update rooms
set image_urls = image_urls || jsonb_build_array(image_url)
where image_url is not null
  and image_url <> ''
  and not (image_urls ? image_url)
  and jsonb_array_length(image_urls) < 10;

alter table rooms
  add constraint rooms_image_urls_is_array
  check (jsonb_typeof(image_urls) = 'array');

alter table rooms
  add constraint rooms_image_urls_max_10
  check (jsonb_array_length(image_urls) <= 10);

alter table rooms
  add constraint rooms_primary_image_in_gallery
  check (
    image_url is null
    or image_url = ''
    or image_urls ? image_url
  );
