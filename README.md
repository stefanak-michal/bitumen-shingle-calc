# Bitumen Shingle Calculator

A frontend-only web application for calculating the number of bitumen shingles required to cover one or more rectangular roof areas, with an accurate canvas-based visualization of the shingle layout.

---

## Features

- **Multiple roof areas** — add as many rectangular areas as needed, each with a custom name
- **Accurate shingle count** — accounts for row offset (every second row is shifted by half a tab width), bottom row cut, and partial last row
- **Canvas visualization** — scaled diagram of each roof area showing the exact shingle layout, tab gaps, cut edges, and row overlap
- **Configurable shingle dimensions** — all shingle parameters can be adjusted in the Shingle Size panel (defaults match the standard 4TAB profile)
- **Persistent state** — all inputs are saved to browser `localStorage` on Calculate and restored automatically on next visit

---

## Usage

1. Open `index.html` directly in a browser — no server or build step required
2. Enter the width and height (in mm) for each roof area
3. Optionally expand **Shingle Size** to adjust shingle dimensions
4. Click **Calculate** to see the results table and visualization

---

## Laying Rules

- **Row 1 (bottom):** cut shingle — only the upper solid band (exposure height) is used, no tabs
- **Even rows (2, 4, 6…):** full shingle, offset by half a tab width to the left; the split shingle at each edge counts as one shingle
- **Odd rows (3, 5, 7…):** full shingle, no offset
- **Last row:** clipped to the remaining roof height; counted as full shingles

---

## File Structure

```
index.html       — HTML markup and structure
styles.css       — all CSS styles
calculator.js    — all application logic (jQuery + Canvas API)
PLAN.md          — full feature and implementation plan
AGENTS.md        — coding guidelines for AI agents
4TAB.jpg         — reference technical drawing of the 4TAB shingle profile
```

---

## Tech Stack

- HTML5 / CSS3
- JavaScript (ES6+)
- [jQuery 4](https://jquery.com/) via CDN
- Canvas 2D API

No build tools, no bundler, no package manager.
