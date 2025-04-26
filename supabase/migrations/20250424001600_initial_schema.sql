-- migration: 20250424001600_initial_schema.sql
-- description: creates the initial database schema for getTaste MVP
-- author: ai assistant
-- date: 2025-04-24 (current system date)

-- users table
create table if not exists users (
    id uuid primary key default auth.uid(),
    email varchar(255) not null unique,
    password_hash varchar(255) not null,
    nick varchar(20) not null unique check (nick ~ '^[A-Za-z0-9_!]+$' and char_length(nick) <= 20),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz null -- soft delete mechanism
);

-- enable row level security on users table
alter table users enable row level security;

-- rls policies for users table
-- authenticated users can only see their own profile
create policy "users_select_policy_for_authenticated"
    on users
    for select
    to authenticated
    using (auth.uid() = id);

-- authenticated users can update only their own profile
create policy "users_update_policy_for_authenticated"
    on users
    for update
    to authenticated
    using (auth.uid() = id);

-- anon users can't see any user profiles
create policy "users_select_policy_for_anon"
    on users
    for select
    to anon
    using (false);

-- create indexes for users table
create index if not exists users_email_idx on users(email);
create index if not exists users_nick_idx on users(nick);

-- user2fa table for two-factor authentication
create table if not exists user2fa (
    id serial primary key,
    user_id uuid not null unique references users(id) on delete cascade,
    verification_code varchar(20) not null,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    verified_at timestamptz null
);

-- enable row level security on user2fa table
alter table user2fa enable row level security;

-- rls policies for user2fa table
-- authenticated users can only see and modify their own 2fa data
create policy "user2fa_select_policy_for_authenticated"
    on user2fa
    for select
    to authenticated
    using (user_id = auth.uid());

create policy "user2fa_insert_policy_for_authenticated"
    on user2fa
    for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "user2fa_update_policy_for_authenticated"
    on user2fa
    for update
    to authenticated
    using (user_id = auth.uid());

-- anon users can't access 2fa data
create policy "user2fa_select_policy_for_anon"
    on user2fa
    for select
    to anon
    using (false);

-- create index for user2fa table
create index if not exists user2fa_user_id_idx on user2fa(user_id);

-- sessions table
create table if not exists sessions (
    id serial primary key,
    user_id uuid not null references users(id) on delete cascade,
    token varchar(255) not null unique,
    created_at timestamptz not null default now()
);

-- enable row level security on sessions table
alter table sessions enable row level security;

-- rls policies for sessions table
-- authenticated users can only see their own sessions
create policy "sessions_select_policy_for_authenticated"
    on sessions
    for select
    to authenticated
    using (user_id = auth.uid());

-- anon users can't see sessions
create policy "sessions_select_policy_for_anon"
    on sessions
    for select
    to anon
    using (false);

-- create index for sessions table
create index if not exists sessions_token_idx on sessions(token);
create index if not exists sessions_user_id_idx on sessions(user_id);

-- music preferences table
create table if not exists music_preferences (
    user_id uuid primary key references users(id) on delete cascade,
    genres text[], -- list of music genres
    artists text[] -- list of favorite artists
);

-- enable row level security on music_preferences table
alter table music_preferences enable row level security;

-- DISABLED: rls policies for music_preferences table
-- authenticated users can only see and modify their own music preferences
/*
create policy "music_preferences_select_policy_for_authenticated"
    on music_preferences
    for select
    to authenticated
    using (user_id = auth.uid());

create policy "music_preferences_insert_policy_for_authenticated"
    on music_preferences
    for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "music_preferences_update_policy_for_authenticated"
    on music_preferences
    for update
    to authenticated
    using (user_id = auth.uid());

-- anon users can't access music preferences
create policy "music_preferences_select_policy_for_anon"
    on music_preferences
    for select
    to anon
    using (false);
*/

-- create index for music_preferences table
create index if not exists music_preferences_user_id_idx on music_preferences(user_id);

-- film preferences table
create table if not exists film_preferences (
    user_id uuid primary key references users(id) on delete cascade,
    genres text[], -- list of film genres
    director varchar(255), -- favorite director
    "cast" text[], -- list of favorite actors/cast
    screenwriter varchar(255) -- favorite screenwriter
);

-- enable row level security on film_preferences table
alter table film_preferences enable row level security;

-- DISABLED: rls policies for film_preferences table
-- authenticated users can only see and modify their own film preferences
/*
create policy "film_preferences_select_policy_for_authenticated"
    on film_preferences
    for select
    to authenticated
    using (user_id = auth.uid());

create policy "film_preferences_insert_policy_for_authenticated"
    on film_preferences
    for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "film_preferences_update_policy_for_authenticated"
    on film_preferences
    for update
    to authenticated
    using (user_id = auth.uid());

-- anon users can't access film preferences
create policy "film_preferences_select_policy_for_anon"
    on film_preferences
    for select
    to anon
    using (false);
*/

-- create index for film_preferences table
create index if not exists film_preferences_user_id_idx on film_preferences(user_id);

-- recommendations table
create table if not exists recommendations (
    id serial primary key,
    user_id uuid not null references users(id) on delete cascade,
    type varchar(10) not null check (type in ('music', 'film')),
    data jsonb not null, -- recommendation data (e.g. list of recommended items)
    created_at timestamptz not null default now()
);

-- enable row level security on recommendations table
alter table recommendations enable row level security;

-- DISABLED: rls policies for recommendations table
-- authenticated users can only see their own recommendations
/*
create policy "recommendations_select_policy_for_authenticated"
    on recommendations
    for select
    to authenticated
    using (user_id = auth.uid());

create policy "recommendations_insert_policy_for_authenticated"
    on recommendations
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- anon users can't access recommendations
create policy "recommendations_select_policy_for_anon"
    on recommendations
    for select
    to anon
    using (false);
*/

-- create index for recommendations table
create index if not exists recommendations_user_id_idx on recommendations(user_id);
create index if not exists recommendations_type_idx on recommendations(type);

-- spotify data table
create table if not exists spotify_data (
    id serial primary key,
    user_id uuid not null references users(id) on delete cascade,
    album_id varchar(50), -- spotify album identifier
    artist_id varchar(50), -- spotify artist identifier
    data jsonb, -- additional spotify api data
    created_at timestamptz not null default now()
);

-- enable row level security on spotify_data table
alter table spotify_data enable row level security;

-- rls policies for spotify_data table
-- authenticated users can only see their own spotify data
create policy "spotify_data_select_policy_for_authenticated"
    on spotify_data
    for select
    to authenticated
    using (user_id = auth.uid());

create policy "spotify_data_insert_policy_for_authenticated"
    on spotify_data
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- anon users can't access spotify data
create policy "spotify_data_select_policy_for_anon"
    on spotify_data
    for select
    to anon
    using (false);

-- create index for spotify_data table
create index if not exists spotify_data_user_id_idx on spotify_data(user_id);
create index if not exists spotify_data_album_id_idx on spotify_data(album_id);
create index if not exists spotify_data_artist_id_idx on spotify_data(artist_id);

-- trigger for updating the 'updated_at' column when a record is updated
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- create trigger on users table for updated_at column
create trigger update_users_updated_at
before update on users
for each row
execute function update_updated_at_column(); 