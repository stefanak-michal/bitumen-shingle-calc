# Bitumen Shingle Calculator — Plan

## Overview

Single-file frontend application (`index.html`) using HTML5, CSS3, jQuery (CDN), and HTML5 Canvas.
No backend. No build step.

---

## Shingle Constants (4TAB profile)

| Property                        | Value   |
|---------------------------------|---------|
| Total width                     | 1000 mm |
| Total height                    | 333 mm  |
| Upper solid part (exposure)     | 190 mm  |
| Tab section height              | 143 mm  |
| Tabs per shingle                | 4       |
| Tab width                       | 242 mm  |
| Gap count                       | 3       |
| Exposure per row                | 190 mm  |
| Horizontal offset (every 2nd row) | 121 mm (half tab width = 242/2) |

---

## Laying Logic

### Row numbering (1 = bottom)

```
Row 1 (bottom):
  - Use only upper 190 mm of shingle (tab section physically cut off)
  - Start at x = 0 (no offset)
  - No tabs drawn in visualization

Row 2:
  - Full shingle height (333 mm total, 190 mm exposed)
  - Horizontal offset: x starts at -121 mm
  - One shingle is split vertically at 121 mm:
      LEFT END:  right piece (879 mm wide) placed at x = -121 mm (visible from x=0)
      RIGHT END: left piece (up to 121 mm wide) fills the remaining space
  - Both pieces drawn with a visible cut line on their cut edge

Row 3:
  - Full shingle, no offset (same as row 1 alignment)

Row 4:
  - Offset row (same as row 2)

...and so on alternating.

Last row:
  - Clipped vertically to the remaining roof height (may be partial shingle)
```

### Shingle count per row

```
Even rows (1, 3, 5... — no offset): ceil(roofWidth / 1000)
Odd rows  (2, 4, 6... — offset):    ceil((roofWidth + 121) / 1000)
```

> Note: The split shingle in offset rows counts as 1 shingle. The ceil() naturally covers this.

### Total shingles per area

```
totalRows     = ceil(roofHeight / 190)
totalShingles = sum of shingles across all rows
```

---

## Visualization — Canvas Rendering

### Shingle shape (4TAB profile)

```
┌────────────────────────────────────────────┐  ← y = 0 (top)
│                                            │
│           solid upper band (190 mm)        │
│                                            │
├──────┬──────────┬──────────┬──────────┬───┤  ← y = 190
│ tab1 │  (gap)   │  tab2    │  (gap)   │...│
│      │          │          │          │   │
└──────┘          └──────────┘          └───┘  ← y = 333
```

- Tab width: 242 mm each
- Gap between tabs: the space between tabs (total width - 4*tab_width = 1000 - 968 = 32 mm → 3 gaps × ~10.67 mm)
- Gaps left empty (transparent — show roof background color)
- Row 1 shingles: only upper 190 mm drawn (no tabs)

### Offset row cut shingle visualization

- Right piece (879 mm) at left edge — vertical cut line drawn on its RIGHT side
- Left piece (≤121 mm) at right edge — vertical cut line drawn on its LEFT side
- Cut lines: dashed or contrasting color to show the shingle was cut

### Colors

- Roof background: light beige/grey (e.g. #e8e0d0)
- Shingle fill: alternating between two close shades of charcoal/slate
  - Even rows: #4a4a4a
  - Odd rows:  #3a3a3a
- Shingle border/outline: #222222
- Cut line: #ff6600 (orange dashed line) to make cuts clearly visible
- Roof boundary box: dark border

### Scale

- Canvas max width: ~900 px
- Scale factor = canvasWidth / roofWidth (in mm)
- Canvas height = roofHeight * scaleFactor

---

## UI Layout

```
┌─────────────────────────────────────────────┐
│  Bitumen Shingle Calculator                 │
├─────────────────────────────────────────────┤
│  [+ Add Roof Area]                          │
│                                             │
│  Area 1: [name______] W:[_____mm] H:[___mm] [×]│
│  Area 2: [name______] W:[_____mm] H:[___mm] [×]│
│                                             │
│  [Calculate]                                │
├─────────────────────────────────────────────┤
│  Results                                    │
│  Area     Width(mm)  Height(mm)  Shingles   │
│  Area 1   5000       3000        XX         │
│  Area 2   3000       2000        XX         │
│  ──────────────────────────────────         │
│  TOTAL                           XX         │
├─────────────────────────────────────────────┤
│  Visualization                              │
│  [Area 1 — 5000 × 3000 mm]                 │
│  ┌──────────────────────────────────────┐  │
│  │  canvas — shingle layout             │  │
│  └──────────────────────────────────────┘  │
│  [Area 2 — 3000 × 2000 mm]                 │
│  ┌──────────────────────────────────────┐  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## Tech Stack

- **HTML5** — single `index.html` file
- **CSS3** — embedded `<style>`, responsive, clean roofing-themed design
- **jQuery** — via CDN, DOM manipulation and event handling
- **Canvas 2D API** — shingle visualization rendering

---

## Files

- `index.html`    — HTML markup and structure only
- `styles.css`    — all CSS styles
- `calculator.js` — all application logic (jQuery + Canvas rendering)
- `PLAN.md`       — this document
- `4TAB.jpg`      — reference shingle outline image
