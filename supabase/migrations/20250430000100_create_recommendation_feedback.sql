-- migration: 20250430000100_create_recommendation_feedback.sql
-- description: creates the recommendation_feedback table to store user feedback on recommendations
-- author: ai assistant
-- date: 2025-04-30

-- recommendations_feedback table 
create table if not exists recommendations_feedback (
    id serial primary key,
    recommendation_id integer not null references recommendations(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    feedback_type varchar(10) not null check (feedback_type in ('like', 'dislike')),
    created_at timestamptz not null default now()
);

-- enable row level security on recommendations_feedback table
alter table recommendations_feedback enable row level security;

-- rls policies for recommendations_feedback table
-- authenticated users can only see their own feedback
create policy "recommendations_feedback_select_policy_for_authenticated"
    on recommendations_feedback
    for select
    to authenticated
    using (user_id = auth.uid());

-- authenticated users can only insert their own feedback
create policy "recommendations_feedback_insert_policy_for_authenticated"
    on recommendations_feedback
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- anon users can't access feedback data
create policy "recommendations_feedback_select_policy_for_anon"
    on recommendations_feedback
    for select
    to anon
    using (false);

-- create indexes for recommendations_feedback table
create index if not exists recommendations_feedback_recommendation_id_idx on recommendations_feedback(recommendation_id);
create index if not exists recommendations_feedback_user_id_idx on recommendations_feedback(user_id);
create index if not exists recommendations_feedback_feedback_type_idx on recommendations_feedback(feedback_type);

-- add a unique constraint to prevent duplicate feedback for the same recommendation
create unique index if not exists recommendations_feedback_unique_idx 
    on recommendations_feedback(recommendation_id, user_id);

-- create a view for recommendation history that joins recommendations with feedback
create or replace view recommendation_history as
select 
    r.id as recommendation_id,
    r.user_id,
    r.type,
    r.data,
    r.created_at as recommendation_created_at,
    rf.id as feedback_id,
    rf.feedback_type,
    rf.created_at as feedback_created_at
from 
    recommendations r
inner join 
    recommendations_feedback rf on r.id = rf.recommendation_id;

-- Note: We cannot apply RLS directly to views in Postgres
-- Instead, we rely on the RLS of the underlying tables to restrict access

-- Create security-definer function to get recommendation history for the current user
create or replace function get_recommendation_history(user_uuid uuid)
returns setof recommendation_history
language sql
security definer
as $$
    select * from recommendation_history where user_id = user_uuid;
$$;

-- Add sample feedback data - using serial IDs 1 and 2 from initial data
insert into recommendations_feedback (recommendation_id, user_id, feedback_type, created_at)
values 
  -- Feedback for user 1's music recommendation (ID 1)
  (1, '00000000-0000-0000-0000-000000000001', 'like', now() - interval '18 days'),
  
  -- Feedback for user 2's film recommendation (ID 2)
  (2, '00000000-0000-0000-0000-000000000002', 'dislike', now() - interval '11 days'); 