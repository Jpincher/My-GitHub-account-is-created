# Avatar controls: portfolio design standard

On every page with an avatar, place Mute/Unmute, Play/Pause/Resume and Stop together in that order, on one horizontal row immediately beneath the avatar. Align their bottom edges, use matching compact green styling and zero individual margins, and prevent wrapping at narrow widths. Retain keyboard focus indicators and translated labels. The final avatar layout stylesheet must follow legacy page styles.

Do not reintroduce a separate Mute row when changing page content or rebuilding the project. Keep automatic narration enabled for each page visit, respect the saved Mute choice, and retain the visible Play fallback when browsers block initial autoplay.

Before publishing changes to the generated runtime, run the avatar layout regression check:

```sh
npm --prefix tests install
npm --prefix tests test
```

This checks every avatar page, all three controls sharing a row, bottom alignment, zero margins and consistent minimum button height. It also checks for page-script errors. Use a browser for final visual checks at desktop and mobile widths.
