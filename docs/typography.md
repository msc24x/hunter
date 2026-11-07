# Typography Audit — Font-Size Inventory & Standardization Plan

Audit of every font-size declaration in the Angular frontend (`src/`),
produced by parallel module scans. Goal: replace the current informal,
inconsistent sizing with a small standardized scale for desktop and mobile.

**Base facts**

- No `font-size` on `html`/`body` → `1rem = 16px` (browser default).
- `body { font-family: appFont; font-weight: 400 }` — `appFont` is a local
  `@font-face` for `DMSans.ttf` (`src/assets/_fonts.scss`). No webfont CDN.
- Units in use: `rem` (~180 declarations, dominant), `px` (~30), `em` (4),
  CSS keywords `large`/`larger`/`smaller` (4), one `min(16vw, 6rem)`.
- 16 distinct media-query widths, 3 different `@media` syntaxes.
- Several mixins inject font-size indirectly (`inputText` 16px/300,
  `appTextArea` 1.2rem/300, `basicBack`/`basicBackZ` 1rem, `yellowBg` 1.2rem).

---

## 1. Global layer (`src/styles.scss`, `src/assets/_mixins.scss`)

| Selector / mixin | font-size | Unit | Line |
|---|---|---|---|
| `button.main, .button.main` | 0.95rem | rem | styles.scss:53 |
| `.beta-label` | 0.75rem | rem | :123 |
| `.mat-mdc-select` | 0.95rem, line-height 1.3 | rem | :167 |
| `.mat-mdc-snack-bar-container` (CSS var) | 16px | px | :195 |
| `.largeButton` | 1rem | rem | :441 |
| `.btable` | 1.1rem | rem | :464 |
| `.info-like.sticky` | 0.8rem | rem | :520 |
| `.info-like.option-sticky` | 0.7rem | rem | :525 |
| `code` | 0.85em | em | :600 |
| `@mixin inputText` | 16px, weight 300 | px | _mixins.scss:98 |
| `@mixin appTextArea` | 1.2rem, weight 300 | rem | _mixins.scss:112 |
| `@mixin basicBack` / `basicBackZ` | 1rem | rem | :76 / :66 |
| `@mixin yellowBg` | 1.2rem | rem | :38 |

Global `input[type=text/email/number]` gets `appTextArea` → effectively
**1.2rem / weight 300** everywhere, including inside `text-input`.

## 2. Distinct values in use (census)

Sorted by computed px at 16px root. `†` = below 12px readability floor.

| rem | ≈px | rem | ≈px |
|---|---|---|---|
| 0.7rem † | 11.2 | 1.4rem | 22.4 |
| 0.72rem † | 11.5 | 1.5rem | 24.0 |
| 0.75rem | 12.0 | 1.8rem | 28.8 |
| 0.8rem | 12.8 | 2rem | 32.0 |
| 0.85rem/em | 13.6 | 2.2rem | 35.2 |
| 0.875rem | 14.0 | 2.4rem | 38.4 |
| 0.9rem | 14.4 | 2.5rem | 40.0 |
| 0.95rem | 15.2 | 3rem | 48.0 |
| 1rem | 16.0 | 4rem | 64.0 |
| 1.05rem | 16.8 | 4.5rem | 72.0 |
| 1.1rem | 17.6 | 5rem | 80.0 |
| 1.15rem | 18.4 | 9rem | 144.0 |
| 1.2rem | 19.2 | | |
| 1.25rem | 20.0 | | |
| 1.3rem | 20.8 | | |

Absolute px values bypassing rem: `12px`, `14px`, `16px`, `18px` (via
keyword `large`), `20px`, `30px`, `120px` (register tagline).

## 3. Module inventory

### shell/

| File | Selector | Size | Breakpoint |
|---|---|---|---|
| app-bar.scss | `#app_title` | 3em (mostly dead — child overrides) | — |
| app-bar.scss | `#app_title_full` | 2.4rem → 1.8rem !important | ≤430px |
| app-bar.scss | `#user_email/#user_name/#register_btn` | 0.8rem | — |
| app-bar.scss | `#navBarBtn` | 0.8rem | — |
| app-bar.scss | `#navBarCompact` | 0.9rem | — |
| app-bar.scss | `.theme-toggle` (+ fa-icon 1.2rem) | 0.8rem | — |
| bottom-app-bar.scss | `#site_logo` | 2rem | — |
| bottom-app-bar.scss | `#site_info` | 1rem (1rem !important @≤1024 — no-op) | ≤1024px |
| bottom-app-bar.scss | `.paragraph` | 0.8rem | ≤512px only (no base size!) |
| popup.scss | `.dialog` | 1rem → 1.05rem !important (**grows**) | ≤900px |

### common/pages/

