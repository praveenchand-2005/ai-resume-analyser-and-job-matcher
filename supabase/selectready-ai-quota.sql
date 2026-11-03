-- Insert-only usage events. The private trigger enforces quotas atomically.
drop function if exists public.claim_selectready_ai_request(text,integer,integer);
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;

create table if not exists public.ai_usage_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 action text not null,
 created_at timestamptz not null default now()
);
create index if not exists ai_usage_events_user_time_idx on public.ai_usage_events(user_id,created_at desc);
alter table public.ai_usage_events enable row level security;
drop policy if exists ai_usage_events_insert_own on public.ai_usage_events;
create policy ai_usage_events_insert_own on public.ai_usage_events for insert to authenticated
 with check ((select auth.uid())=user_id);
revoke all privileges on table public.ai_usage_events from anon,authenticated,public;
grant insert on table public.ai_usage_events to authenticated;

create or replace function private.enforce_selectready_ai_quota()
returns trigger language plpgsql security definer set search_path=pg_catalog
as $$
declare v_minute_count integer; v_day_count integer;
begin
 if new.user_id is null or new.user_id <> auth.uid() then
  raise exception 'AI_USAGE_OWNER_MISMATCH' using errcode='42501';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,0));
 select count(*) filter(where created_at>=now()-interval '1 minute'),
        count(*) filter(where created_at>=now()-interval '1 day')
 into v_minute_count,v_day_count
 from public.ai_usage_events where user_id=new.user_id;
 if v_minute_count>=8 or v_day_count>=40 then
  raise exception 'AI_RATE_LIMIT_REACHED' using errcode='P0001';
 end if;
 return new;
end;
$$;
revoke all on function private.enforce_selectready_ai_quota() from public,anon,authenticated;
drop trigger if exists enforce_selectready_ai_quota on public.ai_usage_events;
create trigger enforce_selectready_ai_quota before insert on public.ai_usage_events
for each row execute function private.enforce_selectready_ai_quota();
