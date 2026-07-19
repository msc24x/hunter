# UI.md — UI Conventions for Hunter

A practical reference for the Hunter frontend (Angular 16, Angular Material 16,
SCSS, FontAwesome, Ace). Read this before adding or touching UI so that new
screens look and behave like the rest of the app.

Companion to `AGENTS.md` (operational guide). For backend rules and dev
commands see that file.

---

## 1. Styling foundations

### 1.1 Theme variables (always use these, never hardcode colors)

All colors are CSS custom properties defined in `src/assets/_colors.scss`:

- `:root` — light theme (default)
- `[data-theme="dark"]` — dark theme, applied to `<html>` by `ThemeService`

`ThemeService` (`src/app/services/theme/theme.service.ts`) toggles the
`data-theme` attribute on `<html>` and persists the choice in `localStorage`.
Subscribe to `themeService.theme$` if a component needs to react to theme
changes at runtime (the `code-editor` does this to swap the Ace theme).

Common tokens:

| Token | Purpose |
|---|---|
| `--body-bg`, `--text-black`, `--text-white` | Page background + primary text |
| `--whitesmoke`, `--white`, `--gray` | Surfaces / secondary text |
| `--border-color` | Default 1px border (used by `sweetBorder`) |
| `--popup-bg`, `--popup-overlay` | Modal dialog + dimmed overlay |
| `--btn-bg`, `--btn-bg-hover`, `--btn-bg-active`, `--btn-main-fg` | Primary button |
| `--btn-danger-bg`, `--btn-danger-bg-hover`, `--btn-danger-bg-active`, `--btn-danger-fg` | Danger button |
| `--dark-red`, `--darkgreen`, `--error` | Status colors |
| `--cute-blue`, `--cute-purple`, `--cute-panel-*` | Accent / "cute" panels |
| `--input-text-bg` | Native input background |

If you need a new color, add it to **both** `:root` and `[data-theme="dark"]`.

### 1.2 SCSS mixins (`src/assets/_mixins.scss`)

`@use "../../assets/mixins" as *;` at the top of every component SCSS file
(adjust the relative path depth). Available mixins:

| Mixin | Use |
|---|---|
| `@include sweetBorder` | The standard 1px solid `--border-color` border. Use this everywhere you want a panel border. |
| `@include blackBack` | `--whitesmoke` background + 1rem padding + 2rem radius + `sweetBorder`. Used for "panel" surfaces (e.g. `.questions-list`, `.editor-first-panel`). |
| `@include appTextArea` | The standard text-input look: `--whitesmoke` bg, 1rem radius, appFont, 1.2rem font, 16px padding, `sweetBorder`. Applied globally to `input[type=number|email|text]` in `styles.scss`. |
| `@include inputText` | Older fixed-width (259px) input style. Rarely used; prefer `appTextArea`. |
| `@include popup` | Fixed full-viewport flex-centered overlay with `--popup-overlay` background. Used by the `popup` component. |
| `@include yellowBg` | Antiquewhite dashed "warning" surface. |
| `@include hideSrollbar` | Hide scrollbars on a scroll container. |
| `@include ellipsis` | Truncate text with `…`. |
| `@include basicBack` / `basicBackZ` | White card with `sweetBorder`. |
| `@include nextPrevControls` | Pagination-style prev/next row. |

### 1.3 Fonts

`appFont` is a global SCSS variable/function (see `src/assets/_fonts.scss`)
that resolves to the project font family. Use `font-family: appFont;` in custom
styles; Material components are re-styled to use it via global overrides in
`styles.scss`.

---

## 2. Global utility classes (`src/styles.scss`)

Available everywhere — prefer these over one-off styles:

### Layout
- `.row` — flex row, `align-items: center`, `flex-wrap: wrap`
- `.flex`, `.flex-row`, `.flex-col`
- `.justify-center`, `.justify-sb` (space-between)
- `.align-center`, `.align-stretch`
- `.wrap`, `.wrap-rev`
- `.full-app-page` (max 1720px), `.large-app-page` (1450px), `.small-app-page` (1080px) — centered page widths

### State
- `.hidden` — `display: none`
- `.no-click` (and `.no-click.disabled`) — disable pointer events
- `.disabled` / `.disabled_bright` — opacity + `not-allowed` cursor
- `.pointer` — `cursor: pointer`
- `.no-selection` — disable text selection (with `.no-click` modifier to also block pointer events)

