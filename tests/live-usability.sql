begin;
set local role service_role;
do $test$
declare sample jsonb:='{"schema":"jp-usability-live-v1","id":"test-response-00000001","created":"2026-10-23T12:00:00Z","projectVersion":"test-only","consent":true,"profile":{"nickname":"PRIVATE_TEST_NAME","email":"private@example.test","followup":true,"age":1,"gender":1,"role":1,"experience":1,"device":1},"sections":{"overview":{"outcome":0,"ratings":{"interface":1,"next":null,"readability":null,"engagement":null,"function":null,"orientation":null,"purpose":null},"comment":""},"comparison":{"outcome":0,"ratings":{"interface":1,"next":null,"readability":null,"engagement":null,"function":null,"orientation":null,"purpose":null},"comment":""},"activities":{"outcome":0,"ratings":{"interface":1,"next":null,"readability":null,"engagement":null,"function":null,"orientation":null,"purpose":null},"comment":""},"dashboards":{"outcome":0,"ratings":{"interface":1,"next":null,"readability":null,"engagement":null,"function":null,"orientation":null,"purpose":null},"comment":""},"materials":{"outcome":0,"ratings":{"interface":1,"next":null,"readability":null,"engagement":null,"function":null,"orientation":null,"purpose":null},"comment":""}},"comments":{"worked":"","improve":"","barriers":"","anything":""}}'::jsonb; result jsonb; second jsonb; s jsonb; n integer;
begin
 if (public.jp_usability_live_summary()->>'total')::integer<>0 then raise exception 'Dataset not empty'; end if;
 result:=public.jp_usability_live_submit(sample);
 if result->>'saved'<>'true' or result->>'duplicate'<>'false' then raise exception 'First save failed'; end if;
 result:=public.jp_usability_live_submit(sample);
 if result->>'duplicate'<>'true' then raise exception 'Duplicate created'; end if;
 second:=jsonb_set(sample,'{id}','"test-response-00000002"');
 second:=jsonb_set(second,'{sections}','{"overview":{"outcome":0,"ratings":{"interface":5,"next":5,"readability":5,"engagement":5,"function":5,"orientation":5,"purpose":5},"comment":""},"comparison":{"outcome":0,"ratings":{"interface":5,"next":5,"readability":5,"engagement":5,"function":5,"orientation":5,"purpose":5},"comment":""},"activities":{"outcome":0,"ratings":{"interface":5,"next":5,"readability":5,"engagement":5,"function":5,"orientation":5,"purpose":5},"comment":""},"dashboards":{"outcome":0,"ratings":{"interface":5,"next":5,"readability":5,"engagement":5,"function":5,"orientation":5,"purpose":5},"comment":""},"materials":{"outcome":0,"ratings":{"interface":5,"next":5,"readability":5,"engagement":5,"function":5,"orientation":5,"purpose":5},"comment":""}}'::jsonb);
 perform public.jp_usability_live_submit(second);
 s:=public.jp_usability_live_summary();
 if (s->>'total')::integer<>2 or (s->'sections'->0->>'average')::numeric<>3 then raise exception 'Incorrect shared averages'; end if;
 if s::text like '%PRIVATE_TEST_NAME%' or s::text like '%private@example.test%' then raise exception 'Public summary leaks identity'; end if;
 select count(*) into n from public.jp_usability_live_claim(5); if n<>2 then raise exception 'Outbox not created'; end if;
 select count(*) into n from public.jp_usability_live_claim(5); if n<>0 then raise exception 'Email claimed twice'; end if;
 if not public.jp_usability_live_limit('test-only',2,now()+interval '1 hour') then raise exception 'Rate limit first attempt'; end if;
 if not public.jp_usability_live_limit('test-only',2,now()+interval '1 hour') then raise exception 'Rate limit second attempt'; end if;
 if public.jp_usability_live_limit('test-only',2,now()+interval '1 hour') then raise exception 'Rate limit ineffective'; end if;
 if has_table_privilege('anon','public.jp_usability_live_responses','select') or has_table_privilege('authenticated','public.jp_usability_live_responses','select') then raise exception 'Individuals publicly readable'; end if;
 if has_function_privilege('anon','public.jp_usability_live_submit(jsonb)','execute') or has_function_privilege('authenticated','public.jp_usability_live_summary()','execute') then raise exception 'Privileged RPC exposed'; end if;
end $test$;
rollback;
select case when count(*)=0 then 'PASS: live dataset clean after transactional database tests' else 'FAIL' end from public.jp_usability_live_responses;
