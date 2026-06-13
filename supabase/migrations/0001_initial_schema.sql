-- ============================================================
-- SparkyQ — initial schema
-- Profiles, verification, Q&A,
-- votes, flags, reputation ledger, notifications, admin.
-- ============================================================

-- ---------- Enums ----------

create type public.au_state as enum ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT');

create type public.trade_role as enum (
  'apprentice', 'electrician', 'supervisor', 'contractor', 'specialist'
);

create type public.verification_status as enum (
  'unverified', 'pending', 'verified', 'rejected', 'expired'
);

create type public.job_type as enum (
  'residential', 'commercial', 'industrial', 'solar_battery',
  'ev_charging', 'data_centre', 'controls', 'other'
);

create type public.urgency_level as enum ('normal', 'same_day', 'stuck_on_site');

create type public.risk_level as enum ('low', 'moderate', 'high', 'needs_expert');

create type public.question_status as enum ('open', 'resolved', 'closed', 'removed');

create type public.flag_reason as enum ('unsafe', 'spam', 'privacy', 'off_topic', 'other');

create type public.flag_status as enum ('open', 'upheld', 'dismissed');

create type public.flag_target as enum ('question', 'answer', 'comment');

create type public.review_verdict as enum ('confirmed_safe', 'disputed', 'unsafe');

create type public.notification_type as enum (
  'new_answer', 'answer_accepted', 'answer_helpful', 'comment',
  'verification_approved', 'verification_rejected', 'moderation', 'urgent_question'
);

create type public.reputation_reason as enum (
  'accepted_answer', 'helpful_vote', 'expert_confirmation',
  'reference_included', 'outcome_confirmed_answerer', 'outcome_confirmed_poster',
  'unsafe_answer_removed', 'spam_penalty', 'admin_adjustment'
);

-- ---------- Profiles ----------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 2 and 60),
  real_name text, -- private: only visible to self + admins via RLS
  state public.au_state not null,
  trade_role public.trade_role not null default 'electrician',
  years_experience int not null default 0 check (years_experience between 0 and 70),
  bio text check (char_length(bio) <= 1000),
  specialisations text[] not null default '{}',
  verification_status public.verification_status not null default 'unverified',
  is_admin boolean not null default false,
  is_moderator boolean not null default false,
  is_expert boolean not null default false,
  is_founding_member boolean not null default false,
  reputation int not null default 0,
  safety_score int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_state_idx on public.profiles (state);
create index profiles_verification_idx on public.profiles (verification_status);

-- ---------- Licence verifications ----------

create table public.licence_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  state public.au_state not null,
  licence_number text not null,
  licence_class text, -- e.g. "Qualified Supervisor Certificate", "A Grade"
  status public.verification_status not null default 'pending',
  expiry_date date,
  checked_at timestamptz,
  checked_by uuid references public.profiles (id),
  notes text, -- admin-only notes
  created_at timestamptz not null default now()
);

create index licence_verifications_user_idx on public.licence_verifications (user_id);
create index licence_verifications_status_idx on public.licence_verifications (status);

-- ---------- Tags ----------

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ---------- Questions ----------

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 8 and 160),
  body text not null check (char_length(body) between 10 and 10000),
  state public.au_state not null,
  job_type public.job_type not null default 'other',
  urgency public.urgency_level not null default 'normal',
  risk public.risk_level not null default 'low',
  status public.question_status not null default 'open',
  accepted_answer_id uuid, -- FK added after answers table exists
  outcome_note text check (char_length(outcome_note) <= 4000),
  view_count int not null default 0,
  needs_expert_review boolean not null default false,
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index questions_search_idx on public.questions using gin (search);
create index questions_created_idx on public.questions (created_at desc);
create index questions_author_idx on public.questions (author_id);
create index questions_state_idx on public.questions (state);
create index questions_job_type_idx on public.questions (job_type);
create index questions_urgency_idx on public.questions (urgency);

create table public.question_media (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  storage_path text not null,
  media_type text not null default 'image',
  created_at timestamptz not null default now()
);

create index question_media_question_idx on public.question_media (question_id);

create table public.question_tags (
  question_id uuid not null references public.questions (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (question_id, tag_id)
);

-- ---------- Answers ----------

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 10 and 10000),
  is_accepted boolean not null default false,
  is_removed boolean not null default false,
  helpful_count int not null default 0,
  includes_reference boolean not null default false, -- cites a standard / manual
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index answers_question_idx on public.answers (question_id);
create index answers_author_idx on public.answers (author_id);

alter table public.questions
  add constraint questions_accepted_answer_fk
  foreign key (accepted_answer_id) references public.answers (id) on delete set null;

