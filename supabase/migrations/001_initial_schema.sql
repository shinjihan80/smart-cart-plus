-- NEMOA 초기 스키마 마이그레이션
-- Supabase 대시보드 > SQL Editor 에서 실행

-- ── profiles ──────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid references auth.users primary key,
  email           text,
  display_name    text,
  avatar_url      text,
  plan_tier       text not null default 'free',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 회원가입 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── items ──────────────────────────────────────────────
create table if not exists public.items (
  id              text primary key,      -- 클라이언트 UUID (로컬과 동일)
  user_id         uuid references auth.users not null,
  item_type       text not null,         -- 'food' | 'clothing'
  category        text not null,
  name            text not null,
  attributes      jsonb not null default '{}',
  archived        boolean not null default false,
  updated_at      timestamptz not null default now()
);

create index if not exists items_user_id_idx on public.items(user_id);
create index if not exists items_updated_at_idx on public.items(updated_at);

-- ── Row Level Security ─────────────────────────────────
alter table public.profiles enable row level security;
alter table public.items enable row level security;

-- profiles
create policy "users view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- items
create policy "users select own items"
  on public.items for select using (auth.uid() = user_id);
create policy "users insert own items"
  on public.items for insert with check (auth.uid() = user_id);
create policy "users update own items"
  on public.items for update using (auth.uid() = user_id);
create policy "users delete own items"
  on public.items for delete using (auth.uid() = user_id);
