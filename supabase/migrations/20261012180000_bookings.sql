-- Online booking (/booking/ page): stores bookings so the calendar can show which times are taken.
--
-- Times are stored as studio-local (Europe/Warsaw) date + minutes after midnight, the same values
-- the booking page shows, so there is no time zone conversion anywhere.
--
-- status:
--   pending   - the customer has gone to Stripe; holds the slot for 30 minutes
--   paid      - Stripe confirmed payment (set by the stripe-webhook edge function)
--   blocked   - added by the studio by hand, e.g. a booking taken by phone, or a day off
--   cancelled - frees the slot
--
-- The table is not readable from the website: RLS is on with no policies. The page only calls the two
-- functions below, which never return names, emails or phone numbers.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  service text not null check (service in ('recording', 'rehearsal')),
  booking_date date not null,
  start_minute integer not null check (start_minute between 0 and 1439),
  duration_minutes integer not null check (duration_minutes between 30 and 720),
  status text not null default 'pending' check (status in ('pending', 'paid', 'blocked', 'cancelled')),
  customer_name text,
  customer_email text,
  customer_phone text,
  notes text,
  amount_pln integer,
  stripe_session_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists bookings_service_date_idx on public.bookings (service, booking_date);

alter table public.bookings enable row level security;

-- Rows that make a slot unavailable.
create or replace function public.booking_is_active(b public.bookings)
returns boolean
language sql
stable
as $$
  select b.status in ('paid', 'blocked')
      or (b.status = 'pending' and b.created_at > now() - interval '30 minutes');
$$;

-- Taken times for one service between two dates (used by the calendar). No personal data.
create or replace function public.booked_slots(p_service text, p_from date, p_to date)
returns table (booking_date date, start_minute integer, duration_minutes integer)
language sql
stable
security definer
set search_path = public
as $$
  select b.booking_date, b.start_minute, b.duration_minutes
  from public.bookings b
  where b.service = p_service
    and b.booking_date between p_from and p_to
    and public.booking_is_active(b);
$$;

-- Holds a slot while the customer pays. Fails with 'slot_taken' if it overlaps an active booking.
create or replace function public.create_booking(
  p_reference text,
  p_service text,
  p_date date,
  p_start_minute integer,
  p_duration_minutes integer,
  p_name text,
  p_email text,
  p_phone text,
  p_notes text,
  p_amount_pln integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_reference !~ '^[A-Za-z0-9_-]{6,200}$' then
    raise exception 'invalid_reference';
  end if;
  if p_date < (now() at time zone 'Europe/Warsaw')::date then
    raise exception 'date_in_past';
  end if;
  if p_start_minute + p_duration_minutes > 1440 then
    raise exception 'invalid_time';
  end if;

  -- One booking at a time per service, so two people can't grab the same slot together.
  perform pg_advisory_xact_lock(hashtext('booking:' || p_service));

  if exists (
    select 1 from public.bookings b
    where b.service = p_service
      and b.booking_date = p_date
      and public.booking_is_active(b)
      and b.start_minute < p_start_minute + p_duration_minutes
      and p_start_minute < b.start_minute + b.duration_minutes
  ) then
    raise exception 'slot_taken';
  end if;

  insert into public.bookings (
    reference, service, booking_date, start_minute, duration_minutes,
    customer_name, customer_email, customer_phone, notes, amount_pln
  ) values (
    p_reference, p_service, p_date, p_start_minute, p_duration_minutes,
    left(p_name, 100), left(p_email, 255), left(p_phone, 50), left(p_notes, 2000), p_amount_pln
  );
  return p_reference;
end;
$$;

revoke all on function public.booked_slots(text, date, date) from public;
revoke all on function public.create_booking(text, text, date, integer, integer, text, text, text, text, integer) from public;
grant execute on function public.booked_slots(text, date, date) to anon, authenticated;
grant execute on function public.create_booking(text, text, date, integer, integer, text, text, text, text, integer) to anon, authenticated;
