-- migration: 20250502000100_create_item_feedback.sql
-- description: creates the item_feedback table to store user feedback on individual items
-- author: ai assistant
-- date: 2025-05-02

-- item_feedback table 
create table if not exists item_feedback (
    id serial primary key,
    user_id text not null, -- user ID as string
    item_id text not null, -- item ID (formatted string from recommendation items)
    feedback_type varchar(10) not null check (feedback_type in ('like', 'dislike')),
    created_at timestamptz not null default now()
);

-- enable row level security on item_feedback table
alter table item_feedback enable row level security;

-- rls policies for item_feedback table
-- authenticated users can only see their own feedback
create policy "item_feedback_select_policy_for_authenticated"
    on item_feedback
    for select
    to authenticated
    using (user_id = auth.uid()::text);

-- authenticated users can only insert their own feedback
create policy "item_feedback_insert_policy_for_authenticated"
    on item_feedback
    for insert
    to authenticated
    with check (user_id = auth.uid()::text);

-- anon users can't access feedback data
create policy "item_feedback_select_policy_for_anon"
    on item_feedback
    for select
    to anon
    using (false);

-- create indexes for item_feedback table
create index if not exists item_feedback_user_id_idx on item_feedback(user_id);
create index if not exists item_feedback_item_id_idx on item_feedback(item_id);
create index if not exists item_feedback_feedback_type_idx on item_feedback(feedback_type);

-- add a unique constraint to prevent duplicate feedback for the same item
create unique index if not exists item_feedback_unique_idx 
    on item_feedback(user_id, item_id); 