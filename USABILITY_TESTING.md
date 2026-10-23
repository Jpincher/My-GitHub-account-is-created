# Be my usability tester — first draft

Status: functional browser-only prototype. Shared online response collection and production developer authentication are not connected. This version must not be presented as a secure live research database. The page prominently tells testers to use fictional personal details.

## Included
- A translated English, Spanish and Chinese tester window, launched from the top of every project sidebar.
- A popup-window request; browser settings may choose a tab. The project remains open and the two windows coordinate internal project navigation.
- Five goal-based stops covering the overview, comparison, learner activities, tutor dashboards, materials and reflection. External project links are blocked only while the guided tester window is active.
- Nickname, optional email and exactly five optional demographic fields, with no more than five choices in each.
- Five core 1–5 radio ratings: interface, next-action clarity, readability, engagement and working controls. Two optional ratings add orientation and learning-purpose clarity.
- Self-reported task completion, section comments and a final comments page.
- Review → Done → aggregate report, with all identity, demographics, email and free-text comments omitted from the aggregate view.
- A developer preview using the requested code, with individual details, demographic percentages, text search and low/high score ordering.
- Explicit feedback-file download and developer import/export for manually combining draft responses.

## Data and security limits
Responses are held in sessionStorage in the current browser window. They are not transmitted to Jonathan or a shared server. Browser restoration can retain a session; anyone with access to that browser's developer tools can inspect local data. The developer code is a client-side preview control, not server-side access protection. Only a SHA-256 verifier is included in public source; do not commit the plaintext code to tests or configuration.

Before collecting real participant details, connect durable server-side storage and protect all individual-response endpoints with server-side authentication. Keep administrator credentials in runtime secrets. Expose public aggregate statistics only, and add server-side validation and request limits. Do not use a public GitHub issue or an embedded repository token as a response collector.

## Scoring
This is a custom diagnostic 1–5 scale, not the System Usability Scale. The anchors are 1 = unusable, 3 = usable and 5 = excellent and engaging. Each criterion and its anchors appear above five native radio choices. Unanswered, not-tested and skipped ratings are excluded, not treated as a score of 1. The v2 browser-session key and feedback schema keep earlier 0–10 records separate; no silent conversion is performed. A section score first averages that tester's valid criteria, then averages those section scores across testers. Each tester has equal weight within a section. Display the count of rated responses beside each average. Demographic percentages use all completed responses, including “Prefer not to say”; score/search filters do not change the demographic overview.

## Checks
Run `npm --prefix tests install` then `npm --prefix tests test`. Optional developer-preview checks can use JP_USABILITY_TEST_CODE in the local process environment; never put its value in source or shell history.
The local authoring environment remains offline. The complete repository jsdom suite has now passed on GitHub's runner, including form flow, 1–5 scoring, return navigation, privacy and login rejection. A rendered real-browser and participant review remains to be carried out.

## Research and browser references
- https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing
- https://www.gov.uk/service-manual/measuring-success/usability-benchmarking-a-website-or-whole-service
- https://developer.mozilla.org/en-US/docs/Web/API/Window/open

Question pages and the final comments page have a persistent return-to-introduction button in the header. Returning preserves answers. Each task ends with the instruction: “The buttons below will take you to the pages you are being asked to assess.” The profile notice begins “This information is not made public.”
