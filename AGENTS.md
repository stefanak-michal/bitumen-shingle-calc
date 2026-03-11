# AGENTS.md — Bitumen Shingle Calculator

Guidelines for agentic coding agents working in this repository.

---

## Project Overview

Frontend-only application. No backend, no build step, no package manager.

**Files:**
- `index.html`     — HTML markup and structure only
- `styles.css`     — all CSS styles
- `calculator.js`  — all application logic (jQuery + Canvas rendering)
- `PLAN.md`        — full feature and implementation plan; read before making changes
- `AGENTS.md`      — this file
- `4TAB.jpg`       — reference technical drawing of the 4TAB shingle profile

---

## Build, Lint, and Test Commands

There is no build step, no bundler, no package manager, and no test runner.

| Task              | How to do it                                      |
|-------------------|---------------------------------------------------|
| Run the app       | Open `index.html` directly in a browser           |
| Lint JS           | No automated linter — review manually             |
| Lint CSS          | No automated linter — review manually             |
| Run tests         | No test suite — verify logic by opening in browser|
| Single test       | N/A — manually test in browser DevTools console   |

> When making logic changes, manually verify in browser with representative inputs:
> e.g. Width=5000mm Height=3000mm and Width=1000mm Height=333mm (exact shingle size).

---

## Architecture Constraints

- **No backend.** Everything runs in the browser.
- **No build tools.** No webpack, vite, rollup, or similar.
- **No npm.** Do not add a `package.json` or `node_modules`.
- **Three files.** Keep HTML in `index.html`, styles in `styles.css`, logic in `calculator.js`. Do not add further files unless explicitly instructed.
- **jQuery via CDN only.** Load from `https://code.jquery.com/`. Do not bundle locally.
- **Canvas 2D API** for all visualization rendering. Do not use WebGL, SVG, or third-party chart libs.

---

## JavaScript Style Guidelines

### General

- Use **ES6+** syntax: `const`, `let`, arrow functions, template literals, destructuring.
- Never use `var`.
- Prefer `const` over `let`. Only use `let` when reassignment is needed.
- Use **strict equality** (`===`, `!==`). Never use `==` or `!=`.
- Keep functions small and single-purpose.
- No unused variables or dead code.

### Naming Conventions

| Kind              | Convention        | Example                        |
|-------------------|-------------------|--------------------------------|
| Variables         | camelCase         | `roofWidth`, `totalShingles`   |
| Functions         | camelCase         | `calculateShingles()`, `drawRow()` |
| Constants (fixed) | UPPER_SNAKE_CASE  | `SHINGLE_WIDTH`, `TAB_HEIGHT`  |
| DOM selectors     | camelCase `$` prefix for jQuery objects | `$areaList`, `$resultTable` |
| Canvas context    | `ctx`             | `const ctx = canvas.getContext('2d')` |

### Shingle Domain Constants

Always reference shingle dimensions via named constants, never magic numbers:

```js
const SHINGLE_WIDTH      = 1000; // mm
const SHINGLE_HEIGHT     = 333;  // mm
const EXPOSURE_HEIGHT    = 190;  // mm — upper solid part (exposed per row)
const TAB_HEIGHT         = 143;  // mm — lower tab section
const TAB_COUNT          = 4;
const TAB_WIDTH          = 242;  // mm per tab
const GAP_WIDTH          = (SHINGLE_WIDTH - TAB_COUNT * TAB_WIDTH) / (TAB_COUNT - 1); // ~10.67 mm
const ROW_OFFSET         = 121;  // mm — horizontal shift every 2nd row (half tab width)
```

### Comments

- Add a comment for every non-obvious calculation or layout decision.
- Use `//` for single-line comments. Use `/* */` only for multi-line blocks.
- Document the row-numbering convention (1 = bottom row) wherever rows are iterated.

### Error Handling

- Validate all user inputs before calculation: width and height must be positive integers.
- Show inline validation errors next to the offending input field using a `<span class="error">`.
- Never use `alert()` or `console.error()` for user-facing errors.
- Use `try/catch` only where a runtime failure is genuinely possible (e.g. canvas not supported).

### jQuery Usage

- Use jQuery for DOM manipulation and event binding only.
- Do **not** use jQuery for math/logic — keep calculation functions pure JS.
- Prefer event delegation for dynamically added elements:
  ```js
  $(document).on('click', '.remove-area', handler);
  ```
- Cache jQuery selections that are reused:
  ```js
  const $list = $('#area-list');
  ```

---

## CSS Style Guidelines

- All styles in the `<style>` block in `<head>`.
- Use **kebab-case** for class and ID names: `.roof-area-row`, `#result-table`.
- Prefer **class selectors** over ID selectors for styling (use IDs only for JS hooks).
- Use **CSS custom properties** for repeated colors/sizes:
  ```css
  :root {
    --color-shingle-dark: #3a3a3a;
    --color-shingle-mid:  #4a4a4a;
    --color-roof-bg:      #e8e0d0;
    --color-cut-line:     #ff6600;
  }
  ```
- Mobile-friendly: use `max-width` containers and `box-sizing: border-box`.
- No external CSS frameworks (no Bootstrap, Tailwind, etc.).

---

## HTML Style Guidelines

- Use semantic elements: `<section>`, `<table>`, `<label>`, `<button>`.
- Every `<input>` must have an associated `<label>` (or `aria-label`).
- Use `type="number"` with `min="1"` for dimension inputs.
- Canvas elements must have a fallback text content:
  ```html
  <canvas id="canvas-1">Canvas not supported.</canvas>
  ```

---

## Calculation Logic Rules

Refer to `PLAN.md` for the full specification. Key rules to preserve:

1. **Row 1** (bottom): shingles use only the upper 190 mm — no tabs drawn, no tabs counted in height.
2. **Odd-numbered rows** (2, 4, 6…): offset by 121 mm. The split shingle at left/right edges counts as **1 shingle total** for the row, not 2.
3. **Last row**: clipped to remaining height. Still counts as full shingles (no reduction in shingle count for partial height).
4. `totalRows = Math.ceil(roofHeight / EXPOSURE_HEIGHT)`
5. Shingles per non-offset row: `Math.ceil(roofWidth / SHINGLE_WIDTH)`
6. Shingles per offset row: `Math.ceil((roofWidth + ROW_OFFSET) / SHINGLE_WIDTH)`

---

## Visualization Rules

- Canvas is scaled so `roofWidth` maps to at most 900 px. Compute `scale = Math.min(900, canvasMaxPx) / roofWidth`.
- Always `ctx.save()` / `ctx.restore()` around clipped drawing operations.
- Clip the canvas to the roof boundary rectangle before drawing shingles — no shingle should render outside the roof area.
- Cut shingles in offset rows must show an **orange dashed vertical line** (`#ff6600`, `setLineDash([4,3])`) on the cut edge.
- Row 1 shingles: draw only the solid upper band (height = `EXPOSURE_HEIGHT * scale`), no tab cutouts.
- Draw the roof boundary border last (on top) so it covers any shingle overdraw at the edges.
