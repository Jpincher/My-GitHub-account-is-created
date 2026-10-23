-- Live usability dataset. No draft records are imported or existing records deleted.
create table public.jp_usability_live_responses (
 id text primary key check (length(id) between 12 and 100),
 submitted_at timestamptz not null default now(),
 payload jsonb not null check (payload->>'schema'='jp-usability-live-v1' and payload->>'id'=id and payload->'consent'='true'::jsonb)
);
create table public.jp_usability_live_sessions (
 token_hash text primary key, expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
create table public.jp_usability_live_limits (
 bucket text primary key, attempts integer not null default 1, expires_at timestamptz not null
);
create table public.jp_usability_live_outbox (
 response_id text primary key references public.jp_usability_live_responses(id),
 summary jsonb not null, state text not null default 'pending' check(state in ('pending','sending','sent')),
 attempts integer not null default 0, next_attempt_at timestamptz not null default now(),
 claimed_until timestamptz, sent_at timestamptz, last_error text
);
create table public.jp_usability_live_config (
 id boolean primary key default true check(id),
 function_url text not null, notify_token text not null, delivery_verified boolean not null default false, ready boolean not null default false
);
alter table public.jp_usability_live_responses enable row level security;
alter table public.jp_usability_live_sessions enable row level security;
alter table public.jp_usability_live_limits enable row level security;
alter table public.jp_usability_live_outbox enable row level security;
alter table public.jp_usability_live_config enable row level security;
revoke all on public.jp_usability_live_responses,public.jp_usability_live_sessions,public.jp_usability_live_limits,public.jp_usability_live_outbox,public.jp_usability_live_config from public,anon,authenticated;
grant select,insert,update,delete on public.jp_usability_live_responses,public.jp_usability_live_sessions,public.jp_usability_live_limits,public.jp_usability_live_outbox,public.jp_usability_live_config to service_role;

create function public.jp_usability_live_summary() returns jsonb
language sql stable security invoker set search_path=public,pg_temp as $$
 with stage_ids as (
  select * from (values('overview',1),('comparison',2),('activities',3),('dashboards',4),('materials',5)) s(id,position)
 ), per_response as (
  select r.id,s.id as stage_id,avg((m.value#>>'{}')::numeric) as score
  from public.jp_usability_live_responses r cross join stage_ids s
  cross join lateral jsonb_each(r.payload->'sections'->s.id->'ratings') m
  where jsonb_typeof(m.value)='number' group by r.id,s.id
 ), stages as (
  select s.id,s.position,count(p.score)::integer as n,avg(p.score) as average
  from stage_ids s left join per_response p on p.stage_id=s.id group by s.id,s.position
 )
 select jsonb_build_object('schema','jp-usability-live-v1','total',(select count(*) from public.jp_usability_live_responses),
 'sections',(select jsonb_agg(jsonb_build_object('id',id,'n',n,'average',average) order by position) from stages))
$$;

create function public.jp_usability_live_limit(p_bucket text,p_limit integer,p_expiry timestamptz) returns boolean
language plpgsql security invoker set search_path=public,pg_temp as $$
 declare n integer;
 begin
  delete from public.jp_usability_live_limits where expires_at<now();
  insert into public.jp_usability_live_limits(bucket,expires_at) values(p_bucket,p_expiry)
  on conflict(bucket) do update set attempts=jp_usability_live_limits.attempts+1 returning attempts into n;
  return n<=p_limit;
 end $$;

create function public.jp_usability_live_submit(p_record jsonb) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
 declare result jsonb; existing jsonb; rid text:=p_record->>'id';
 begin
  perform pg_advisory_xact_lock(hashtext('jp-usability-live-v1'));
  select payload into existing from public.jp_usability_live_responses where id=rid;
  if existing is not null then
   if existing<>p_record then raise exception 'Response identifier already used'; end if;
   return jsonb_build_object('saved',true,'duplicate',true,'summary',public.jp_usability_live_summary());
  end if;
  insert into public.jp_usability_live_responses(id,payload) values(rid,p_record);
  result:=public.jp_usability_live_summary();
  insert into public.jp_usability_live_outbox(response_id,summary) values(rid,result);
  return jsonb_build_object('saved',true,'duplicate',false,'summary',result);
 end $$;

create function public.jp_usability_live_claim(p_max integer default 5) returns setof public.jp_usability_live_outbox
language sql security invoker set search_path=public,pg_temp as $$
 update public.jp_usability_live_outbox o set state='sending',claimed_until=now()+interval '2 minutes',attempts=attempts+1
 where response_id in (
  select response_id from public.jp_usability_live_outbox
  where (state='pending' and next_attempt_at<=now()) or (state='sending' and claimed_until<now())
  order by next_attempt_at limit least(greatest(p_max,1),5) for update skip locked
 ) returning o.*
$$;

revoke all on function public.jp_usability_live_summary() from public,anon,authenticated;
revoke all on function public.jp_usability_live_limit(text,integer,timestamptz) from public,anon,authenticated;
revoke all on function public.jp_usability_live_submit(jsonb) from public,anon,authenticated;
revoke all on function public.jp_usability_live_claim(integer) from public,anon,authenticated;
grant execute on function public.jp_usability_live_summary(),public.jp_usability_live_limit(text,integer,timestamptz),public.jp_usability_live_submit(jsonb),public.jp_usability_live_claim(integer) to service_role;
