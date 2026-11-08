-- ============================================================
-- Push notifications for the iOS/Android app
-- ============================================================
-- Every in-app notification (except helpful votes) is also pushed to the member's devices.
-- Flow: notifications insert -> trigger -> pg_net POST {notification_id} -> Edge Function
-- `push` -> APNs. The trigger only sends an id; the function loads everything itself with
-- the service role, so nothing in the request is trusted.

create extension if not exists pg_net;

-- ---------- Device tokens ----------

create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "push tokens readable by owner"
  on public.push_tokens for select to authenticated
  using (user_id = auth.uid());

-- Writes go through these functions: a device token moves to whoever signs in on that phone,
-- which a plain update can't do under RLS (the row belongs to the previous user).
create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if p_platform not in ('ios', 'android') or length(p_token) not between 16 and 512 then
    raise exception 'invalid push token';
  end if;

  insert into public.push_tokens (token, user_id, platform)
  values (p_token, auth.uid(), p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

create or replace function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.push_tokens where token = p_token and user_id = auth.uid();
$$;

revoke all on function public.register_push_token(text, text) from public, anon;
revoke all on function public.unregister_push_token(text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;

-- ---------- Send on new notification ----------

-- Endpoint and shared secret live in Vault so they differ per environment:
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/push', 'push_function_url');
--   select vault.create_secret('<random secret>', 'push_webhook_secret');
-- Until both exist, nothing is sent (in-app notifications are unaffected).
create or replace function public.queue_push_for_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  -- Votes are frequent and low value; keep them in-app only
  if new.type = 'answer_helpful' then
    return new;
  end if;

  if not exists (select 1 from public.push_tokens where user_id = new.user_id) then
    return new;
  end if;

  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'push_function_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'push_webhook_secret';
  if v_url is null or v_secret is null then
    return new;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('notification_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret)
  );
  return new;
end;
$$;

create trigger notification_push
after insert on public.notifications
for each row execute function public.queue_push_for_notification();