### Typography / hints
- `.info-like` — gray secondary text. Modifiers:
  - `.sticky` — small top-negative-margin caption (the canonical "helper text under a control")
  - `.cute` — blue accent helper
  - `.option-sticky` — even smaller variant
- `.error-like` — `--dark-red` text
- `.link-like` — underlines on hover
- `.beta-label` — pill-shaped "BETA" badge

### Surfaces / dividers
- `.sweet-hr` — dashed full-width `<hr>` (`.up` variant pushes it to the top)
- `.hsection` — `--whitesmoke` rounded section
- `.cute-panel` — pink/purple accent panel (uses `--cute-panel-*`)
- `.glowing-thing` — animated rainbow glow border (used for special CTAs)

### Tables
- `.btable` — flex-based table with `.table_heading` row

### Buttons (the canonical button system — see §3)

---

## 3. Buttons

There is **no reusable button component**. The project uses CSS classes on
native `<button>` or `<div>`/`<a>` elements:

```html
<button class="main">Primary action</button>
<button class="main danger">Destructive action</button>
<button class="main sim">Secondary / subtle</button>
<div class="button main" (click)="...">Clickable div styled as button</div>
<a class="button main" routerLink="/...">Link styled as button</a>
```

`.button.main` and `button.main` are styled identically in `styles.scss` — use
`.button.main` when you need a `<div>`/`<a>` to look like a button (e.g. when it
wraps a `mat-select`, as in the questions-list "Add" button).

Behavior baked in:
- 1rem font, 1rem radius, 0.8rem padding, 100ms transition
- `:hover` → `--btn-bg-hover` (danger → `--btn-danger-bg-hover`)
- `:active` → `scale: 0.99` + `--btn-bg-active`
- `.danger` → red palette
- `.sim` → softer border (`--btn-sim-border`), used for "Cancel" next to a primary action

For a larger, white, hover-inverts-to-black button use `.largeButton`.

### Inline icon buttons

Use FontAwesome directly inside a `.button.main`:

```html
<div class="button main" (click)="copyPrompt()">
    <fa-icon [icon]="copyIcon"></fa-icon> &nbsp; Copy prompt
</div>
```

Icons live in `@fortawesome/free-solid-svg-icons` (and `-regular` for a few like
the infotip question mark). Declare each icon as a component property:

```ts
copyIcon = faCopy;
importIcon = faFileImport;
magicIcon = faWandMagicSparkles;
```

---

## 4. Form inputs

The project does **not** use `mat-form-field` / `mat-input`. It uses **native
HTML inputs** styled globally by `styles.scss`:

```html
<input type="text" [(ngModel)]="model.title" placeholder="..." />
<input type="number" min="0" max="40" [(ngModel)]="model.points" />
<input type="email" name="email" [(ngModel)]="email" email />
<textarea rows="5" [(ngModel)]="model.description"></textarea>
<input type="datetime-local" [value]="utcToDatetimeLocal(model.at)" />
<input type="checkbox" [(ngModel)]="model.flag" />
```

`input[type=number|email|text]` automatically get `@include appTextArea` (with a
slightly tighter 0.7rem radius and 0.5rem padding override). `<textarea>` is
styled per-component with `@include appTextArea` directly.

### Validation messages

Use the `manual-error` component (NOT Material error states):

```html
<manual-error [message]="errors.title"></manual-error>
```

It renders an exclamation icon + the message in `--dark-red`. Bind it to a
string on the component's `errors` object; empty string renders nothing visible.

### Toggles

Use `mat-slide-toggle` for boolean switches:

```html
<mat-slide-toggle [(ngModel)]="model.hidden_scoreboard"></mat-slide-toggle>
```

### Dropdowns

Two patterns coexist:

1. **`mat-select`** for native Angular Material dropdowns (used in the editor
   for visibility, community linking, and the "Add question" type picker):
   ```html
   <mat-select placeholder="Add" [(value)]="buf" (selectionChange)="onAdd($event)">
       <mat-option *ngFor="let op of options" [value]="op[1]">{{ op[0] }}</mat-option>
   </mat-select>
   ```