| Page | Selector | Size | Breakpoint |
|---|---|---|---|
| home | `#tagline` | 5rem → 2.5rem → 2rem !important | ≤768px / ≤456px |
| home | `.helperline` | 2rem → 1.5rem → 1.2rem !important | ≤768px / ≤456px |
| home | `.feature-content h2` / `p` | 2.5rem / 1.1rem | — |
| home | `.direct-buttons button` | 1.4rem → 1.1rem !important | ≤456px |
| home | `.stat-item h3` / `p` | 2.5rem / 1.1rem | — |
| about | `#about` (container cascade) | 1.2rem → 1.05rem !important | ≤456px |
| about | `.logo span` | min(16vw, 6rem) — dead (span commented out) | — |
| about/docs-mcp html | `.logo p` inline | 1.8rem (bypasses cascade) | — |
| docs-mcp | `#docs-mcp` | 1.2rem → 1.05rem !important | ≤456px |
| docs-mcp | `.mcp-config code` / `.copy-btn` | 0.85rem / 0.8rem | — |
| profile | `.user-badges .badge` | 4rem → 2.5rem | ≤720px |
| profile | `.field-row` / input | 1rem | — |
| profile | `.token-*`, `.comp-stats`, `.field-note`, `.name-preview` | 0.7–0.85rem | — |
| register | `#register_tagline` | 30px / 120px (**px**) | ≤850px / ≥850px |
| design-system | sidebar/nav | 0.85–1.8rem | layout-only @768px |
| not-found | — | none (inherits) | — |

### common/components/

