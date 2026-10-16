-- ============================================================
-- SparkyQ — 0002: Security guards, atomic accept_answer RPC,
-- and storage access hardening
-- ============================================================

-- 1. Update reputation/vote/admin functions to set internal bypass GUC
create or replace function public.apply_reputation_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('sparkyq.internal', 'true', true);

  update public.profiles
  set reputation = reputation + new.points,
      safety_score = safety_score + case
        when new.reason in ('expert_confirmation', 'reference_included') then new.points
        when new.reason = 'unsafe_answer_removed' then new.points
        else 0
      end,
      updated_at = now()
  where id = new.user_id;

  if new.category is not null then
    insert into public.user_category_scores (user_id, category, score)
    values (new.user_id, new.category, new.points)
    on conflict (user_id, category)
    do update set score = public.user_category_scores.score + new.points;
  end if;

  return new;
end;
$$;

create or replace function public.on_vote_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
  v_category public.job_type;
  v_question uuid;
begin
  perform set_config('sparkyq.internal', 'true', true);

  select a.author_id, q.job_type, q.id into v_author, v_category, v_question
  from public.answers a join public.questions q on q.id = a.question_id
  where a.id = new.answer_id;

  update public.answers set helpful_count = helpful_count + 1 where id = new.answer_id;

  if v_author is not null and v_author <> new.user_id then
    insert into public.reputation_events (user_id, points, reason, category, source_type, source_id, created_by)
    values (v_author, 5, 'helpful_vote', v_category, 'answer', new.answer_id, new.user_id);

    insert into public.notifications (user_id, type, title, link)
    values (v_author, 'answer_helpful', 'A verified peer marked your answer helpful', '/questions/' || v_question);
  end if;

  return new;
end;
$$;

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

  if v_author is not null and v_author <> old.user_id then
    insert into public.reputation_events (user_id, points, reason, category, source_type, source_id, created_by)
    values (v_author, -5, 'helpful_vote', v_category, 'answer', old.answer_id, old.user_id);
  end if;

  return old;
end;
$$;

-- Prevent duplicate reputation awards if an answer is unaccepted and re-accepted,
-- and do not award points for accepting one's own answer.
create or replace function public.on_answer_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category public.job_type;
  v_question_author uuid;
  v_already_awarded boolean;
begin
  if new.is_accepted and not old.is_accepted then
    select job_type, author_id into v_category, v_question_author
    from public.questions where id = new.question_id;

    if new.author_id <> v_question_author then
      select exists (
        select 1 from public.reputation_events
        where user_id = new.author_id
          and reason = 'accepted_answer'
          and source_id = new.id
      ) into v_already_awarded;

      if not v_already_awarded then
        insert into public.reputation_events (user_id, points, reason, category, source_type, source_id)
        values (new.author_id, 10, 'accepted_answer', v_category, 'answer', new.id);

        if new.includes_reference then
          insert into public.reputation_events (user_id, points, reason, category, source_type, source_id)
          values (new.author_id, 5, 'reference_included', v_category, 'answer', new.id);
        end if;
      end if;

      insert into public.notifications (user_id, type, title, link)
      values (new.author_id, 'answer_accepted', 'Your answer was accepted', '/questions/' || new.question_id);
    end if;
  end if;

  return new;
end;
$$;

-- 2. Guard privileged/score columns on profiles and answers from client tampering
create or replace function public.guard_profile_updates()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('sparkyq.internal', true), '') = 'true'
     or public.is_admin(auth.uid()) then
    return new;
  end if;

  if new.is_admin is distinct from old.is_admin
     or new.is_moderator is distinct from old.is_moderator
     or new.is_expert is distinct from old.is_expert
     or new.is_founding_member is distinct from old.is_founding_member
     or new.reputation is distinct from old.reputation
     or new.safety_score is distinct from old.safety_score
     or new.handle is distinct from old.handle then
    raise exception 'cannot modify privileged profile fields';
  end if;

  if new.verification_status is distinct from old.verification_status then
    if not (old.verification_status in ('unverified', 'rejected') and new.verification_status = 'pending') then
      raise exception 'cannot modify verification status directly';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profile_update_guard on public.profiles;
create trigger profile_update_guard
before update on public.profiles
for each row execute function public.guard_profile_updates();

create or replace function public.guard_answer_updates()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('sparkyq.internal', true), '') = 'true'
     or public.is_admin(auth.uid()) then
    return new;
  end if;

  if new.is_accepted is distinct from old.is_accepted
     or new.helpful_count is distinct from old.helpful_count
     or new.is_removed is distinct from old.is_removed
     or new.question_id is distinct from old.question_id
     or new.author_id is distinct from old.author_id then
    raise exception 'cannot modify system answer fields directly';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists answer_update_guard on public.answers;