-- ---------- Comments (clarifying questions only) ----------

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.questions (id) on delete cascade,
  answer_id uuid references public.answers (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 2 and 2000),
  is_removed boolean not null default false,
  created_at timestamptz not null default now(),
  check (num_nonnulls(question_id, answer_id) = 1)
);

create index comments_question_idx on public.comments (question_id);
create index comments_answer_idx on public.comments (answer_id);

-- ---------- Votes (helpful marks on answers) ----------

create table public.votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  answer_id uuid not null references public.answers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, answer_id)
);

-- ---------- Expert answer reviews ----------

create table public.answer_reviews (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.answers (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  verdict public.review_verdict not null,
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  unique (answer_id, reviewer_id)
);

-- ---------- Flags ----------

create table public.flags (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.flag_target not null,
  target_id uuid not null,
  reason public.flag_reason not null,
  detail text check (char_length(detail) <= 2000),
  status public.flag_status not null default 'open',
  resolved_by uuid references public.profiles (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index flags_status_idx on public.flags (status);
create index flags_target_idx on public.flags (target_type, target_id);

-- ---------- Reputation ledger ----------

create table public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  points int not null,
  reason public.reputation_reason not null,
  category public.job_type, -- category-specific reputation
  source_type text, -- 'answer' | 'question' | 'flag' | 'admin'
  source_id uuid,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index reputation_events_user_idx on public.reputation_events (user_id);

create table public.user_category_scores (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category public.job_type not null,
  score int not null default 0,
  primary key (user_id, category)
);

-- ---------- Notifications ----------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------- Waitlist (public landing page) ----------

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  state public.au_state,
  trade_role public.trade_role,
  licence_status text,
  specialisation text,
  created_at timestamptz not null default now()
);

-- ---------- Audit log ----------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  target_type text,
  target_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Helper functions
-- ============================================================

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin or is_moderator from public.profiles where id = uid),
    false
  );
$$;

create or replace function public.is_verified(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select verification_status = 'verified' from public.profiles where id = uid),
    false
  );
$$;

-- ============================================================
-- Triggers: reputation ledger -> profile + category scores
-- ============================================================

create or replace function public.apply_reputation_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

create trigger reputation_event_applied
after insert on public.reputation_events
for each row execute function public.apply_reputation_event();

-- Helpful vote -> +5 to answer author, bump helpful_count, notify
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

create trigger vote_inserted
after insert on public.votes
for each row execute function public.on_vote_insert();

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

create trigger vote_deleted
after delete on public.votes
for each row execute function public.on_vote_delete();

-- New answer -> notify question author
create or replace function public.on_answer_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question_author uuid;
  v_title text;
begin
  select author_id, title into v_question_author, v_title
  from public.questions where id = new.question_id;

  if v_question_author is not null and v_question_author <> new.author_id then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      v_question_author, 'new_answer',
      'New answer on your question',
      left(v_title, 120),
      '/questions/' || new.question_id
    );
  end if;

  return new;
end;
$$;

create trigger answer_inserted
after insert on public.answers
for each row execute function public.on_answer_insert();

-- Accepted answer -> +10 answerer (and +5 reference bonus), notify
create or replace function public.on_answer_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category public.job_type;
begin
  if new.is_accepted and not old.is_accepted then
    select job_type into v_category from public.questions where id = new.question_id;

    insert into public.reputation_events (user_id, points, reason, category, source_type, source_id)
    values (new.author_id, 10, 'accepted_answer', v_category, 'answer', new.id);

    if new.includes_reference then
      insert into public.reputation_events (user_id, points, reason, category, source_type, source_id)
      values (new.author_id, 5, 'reference_included', v_category, 'answer', new.id);
    end if;

    insert into public.notifications (user_id, type, title, link)
    values (new.author_id, 'answer_accepted', 'Your answer was accepted', '/questions/' || new.question_id);
  end if;

  return new;
end;
$$;

create trigger answer_accepted
after update of is_accepted on public.answers
for each row execute function public.on_answer_accepted();

-- Expert review -> +20 confirmation / unsafe handled via flags
create or replace function public.on_answer_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category public.job_type;
begin
  if new.verdict = 'confirmed_safe' then
    select q.job_type into v_category
    from public.answers a join public.questions q on q.id = a.question_id
    where a.id = new.answer_id;

    insert into public.reputation_events (user_id, points, reason, category, source_type, source_id, created_by)
    select a.author_id, 20, 'expert_confirmation', v_category, 'answer', a.id, new.reviewer_id
    from public.answers a where a.id = new.answer_id;
  end if;

  return new;
end;
$$;

create trigger answer_reviewed
after insert on public.answer_reviews
for each row execute function public.on_answer_review();

