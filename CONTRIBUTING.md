# Avatar controls: portfolio design standard

On every page with an avatar, place Mute/Unmute, Play/Pause/Resume and Stop together in that order, on one horizontal row immediately beneath the avatar. Align their bottom edges, use matching compact green styling and zero individual margins, and prevent wrapping at narrow widths. Retain keyboard focus indicators and translated labels. The final avatar layout stylesheet must follow legacy page styles.

Do not reintroduce a separate Mute row when changing page content or rebuilding the project. Offer one translated “Start experience with sound” action on initial arrival, then automatically narrate subsequent page visits using the same audio element. Call audio.play() synchronously from the real start click. Do not fake browser clicks or restart sound merely because the viewer changes language before starting. Remove the start button immediately when clicked and do not show it again during internal navigation. Do not add a separate silent-browsing button or welcome panel. Centre the start button beneath the body-text column on the same horizontal row as the avatar's playback buttons, with both groups aligned along their bottom edges. Respect both Mute controls across pages. Retain the visible Play fallback if the browser blocks playback.

Before publishing changes to the generated runtime, run the avatar layout regression check:

```sh
npm --prefix tests install
npm --prefix tests test
```

This checks every avatar page, all three controls sharing a row, bottom alignment, zero margins and consistent minimum button height. It also checks for page-script errors. Use a browser for final visual checks at desktop and mobile widths.

The sound regression check covers first arrival, translated start labels, synchronous audio start, automatic narration across navigation, shared audio reuse, persistent mute, the disappearing start action and blocked-playback fallback.


## Guided usability testing
Keep the tester launch button directly below the “Learning by design.” heading and above “Mute voice” in every project sidebar. Use the same green palette and compact controls. Keep tester instructions next to the buttons for the pages they describe, retain English/Spanish/Chinese content, and show honest dataset scope beside every report. The current tester is a browser-only first draft; see USABILITY_TESTING.md before enabling shared collection or collecting real personal information.

The usability tester uses a 1–5 native-radio scale (1 unusable, 3 usable, 5 excellent and engaging). Put each criterion and its scale anchors above its choices. Keep the return-to-introduction action visible on question pages and preserve answers when returning. Task instructions end by explaining that the buttons below open the pages being assessed. Keep old 0–10 draft records separate from the 1–5 schema.

Keep the usability-launch and sidebar Mute voice buttons equal in width, using the existing common left edge; extend the shorter control instead of moving either button. The usability introduction includes a separate example-testing note beneath its title, with a full line of space before the task introduction. Keep the wording accurate about feedback shared with the designer while collection remains browser-only.


## Usability rationale section
Keep “11 — Usability testing” immediately after instructional design in every sidebar. Curriculum, Reflection and Bibliography follow as 12, 13 and 14. The section has a real runtime route and direct entry file `learning-usability-testing.html`; keep its anchors and EN/ES/ZH labels consistent in all menus. It is separate from the “Be a usability tester” questionnaire launcher.

The explanatory page describes proposed evaluation methods, the complete control inventory, accessibility, networks/internet conditions and evidence limitations. Do not invent completed participant studies or imply that browser-only feedback is collected online. Elena is a joint least-used guide. Her new narration is explicitly labelled a browser-voice preview, with per-language voice selection and a readable transcript; a matching recorded voice is still pending. Keep stop/restart, mute and route cleanup functional, and never reuse an unrelated recording for a new script.

`tests/usability-section.cjs` checks every menu, destinations, numbering, heading/arrow behaviour, script compilation and browser-speech playback controls. Browser rendering/audio still need testing on actual browsers and networks.