2. **`drop-down-list`** component for the custom-styled dropdown used inside
   `code-editor` for language selection. API: `items: string[]`, `itemSelected`,
   `(itemSelectedChange)`, `editable`, `listType`.

### Checkboxes / destructive toggles

There is **no `MatCheckboxModule`** imported anywhere. For boolean toggles use
`mat-slide-toggle` (see §4.3). For destructive confirmations, pair the toggle
with a `manual-error` warning shown conditionally when the toggle is on, and
bind `[destructive]` on the surrounding `popup` so the heading turns red (see
the import-questions popup in `editor.component.html` for the
`.import-toggle` pattern).

### Date/time

Use native `<input type="datetime-local">` and convert to/from UTC with a helper
like `utcToDatetimeLocal()` (see `editor.component.ts`).

---

## 5. Reusable components

All declared in `src/app/common/common.module.ts` (NgModule, not standalone) and
exported for use across the app. Import `CommonModule` into your feature module
to get all of them.

### 5.1 `popup` — modal dialog

`src/app/common/components/popup/`

```html
<popup
    heading="Title"
    [destructive]="false"
    [showControls]="true"
    [continueOnly]="false"
    [noContainer]="false"
    [continueMessage]="'Continue'"
    (closeEvent)="onClose($event)"
>
    <!-- projected content -->
</popup>
```

| Input | Default | Purpose |
|---|---|---|
| `heading` | `'Message'` | Dialog title (hidden if `noContainer`) |
| `destructive` | `false` | Renders heading in `--dark-red` and the Continue button with `.danger` |
| `visible` | `false` | If false on init, emits `'cancel'` immediately |
| `showControls` | `true` | Show the built-in Continue + Cancel row |
| `continueOnly` | `false` | Hide the Cancel button (force-continue) |
| `noContainer` | `false` | Borderless transparent variant (used for scoreboard) |
| `continueMessage` | `'Continue'` | Label on the Continue button |

Output: `closeEvent: 'cancel' | 'continue'`.

**Important quirk:** the built-in Continue button emits **both** `'cancel'` and
`'continue'` in sequence. For custom action layouts, set `showControls="false"`
and put your own `<button class="main">` row inside the projected content (the
import-questions popup does this). Close the popup by calling
`showPopup(false, id)` or by emitting `'cancel'`.

Visibility is toggled by manipulating `display` on the host element via
`document.getElementById(id)` (see `EditorComponent.showPopup`). The popup also
respects the `[hidden]` binding for one-off show/hide without DOM scripting.

### 5.2 `code-editor` — Ace editor

`src/app/common/components/code-editor/`

```html
<code-editor
    [editorClass]="'participation-page'"
    [editable]="true"
    [json_mode]="false"
    [(code)]="code"
    [(languageSelected)]="lang"
    (fetchLastSubmission)="onFetch()"
></code-editor>
```

| Input | Default | Purpose |
|---|---|---|
| `code` | `''` | Two-way bound editor contents |
| `languageSelected` | `'cpp'` | One of `HunterLanguage` (`cpp\|c\|py\|js\|ts\|go\|java`) |
| `editable` | `true` | If false, sets Ace read-only |
| `editorClass` | `''` | Adds an Ace style class (e.g. `'participation-page'` for a taller editor) |
| `json_mode` | `false` | Switches the Ace session to `ace/mode/json` and hides the language dropdown + "Load Template" button |

Outputs: `codeChange`, `languageSelectedChange`, `fetchLastSubmission`.

Ace `basePath` is `assets/`, so every mode/worker used must ship as
`src/assets/mode-*.js` / `src/assets/worker-*.js`. The `src` (not
`src-noconflict`) variant of `ace-builds` is what the existing assets use — copy
new modes from `node_modules/ace-builds/src/`.

Theme: dark mode → `ace/theme/twilight`; light mode → default. The component
subscribes to `ThemeService.theme$` to swap.

### 5.3 `manual-error` — inline validation/warning message

```html
<manual-error [message]="errors.title"></manual-error>
```

Single `@Input() message: string`. Renders nothing meaningful when empty. Use
this (not Material error states) for all form validation and inline warnings.

### 5.4 `infotip` — small info tooltip

```html
<infotip message="Some clarification" [svgSize]="'sm'" />
```