-- Outcome confirmed -> +5 answerer, +3 poster
create or replace function public.on_outcome_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_answer_author uuid;
begin
  if new.outcome_note is not null and old.outcome_note is null then
    insert into public.reputation_events (user_id, points, reason, category, source_type, source_id)
    values (new.author_id, 3, 'outcome_confirmed_poster', new.job_type, 'question', new.id);

    if new.accepted_answer_id is not null then
      select author_id into v_answer_author from public.answers where id = new.accepted_answer_id;
      if v_answer_author is not null and v_answer_author <> new.author_id then
        insert into public.reputation_events (user_id, points, reason, category, source_type, source_id)
        values (v_answer_author, 5, 'outcome_confirmed_answerer', new.job_type, 'answer', new.accepted_answer_id);
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger outcome_confirmed
after update of outcome_note on public.questions
for each row execute function public.on_outcome_confirmed();

-- High-risk keyword detection: auto-escalate risk on questions
create or replace function public.detect_high_risk()
returns trigger
language plpgsql
as $$
declare
  v_text text := lower(new.title || ' ' || new.body);
begin
  if v_text ~ '(live work|live working|hv |high voltage|switchboard|arc flash|arc fault|fire|battery bank|ups |generator|asbestos|ceiling space.*live)' then
    if new.risk = 'low' then
      new.risk := 'moderate';
    end if;
    new.needs_expert_review := true;
  end if;
  return new;
end;
$$;

create trigger question_risk_detection
before insert on public.questions
for each row execute function public.detect_high_risk();

-- Auto-create profile shell row is NOT done here: onboarding collects
-- required fields (state, role) so the app creates the profile explicitly.

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.licence_verifications enable row level security;
alter table public.tags enable row level security;
alter table public.questions enable row level security;
alter table public.question_media enable row level security;
alter table public.question_tags enable row level security;
alter table public.answers enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;
alter table public.answer_reviews enable row level security;
alter table public.flags enable row level security;
alter table public.reputation_events enable row level security;
alter table public.user_category_scores enable row level security;
alter table public.notifications enable row level security;
alter table public.waitlist enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: any authenticated user can read; users manage their own row.
create policy "profiles readable by authenticated"
  on public.profiles for select to authenticated using (true);

create policy "users create own profile"
  on public.profiles for insert to authenticated
  with check (id = auth.uid() and is_admin = false and is_moderator = false and is_expert = false);

create policy "users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()));

-- Licence verifications: owner + admins only.
create policy "licence read own or admin"
  on public.licence_verifications for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "licence insert own"
  on public.licence_verifications for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

create policy "licence update admin"
  on public.licence_verifications for update to authenticated
  using (public.is_admin(auth.uid()));

-- Tags readable by all authenticated; admin-managed.
create policy "tags readable" on public.tags for select to authenticated using (true);
create policy "tags admin write" on public.tags for insert to authenticated
  with check (public.is_admin(auth.uid()));

-- Questions: verified-trade-only content -> authenticated users only.
create policy "questions readable by authenticated"
  on public.questions for select to authenticated
  using (status <> 'removed' or author_id = auth.uid() or public.is_admin(auth.uid()));

create policy "questions insert by author"
  on public.questions for insert to authenticated
  with check (author_id = auth.uid());

create policy "questions update by author or admin"
  on public.questions for update to authenticated
  using (author_id = auth.uid() or public.is_admin(auth.uid()));

-- Question media
create policy "question media readable"
  on public.question_media for select to authenticated using (true);

create policy "question media insert by question author"
  on public.question_media for insert to authenticated
  with check (exists (
    select 1 from public.questions q
    where q.id = question_id and q.author_id = auth.uid()
  ));

-- Question tags
create policy "question tags readable"
  on public.question_tags for select to authenticated using (true);

create policy "question tags insert by question author"
  on public.question_tags for insert to authenticated
  with check (exists (
    select 1 from public.questions q
    where q.id = question_id and q.author_id = auth.uid()
  ));

