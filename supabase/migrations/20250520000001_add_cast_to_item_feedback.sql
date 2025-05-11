-- migration: add_cast_to_item_feedback
-- description: adds a cast column to item_feedback table to store movie cast metadata
-- created by: ai assistant
-- created at: 2025-05-20

-- add cast column to item_feedback table (if it doesn't exist)
alter table public.item_feedback add column if not exists "cast" text;

-- add an index for the new column to improve search performance
create index if not exists item_feedback_cast_idx on public.item_feedback("cast");

-- add documentation comment for the column
comment on column public.item_feedback."cast" is 'movie cast members separated by commas (without spaces)';

-- update or create rls policies for the new column
-- these policies ensure proper access control for the item_feedback table

-- ensure rls is enabled on the table
alter table public.item_feedback enable row level security;

-- policy for anonymous users to select items - no changes needed for new column
-- but we'll make sure it exists
do $$
begin
    if not exists (
        select from pg_policies 
        where tablename = 'item_feedback' 
        and policyname = 'anon_select_policy'
    ) then
        create policy anon_select_policy
        on public.item_feedback
        for select
        to anon
        using (true);
    end if;
end $$;

-- policy for authenticated users to select items
do $$
begin
    if not exists (
        select from pg_policies 
        where tablename = 'item_feedback' 
        and policyname = 'authenticated_select_policy'
    ) then
        create policy authenticated_select_policy
        on public.item_feedback
        for select
        to authenticated
        using (true);
    end if;
end $$;

-- policy for authenticated users to insert feedback with the new cast column
do $$
begin
    if not exists (
        select from pg_policies 
        where tablename = 'item_feedback' 
        and policyname = 'authenticated_insert_policy'
    ) then
        create policy authenticated_insert_policy
        on public.item_feedback
        for insert
        to authenticated
        with check (user_id = auth.uid());
    end if;
end $$;

-- policy for authenticated users to update feedback including the new cast column
do $$
begin
    if not exists (
        select from pg_policies 
        where tablename = 'item_feedback' 
        and policyname = 'authenticated_update_policy'
    ) then
        create policy authenticated_update_policy
        on public.item_feedback
        for update
        to authenticated
        using (user_id = auth.uid())
        with check (user_id = auth.uid());
    end if;
end $$;

-- refresh the schema cache
notify pgrst, 'reload schema';

-- log information for tracking
do $$
begin
  raise notice 'cast column has been added to the item_feedback table';
end $$; 