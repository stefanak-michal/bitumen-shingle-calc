$(function () {

  /* ═══════════════════════════════════════════════════════════════
     SHINGLE CONSTANTS  (4TAB profile, all dimensions in mm)
  ═══════════════════════════════════════════════════════════════ */
  const SHINGLE_WIDTH    = 1000;  // total shingle width
  const SHINGLE_HEIGHT   = 333;   // total shingle height
  const EXPOSURE_HEIGHT  = 180;   // upper solid band — exposed per row
  const TAB_HEIGHT       = 143;   // lower tab section height
  const TAB_COUNT        = 4;     // number of tabs
  const TAB_WIDTH        = 242;   // width of one tab (mm)
  // 4 tabs × 242 = 968 mm; remaining 32 mm split across 3 gaps
  const GAP_WIDTH        = (SHINGLE_WIDTH - TAB_COUNT * TAB_WIDTH) / (TAB_COUNT - 1); // ≈10.67 mm
  const ROW_OFFSET       = 121;   // horizontal shift on every 2nd row (half tab width)

  /* ═══════════════════════════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════════════════════════ */
  let areaCounter = 0; // increments for unique IDs

  /* ═══════════════════════════════════════════════════════════════
     CALCULATION LOGIC  (pure functions — no DOM access)
  ═══════════════════════════════════════════════════════════════ */

  /**
   * Calculate shingle count and row data for one rectangular roof area.
   * Row numbering: row 1 = bottom, row N = top.
   *
   * @param {number} roofWidth  — in mm
   * @param {number} roofHeight — in mm
   * @returns {{ totalRows: number, totalShingles: number, rows: Array }}
   *
   * rows[] each entry: { rowNum, isOffset, shingleCount, visibleHeight }
   *   visibleHeight = how many mm of this row are visible (all rows = EXPOSURE_HEIGHT
   *                   except last row which may be less if roof height isn't a multiple)
   */
  function calculateArea(roofWidth, roofHeight) {
    const totalRows = Math.ceil(roofHeight / EXPOSURE_HEIGHT);
    const rows = [];
    let totalShingles = 0;

    for (let rowNum = 1; rowNum <= totalRows; rowNum++) {
      // Every 2nd row (row 2, 4, 6…) is offset by ROW_OFFSET
      const isOffset = (rowNum % 2 === 0);

      // Shingles needed for this row.
      // Offset rows: effective span starts ROW_OFFSET to the left, so add that to width.
      const effectiveWidth = isOffset ? roofWidth + ROW_OFFSET : roofWidth;
      const shingleCount   = Math.ceil(effectiveWidth / SHINGLE_WIDTH);

      // How many mm of height this row actually occupies (last row may be partial).
      // Rows stack from the bottom: row 1 occupies [0..EXPOSURE_HEIGHT),
      // row 2 [EXPOSURE_HEIGHT..2×EXPOSURE_HEIGHT), etc.
      const bottomMm      = (rowNum - 1) * EXPOSURE_HEIGHT;
      const topMm         = Math.min(rowNum * EXPOSURE_HEIGHT, roofHeight);
      const visibleHeight = topMm - bottomMm;

      rows.push({ rowNum, isOffset, shingleCount, visibleHeight });
      totalShingles += shingleCount;
    }

    return { totalRows, totalShingles, rows };
  }

  /* ═══════════════════════════════════════════════════════════════
     DOM — AREA ROW MANAGEMENT
  ═══════════════════════════════════════════════════════════════ */
  const $areaList = $('#area-list');

  function addAreaRow() {
    areaCounter++;
    const id   = areaCounter;
    const name = `Area ${id}`;

    const $row = $(`
      <div class="area-row" data-id="${id}">
        <div class="area-name-wrap">
          <label for="name-${id}">Name</label>
          <input type="text" id="name-${id}" class="area-name" value="${name}" aria-label="Area name" />
        </div>
        <div class="dim-wrap">
          <label for="w-${id}">Width</label>
          <input type="number" id="w-${id}" class="area-width" min="1" step="1" placeholder="e.g. 5000" aria-label="Width in mm" />
          <span class="unit-label">mm</span>
        </div>
        <div class="dim-wrap">
          <label for="h-${id}">Height</label>
          <input type="number" id="h-${id}" class="area-height" min="1" step="1" placeholder="e.g. 3000" aria-label="Height in mm" />
          <span class="unit-label">mm</span>
        </div>
        <button class="btn btn-remove remove-area" aria-label="Remove area">&times;</button>
      </div>
    `);

    $areaList.append($row);
  }

  // Start with one area row by default
  addAreaRow();

  // Add area button
  $('#btn-add-area').on('click', () => addAreaRow());

  // Remove area — event delegation for dynamically added rows
  $(document).on('click', '.remove-area', function () {
    const $row = $(this).closest('.area-row');
    // Keep at least one row
    if ($areaList.find('.area-row').length > 1) {
      $row.remove();
    }
  });

  /* ═══════════════════════════════════════════════════════════════
     INPUT VALIDATION
  ═══════════════════════════════════════════════════════════════ */

  /**
   * Validate a single number input. Shows an inline error span if invalid.
   * Returns the parsed integer or null if invalid.
   *
   * @param {jQuery} $input
   * @param {string} label — field name shown in the error message
   * @returns {number|null}
   */
  function validateDimension($input, label) {
    $input.removeClass('input-error');
    $input.siblings('.error-msg').remove();

    const raw = $input.val().trim();
    const val = parseInt(raw, 10);

    if (raw === '' || isNaN(val) || val < 1) {
      $input.addClass('input-error');
      return null;
    }
    return val;
  }

  /**
   * Collect and validate all area rows.
   * Returns array of { name, width, height } or null if any row is invalid.
   *
   * @returns {Array|null}
   */
  function collectAreas() {
    let valid = true;
    const areas = [];

    $areaList.find('.area-row').each(function () {
      const $row   = $(this);
      const name   = $row.find('.area-name').val().trim() || 'Area';
      const width  = validateDimension($row.find('.area-width'),  'Width');
      const height = validateDimension($row.find('.area-height'), 'Height');

      if (width === null || height === null) {
        valid = false;
      } else {
        areas.push({ name, width, height });
      }
    });

    return valid ? areas : null;
  }

  /* ═══════════════════════════════════════════════════════════════
     RESULTS TABLE
  ═══════════════════════════════════════════════════════════════ */

  /**
   * Populate and show the results table.
   *
   * @param {Array} areas   — [{ name, width, height }]
   * @param {Array} results — [{ totalRows, totalShingles, rows }]
   */
  function renderResultsTable(areas, results) {
    const $tbody = $('#results-tbody').empty();
    let grandTotal = 0;

    areas.forEach((area, i) => {
      const r = results[i];
      grandTotal += r.totalShingles;
      $tbody.append(`
        <tr>
          <td>${$('<span>').text(area.name).html()}</td>
          <td class="count">${area.width.toLocaleString()}</td>
          <td class="count">${area.height.toLocaleString()}</td>
          <td class="count">${r.totalRows}</td>
          <td class="count shingle-count">${r.totalShingles}</td>
        </tr>
      `);
    });

    // Grand total row
    $tbody.append(`
      <tr class="total-row">
        <td colspan="4">Total shingles required</td>
        <td class="count shingle-count">${grandTotal}</td>
      </tr>
    `);

    $('#results-section').show();
  }

  /* ═══════════════════════════════════════════════════════════════
     CANVAS VISUALIZATION
  ═══════════════════════════════════════════════════════════════ */

  /**
   * Draw a single shingle onto the canvas.
   * The shingle is drawn from its natural origin x (which may be negative for
   * offset-row left-edge pieces). The canvas clip region hides anything outside
   * the roof boundary.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number}  x       — left edge of shingle in canvas px (may be negative)
   * @param {number}  y       — top edge of shingle in canvas px
   * @param {number}  totalW  — full shingle width in canvas px (SHINGLE_WIDTH × scale)
   * @param {number}  drawH   — height to draw in canvas px
   * @param {number}  scale   — mm → px scale factor
   * @param {string}  fill    — shingle body fill color (hex)
   * @param {boolean} isRow1  — true for row 1: draw only the upper solid band, no tabs
   */
  function drawShingle(ctx, x, y, totalW, drawH, scale, fill, isRow1) {
    const solidH = EXPOSURE_HEIGHT * scale; // upper solid band height in px

    if (isRow1) {
      // Row 1: only the upper solid band (tab section physically cut off)
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, totalW, drawH);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 0.25, y + 0.25, totalW - 0.5, drawH - 0.5);
    } else {
      // Full shingle: upper solid band + 4 tabs below, gaps between tabs show background

      // 1. Upper solid band — outline left, top, right edges only (no bottom edge,
      //    so there is no horizontal line between the solid band and the tabs)
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, totalW, solidH);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x + 0.25,          y + solidH);      // bottom-left (no line drawn here)
      ctx.lineTo(x + 0.25,          y + 0.25);        // left edge up
      ctx.lineTo(x + totalW - 0.25, y + 0.25);        // top edge across
      ctx.lineTo(x + totalW - 0.25, y + solidH);      // right edge down
      ctx.stroke();

      // 2. Tab section — 4 tabs with gaps between them left transparent
      // Start 1px above the solid-band bottom so the fills overlap and no gap appears
      const tabY = y + solidH - 1;
      const tabH = drawH - solidH + 1; // remaining height for tabs (may be clipped for last row)

      if (tabH > 0) {
        for (let t = 0; t < TAB_COUNT; t++) {
          // Tab bounds in mm relative to shingle left edge
          const tabLeftMm  = t * (TAB_WIDTH + GAP_WIDTH);
          const tabRightMm = tabLeftMm + TAB_WIDTH;

          // Convert to canvas px
          const tabX1 = x + tabLeftMm  * scale;
          const tabX2 = x + tabRightMm * scale;

          ctx.fillStyle = fill;
          ctx.fillRect(tabX1, tabY, tabX2 - tabX1, tabH);
          // Stroke left, bottom, right only — no top edge, so there is no
          // horizontal line at the solid-band/tab boundary
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(tabX1 + 0.25, tabY);
          ctx.lineTo(tabX1 + 0.25, tabY + tabH - 0.25);  // left edge down
          ctx.lineTo(tabX2 - 0.25, tabY + tabH - 0.25);  // bottom edge across
          ctx.lineTo(tabX2 - 0.25, tabY);                 // right edge up
          ctx.stroke();
        }
      }
    }
  }

  /**
   * Draw a vertical orange dashed cut line at a given canvas x position.
   * Marks where a shingle was cut (offset-row left and right edge pieces).
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cutX  — canvas x of the cut edge
   * @param {number} y     — top of the row in canvas px
   * @param {number} drawH — height of the row in canvas px
   */
  function drawCutLine(ctx, cutX, y, drawH) {
    ctx.save();
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cutX, y);
    ctx.lineTo(cutX, y + drawH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /**
   * Draw one full row of shingles onto the canvas.
   *
   * Canvas y=0 is the top of the canvas (top of the roof).
   * Row 1 (bottom of roof) is drawn at the bottom of the canvas.
   * Rows are drawn bottom→top (row 1 first, highest row last) so each row's
   * solid band paints over the tabs of the row below it, keeping tabs visible.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} row       — { rowNum, isOffset, shingleCount, visibleHeight }
   * @param {number} roofWidth — mm
   * @param {number} canvasH   — canvas height in px
   * @param {number} scale     — mm → px
   */
  function drawRow(ctx, row, roofWidth, canvasH, scale) {
    const { rowNum, isOffset } = row;

    // The exposure zone for this row:
    //   bottom = canvasH - rowNum * EXPOSURE_HEIGHT * scale
    //   top    = bottom  - (SHINGLE_HEIGHT - EXPOSURE_HEIGHT) * scale  [for full shingles]
    //
    // Row 1 (bottom): cut shingle, drawn flush at canvas bottom, height = EXPOSURE_HEIGHT.
    // Full shingles: anchored so their solid band top aligns with exposureTopPx.
    //   exposureTopPx = canvasH - rowNum * EXPOSURE_HEIGHT * scale
    //   shingleY      = exposureTopPx  (top of solid band = top of shingle)
    //   drawH         = SHINGLE_HEIGHT * scale  (tabs hang downward, clipped by row below)

    const fill = (rowNum % 2 === 0) ? '#4a4a4a' : '#3a3a3a';
    const isRow1 = (rowNum === 1);

    // Top of the exposure band for this row in canvas px
    const exposureTopPx = canvasH - rowNum * EXPOSURE_HEIGHT * scale;

    if (!isOffset) {
      const shingleCount = Math.ceil(roofWidth / SHINGLE_WIDTH);

      for (let s = 0; s < shingleCount; s++) {
        const shingleX = s * SHINGLE_WIDTH * scale;

        if (isRow1) {
          // Row 1: cut shingle — only the 190mm solid band, flush at canvas bottom
          const shingleY = canvasH - EXPOSURE_HEIGHT * scale;
          const drawH    = EXPOSURE_HEIGHT * scale;
          drawShingle(ctx, shingleX, shingleY, SHINGLE_WIDTH * scale, drawH, scale, fill, true);
        } else {
          // Full shingle: top of shingle = top of exposure band; tabs hang below
          const shingleY = exposureTopPx;
          const drawH    = SHINGLE_HEIGHT * scale;
          drawShingle(ctx, shingleX, shingleY, SHINGLE_WIDTH * scale, drawH, scale, fill, false);
        }
      }

    } else {
      // Offset row — same vertical anchor as non-offset full rows
      const shingleY     = exposureTopPx;
      const drawH        = SHINGLE_HEIGHT * scale;
      const shingleCount = Math.ceil((roofWidth + ROW_OFFSET) / SHINGLE_WIDTH);

      for (let s = 0; s < shingleCount; s++) {
        const shingleOriginMm = s * SHINGLE_WIDTH - ROW_OFFSET;
        const shingleX        = shingleOriginMm * scale;

        const visRightMm = Math.min(shingleOriginMm + SHINGLE_WIDTH, roofWidth);
        const visLeftMm  = Math.max(shingleOriginMm, 0);
        if (visRightMm - visLeftMm <= 0) continue;

        drawShingle(ctx, shingleX, shingleY, SHINGLE_WIDTH * scale, drawH, scale, fill, false);

        // Cut line at left canvas edge: right-piece of the split shingle (s=0)
        if (s === 0 && ROW_OFFSET > 0) {
          drawCutLine(ctx, 0, shingleY, drawH);
        }

        // Cut line at right canvas edge: left-piece clipped by roof boundary
        const isLastShingle = (s === shingleCount - 1);
        if (isLastShingle && visRightMm < shingleOriginMm + SHINGLE_WIDTH) {
          drawCutLine(ctx, roofWidth * scale, shingleY, drawH);
        }
      }
    }
  }

  /**
   * Render the full roof area visualization on a canvas element.
   *
   * @param {HTMLCanvasElement} canvas
   * @param {number} roofWidth     — mm
   * @param {number} roofHeight    — mm
   * @param {object} calcResult    — from calculateArea()
   * @param {number} availableWidth — container width in px (used for scaling)
   */
  function renderRoof(canvas, roofWidth, roofHeight, calcResult, availableWidth) {
    const MAX_CANVAS_WIDTH = 900;
    const scale   = Math.min(MAX_CANVAS_WIDTH, availableWidth) / roofWidth;
    const canvasW = Math.round(roofWidth  * scale);
    const canvasH = Math.round(roofHeight * scale);

    canvas.width  = canvasW;
    canvas.height = canvasH;

    const ctx = canvas.getContext('2d');

    // Fill roof background (visible through tab gaps and at canvas edges)
    ctx.fillStyle = '#c8bfae';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Clip all shingle drawing to the roof rectangle so nothing renders outside
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvasW, canvasH);
    ctx.clip();

    // Draw rows bottom→top (row 1 first, highest row last).
    // Each row's solid band paints over the tabs of the row below it,
    // so tabs are visible between the solid bands — correct overlap behaviour.
    for (let i = 0; i < calcResult.rows.length; i++) {
      drawRow(ctx, calcResult.rows[i], roofWidth, canvasH, scale);
    }

    ctx.restore();

    // Draw roof boundary border last — covers any shingle overdraw at the edges
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth   = 2;
    ctx.strokeRect(1, 1, canvasW - 2, canvasH - 2);
  }

  /**
   * Build the visualization section: one labelled canvas per roof area.
   *
   * @param {Array} areas   — [{ name, width, height }]
   * @param {Array} results — [{ totalRows, totalShingles, rows }]
   */
  function renderVisualization(areas, results) {
    const $container = $('#viz-container').empty();

    // Show the section first so the panel-body has a real layout width to measure.
    $('#viz-section').show();

    // Measure available width from the now-visible panel body before creating canvases.
    const availableWidth = $('#viz-section .panel-body').width() || 900;

    areas.forEach((area, i) => {
      const r        = results[i];
      const canvasId = `canvas-area-${i + 1}`;

      const $wrap = $(`
        <div class="viz-area">
          <div class="viz-area-label">
            ${$('<span>').text(area.name).html()}
            <span>&mdash; ${area.width.toLocaleString()} &times; ${area.height.toLocaleString()} mm
              &mdash; ${r.totalRows} rows &mdash; ${r.totalShingles} shingles</span>
          </div>
          <div class="canvas-wrap">
            <canvas id="${canvasId}">Canvas not supported.</canvas>
          </div>
        </div>
      `);

      $container.append($wrap);

      const canvas = document.getElementById(canvasId);
      renderRoof(canvas, area.width, area.height, r, availableWidth);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     CALCULATE BUTTON
  ═══════════════════════════════════════════════════════════════ */
  $('#btn-calculate').on('click', function () {
    const areas = collectAreas();
    if (!areas) return; // validation failed — errors shown inline

    const results = areas.map(a => calculateArea(a.width, a.height));

    renderResultsTable(areas, results);
    renderVisualization(areas, results);

    // Smooth scroll to results
    $('html, body').animate({ scrollTop: $('#results-section').offset().top - 20 }, 300);
  });

  /* ═══════════════════════════════════════════════════════════════
     CLEAR ERRORS ON INPUT
  ═══════════════════════════════════════════════════════════════ */
  $(document).on('input', '.area-width, .area-height', function () {
    $(this).removeClass('input-error');
    $(this).siblings('.error-msg').remove();
  });

});
