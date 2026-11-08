-- ============================================================
-- Local test data. Runs on `supabase start` (first time) and `supabase db reset`.
-- Never run against the cloud project.
--
-- Sign in with any of these emails; the 6-digit code arrives in Mailpit
-- (http://127.0.0.1:54324), nothing is actually emailed.
--
--   admin@sparkyq.test    admin + verified, NSW     -> /admin dashboard
--   nsw.sparky@sparkyq.test   verified NSW electrician, 8 yrs
--   vic.sparky@sparkyq.test   verified VIC contractor, 15 yrs, expert reviewer
--   pending@sparkyq.test  licence submitted, awaiting admin approval
--   new@sparkyq.test      auth user with no profile -> onboarding flow
--   review@sparkyq.test   App Store reviewer: password "sparkyq-review-local" at /login/review
--                         (needs APP_REVIEW_EMAIL=review@sparkyq.test in .env.development.local)
-- ============================================================

-- Let seed updates through the privileged-field guards
select set_config('sparkyq.internal', 'true', false);

-- ---------- Auth users ----------

insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'admin@sparkyq.test'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'nsw.sparky@sparkyq.test'),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'vic.sparky@sparkyq.test'),
  ('a0000000-0000-4000-8000-000000000004'::uuid, 'pending@sparkyq.test'),
  ('a0000000-0000-4000-8000-000000000005'::uuid, 'new@sparkyq.test')
) as u (id, email);

-- Reviewer account signs in with a password instead of an emailed code
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000006',
  'authenticated', 'authenticated', 'review@sparkyq.test',
  extensions.crypt('sparkyq-review-local', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.email like '%@sparkyq.test';

-- ---------- Profiles (new@ deliberately has none) ----------

insert into public.profiles (
  id, handle, display_name, real_name, state, trade_role, years_experience, bio,
  specialisations, verification_status, is_admin, is_expert, is_founding_member
) values
  ('a0000000-0000-4000-8000-000000000001', 'admin_sparky', 'SparkyQ Admin', 'Test Admin',
   'NSW', 'supervisor', 20, 'Local test admin account.',
   '{switchboard,testing}', 'verified', true, true, true),
  ('a0000000-0000-4000-8000-000000000002', 'nsw_sparky', 'Dave from Parramatta', 'Dave Test',
   'NSW', 'electrician', 8, 'Resi and light commercial around Western Sydney.',
   '{switchboard,fault-finding,rcd}', 'verified', false, false, true),
  ('a0000000-0000-4000-8000-000000000003', 'vic_sparky', 'Priya, Geelong', 'Priya Test',
   'VIC', 'contractor', 15, 'Solar, batteries and EV chargers. REC holder.',
   '{solar,battery,ev-charger}', 'verified', false, true, false),
  ('a0000000-0000-4000-8000-000000000004', 'pending_sparky', 'New apprentice', 'Sam Test',
   'NSW', 'apprentice', 2, null,
   '{lighting}', 'pending', false, false, false),
  ('a0000000-0000-4000-8000-000000000006', 'app_review', 'App Review', 'App Review',
   'NSW', 'electrician', 5, 'Account for App Store / Google Play review.',
   '{}', 'verified', false, false, false);

-- Verified members have a checked licence, as they would after admin review
insert into public.licence_verifications
  (user_id, state, licence_number, licence_class, status, checked_at, checked_by)
values
  ('a0000000-0000-4000-8000-000000000001', 'NSW', '100001S', 'Qualified Supervisor', 'verified', now(), 'a0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000002', 'NSW', '200002C', 'Contractor licence', 'verified', now(), 'a0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000003', 'VIC', 'REC-30003', 'A Grade', 'verified', now(), 'a0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000006', 'NSW', '600006C', 'Contractor licence', 'verified', now(), 'a0000000-0000-4000-8000-000000000001');

insert into public.licence_verifications (user_id, state, licence_number, licence_class, status)
values ('a0000000-0000-4000-8000-000000000004', 'NSW', '123456C', 'Electrician (supervised)', 'pending');

-- ---------- Questions ----------

insert into public.questions (id, author_id, title, body, state, job_type, urgency, risk, created_at) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   'RCD tripping intermittently on a new switchboard upgrade',
   'Just swapped an old board for a new one with 4 RCBOs. The kitchen circuit trips every few hours, no obvious pattern. IR test looked fine at 500V. Anyone seen this with fridges or induction cooktops?',
   'NSW', 'residential', 'same_day', 'moderate', now() - interval '3 hours'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003',
   'Battery inverter showing isolation fault after rain',
   'Hybrid inverter throwing an isolation fault each morning after overnight rain, clears by midday. Array is 6 years old. Where would you start before pulling the whole string apart?',
   'VIC', 'solar_battery', 'stuck_on_site', 'high', now() - interval '40 minutes'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002',
   'Cable sizing for a 7kW EV charger at 35m run',
   'Single phase 7kW charger, 35m run from the board in a garage, clipped direct for most of it. What size are people running to keep volt drop under 5%?',
   'NSW', 'ev_charging', 'normal', 'low', now() - interval '2 days');

