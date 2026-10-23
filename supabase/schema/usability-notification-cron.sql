-- Apply only after inspecting installed extensions and creating the live API.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;
create function public.jp_usability_live_retry_tick() returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
 declare config public.jp_usability_live_config;
 begin
  select * into config from public.jp_usability_live_config where id=true and ready=true;
  if not found then return; end if;
  if not exists(select 1 from public.jp_usability_live_outbox where (state='pending' and next_attempt_at<=now()) or (state='sending' and claimed_until<now())) then return; end if;
  perform net.http_post(url:=config.function_url,
   headers:=jsonb_build_object('Content-Type','application/json'),
   body:=jsonb_build_object('action','flush','notifyToken',config.notify_token),
   timeout_milliseconds:=90000);
 end $$;
revoke all on function public.jp_usability_live_retry_tick() from public,anon,authenticated;
grant execute on function public.jp_usability_live_retry_tick() to service_role;
select cron.schedule('jp-usability-live-email-retry','*/5 * * * *','select public.jp_usability_live_retry_tick()');