-- Answers: only VERIFIED electricians (not apprentices' unverified accounts) may answer.
create policy "answers readable by authenticated"
  on public.answers for select to authenticated
  using (not is_removed or author_id = auth.uid() or public.is_admin(auth.uid()));

create policy "answers insert by verified"
  on public.answers for insert to authenticated
  with check (author_id = auth.uid() and public.is_verified(auth.uid()));

create policy "answers update by author or admin"
  on public.answers for update to authenticated
  using (author_id = auth.uid() or public.is_admin(auth.uid()));

-- Comments
create policy "comments readable by authenticated"
  on public.comments for select to authenticated using (not is_removed or public.is_admin(auth.uid()));

create policy "comments insert by authenticated"
  on public.comments for insert to authenticated
  with check (author_id = auth.uid());

create policy "comments update by author or admin"
  on public.comments for update to authenticated
  using (author_id = auth.uid() or public.is_admin(auth.uid()));

-- Votes: verified users only.
create policy "votes readable" on public.votes for select to authenticated using (true);

create policy "votes insert by verified"
  on public.votes for insert to authenticated
  with check (user_id = auth.uid() and public.is_verified(auth.uid()));

create policy "votes delete own"
  on public.votes for delete to authenticated using (user_id = auth.uid());

-- Answer reviews: experts/moderators only.
create policy "reviews readable" on public.answer_reviews for select to authenticated using (true);

create policy "reviews insert by experts"
  on public.answer_reviews for insert to authenticated
  with check (
    reviewer_id = auth.uid() and
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and (p.is_expert or p.is_moderator or p.is_admin)
    )
  );

-- Flags: reporters create; admins manage; reporters see their own.
create policy "flags read own or admin"
  on public.flags for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin(auth.uid()));

create policy "flags insert by authenticated"
  on public.flags for insert to authenticated
  with check (reporter_id = auth.uid());

create policy "flags update admin"
  on public.flags for update to authenticated
  using (public.is_admin(auth.uid()));

-- Reputation events: readable by owner + admins (writes happen in triggers/definer fns).
create policy "reputation read own or admin"
  on public.reputation_events for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "reputation insert admin"
  on public.reputation_events for insert to authenticated
  with check (public.is_admin(auth.uid()));

-- Category scores: public within the network.
create policy "category scores readable"
  on public.user_category_scores for select to authenticated using (true);

-- Notifications: own only.
create policy "notifications read own"
  on public.notifications for select to authenticated using (user_id = auth.uid());

create policy "notifications update own"
  on public.notifications for update to authenticated using (user_id = auth.uid());

-- Waitlist: anonymous insert allowed (landing page), no reads except admin.
create policy "waitlist insert by anyone"
  on public.waitlist for insert to anon, authenticated with check (true);

create policy "waitlist read admin"
  on public.waitlist for select to authenticated using (public.is_admin(auth.uid()));

-- Audit logs: admins only.
create policy "audit read admin"
  on public.audit_logs for select to authenticated using (public.is_admin(auth.uid()));

create policy "audit insert admin"
  on public.audit_logs for insert to authenticated
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- Moderation RPCs (security definer so admins can act atomically)
-- ============================================================

-- Uphold an unsafe-answer flag: remove answer, apply penalty, log.
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

-- Approve/reject a licence verification and sync the profile.
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

-- Increment view count without granting general update rights.
create or replace function public.increment_question_views(p_question_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.questions set view_count = view_count + 1 where id = p_question_id;
$$;

-- ============================================================
-- Storage: question media bucket
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-media', 'question-media', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

create policy "question media upload by authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'question-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "question media public read"
  on storage.objects for select to public
  using (bucket_id = 'question-media');

create policy "question media delete own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'question-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- Seed tags
-- ============================================================

insert into public.tags (slug, name, description) values
  ('switchboard', 'Switchboard', 'Switchboards, mains, metering, upgrades'),
  ('fault-finding', 'Fault finding', 'Diagnosing faults and intermittent issues'),
  ('as-nzs-3000', 'AS/NZS 3000', 'Wiring Rules questions and clause references'),
  ('rcd', 'RCD', 'RCDs, nuisance tripping, testing'),
  ('solar', 'Solar', 'Solar PV installation and troubleshooting'),
  ('battery', 'Battery', 'Battery storage systems'),
  ('ev-charger', 'EV charger', 'EV charging equipment and installation'),
  ('ups', 'UPS', 'Uninterruptible power supplies'),
  ('data-centre', 'Data centre', 'Data centre and critical power'),
  ('testing', 'Testing', 'Test and tag, installation testing, commissioning'),
  ('controls', 'Controls', 'Automation, contactors, relays, PLCs'),
  ('lighting', 'Lighting', 'Lighting circuits and control'),
  ('three-phase', 'Three phase', 'Three-phase supply and equipment'),
  ('cable-sizing', 'Cable sizing', 'Cable selection, derating, volt drop'),
  ('apprentice', 'Apprentice help', 'Learning-safe questions for apprentices'),
  ('quoting', 'Quoting & business', 'Pricing, quoting and running a trade business'),
  ('tools', 'Tools', 'Tools and equipment'),
  ('compliance', 'Compliance', 'Certificates, notifications, defect handling')
on conflict (slug) do nothing;