insert into public.question_tags (question_id, tag_id)
select q.id, t.id
from (values
  ('b0000000-0000-4000-8000-000000000001'::uuid, 'rcd'),
  ('b0000000-0000-4000-8000-000000000001'::uuid, 'switchboard'),
  ('b0000000-0000-4000-8000-000000000001'::uuid, 'fault-finding'),
  ('b0000000-0000-4000-8000-000000000002'::uuid, 'solar'),
  ('b0000000-0000-4000-8000-000000000002'::uuid, 'battery'),
  ('b0000000-0000-4000-8000-000000000003'::uuid, 'ev-charger'),
  ('b0000000-0000-4000-8000-000000000003'::uuid, 'cable-sizing')
) as q (id, slug)
join public.tags t on t.slug = q.slug;

-- ---------- Answers ----------

insert into public.answers (id, question_id, author_id, body, includes_reference, created_at) values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
   'a0000000-0000-4000-8000-000000000003',
   'Check for a shared neutral between the kitchen and another circuit first, very common on old boards being split onto RCBOs. Also measure standing earth leakage with a clamp meter; induction tops plus a fridge can sit close to the threshold.',
   false, now() - interval '2 hours'),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003',
   'a0000000-0000-4000-8000-000000000003',
   'At 32A and 35m clipped direct, 6mm² copper usually keeps you under 5% volt drop, but run the numbers from AS/NZS 3008 for your actual installation method and any grouping.',
   true, now() - interval '1 day');

-- Accept the cable-sizing answer through the real trigger (awards reputation + notification)
update public.answers set is_accepted = true where id = 'c0000000-0000-4000-8000-000000000002';
update public.questions
  set accepted_answer_id = 'c0000000-0000-4000-8000-000000000002', status = 'resolved'
  where id = 'b0000000-0000-4000-8000-000000000003';

-- Helpful votes (fire the vote triggers)
insert into public.votes (user_id, answer_id) values
  ('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002');

-- Clarifying comment
insert into public.comments (question_id, author_id, body) values
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
   'Is it a transformerless inverter? And are the DC isolators on the roof the old style?');

-- An open flag for the admin moderation queue
insert into public.flags (reporter_id, target_type, target_id, reason, detail)
values ('a0000000-0000-4000-8000-000000000002', 'answer', 'c0000000-0000-4000-8000-000000000001',
        'other', 'Test flag for the moderation queue.');

select set_config('sparkyq.internal', '', false);

-- ---------- Push notifications (local) ----------
-- Points the notification_push trigger at the local Edge Function. The secret matches
-- PUSH_WEBHOOK_SECRET in config.toml. Without APNs keys the function only logs (dry run).
select vault.create_secret('http://kong:8000/functions/v1/push', 'push_function_url');
select vault.create_secret('local-push-secret', 'push_webhook_secret');
