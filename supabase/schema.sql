-- =====================================================
-- ZenFlow Studio · SWE334 төсөл
-- Supabase Dashboard -> SQL Editor дээр бүхлээр нь ажиллуулна.
-- (Дахин ажиллуулах бол эхлээд төслийг цэвэрлэх эсвэл шинэ төсөл ашигла.)
-- =====================================================

-- ---------- 1. ХҮСНЭГТҮҮД (8) ----------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

create table public.trainers (
  id bigint generated always as identity primary key,
  name text not null,
  bio text,
  specialty text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table public.class_types (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  level text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  image_url text,
  created_at timestamptz not null default now()
);

create table public.classes (
  id bigint generated always as identity primary key,
  class_type_id bigint not null references public.class_types(id) on delete restrict,
  trainer_id bigint not null references public.trainers(id) on delete restrict,
  starts_at timestamptz not null,
  duration_min int not null default 60 check (duration_min > 0),
  capacity int not null check (capacity > 0),
  price numeric(10,2) not null default 0 check (price >= 0),
  booked_count int not null default 0,          -- trigger-ээр автоматаар тооцогдоно
  created_at timestamptz not null default now()
);

create table public.membership_plans (
  id bigint generated always as identity primary key,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  duration_days int not null check (duration_days > 0),
  class_limit int check (class_limit is null or class_limit > 0),   -- null = хязгааргүй
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id bigint not null references public.membership_plans(id) on delete restrict,
  start_date date,
  end_date date,
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'cancelled')),
  created_at timestamptz not null default now()
);

-- N:M холбоо: profiles <-> classes
create table public.bookings (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  class_id bigint not null references public.classes(id) on delete cascade,
  status text not null default 'booked' check (status in ('booked', 'cancelled', 'attended')),
  qr_code uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  unique (user_id, class_id)
);

create table public.payments (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  membership_id bigint not null references public.memberships(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  provider text,
  provider_ref text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index on public.classes (starts_at);
create index on public.classes (class_type_id);
create index on public.classes (trainer_id);
create index on public.bookings (user_id);
create index on public.bookings (class_id);
create index on public.memberships (user_id);
create index on public.payments (user_id);
create index on public.payments (provider_ref);

-- ---------- 2. FUNCTION, TRIGGER ----------

-- RLS дотор recursion үүсгэхгүйн тулд security definer ашиглана
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_role()
returns text language sql security definer set search_path = public stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Бүртгүүлэхэд profile автоматаар үүснэ
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Захиалгын дүрмүүд: багтаамж, идэвхтэй гишүүнчлэл, ангийн эрхийн хязгаар, цуцлалт
create or replace function public.bookings_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c record;
  m record;
  used int;
begin
  -- ангийн мөрийг түгжиж, зэрэг захиалахад багтаамж давахаас сэргийлнэ
  select * into c from public.classes where id = new.class_id for update;

  if tg_op = 'UPDATE' then
    if new.status = 'cancelled' and old.status <> 'cancelled'
       and not public.is_admin() and c.starts_at <= now() then
      raise exception 'Эхэлсэн ангийг цуцлах боломжгүй';
    end if;
    -- зөвхөн цуцалсан захиалгыг дахин нээх үед доорх шалгалт хийгдэнэ
    if not (new.status = 'booked' and old.status = 'cancelled') then
      return new;
    end if;
  end if;

  if new.status <> 'booked' then
    return new;
  end if;

  if c.starts_at <= now() then
    raise exception 'Энэ анги эхэлсэн байна';
  end if;

  if c.booked_count >= c.capacity then
    raise exception 'Энэ анги дүүрсэн байна';
  end if;

  if not public.is_admin() then
    select ms.id, ms.start_date, ms.end_date, p.class_limit into m
    from public.memberships ms
    join public.membership_plans p on p.id = ms.plan_id
    where ms.user_id = new.user_id
      and ms.status = 'active'
      and current_date between ms.start_date and ms.end_date
      and c.starts_at::date <= ms.end_date
    order by ms.end_date desc
    limit 1;

    if not found then
      raise exception 'Идэвхтэй гишүүнчлэл байхгүй байна. Эхлээд багц худалдан аваарай';
    end if;

    if m.class_limit is not null then
      select count(*) into used
      from public.bookings b
      join public.classes cl on cl.id = b.class_id
      where b.user_id = new.user_id
        and b.status <> 'cancelled'
        and cl.starts_at::date between m.start_date and m.end_date
        and b.id is distinct from new.id;
      if used >= m.class_limit then
        raise exception 'Таны багцын ангийн эрх дууссан байна';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger bookings_guard_trg
  before insert or update on public.bookings
  for each row execute function public.bookings_guard();

-- classes.booked_count-ийг синхрончилно
create or replace function public.sync_booked_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare cid bigint;
begin
  if tg_op = 'DELETE' then cid := old.class_id; else cid := new.class_id; end if;
  update public.classes
     set booked_count = (select count(*) from public.bookings where class_id = cid and status <> 'cancelled')
   where id = cid;
  return null;
end;
$$;

create trigger bookings_sync_trg
  after insert or update or delete on public.bookings
  for each row execute function public.sync_booked_count();

-- QR кодоор ирц бүртгэх (зөвхөн админ)
create or replace function public.check_in(p_qr uuid)
returns json language plpgsql security definer set search_path = public as $$
declare b record;
begin
  if not public.is_admin() then
    raise exception 'Эрх хүрэхгүй байна';
  end if;

  select bk.id, bk.status, pr.full_name, ct.name as class_name, c.starts_at into b
  from public.bookings bk
  join public.profiles pr on pr.id = bk.user_id
  join public.classes c on c.id = bk.class_id
  join public.class_types ct on ct.id = c.class_type_id
  where bk.qr_code = p_qr;

  if not found then raise exception 'QR код олдсонгүй'; end if;
  if b.status = 'cancelled' then raise exception 'Энэ захиалга цуцлагдсан байна'; end if;
  if b.status = 'attended' then raise exception 'Ирц аль хэдийн бүртгэгдсэн байна'; end if;

  update public.bookings set status = 'attended' where id = b.id;

  return json_build_object('full_name', b.full_name, 'class_name', b.class_name, 'starts_at', b.starts_at);
end;
$$;

-- ---------- 3. RLS (БҮХ ХҮСНЭГТЭД) ----------

alter table public.profiles         enable row level security;
alter table public.trainers         enable row level security;
alter table public.class_types      enable row level security;
alter table public.classes          enable row level security;
alter table public.membership_plans enable row level security;
alter table public.memberships      enable row level security;
alter table public.bookings         enable row level security;
alter table public.payments         enable row level security;

-- profiles: өөрийнхөө мэдээллийг харж засна, role-оо өөрчилж чадахгүй
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = public.my_role());
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Нийтэд харагдах хүснэгтүүд (зочин ч харна), бичих эрх зөвхөн админд
create policy "trainers_public_read" on public.trainers for select using (true);
create policy "trainers_admin_write" on public.trainers
  for all using (public.is_admin()) with check (public.is_admin());

create policy "class_types_public_read" on public.class_types for select using (true);
create policy "class_types_admin_write" on public.class_types
  for all using (public.is_admin()) with check (public.is_admin());

create policy "classes_public_read" on public.classes for select using (true);
create policy "classes_admin_write" on public.classes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "plans_public_read" on public.membership_plans for select using (true);
create policy "plans_admin_write" on public.membership_plans
  for all using (public.is_admin()) with check (public.is_admin());

-- memberships: зөвхөн унших. Үүсгэх, идэвхжүүлэх нь Edge Function (service_role)-оор
create policy "memberships_select_own_or_admin" on public.memberships
  for select using (user_id = auth.uid() or public.is_admin());
create policy "memberships_admin_all" on public.memberships
  for all using (public.is_admin()) with check (public.is_admin());

-- bookings: өөрийнхөө захиалгыг үүсгэж, цуцална ("attended"-ыг өөрөө тэмдэглэж чадахгүй)
create policy "bookings_select_own_or_admin" on public.bookings
  for select using (user_id = auth.uid() or public.is_admin());
create policy "bookings_insert_own" on public.bookings
  for insert with check (user_id = auth.uid() and status = 'booked');
create policy "bookings_update_own" on public.bookings
  for update using (user_id = auth.uid() and status <> 'attended')
  with check (user_id = auth.uid() and status in ('booked', 'cancelled'));
create policy "bookings_admin_all" on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());