Renders a question-mark icon with a `matTooltip`. Use it next to labels that
need a one-line explanation.

### 5.5 `drop-down-list` — custom dropdown

```html
<drop-down-list
    [items]="['cpp', 'c', 'py']"
    [itemSelected]="lang"
    (itemSelectedChange)="onLang($event)"
    [editable]="true"
    listType="Language"
></drop-down-list>
```

Used inside `code-editor`. Prefer `mat-select` for new dropdowns unless you
specifically want this look.

### 5.6 `text-input` — labeled text field (rarely used)

```html
<text-input title="my_field" (onChangeEvent)="onchange($event)"></text-input>
```

Mostly legacy. Prefer native `<input>` + `[(ngModel)]` (see §4).

### 5.7 `app-loading` / `spinner` — loading indicators

- `<app-loading *ngIf="loading"></app-loading>` — full loading overlay
- `<spinner *ngIf="!data"></spinner>` — centered spinner (used while waiting for competition data)

### 5.8 `ques-type-label` — question type badge

```html
<ques-type-label [ques_type]="1" [no_label]="false"></ques-type-label>
```

Renders the icon + label for question types: `0=Coding, 1=MCQ, 2=Fill, 3=Long`.
Set `no_label` to show only the icon.

### 5.9 `questions-list` — question strip

`src/app/common/questions-list/`. The horizontal scrollable list of questions
with "Add" (mat-select) and "DELETE" buttons. Inputs/outputs in
`questions-list.component.ts`. Used inside the editor page; not generally
reused elsewhere.

### 5.10 Other shared components

`app-bar`, `bottom-app-bar`, `competition-card`, `communities-list`,
`community-display`, `create-dialog`, `info-card`, `login-dialog`,
`signin-dialog`, `sign-in-prompt`, `user-display`, `scoreboard`,
`submission-view`, `question-display`, `question-evaluation`, `ng-katex`,
`pretty-meta`, `add-to-calendar`. Browse `src/app/common/components/` for each.

---

## 6. Angular Material usage

Imported in `CommonModule` (`UI_MODULES` array):

- `MatTooltipModule` — used **pervasively** for hover hints. Prefer
  `matTooltip` over custom tooltips.
- `MatSnackBarModule` — `MatSnackBar` injected into components; open with
  `this.snackBar.open('Message', 'Dismiss')`. Globally themed to a
  blanched-almond palette in `styles.scss`.
- `MatSlideToggleModule` — boolean toggles (see §4.3).
- `MatSelectModule` — dropdowns (see §4.4).
- `MatTabsModule` — tabbed views.
- `DragDropModule` (CDK) — drag-drop lists (currently commented out in
  `questions-list` but wired).

**Not imported:** `MatCheckboxModule`, `MatFormFieldModule`, `MatInputModule`,
`MatDialogModule`, `MatButtonModule`. Don't introduce these without reason —
the project deliberately uses native inputs + the `.main` button class instead.

Material components are globally re-skinned in `styles.scss` (snack-bar,
select panel, tabs, switch). When styling a Material component, prefer
overriding its CSS variables (e.g. `--mdc-switch-track-height`) over deep
`::ng-deep` selectors.

---

## 7. Icons (FontAwesome)

```ts
import { faCopy, faFileImport } from '@fortawesome/free-solid-svg-icons';

@Component({...})
export class MyComponent {
    copyIcon = faCopy;
    importIcon = faFileImport;
}
```

```html
<fa-icon [icon]="copyIcon"></fa-icon>
<fa-icon [icon]="copyIcon" size="lg"></fa-icon>
<fa-icon [icon]="copyIcon" [animation]="'fade'"></fa-icon>
```

Sizes: `'xs' | 'sm' | 'lg' | 'xl' | '2x' | ...`. Declare each icon as a class
property — don't inline the import in the template.

`FontAwesomeModule` is in `CommonModule`.

---

## 8. Layout patterns

### Page shell

Most authenticated pages follow:

```html
<app-bar></app-bar>
<app-loading *ngIf="loading"></app-loading>
<spinner *ngIf="!ready"></spinner>

<div class="page-section" *ngIf="ready">
    <div class="section-side">...meta / sidebar...</div>
    <div class="section-content">...main content...</div>
</div>
```

