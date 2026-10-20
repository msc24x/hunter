# Border Radius Audit

Generated 2026-10-20. Complete inventory of `border-radius` usage across `src/`:
143 SCSS declarations + 4 inline HTML styles.

## Summary

- **No design tokens** — every radius is a hardcoded literal; nothing is driven by a CSS variable or shared constant.
- **Mixed units** — `rem` (15 distinct values), `px` (10 distinct), `%`, and partial-corner shorthands are all in play.
- **Mixins are the de-facto system** — `blackBack`, `basicBack`, `basicBackZ`, `inputText`, `appTextArea`, `yellowBg`, `nextPrevControls` produce most surfaces, so a handful of values dominate.

## Mixin-driven values (effective "system")

| Mixin | Radius | Used by |
|---|---|---|
| `blackBack` | 2rem | `#competition_info`, `.question-side-section` (non-ace), `.button.main`, `button.main` |
| `basicBack` | 1rem | `.bottom-section`, `.invite-box`, `.question-side-section`, `.community-partner` … |
| `basicBackZ` | 1rem | lighter surfaces (same 1rem, `--white` bg) |
| `inputText` / `appTextArea` | 1rem | all text inputs, textareas |
| `nextPrevControls > div` | 0.6rem | next/prev nav buttons |
| `yellowBg` | 1rem | warning/dashed-callout panels |

Everything routed through a mixin is already consistent — the sprawl is in the one-off component styles.

## Value distribution

| Radius | Count | Typical role |
|---|---|---|
| 1rem | ~45 | cards, panels, inputs, dialogs, buttons |
| 2rem | ~16 | large panels/cards (blackBack, logos, sections) |
| 0.5rem | ~13 | small inner elements, previews, list rows |
| 0.6rem | ~8 | chips/tags (`info-tag`, `detail-tag`), nav controls, duration pill |
| 0.7rem | ~5 | inputs (`0.7rem !important`), mat-select, material cards |
| 0.3–0.4rem | ~7 | tiny elements (hover rows, type badges, avatar) |
| 0.8–0.9rem | ~5 | editor buttons, hosted-comp, dropzone |
| 1.3–1.5rem | ~5 | `#competition_info`, `.bottom-section`, tab container |
| 3rem / 5rem | ~4 | home page hero sections |
| 12px / 8px | ~9 | join-competition form, app-bar buttons, popup, glowing-thing |
| 24px | ~3 | `.hsection`, dashboard delete btn, editor scrollbar |
| 30px | ~2 | login/signin dialogs |
| 5px / 2px / 6px | ~5 | dialog buttons, resizer handle, code-editor dropdown |
| 50px / 999px / 100% / 50% | ~5 | pill labels, circular avatar/theme-toggle |
| partial corners | ~4 | code-editor edges, sticky tab bar, `#created_at` |

## Full inventory — global & shared

| File:line | Selector | Value |
|---|---|---|
| styles.scss:23 | `body` (impersonating) | 2rem |
| styles.scss:46 | `input[type=…]` | 0.7rem !important |
| styles.scss:59,61 | `.button.main` | 1rem (dup) |
| styles.scss:112 | `.beta-label` | 50px (pill) |
| styles.scss:157 | `.mat-mdc-snack-bar-container` | 0.5rem !important |
| styles.scss:165 | `.mat-mdc-select-panel` | 1rem !important |
| styles.scss:170 | `.mat-mdc-option` | 0.7rem |
| styles.scss:185 | `.mat-mdc-tab-label-container` | 1.3rem |
| styles.scss:190 | `.mat-mdc-tab` | 1rem |
| styles.scss:218 | `.mdc-tab--active:hover` | 1rem |
| styles.scss:245 | `.question-data .sun-editor` | 1rem |
| styles.scss:254–269 | SunEditor buttons/dialogs/lists | 0.9rem / 0.85rem / 1rem / 0.5rem |
| styles.scss:405 | `.largeButton` | 1rem |
| styles.scss:429 | `.btable` | 1rem |
| styles.scss:450 | table row hover | 0.3rem |
| styles.scss:499 | `.hsection` | 24px |
| styles.scss:513 | `.glowing-thing` | 8px |

## Full inventory — components