-- payments: зөвхөн унших. Бичилтийг Edge Function (service_role) хийнэ
create policy "payments_select_own_or_admin" on public.payments
  for select using (user_id = auth.uid() or public.is_admin());
create policy "payments_admin_all" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- 4. STORAGE (зураг) ----------
-- 2MB хязгаар, зөвхөн jpeg/png/webp
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "images_public_read" on storage.objects
  for select using (bucket_id = 'images');
create policy "images_admin_insert" on storage.objects
  for insert with check (bucket_id = 'images' and public.is_admin());
create policy "images_admin_update" on storage.objects
  for update using (bucket_id = 'images' and public.is_admin());
create policy "images_admin_delete" on storage.objects
  for delete using (bucket_id = 'images' and public.is_admin());

-- ---------- 5. ТУРШИЛТЫН ӨГӨГДӨЛ ----------
insert into public.class_types (name, description, level) values
  ('Hatha Yoga', 'Тайван хэмнэлтэй, үндсэн позууд', 'beginner'),
  ('Vinyasa Flow', 'Амьсгалтай уялдсан үргэлжилсэн урсгал', 'intermediate'),
  ('Power Yoga', 'Хүч, тэнцвэр, уян хатан байдлыг хөгжүүлнэ', 'advanced'),
  ('HIIT', 'Өндөр эрчимтэй интервал дасгал', 'advanced'),
  ('Pilates', 'Бие махбодийн гол булчинг бэхжүүлнэ', 'beginner');

insert into public.trainers (name, bio, specialty) values
  ('Сарнай', 'Йогийн 5 жилийн туршлагатай багш', 'Yoga'),
  ('Тэмүүлэн', 'Фитнес, HIIT дасгалжуулагч', 'HIIT'),
  ('Номин', 'Pilates болон нугаламын эрүүл мэндийн чиглэл', 'Pilates');

insert into public.membership_plans (name, price, duration_days, class_limit) values
  ('Сарын 8 анги', 120000, 30, 8),
  ('Сарын хязгааргүй', 200000, 30, null),
  ('Улирлын хязгааргүй', 520000, 90, null);

insert into public.classes (class_type_id, trainer_id, starts_at, duration_min, capacity, price)
select ct.id, t.id, date_trunc('day', now()) + (d || ' days')::interval + (h || ' hours')::interval, 60, 12, 0
from (values (1, 1, 1, 8), (2, 1, 2, 18), (3, 1, 3, 9), (4, 2, 4, 19), (5, 3, 5, 10), (1, 3, 6, 11)) as v(ct_i, t_i, d, h)
join (select id, row_number() over (order by id) rn from public.class_types) ct on ct.rn = v.ct_i
join (select id, row_number() over (order by id) rn from public.trainers) t on t.rn = v.t_i;

-- ---------- 6. АДМИН ЭРХ ----------
-- App дээр өөрөө бүртгүүлсний дараа ӨӨРИЙН email-ээр ажиллуулна:
-- update public.profiles set role = 'admin' where email = 'ТАНЫ_EMAIL';
