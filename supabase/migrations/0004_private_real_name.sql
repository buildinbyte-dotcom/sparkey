-- ============================================================
-- Keep profiles.real_name private
-- ============================================================
-- "profiles readable by authenticated" allows every row, and table-level SELECT
-- included real_name, so any member could read everyone's real name straight from
-- the API (the app only hid it by choosing columns). Column privileges close that:
-- members can read every other column; real names come from get_real_names(),
-- which only answers for yourself or for admins/moderators.

revoke select on public.profiles from anon, authenticated;

grant select (
  id, handle, display_name, state, trade_role, years_experience, bio, specialisations,
  verification_status, is_admin, is_moderator, is_expert, is_founding_member,
  reputation, safety_score, created_at, updated_at
) on public.profiles to authenticated;

create or replace function public.get_real_names(p_ids uuid[])
returns table (id uuid, real_name text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.real_name
  from public.profiles p
  where p.id = any (p_ids)
    and (p.id = auth.uid() or public.is_admin(auth.uid()));
$$;

revoke all on function public.get_real_names(uuid[]) from public, anon;
grant execute on function public.get_real_names(uuid[]) to authenticated;