| File:line | Selector | Value |
|---|---|---|
| compete/competition.component.scss | `.bottom-section` | 1.5rem |
| compete/competition.component.scss | `.progress-box` | 1rem |
| compete/competition.component.scss | `.toggle-layout-label` | 1rem |
| compete/competition.component.scss | `.handle-bar` (resizer) | 2px |
| compete/competition.component.scss | `.choice` (mcq) | 1rem |
| compete/competition.component.scss | `#competition_info` | 1.5rem |
| compete/competition.component.scss | `.info-tag` | 0.6rem |
| compete/competition.component.scss | `#duration_info` | 0.6rem |
| compete/competition.component.scss | `#duration_info span` | 0.5rem |
| compete/competition.component.scss | `#solution_output` | 1rem |
| compete/competition.component.scss | `pre` | 0.5rem |
| compete/invite.component.scss | `.invite-box` | 2rem |
| compete/compete.component.scss | `.survey-content` | 2rem |
| compete/compete.component.scss | `#join_competition` | 12px |
| compete/compete.component.scss | `#competition_id_text`, `#btn_submit_compt_code` | 8px |
| compete/compete.component.scss | `.community-partner` | 1.5rem |
| common/questions-list | `.questions_list`, rows, drag preview | 1rem |
| common/questions-list | `.question-progress` | 1.3rem |
| common/competition-card | `.competition_card` | 1rem |
| common/competition-card | `.detail-tag` | 0.6rem |
| common/competitions-list | `#filter_controls` | 1rem |
| common/competitions-list | `mat-select` | 0.7rem |
| common/competitions-list | `#competitions_list` | 12px |
| common/communities-list | `.badge` | 999px |
| common/communities-list | `.logo` | 2rem |
| common/scoreboard | `.user-rank-row`, `.selected`, hover | 0.3rem / 1rem / 0.5rem / 0.3rem |
| common/profile-card | `:host`, `.points`, `img` | 2rem / 0.5rem / 1rem |
| common/question-display | `#question_statement` | 2rem |
| common/question-display | `.material-type-chip`, iframe, fs previews | 0.4rem / 0.6rem / 0.5rem |
| common/question-evaluation | `.view-submission-container` | 1rem |
| common/pretty-meta | `.solution-meta` | 1rem |
| common/add-to-calendar | `.dropdown` | 1rem |
| common/code-editor | `:host`, `.hunter-conf`, `.editor-instance`, `.json-mode`, dropdown | 1rem / `1rem 1rem 0 0` / `0 0 1rem 1rem` / 1rem / 6px |
| common/sign-in-prompt | `.sign-in-section`, `#getstarted` | 2rem |
| common/login-dialog | `#loginDialog`, `button` | 30px / 5px |
| common/signin-dialog | `#signinDialog`, `input.textbox`, `#register_btn` | 30px / 5px / 5px |
| common/user-display | `.avatar` | 0.2rem |
| common/text-input | `input` | 1rem |
| common/greenred | `:host` | 0.3rem |
| common/home | `button`, sections, `.feature-image`, `#tagline` | 2rem / 5rem / 2rem / 3rem+5rem |
| common/profile | `.badge`, `.hosted-comp`, rows, input, `.name-preview` | 2rem / 0.8rem / 0.5rem / 1rem / 0.5rem |
| community/community | `.badge`, `.logo` | 999px / 2rem |
| editor/editor | `.meta-section`, `.question-data`, sticky bar, `#created_at`, `#visbility_controller`, `.insight-details` | 2rem / 2rem / `0 0 2rem 2rem` / `0 0 1rem 1rem` / 1rem / 16px |
| editor/editor | `.invited`, `.email-prev`, `&::before` (dot) | 0.5rem / 0.5rem / 50% |
| editor/editor | `.participant-link`, delete-btns, file input, input, sun-editor | 1rem / 24px+1rem / 1rem / 1rem / 1rem |
| editor/editor-menu | scrollbar, `.community-ad` | 24px / 2rem |
| editor/insights | `.options`, `.option`, `.status` | 1rem / 1rem / 0.6rem |
| editor/materials-browser | `.browser`, `.material-card`, `.type-badge`/`.linked-chip`, `.dropzone`, `.file-pick`, `.rich-view`, previews, `.linked-row`, `.fullscreen-content` | 1rem / 0.7rem / 0.4rem / 0.8rem / 0.5rem / 0.7rem / 0.6rem / 0.5rem / 1rem |
| editor/dashboard-card | `:host` | 2rem |
| shell/popup | `.dialog`, inner div | 1rem / 12px |
| shell/app-bar | `#logout_btn`/`#register_btn`, `#navBarBtn`, `ul`, `a`, `.theme-toggle` | 12px / 8px / 16px / 24px / 100% |
| shell/bottom-app-bar | `.github-button` | 1rem |
| shell/info-card | `#card` | 1rem |

## Inline styles in templates

| File:line | Element | Value |
|---|---|---|
| app-bar.component.html:22 | avatar img | 6px |
| about.component.html:9 | card | 2rem |
| about.component.html:71 | img | 6px |
| bottom-app-bar.component.html:193 | img | 6px |

## Observations for the revamp

1. **Two competing scales**: rem-based (0.3–5) vs px-based (5–50px). A 4-tier scale — e.g. `--r-sm` 0.5rem, `--r-md` 1rem, `--r-lg` 1.5/2rem, `--r-pill` 999px — would cover ~90% of usages.
2. **Fuzzy near-duplicates**: 0.6/0.7rem, 0.8/0.85/0.9rem, 1.3/1.5rem, 8px/0.5rem, 12px/0.7rem are visually interchangeable today.
3. **`#competition_info` (1.5rem) vs `blackBack` (2rem) vs `basicBack` (1rem)** — sibling panels use three different radii; the tags inside it (0.6rem) match `detail-tag`.
4. **Partial-corner tricks** in code-editor/sticky tab bar/`#created_at` — keep as-is; they're edge-mating, not styling.
5. **Avatar inconsistency**: `user-display` 0.2rem vs `community .logo`/`communities .logo` 2rem vs theme-toggle 100% — pick a shape policy (square-ish vs circle) if revamping avatars.
