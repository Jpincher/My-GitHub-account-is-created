# Homepage navigation repair — 23 October 2026

The latest owner-supplied homepage was uploaded as FinalHomepage.html.html. It depended on twelve standalone HTML destinations and portfolio-languages.js that were never committed to this repository. Prior index.html was an older design.

Both index.html and FinalHomepage.html.html now serve the supplied latest design with repaired navigation. The original uploaded HTML remains recoverable from commit dbb822727d517b7c349d9d2921f4f1348077a141.

Missing standalone pages were NOT recovered. Links now open the matching existing content in the learning-project runtime, including the owner's previously published CV extracts. Legacy URLs redirect to those sections. No CV details were invented.

| Previously missing destination | Existing published content |
| --- | --- |
| approach.html | interactive-learning.html#view=learning-design-considerations.html&section=section-top |
| question.html | interactive-learning.html#view=learning-design-considerations.html&section=criterion-2 |
| design.html | interactive-learning.html#view=learning-design-considerations.html&section=nav-section-7 |
| test.html | interactive-learning.html#view=learning-usability-testing.html&section=section-top |
| career.html | interactive-learning.html#view=learning-design-considerations.html&section=experience-and-standards |
| experience.html | interactive-learning.html#view=learning-design-considerations.html&section=experience-skillkit |
| accredited-course-design.html | interactive-learning.html#view=learning-design-considerations.html&section=experience-miid |
| audit-accountability.html | interactive-learning.html#view=learning-design-considerations.html&section=experience-skillkit |
| university-institute.html | interactive-learning.html#view=learning-design-considerations.html&section=experience-miid |
| cv.html | interactive-learning.html#view=learning-design-considerations.html&section=experience-and-standards |
| addie.html | interactive-learning.html#view=learning-design-considerations.html&section=nav-section-1 |
| featured-work.html | interactive-learning.html#view=interactive-learning.html&section=section-top |

portfolio-languages.js provides body, menu, accessible label and metadata translations in English, Spanish and Chinese. It uses jp-guide-language to share the preference with the learning project. Choosing a language works without localStorage. A lang query parameter can override the saved choice.

tests/homepage-navigation.cjs checks every homepage href/src and every redirect against repository files, checks project routes and fragment IDs against the actual runtime pages, and exercises language switching in a DOM (including body text, URL, accessible state, round-trip, saved preference and denied-storage behavior). DOM checks do not substitute for real Safari visual/usability testing.

The DRAFT watermark was removed from the final homepage. The usability form's collection status and the learning project's evidence limitations remain unchanged by this repair.

## Original translation recovery

A subsequent owner upload, FinalHomepage.html.webarchive (131,195 bytes), contains the original portfolio-languages.js (95,516 UTF-8 bytes), with 270 entries in each of Spanish and Chinese. Its main-resource URL identifies the final horizontal-language-buttons local preview. The separately uploaded HTML, Put my thinking to work | Jonathan Pincher.html, is byte-for-byte identical to the first HTML upload (blob a3a30dbd7ba48cb8ac3616eab927aa4a7c93829f).

The live language script now uses those original translations and original switching behavior. Small compatibility changes share the language preference with the learning project, update description metadata and refresh the saved preference on return. Additional accessible-label translations cover the repaired skip link. The archived original script is retained unchanged in tools/recovered-portfolio-languages.js. The archive contains only the homepage and its language script, not the standalone destination pages; their existing-content navigation mappings above remain in effect.


## Standalone portfolio restoration — 24 October 2026

Supersedes the redirect approach above. All twelve original homepage destinations now contain substantive standalone content recovered from the English keys and Spanish/Chinese translations in portfolio-languages.js. Original page markup was unavailable; the pages were rebuilt with the current shared homepage shell, typography, language controls and sidebar. Original destination mapping is restored across the sidebar, homepage graphic and recruiter navigation. The featured-work overview contains explicit launch buttons for the learning project. ADDIE has five independently expandable stages. The CV includes the original delivery evidence, career history, qualifications and working arrangements.

Automated checks cover every local destination/fragment, all twelve current-page menus and three-language round trips. Homepage-only recovery packages include these independent pages and keep portfolio navigation local.
