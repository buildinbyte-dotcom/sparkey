-- ============================================================
-- App Store requirements: in-app account deletion and blocking users
-- ============================================================

-- ---------- Account deletion ----------

-- Moderation and audit references kept NO ACTION, so deleting anyone who ever
-- reviewed a licence, resolved a flag or created a reputation event failed.
-- Keep those records and just forget who acted.
alter table public.licence_verifications
  drop constraint licence_verifications_checked_by_fkey,
  add constraint licence_verifications_checked_by_fkey
    foreign key (checked_by) references public.profiles (id) on delete set null;

alter table public.flags
  drop constraint flags_resolved_by_fkey,
  add constraint flags_resolved_by_fkey
    foreign key (resolved_by) references public.profiles (id) on delete set null;

alter table public.reputation_events
  drop constraint reputation_events_created_by_fkey,
  add constraint reputation_events_created_by_fkey
    foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.audit_logs
  drop constraint audit_logs_actor_id_fkey,
  add constraint audit_logs_actor_id_fkey
    foreign key (actor_id) references public.profiles (id) on delete set null;

-- When a voter's account is deleted, their votes cascade away. The old trigger
-- then wrote a -5 event created_by the deleted user (FK violation, so deletion
-- failed). Reputation someone earned stays when the voter leaves.
create or replace function public.on_vote_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
  v_category public.job_type;
begin
  perform set_config('sparkyq.internal', 'true', true);

  select a.author_id, q.job_type into v_author, v_category
  from public.answers a join public.questions q on q.id = a.question_id
  where a.id = old.answer_id;

  update public.answers set helpful_count = greatest(helpful_count - 1, 0) where id = old.answer_id;

  if v_author is not null
     and v_author <> old.user_id
     and exists (select 1 from public.profiles where id = old.user_id) then
    insert into public.reputation_events (user_id, points, reason, category, source_type, source_id, created_by)
    values (v_author, -5, 'helpful_vote', v_category, 'answer', old.answer_id, old.user_id);
  end if;

  return old;
end;
$$;

-- Deletes the caller's auth user; everything they own cascades from profiles.
-- Uploaded photos are removed by the app first (storage API), see settings/actions.ts.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;

  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------- Blocking ----------

create table public.user_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index user_blocks_blocked_idx on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

-- Blocks are private: only the blocker can see or change their list.
create policy "blocks readable by blocker"
  on public.user_blocks for select to authenticated
  using (blocker_id = auth.uid());

create policy "blocks insert by blocker"
  on public.user_blocks for insert to authenticated
  with check (blocker_id = auth.uid());

create policy "blocks delete by blocker"
  on public.user_blocks for delete to authenticated
  using (blocker_id = auth.uid());