`.page-section` is a two-column flex (sidebar + content) defined per page in
its SCSS. See `editor.component.scss` / `editor.component.html` for the
canonical example.

### Sticky bottom controls

The editor uses a `.row_flex#controls` row at the bottom of the content column
with plain `<button>` elements (no `.main` class — they use a different
borderless style defined in the page SCSS).

### Modal flows

1. Add a `<popup id="my_popup" (closeEvent)="handler($event)">` near the top of
   the page template.
2. Open it with `this.showPopup(true, 'my_popup')` (which sets
   `display: block` and scrolls to top).
3. Close it from a handler with `this.showPopup(false, 'my_popup')`.
4. For destructive confirmations, set `[destructive]="true"` and use
   `continueMessage` to make the action explicit (e.g. "Yes, delete the
   question").

### Headings with inline actions

Use a flex row to put a primary action next to an `<h2>`:

```html
<div class="questions-heading-row">
    <h2>{{ count }} Questions</h2>
    <div class="button main" (click)="openImport()">Import / Generate</div>
</div>
```

---

## 9. Feedback patterns

### Toasts

```ts
constructor(private snackBar: MatSnackBar) {}

this.snackBar.open('Saved', 'Dismiss');
this.snackBar.open('Link copied to clipboard', 'Dismiss');
this.snackBar.open('Long message the user must read', 'Dismiss', { duration: 0 });
```

`duration: 0` keeps it open until dismissed — use for important messages.

### Inline log

The editor page keeps a `log: string[]` and a floating `#log` element updated
via `displayLog(msg)` (`console.info` + DOM write). Useful for debugging-style
status during multi-step flows.

### Clipboard

```ts
if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(
        () => this.snackBar.open('Copied to clipboard', 'Dismiss'),
        () => this.snackBar.open('Unable to copy', 'Dismiss'),
    );
}
```

### Sharing

Prefer `navigator.share` when available, fall back to clipboard (see
`EditorComponent.shareAction`).

---

## 10. SCSS authoring rules

1. Start every component SCSS file with:
   ```scss
   @use "../../assets/fonts";
   @use "../../assets/colors";
   @use "../../assets/mixins" as *;
   ```
   (adjust relative depth). The `as *` is required because mixins are not
   prefixed.
2. Prefer `@include` mixins (`sweetBorder`, `appTextArea`, `blackBack`) over
   re-declaring borders/padding.
3. Use CSS variables (`var(--…)`) for colors — never hardcode hex in component
   SCSS, or it won't respond to dark mode.
4. Piercing encapsulation is allowed but rare: use `::ng-deep` only when
   styling a child component's internal DOM (e.g. sizing the Ace editor
   instance from a parent). Prefer overriding Material CSS variables over
   `::ng-deep` for Material components.
5. Indentation: **Prettier with `tabWidth: 4`** wins (see `AGENTS.md` §4 —
   `.editorconfig` says 2 but Prettier says 4).
6. Don't `@import` — use `@use`.

---

## 11. Adding a new screen — checklist

- [ ] Create the component under the appropriate feature folder
  (`src/app/<feature>/pages/<page>/` or `src/app/common/components/<name>/`).
- [ ] Declare it in the right module (usually `CommonModule` if shared).
- [ ] Use `<app-bar>` + `.page-section` shell for authenticated pages.
- [ ] Use native `<input>`/`<textarea>` + `[(ngModel)]` for forms; validate with
  `manual-error`.
- [ ] Use `<button class="main">` / `.button.main` / `.main danger` for actions.
- [ ] Use `mat-slide-toggle` for booleans, `mat-select` for dropdowns,
  `matTooltip` for hints, `MatSnackBar` for toasts.
- [ ] Use `popup` for modals; toggle via `showPopup(true/false, id)`.
- [ ] Use `app-loading` / `spinner` for loading states.
- [ ] All colors via `var(--…)`, all borders via `@include sweetBorder`, all
  text via `font-family: appFont`.
- [ ] Verify in both light and dark themes (`ThemeService.toggleTheme()`).
- [ ] Run `npx tsc --noEmit -p tsconfig.app.json` and
  `npx ng build --configuration development` (avoid `npm run build` on Windows
  — see `AGENTS.md` §4).