create trigger answer_update_guard
before update on public.answers
for each row execute function public.guard_answer_updates();

-- 3. Atomic RPC for question authors to accept an answer
create or replace function public.accept_answer(p_question_id uuid, p_answer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question public.questions%rowtype;
  v_answer public.answers%rowtype;
begin
  perform set_config('sparkyq.internal', 'true', true);

  select * into v_question from public.questions where id = p_question_id for update;
  if v_question.id is null then
    raise exception 'question not found';
  end if;

  if v_question.author_id <> auth.uid() and not public.is_admin(auth.uid()) then
    raise exception 'not authorised';
  end if;

  select * into v_answer from public.answers
  where id = p_answer_id and question_id = p_question_id and not is_removed;
  if v_answer.id is null then
    raise exception 'answer not found';
  end if;

  if v_question.accepted_answer_id is not null and v_question.accepted_answer_id <> p_answer_id then
    update public.answers set is_accepted = false where id = v_question.accepted_answer_id;
  end if;

  update public.answers set is_accepted = true where id = p_answer_id;
  update public.questions
  set accepted_answer_id = p_answer_id,
      status = 'resolved',
      updated_at = now()
  where id = p_question_id;
end;
$$;

-- 4. Update resolve_flag and review_licence to set internal GUC
create or replace function public.resolve_flag(p_flag_id uuid, p_uphold boolean, p_penalty int default 25)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flag public.flags%rowtype;
  v_answer public.answers%rowtype;
  v_category public.job_type;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorised';
  end if;

  perform set_config('sparkyq.internal', 'true', true);

  select * into v_flag from public.flags where id = p_flag_id for update;
  if v_flag.id is null or v_flag.status <> 'open' then
    raise exception 'flag not open';
  end if;

  update public.flags
  set status = case when p_uphold then 'upheld'::public.flag_status else 'dismissed'::public.flag_status end,
      resolved_by = auth.uid(),
      resolved_at = now()
  where id = p_flag_id;

  if p_uphold and v_flag.target_type = 'answer' then
    select * into v_answer from public.answers where id = v_flag.target_id;
    if v_answer.id is not null then
      update public.answers set is_removed = true where id = v_answer.id;

      if v_flag.reason = 'unsafe' then
        select q.job_type into v_category from public.questions q where q.id = v_answer.question_id;
        insert into public.reputation_events (user_id, points, reason, category, source_type, source_id, created_by)
        values (v_answer.author_id, -abs(p_penalty), 'unsafe_answer_removed', v_category, 'flag', p_flag_id, auth.uid());

        insert into public.notifications (user_id, type, title, body, link)
        values (
          v_answer.author_id, 'moderation',
          'An answer of yours was removed for safety',
          'A moderator upheld a safety flag on one of your answers.',
          '/questions/' || v_answer.question_id
        );
      end if;
    end if;
  end if;

  if p_uphold and v_flag.target_type = 'question' then
    update public.questions set status = 'removed' where id = v_flag.target_id;
  end if;

  if p_uphold and v_flag.target_type = 'comment' then
    update public.comments set is_removed = true where id = v_flag.target_id;
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id, detail)
  values (
    auth.uid(),
    case when p_uphold then 'flag_upheld' else 'flag_dismissed' end,
    v_flag.target_type::text, v_flag.target_id,
    jsonb_build_object('flag_id', p_flag_id, 'reason', v_flag.reason)
  );
end;
$$;

create or replace function public.review_licence(p_verification_id uuid, p_approve boolean, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorised';
  end if;

  perform set_config('sparkyq.internal', 'true', true);

  update public.licence_verifications
  set status = case when p_approve then 'verified'::public.verification_status else 'rejected'::public.verification_status end,
      checked_at = now(),
      checked_by = auth.uid(),
      notes = coalesce(p_notes, notes)
  where id = p_verification_id
  returning user_id into v_user;

  if v_user is null then
    raise exception 'verification not found';
  end if;

  update public.profiles
  set verification_status = case when p_approve then 'verified'::public.verification_status else 'rejected'::public.verification_status end,
      updated_at = now()
  where id = v_user;

  insert into public.notifications (user_id, type, title, body, link)
  values (
    v_user,
    case when p_approve then 'verification_approved'::public.notification_type else 'verification_rejected'::public.notification_type end,
    case when p_approve then 'Your licence has been verified' else 'Your licence verification was not approved' end,
    case when p_approve then 'You can now answer questions and vote.' else 'Check your licence details and resubmit, or contact support.' end,
    '/settings'
  );

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (auth.uid(), case when p_approve then 'licence_approved' else 'licence_rejected' end, 'licence_verification', p_verification_id);
end;
$$;