| Component | Selector | Size |
|---|---|---|
| competitions-list | `#filter_controls` | 1.1rem → 0.8rem @≤620px |
| competitions-list | `.filters-heading` | 1.5rem → 1rem @≤620px |
| competitions-list | `#list_end` | 1rem |
| competition-card | `.competition_card` / `#c_title` | 0.8rem @≤620/500px / 1.3rem → 1.1rem → 0.9rem |
| communities-list | `.community .name` (hover only) / `.badge` / `.desc` | 1.05rem hover / 0.75rem / 0.7rem |
| question-display | `#question_title/#question_statement/#question_materials` | 1.05rem (+redundant !important) |
| question-display | `.title_text` / `.material-type-chip` / `.fs-btn` | 1.2rem / 0.75rem / 0.8rem |
| question-display ts:77 | SunEditor `defaultStyle` | 1.1rem (baked into HTML) |
| question-evaluation | `.points-time-col` / html inline status | 0.8rem / 0.9rem inline |
| scoreboard | `#sc_title` / `#scores_table` / `.ahead-statement` | 1.4rem / 1.1rem / 0.8rem |
| questions-list | `.question-progress` badge | 1.3rem (line-height 1.3rem > height 1.2rem — clips) |
| sign-in-prompt | `.sign-in-section .text` / container | 1.5rem → 1.2rem @≤720px / 1.8rem @≤720px (container!) |
| signin-dialog | `p.sectionHeading` (1.5em) / `p.inputHeading` (16px) / `#legal` / headings | em+px mix / 0.7rem / 12px |
| login-dialog | same structure, drifted values; **component unused** | — |
| manual-error | `p` | 1.1rem |
| profile-card | `.profile-name` / `.points` / `.user-profile-details` / `.manage-button` | 1.2 / 1 / 0.9 / 0.8rem |
| submission-view | `.grading-status` / details | 1.2rem / 1rem |
| create-dialog | `#create`, `.create_btn` (yellowBg), inputs (appTextArea) | 1.2rem |
| add-to-calendar | `.dropdown-item` / `.icon` | 0.875rem / 1.25rem |
| infotip | `fa-icon` | 1rem |
| code-editor | `.editor-instance` | 1rem (**doesn't reach Ace** — Ace default 12px) |
| text-input, drop-down-list, user-display, spinner, ng-katex, ques-type-label, pretty-meta, community-display, greenred | — | inherit |

### compete/

| File | Selector | Size |
|---|---|---|
| compete.scss | `.survey-banner h3`/`p` | 18px / 14px (**px**) |
| compete.scss | `.community-partner .description` / `.title` | 0.7rem / 1rem |
| competition.scss | `.competition-title` / `#competition_info` / `.title` | 1.5 / 1.2 / 1.4rem |
| competition.scss | `.score-num` / `.progress-num` / `.progress-box` | 2.2 / 1.4 / 1.3rem |
| competition.scss | `.choice` / `.nav-controls` / `.info-tag` | 1.1 / 0.9 / 0.95rem |
| competition.scss | `#solution_output` (+loading 1.2/1.5rem) | 1rem |
| competition.scss | `#duration_info span` (timer) | inherits 1.2rem, `font-family: monospace` |
| competition.html | inline spans (q-count, type count, ques-type-label) | 1.2 / 0.8 / 1rem inline |
| invite | — | all inherit |

### community/

| File | Selector | Size |
|---|---|---|
| community.scss | `.badge` / `.user-info` (requests) / `.remove` | 1rem / 1.15rem / 0.8rem |
| communities.scss, create-community.scss | — | empty/inherit |

### editor/

| File | Selector | Size |
|---|---|---|
| editor.scss | `.clabel` / `.label` / `#sample_*_label` | 1.2 / 1.1 / 1rem |
| editor.scss | bare `input {}` (**hits every input**) | 1.2rem |
| editor.scss | `.text-area` (overrides appTextArea) | 1rem |
| editor.scss | `#text_qtitle,#text_statement` | `large` keyword ≈18px |
| editor.scss | sample-cases textarea | `large` + `monospace` |
| editor.scss | `#code_file_label` | `larger` keyword ≈19px |
| editor.scss | `#text_statement_preview` | 1.05rem !important |
| editor.scss | `.add-choice` / `#controls button` / `.invited`/`.email-prev` | 1.2 / 1 / 1.1rem |
| editor.scss | `.import-steps` / `li::before` | 0.8 / 0.7rem |
| editor.ts:537 + materials-browser.ts:141 + question-display.ts:77 | SunEditor `defaultStyle` | 1.1rem ×3 (baked into HTML) |
| editor-menu.scss | `.community-ad` / `.more` | 1.2 / 0.8rem |
| insights.scss | `.option` / `.evaluation .for` / `.status` / `.selected-eval .by`/`.points` / `.download` | 1.2 / 1.2 / 0.8 / 1.3 / 1.4 / 0.9rem |
| materials-browser.scss | `h2` / `.card-meta` / `.form-field label` / `.dropzone p`/`.hint`/`.chosen` / `.detail-meta` / `.linked-title` / `.empty` | 1.3 / 0.72 / 0.9 / 0.9 / 0.75 / 0.8 / 0.85 / 0.9 / 0.85rem |
| dashboard-card.scss | `.title` / `.message` | 3rem / 1.4rem → 1rem @≤900px (**only live responsive font-size in editor/community**) |
| code-tester.scss | `.failure-reason pre` | weight 100 (!), size inherits |

## 4. Non-SCSS font sources

- **7 live inline `style="font-size…"`** in templates: about/docs-mcp logo
  taglines (1.8rem ×2), competition.html (1.2/0.8/1rem ×3),
  question-evaluation.html (0.9rem), editor.html:1246 (`smaller` keyword).
- **3 SunEditor `defaultStyle` strings** hardcode `font-size: 1.1rem` into
  generated HTML; `question-display` renders user content via
  `bypassSecurityTrustHtml` → user-authored statements/materials can carry
  **arbitrary inline font sizes no stylesheet can standardize**.
- Material: only `.mat-mdc-select` (0.95rem) and snackbar vars (16px) in
  styles.scss; no `mat-typography` level overrides anywhere.

## 5. Breakpoint census — 16 distinct widths

`430, 456, 500, 512, 620, 640, 686–420, 720, 768, 800, 840, 850, 900,
1024, 1080, 1120, 1400` — near-duplicates (500/512/620; 640/720/768) and
three syntaxes (`only screen and`, `screen and`, bare `@media`).

Mobile font behavior is inconsistent: most components never adjust;
competition-card/competitions-list/sign-in-prompt shrink; popup **grows**
text (1→1.05rem @900px); home/about/docs-mcp use container-level
`!important` cascades; scoreboard/question-evaluation hide columns instead.

## 6. Defects found (fix regardless of scale decision)

1. `questions-list .question-progress`: `font-size:1.3rem` +
   `line-height:1.3rem` inside `height:1.2rem` badge → clipped text.
2. `pretty-meta .solution-meta > div { line-height:1.5rem }` — fixed rem
   line-height won't scale with font-size.
3. `profile.component.html:107` — malformed `[style]="{ color: ': var(--gray);' }"`
   (stray colon → invalid CSS).
4. `competition.scss .info-tags { font-size:1rem }` @≤512px — no-op,
   children have explicit 0.95rem.
5. `editor.scss` bare `input { font-size:1.2rem }` hits every input.
6. `sign-in-prompt` sets 1.8rem on the section **container** @≤720px —
   leaks to inheriting children only; heading shrinks while container grows.
7. `code-editor .editor-instance { font-size:1rem }` doesn't affect Ace
   (Ace uses its own `fontSize` option, currently unset → 12px default).
8. `#duration_info span` timer uses bare `monospace` while `code` uses the
   proper mono stack — inconsistent.
9. Dead typography CSS: home (`#logo` 9rem, `#login_tag` 4.5rem, `.hero`),
   about (`min(16vw,6rem)` on commented-out span), editor + editor-menu
   (multiple), competitions-list (`.heading`, `p.heading`, `s`),
   login/signin dialogs (`p.line`, `#keep_logged_check`), register
   (both media blocks use px).
10. `login-dialog` vs `signin-dialog` — ~90% duplicate SCSS with drifted
    values; `login-dialog` itself appears unused.
11. `html { font-weight:200 }` overridden by `body { font-weight:400 }` —
    the 200 leaks to non-body content unintentionally.
12. Three different "question statement" sizes coexist: container 1.05rem,
    redundant `!important` 1.05rem, SunEditor inline 1.1rem.

## 7. Proposed standard scale

Root stays `16px` (no `html` font-size — preserves iOS no-zoom behavior
for inputs ≥16px). Define as CSS custom properties on `:root`:

```scss
:root {
    // Type scale — all rem, 16px root
    --fs-micro:    0.75rem;  // 12px  badges, legal, hints (floor)
    --fs-caption:  0.8rem;   // 12.8px meta, timestamps, secondary text
    --fs-small:    0.9rem;   // 14.4px labels, helper text
    --fs-control:  0.95rem;  // 15.2px buttons, selects, triggers
    --fs-body:     1rem;     // 16px  default body
    --fs-body-lg:  1.1rem;   // 17.6px emphasized body, question text
    --fs-h3:       1.25rem;  // 20px  card titles, section labels
    --fs-h2:       1.5rem;   // 24px  section headings, dialog titles
    --fs-h1:       1.9rem;   // 30.4px page titles
    --fs-display:  2.5rem;   // 40px  hero/taglines
}
```

Mapping guidance (current → proposed):

- `0.7/0.72rem` → `--fs-micro` (or `--fs-caption` if it's real content)
- `0.75–0.85rem` → `--fs-caption`
- `0.875–0.95rem` → `--fs-small` / `--fs-control`
- `1–1.15rem` → `--fs-body` / `--fs-body-lg`
- `1.2–1.3rem` → `--fs-h3`
- `1.4–1.5rem` → `--fs-h2`
- `1.8–2.4rem` → `--fs-h1`
- `2.5rem+` → `--fs-display` (home tagline 5rem can stay as a one-off
  display size or become `--fs-hero: 3rem` desktop / 2rem mobile)

### Mobile scale (separate set)

One breakpoint `--bp-mobile: 640px`. Mobile keeps body text unchanged
(readability + ≥16px inputs avoid iOS auto-zoom) and shrinks only the
upper scale — large text is what actually breaks small screens:

```scss
@media (max-width: 640px) {
    :root {
        --fs-micro:    0.75rem;  // 12px    unchanged (floor)
        --fs-caption:  0.8rem;   // 12.8px  unchanged
        --fs-small:    0.85rem;  // 13.6px  slightly smaller labels
        --fs-control:  0.9rem;   // 14.4px  slimmer controls
        --fs-body:     1rem;     // 16px    unchanged (readability)
        --fs-body-lg:  1rem;     // 16px    collapses onto body
        --fs-h3:       1.15rem;  // 18.4px
        --fs-h2:       1.3rem;   // 20.8px
        --fs-h1:       1.5rem;   // 24px
        --fs-display:  2rem;     // 32px
    }
}
```

Alternative worth considering later: scale the root itself
(`html { font-size: 90% }` at ≤640px shrinks every rem uniformly) —
requires converting all `px`/keyword sizes to rem first, and drops body
text to ~14.4px. The token set above is the safer choice.

Either way: **eliminate all `!important` font-size overrides** and the
direction-inconsistent cases (popup growing text, sign-in-prompt
container 1.8rem).

### Breakpoint tokens

Collapse 16 widths into 3–4:

```scss
$bp-sm: 480px;   // phones
$bp-md: 768px;   // tablets / large phones landscape
$bp-lg: 1024px;  // small desktop
$bp-xl: 1280px;  // desktop (optional)
```

## 8. Migration plan (suggested order)

1. **Fix the defects in §6** — they're bugs independent of the scale.
2. **Introduce the `--fs-*` tokens** in `styles.scss`; keep values equal
   to today's most-common choices so visuals barely change.
3. **Convert px/em/keyword sizes to rem** (dialogs, register, compete
   banner, editor keywords, mixins' `16px`).
4. **Replace literal font-sizes with tokens** module by module
   (shell → common → compete → community → editor).
5. **Move inline font-sizes to classes** (7 template spots) and unify
   the 3 SunEditor `defaultStyle` strings into one shared constant.
6. **Collapse breakpoints** to the token set; adopt one mobile policy.
7. **Prune dead typography CSS** listed in §6.9.
8. Consider `pre`/`code` font-family normalization (submission-view `pre`
   currently monospace via UA stylesheet at inherited size).
