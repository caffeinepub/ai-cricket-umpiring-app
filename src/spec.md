# Specification

## Summary
**Goal:** Run a glitch-fix/QA pass for MR.AI UMPIRE to resolve runtime issues, UI regressions, and branding/text inconsistencies.

**Planned changes:**
- Perform end-to-end manual QA across recording/camera, upload, analysis playback, theme toggle, and navigation/back flow; fix any runtime errors, broken UI states, or regressions found.
- Update visible branding text so the app name consistently displays as "MR.AI UMPIRE" (including the header) with no remaining old-name occurrences.
- Remove or properly implement empty/placeholder frontend components that may be included in the build, and fix theme toggle behavior when the initial theme is set to "system" (ensure reliable light/dark switching and no blank renders).
- Address timer/interval lifecycle issues during play/pause so intervals are created/cleaned up correctly and do not stack or leak.

**User-visible outcome:** The app loads cleanly (logged out and after Internet Identity login), users can record/select a video, complete analysis and navigate back without getting stuck/seeing blank screens, the theme toggle works reliably (including from "system"), and the UI consistently shows the name "MR.AI UMPIRE".
