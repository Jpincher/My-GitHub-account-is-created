# Live usability integration — deployment preparation

Live deployment completed on 23 October 2026. Supabase project uyjwotszvggcoutalobr in Jpincher’s Org (London) hosts the protected dataset and API. The original preview notice was removed after hosted database, authentication and actual inbox-delivery verification.

Prepared components:
- supabase/schema/usability-live.sql: a new empty live dataset; server-only response, session, rate-limit, configuration and transactional outbox tables. No legacy imports or destructive reset.
- supabase/functions/usability-api/core.mjs: strict 1–5 response validation, equal-weight per-tester section averages and personal-data-free individual/running email summaries.
- supabase/functions/usability-api/index.ts: public submission/aggregate endpoints; server-verified owner code; expiring opaque owner sessions; private paginated individual records; idempotent save plus outbox; rate limits; CORS; provider delivery and retries.
- supabase/schema/usability-notification-cron.sql: database retry worker every five minutes. This retries failures; initial notification is attempted immediately on submission.
- tools/enable-live-usability.cjs: guarded frontend conversion. It refuses activation unless backend health confirms live readiness AND independently verified email delivery.
- tools/usability-live-client.js and usability-live-text.json: live report/submission/login behavior and English/Spanish/Chinese consent, privacy and error text.
- tests/live-usability.cjs and .sql: mock-network DOM tests plus real PostgreSQL transactional privacy/idempotency/summary/outbox/rate-limit checks.

Deployment order:
1. User selects the Supabase organization. Inspect projects, pricing and tables before creating/applying anything. Nonzero costs require agreement.
2. Create a London-region project if supported; wait for ready. Inspect tables/extensions. Apply the SQL with Supabase migration tools.
3. Deploy usability-api with its local core.mjs dependency and no package dependencies. verify_jwt=false is necessary because the function authenticates owner sessions itself and accepts anonymous feedback. No service/secret key enters the frontend.
4. Verify unauthorized records access and raw Data API access are denied. Test database operations transactionally with rollback. Run security advisors.
5. Sign in with the owner's requested code. Send a clearly labelled SETUP TEST through delivery-test. The notification provider is FormSubmit. Only anonymous task outcomes, score summaries, running averages and response ID are sent through the provider; names, email, demographics and free comments stay in the protected database.
6. Activate the owner recipient if required and verify the actual delivered setup email through the connected owner mailbox. Only then set delivery_verified=true via trusted database tooling. Do not equate an HTTP provider acknowledgement with inbox delivery.
7. Install the retry cron after checking extensions. Sign in and call enable. Confirm live dataset and outbox both remain empty before the first genuine test. No public test records should be inserted; use rollback or the non-recording delivery-test.
8. Write usability-live-config.json containing ONLY {endpoint:"https://PROJECT.supabase.co/functions/v1/usability-api"}. Run node tools/enable-live-usability.cjs; it verifies health before changing the public form. Preserve the tester-only Jonathan Pincher header.
9. Run full checks. Adjust the old prototype-only test entry to run the new live suite once the public form is converted. Update section 11's prototype collection wording in all three languages, completion status and private owner guide. Publish, verify GitHub Pages, and refresh the complete backup.
10. Verify a genuine end-to-end user submission with the owner when testing begins: independent browser aggregate, protected owner details, individual/running email and retry status. Future owner responses are live data; never delete them as “test cleanup”.

Verified deployment:
- Organization selection confirmed by the owner.
- Hosted transactional database checks passed with rollback and zero live records.
- FormSubmit activated for the actual tester URL. A SETUP TEST email with individual scores and running totals was received and read in the owner mailbox.
- Live readiness and delivery verification enabled. Security and performance advisors return no findings.
- No prototype responses were imported; no sample rows remain.
- Public source never contains a service/secret key or the plaintext developer code.

Private code: use the value requested in the conversation. Only its digest exists in server source. Do not add its plaintext to public GitHub or releases. The original client-side digest gate is removed by the live conversion.
