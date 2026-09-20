-- Diraya schema (spec section 4)
-- Static reference data: surahs, ayahs, tafsir_books, tafsir_entries.
-- User data: profiles, projects, chats, messages, saved_sources (RLS-protected).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Static data
-- ---------------------------------------------------------------------

create table if not exists surahs (
  id smallint primary key check (id between 1 and 114),
  name_ar text not null,
  ayah_count smallint not null check (ayah_count > 0),
  revelation_type text not null check (revelation_type in ('meccan', 'medinan'))
);

create table if not exists ayahs (
  surah smallint not null references surahs(id),
  number smallint not null check (number > 0),
  text text not null,
  text_normalized text not null,
  primary key (surah, number)
);

create table if not exists tafsir_books (
  id smallint generated always as identity primary key,
  key text not null unique check (key in ('tabari', 'kathir', 'saadi', 'muyassar')),
  name_ar text not null,
  author_ar text not null,
  sort_order smallint not null default 0
);

create table if not exists tafsir_entries (
  id bigint generated always as identity primary key,
  book_id smallint not null references tafsir_books(id),
  surah smallint not null references surahs(id),
  verse_from smallint not null check (verse_from > 0),
  verse_to smallint not null check (verse_to >= verse_from),
  text text not null,
  source_path text not null,
  reviewed boolean not null default false
);

create index if not exists tafsir_entries_lookup
  on tafsir_entries (book_id, surah, verse_from, verse_to);

create index if not exists tafsir_entries_surah_range
  on tafsir_entries (surah, verse_from, verse_to);

-- full-text search over normalized ayah text and tafsir text, for topic search (spec section 10)
create extension if not exists pg_trgm;
create index if not exists ayahs_text_normalized_trgm on ayahs using gin (text_normalized gin_trgm_ops);
create index if not exists tafsir_entries_text_trgm on tafsir_entries using gin (text gin_trgm_ops);

alter table surahs enable row level security;
alter table ayahs enable row level security;
alter table tafsir_books enable row level security;
alter table tafsir_entries enable row level security;

create policy "public read surahs" on surahs for select using (true);
create policy "public read ayahs" on ayahs for select using (true);
create policy "public read tafsir_books" on tafsir_books for select using (true);
create policy "public read tafsir_entries" on tafsir_entries for select using (true);

-- ---------------------------------------------------------------------
-- User data (each user sees only their own rows)
-- ---------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  preferred_books text[] not null default array['tabari', 'kathir', 'saadi', 'muyassar']
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists saved_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  surah smallint not null references surahs(id),
  ayah smallint not null,
  book_id smallint not null references tafsir_books(id),
  created_at timestamptz not null default now(),
  unique (project_id, surah, ayah, book_id)
);

create index if not exists chats_user_id on chats(user_id);
create index if not exists chats_project_id on chats(project_id);
create index if not exists messages_chat_id on messages(chat_id);
create index if not exists projects_user_id on projects(user_id);
create index if not exists saved_sources_project_id on saved_sources(project_id);

alter table profiles enable row level security;
alter table projects enable row level security;
alter table chats enable row level security;
alter table messages enable row level security;
alter table saved_sources enable row level security;

create policy "own profile" on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

create policy "own projects" on projects for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own chats" on chats for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own messages" on messages for all
  using (exists (select 1 from chats where chats.id = messages.chat_id and chats.user_id = auth.uid()))
  with check (exists (select 1 from chats where chats.id = messages.chat_id and chats.user_id = auth.uid()));

create policy "own saved sources" on saved_sources for all
  using (exists (select 1 from projects where projects.id = saved_sources.project_id and projects.user_id = auth.uid()))
  with check (exists (select 1 from projects where projects.id = saved_sources.project_id and projects.user_id = auth.uid()));

-- auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
