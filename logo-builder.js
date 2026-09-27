/* ============================================================
   LOGO BUILDER v15 — School + Gov (Separate Images)
   ============================================================ */
(function() {
  'use strict';
  function $(id) { return document.getElementById(id); }

  // ============ DEFAULT STATE ============
  function defaultState() {
    return {
      activeTemplate: 'gov',   // सरकारी default

      bgColor: '#ffffff',
      icon: '📖',

      borderWidth: 6,
      borderStyle: 'double',
      innerCircleRadius: 135,
      outerCircleRadius: 190,

      fontFamily: 'sans-serif',
      fontWeight: 'bold',

      // Logo Size
      logoWidthInch: 2,
      logoHeightInch: 2,
      logoDPI: 150,
      logoLockRatio: true,

      // Preview
      previewShowCrosshair: true,
      previewShowRuler: true,
      previewShowGrid: true,
      previewRulerUnit: 'inch',
      previewZoom: 1,

      // 🎓 SCHOOL — अलग image
      schoolImage: null,
      topLines: [
        { text: 'श्री महेन्द्री माध्यमिक विद्यालय', size: 35, curveRadius: 143, offset: 50 }
      ],
      bottomLines: [
        { text: 'तिलोत्तमा मा.पा.-७, रूपन्देही', size: 31, curveRadius: 174, offset: 50 }
      ],
      year: '२०२०',
      yearSize: 23,
      showYear: true,
      showStars: true,
      starIcon: '★',
      starSize: 44,
      starPosX: 161,
      starPosY: 8,
      starRotation: 0,
      starUseCustomColor: false,
      starColor: '#0a0a0a',
      starCorners: false,
      showInnerCircle: true,

      // 🏛️ GOV — अलग image
      govImage: null,
      govTextStyle: {
        fontFamily: "'Noto Sans Devanagari', sans-serif",
        fontWeight: 'bold',
        textColor: '#000000',
        fontSize: 24
      },
      govLines: [
        { text: 'बारबर्दिया नगरपालिका', size: 23, curveRadius: 192, offset: 50, letterSpacing: 0, color: '#000000', visible: true },
        { text: 'नगर कार्यपालिकाको कार्यालय', size: 20, curveRadius: 177, offset: 50, letterSpacing: 0, color: '#000000', visible: true },
        { text: 'जयनगर, बर्दिया', size: 20, curveRadius: 160, offset: 50, letterSpacing: 2, color: '#000000', visible: true },
        { text: 'लुम्बिनी प्रदेश, नेपाल', size: 20, curveRadius: 144, offset: 50, letterSpacing: -1, color: '#000000', visible: true }
      ],
      layoutStartGap: 3,
      layoutLineGap: 24,
      layoutYOffset: -100,
      layoutAutoFit: true
    };
  }

  var state = defaultState();

  // ============ UNDO ============
  var undoStack = [];
  var MAX_UNDO = 30;

  function pushUndo() {
    try {
      undoStack.push(JSON.stringify(state));
      if (undoStack.length > MAX_UNDO) undoStack.shift();
    } catch (e) {}
  }

  function doUndo() {
    if (undoStack.length === 0) return;
    var prev = undoStack.pop();
    try {
      state = JSON.parse(prev);
      refreshAllInputs();
    } catch (e) {
      console.error('Undo failed:', e);
    }
  }

  // ============ HELPERS ============
  function escapeXml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function num(v, min, max, def) {
    v = parseFloat(v);
    if (isNaN(v)) return def;
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }
  function setVal(id, val) {
    var el = $(id);
    if (el && document.activeElement !== el) el.value = val;
  }

  // ============ SIZE CONVERSION ============
  function inchToCm(inch) { return inch * 2.54; }
  function cmToInch(cm) { return cm / 2.54; }
  function inchToPx(inch, dpi) { return Math.round(inch * dpi); }
  function pxToInch(px, dpi) { return px / dpi; }

  function syncSizeInputs() {
    var dpi = state.logoDPI;
    var wIn = state.logoWidthInch;
    var hIn = state.logoHeightInch;

    setVal('logoWidthInch', wIn.toFixed(2));
    setVal('logoWidthCm', inchToCm(wIn).toFixed(2));
    setVal('logoWidthPx', inchToPx(wIn, dpi));

    setVal('logoHeightInch', hIn.toFixed(2));
    setVal('logoHeightCm', inchToCm(hIn).toFixed(2));
    setVal('logoHeightPx', inchToPx(hIn, dpi));

    var info = $('logoSizeInfo');
    if (info) {
      info.textContent = '📊 ' + wIn.toFixed(2) + '" × ' + hIn.toFixed(2) + '" • ' +
        inchToCm(wIn).toFixed(2) + ' × ' + inchToCm(hIn).toFixed(2) + ' cm • ' +
        inchToPx(wIn, dpi) + ' × ' + inchToPx(hIn, dpi) + ' px';
    }
  }

  function setLogoWidth(inch) {
    if (inch < 0.5) inch = 0.5;
    if (inch > 24) inch = 24;
    state.logoWidthInch = inch;
    if (state.logoLockRatio) state.logoHeightInch = inch;
    syncSizeInputs();
    updateRulers();
  }

  function setLogoHeight(inch) {
    if (inch < 0.5) inch = 0.5;
    if (inch > 24) inch = 24;
    state.logoHeightInch = inch;
    if (state.logoLockRatio) state.logoWidthInch = inch;
    syncSizeInputs();
    updateRulers();
  }

  // ============ INNER SHAPE ============
  function renderInnerShape(cx, cy, size, color, strokeWidth) {
    var s = size;
    var sw = strokeWidth || 3;
    if (state.innerShape === 'star6') {
      var pts1 = [], pts2 = [];
      for (var i = 0; i < 3; i++) {
        var a1 = (-90 + i * 120) * Math.PI / 180;
        pts1.push((cx + s * Math.cos(a1)) + ',' + (cy + s * Math.sin(a1)));
        var a2 = (90 + i * 120) * Math.PI / 180;
        pts2.push((cx + s * Math.cos(a2)) + ',' + (cy + s * Math.sin(a2)));
      }
      return '<polygon points="' + pts1.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="' + sw + '"/>' +
             '<polygon points="' + pts2.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="' + sw + '"/>';
    }
    return '';
  }

  function getBorderDash() {
    switch (state.borderStyle) {
      case 'dashed': return '12,6';
      case 'dotted': return '2,6';
      default: return 'none';
    }
  }

  // ============ IMAGE RENDER ============
  function renderImageSVG(imgData, cx, cy, defaultSize) {
    if (!imgData || !imgData.dataURL) return '';
    var ix = cx;
    var iy = cy + num(imgData.y, -100, 100, 0);
    var size = num(imgData.displaySize, 20, 300, defaultSize || 120);
    var half = size / 2;

    var svg = '<g transform="translate(' + ix + ',' + iy + ')">';
    svg += '<image xlink:href="' + imgData.dataURL + '" href="' + imgData.dataURL + '" ';
    svg += 'x="' + (-half) + '" y="' + (-half) + '" ';
    svg += 'width="' + size + '" height="' + size + '" ';
    svg += 'preserveAspectRatio="xMidYMid meet"/>';
    svg += '</g>';
    return svg;
  }

  // ============ GOV LINES ============
  function renderGovLines(cx, cy) {
    if (!state.govLines || !state.govLines.length) return '';
    var svg = '';
    var visibleLines = state.govLines.filter(function(l) {
      return l.visible && l.text;
    });
    if (!visibleLines.length) return '';

    var startGap = num(state.layoutStartGap, 0, 200, 60);
    var lineGap = num(state.layoutLineGap, 5, 80, 20);
    var yOffset = num(state.layoutYOffset, -200, 100, 0);

    var currentY = cy + startGap + yOffset;

    visibleLines.forEach(function(line) {
      var color = line.color || state.govTextStyle.textColor;
      var fontFam = line.fontFamily || state.govTextStyle.fontFamily;
      var fontWt = line.fontWeight || state.govTextStyle.fontWeight;

      var fontSize = num(line.size, 8, 60, 24);
      var radius = num(line.curveRadius, 80, 240, 160);
      var offset = num(line.offset, 0, 100, 50);
      var letterSp = num(line.letterSpacing, -5, 20, 0);

      var yPos = currentY + fontSize * 0.75;

      var originalIndex = state.govLines.indexOf(line);
      var pathId = 'govCurve_' + originalIndex;
      var pathD = 'M ' + (cx - radius) + ' ' + yPos +
                  ' A ' + radius + ' ' + radius +
                  ' 0 0 0 ' + (cx + radius) + ' ' + yPos;

      svg += '<path id="' + pathId + '" d="' + pathD + '" fill="none"/>';
      svg += '<text font-family="' + fontFam + '" ';
      svg += 'font-size="' + fontSize + '" ';
      svg += 'font-weight="' + fontWt + '" ';
      svg += 'letter-spacing="' + letterSp + '" ';
      svg += 'fill="' + color + '" text-anchor="middle">';
      svg += '<textPath xlink:href="#' + pathId + '" href="#' + pathId + '" startOffset="' + offset + '%">';
      svg += escapeXml(line.text);
      svg += '</textPath></text>';

      currentY += fontSize + lineGap;
    });

    return svg;
  }

  // ============ SCHOOL TEMPLATE ============
  function renderSchoolTemplate(cx, cy, borderColor, borderWidth) {
    var svg = '';
    var outerR = num(state.outerCircleRadius, 100, 195, 190);
    var innerR = num(state.innerCircleRadius, 50, 185, 135);

    // School image
    if (state.schoolImage && state.schoolImage.dataURL) {
      svg += renderImageSVG(state.schoolImage, cx, cy, 150);
    }

    // Outer circle
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + outerR + '" ';
    svg += 'fill="none" stroke="' + borderColor + '" stroke-width="' + borderWidth + '"';
    var dash = getBorderDash();
    if (dash !== 'none') svg += ' stroke-dasharray="' + dash + '"';
    svg += '/>';

    if (state.borderStyle === 'double') {
      var secondR = outerR - borderWidth - 3;
      if (secondR > 10) {
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + secondR + '" ';
        svg += 'fill="none" stroke="' + borderColor + '" stroke-width="' + Math.max(1, borderWidth - 2) + '"/>';
      }
    }

    if (state.showInnerCircle) {
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + innerR + '" ';
      svg += 'fill="none" stroke="' + borderColor + '" stroke-width="' + Math.max(1, borderWidth - 1) + '"/>';
    }

    // Top text
    state.topLines.forEach(function(line, i) {
      if (!line.text) return;
      var radius = num(line.curveRadius, 100, 180, 150);
      var pathId = 'topCurve_' + i;
      svg += '<path id="' + pathId + '" d="M ' + (cx - radius) + ' ' + cy + ' A ' + radius + ' ' + radius + ' 0 0 1 ' + (cx + radius) + ' ' + cy + '" fill="none"/>';
      svg += '<text font-family="' + state.fontFamily + ', sans-serif" ';
      svg += 'font-size="' + num(line.size, 8, 40, 18) + '" ';
      svg += 'font-weight="' + state.fontWeight + '" fill="' + borderColor + '" text-anchor="middle">';
      svg += '<textPath xlink:href="#' + pathId + '" href="#' + pathId + '" startOffset="' + num(line.offset, 0, 100, 50) + '%">';
      svg += escapeXml(line.text);
      svg += '</textPath></text>';
    });

    // Bottom text
    state.bottomLines.forEach(function(line, i) {
      if (!line.text) return;
      var radius = num(line.curveRadius, 100, 180, 150);
      var pathId = 'bottomCurve_' + i;
      svg += '<path id="' + pathId + '" d="M ' + (cx - radius) + ' ' + cy + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + (cx + radius) + ' ' + cy + '" fill="none"/>';
      svg += '<text font-family="' + state.fontFamily + ', sans-serif" ';
      svg += 'font-size="' + num(line.size, 8, 40, 14) + '" ';
      svg += 'font-weight="' + state.fontWeight + '" fill="' + borderColor + '" text-anchor="middle">';
      svg += '<textPath xlink:href="#' + pathId + '" href="#' + pathId + '" startOffset="' + num(line.offset, 0, 100, 50) + '%">';
      svg += escapeXml(line.text);
      svg += '</textPath></text>';
    });

    // Emoji (यदि image छैन भने)
    if (!state.schoolImage && state.icon) {
      svg += '<text x="' + cx + '" y="' + (cy + 20) + '" text-anchor="middle" ';
      svg += 'font-size="55" dominant-baseline="middle">' + state.icon + '</text>';
    }

    // Year
    if (state.showYear && state.year) {
      svg += '<text x="' + cx + '" y="' + (cy + 105) + '" text-anchor="middle" ';
      svg += 'font-family="' + state.fontFamily + ', sans-serif" ';
      svg += 'font-size="' + num(state.yearSize, 8, 30, 14) + '" ';
      svg += 'font-weight="' + state.fontWeight + '" fill="' + borderColor + '">';
      svg += escapeXml(state.year);
      svg += '</text>';
    }

    // Stars
    if (state.showStars) {
      var sz = num(state.starSize, 16, 60, 26);
      var starChar = state.starIcon || '★';
      var px = num(state.starPosX, 0, 190, 60);
      var py = num(state.starPosY, -100, 100, 0);
      var rotS = num(state.starRotation, 0, 360, 0);
      var starColor = state.starUseCustomColor ? state.starColor : borderColor;
      var starEsc = escapeXml(starChar);

      if (state.starCorners) {
        var positions = [
          { x: cx - px, y: cy - py },
          { x: cx + px, y: cy - py },
          { x: cx - px, y: cy + py },
          { x: cx + px, y: cy + py }
        ];
        positions.forEach(function(p) {
          svg += '<g transform="translate(' + p.x + ',' + p.y + ') rotate(' + rotS + ')">';
          svg += '<text x="0" y="0" text-anchor="middle" dominant-baseline="central" ';
          svg += 'font-size="' + sz + '" fill="' + starColor + '">' + starEsc + '</text></g>';
        });
      } else {
        svg += '<g transform="translate(' + (cx - px) + ',' + (cy + py) + ') rotate(' + rotS + ')">';
        svg += '<text x="0" y="0" text-anchor="middle" dominant-baseline="central" ';
        svg += 'font-size="' + sz + '" fill="' + starColor + '">' + starEsc + '</text></g>';
        svg += '<g transform="translate(' + (cx + px) + ',' + (cy + py) + ') rotate(' + rotS + ')">';
        svg += '<text x="0" y="0" text-anchor="middle" dominant-baseline="central" ';
        svg += 'font-size="' + sz + '" fill="' + starColor + '">' + starEsc + '</text></g>';
      }
    }

    return svg;
  }

  // ============ MAIN SVG RENDER ============
  function renderSVG() {
    var h = 400;
    if (state.activeTemplate === 'gov') {
      var startGap = num(state.layoutStartGap, 0, 200, 60);
      var lineGap = num(state.layoutLineGap, 5, 80, 20);
      var yOffset = num(state.layoutYOffset, -200, 100, 0);
      h = 200 + startGap + yOffset;
      if (state.govLines) {
        state.govLines.forEach(function(l) {
          if (l.visible && l.text) {
            h += num(l.size, 8, 60, 24) + lineGap;
          }
        });
      }
      h += 50;
    }
    h = Math.max(400, Math.round(h));

    var w = 400;
    var cx = 200;
    var cy = 200;
    var borderColor = state.govTextStyle.textColor;
    var borderWidth = num(state.borderWidth, 1, 20, 4);

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' + w + ' ' + h + '" ';
    svg += 'width="' + w + '" height="' + h + '">';
    svg += '<rect width="' + w + '" height="' + h + '" fill="' + state.bgColor + '"/>';

    if (state.activeTemplate === 'school') {
      svg += renderSchoolTemplate(cx, cy, borderColor, borderWidth);
    } else if (state.activeTemplate === 'gov') {
      // Gov image
      if (state.govImage && state.govImage.dataURL) {
        svg += renderImageSVG(state.govImage, cx, cy, 120);
      }
      // ४ lines
      svg += renderGovLines(cx, cy);
    }

    svg += '</svg>';
    return svg;
  }

  function updatePreview() {
    var content = $('previewContent');
    if (!content) content = $('logoPreview');
    if (!content) return;
    content.innerHTML = renderSVG();
    applyPreviewZoom();
    setTimeout(updateRulers, 50);
  }

  // ============ PREVIEW ZOOM ============
  function applyPreviewZoom() {
    var content = $('previewContent');
    if (!content) return;
    var zoom = state.previewZoom;
    content.style.transform = 'scale(' + zoom + ')';
    content.style.transformOrigin = 'top center';
    var label = $('previewZoomLabel');
    if (label) label.textContent = Math.round(zoom * 100) + '%';
    requestAnimationFrame(function() { updateRulers(); });
  }

  function setZoom(z) {
    if (z < 0.25) z = 0.25;
    if (z > 3) z = 3;
    state.previewZoom = z;
    applyPreviewZoom();
  }

  function zoomIn() { setZoom(state.previewZoom + 0.25); }
  function zoomOut() { setZoom(state.previewZoom - 0.25); }

  function zoomFit() {
    var stage = $('previewStage');
    var content = $('previewContent');
    if (!stage || !content) return;
    var stageW = stage.clientWidth - 40;
    var stageH = stage.clientHeight - 40;
    var svgEl = content.querySelector('svg');
    if (!svgEl) return;
    var contentW = parseFloat(svgEl.getAttribute('width')) || 400;
    var contentH = parseFloat(svgEl.getAttribute('height')) || 600;
    var fitW = stageW / contentW;
    var fitH = stageH / contentH;
    var fitScale = Math.min(fitW, fitH, 1);
    if (fitScale < 0.25) fitScale = 0.25;
    if (fitScale > 1) fitScale = 1;
    state.previewZoom = fitScale;
    applyPreviewZoom();
  }

  // ============ RULER ============
  function updateRulers() {
    var topEl = $('rulerTop');
    var leftEl = $('rulerLeft');

    if (!state.previewShowRuler) {
      if (topEl) topEl.innerHTML = '';
      if (leftEl) leftEl.innerHTML = '';
      return;
    }
    if (!topEl || !leftEl) return;

    var unit = state.previewRulerUnit;
    var wIn = state.logoWidthInch;
    var zoom = state.previewZoom;

    var svgEl = document.querySelector('#previewContent svg');
    var svgW = svgEl ? parseFloat(svgEl.getAttribute('width')) : 400;
    var svgH = svgEl ? parseFloat(svgEl.getAttribute('height')) : 600;

    var svgPerUnit, suffix = '';
    if (unit === 'inch') { svgPerUnit = svgW / wIn; suffix = '"'; }
    else if (unit === 'cm') { svgPerUnit = svgW / inchToCm(wIn); }
    else { svgPerUnit = 1; }

    var screenPerUnit = svgPerUnit * zoom;

    var majorStep, minorStep;
    if (unit === 'inch') { majorStep = 0.5; minorStep = 0.25; }
    else if (unit === 'cm') { majorStep = 1; minorStep = 0.5; }
    else {
      majorStep = 50; minorStep = 10;
      if (screenPerUnit * 50 > 150) { majorStep = 100; minorStep = 20; }
      if (screenPerUnit * 50 < 30) { majorStep = 25; minorStep = 5; }
      screenPerUnit = zoom;
    }

    buildRulerAxis(topEl, 'horizontal', svgW * zoom, screenPerUnit, majorStep, minorStep, suffix);
    buildRulerAxis(leftEl, 'vertical', svgH * zoom, screenPerUnit, majorStep, minorStep, suffix);
  }

  function buildRulerAxis(container, direction, screenTotal, screenPerUnit, majorStep, minorStep, suffix) {
    container.innerHTML = '';
    var maxScreen = (direction === 'horizontal') ? container.clientWidth : container.clientHeight;
    var maxUnits = Math.min(screenTotal / screenPerUnit, maxScreen / screenPerUnit + 1);
    var unitVal = 0;
    var safety = 0;

    while (unitVal <= maxUnits + 0.001 && safety < 200) {
      safety++;
      var screenPos = unitVal * screenPerUnit;
      if (screenPos > maxScreen + 5) break;

      var tick = document.createElement('div');
      tick.className = 'ruler-tick ruler-tick-major';
      if (direction === 'horizontal') tick.style.left = screenPos + 'px';
      else tick.style.top = screenPos + 'px';
      container.appendChild(tick);

      var label = document.createElement('div');
      label.className = 'ruler-label';
      if (direction === 'horizontal') label.style.left = screenPos + 'px';
      else label.style.top = screenPos + 'px';

      var displayVal;
      if (unitVal % 1 === 0) displayVal = unitVal.toString();
      else displayVal = unitVal.toFixed(2).replace(/\.?0+$/, '');
      label.textContent = displayVal + suffix;
      container.appendChild(label);

      var minorsPerMajor = 1;
      if (majorStep === 50) minorsPerMajor = 4;
      if (majorStep === 100) minorsPerMajor = 4;
      if (majorStep === 25) minorsPerMajor = 4;

      for (var m = 1; m <= minorsPerMajor; m++) {
        var minorVal = unitVal + (majorStep / (minorsPerMajor + 1)) * m;
        var minorScreen = minorVal * screenPerUnit;
        if (minorScreen > maxScreen + 5) break;
        var minorTick = document.createElement('div');
        minorTick.className = 'ruler-tick ruler-tick-minor';
        if (direction === 'horizontal') minorTick.style.left = minorScreen + 'px';
        else minorTick.style.top = minorScreen + 'px';
        container.appendChild(minorTick);
      }
      unitVal += majorStep;
    }
  }

  // ============ PREVIEW TOGGLES ============
  function updatePreviewToggles() {
    var crosshair = $('previewCrosshair');
    if (crosshair) {
      crosshair.classList.toggle('active', state.previewShowCrosshair);
      if (state.previewShowCrosshair && !crosshair.querySelector('.crosshair-center')) {
        var dot = document.createElement('div');
        dot.className = 'crosshair-center';
        crosshair.appendChild(dot);
      }
    }
    var grid = $('previewGrid');
    if (grid) grid.classList.toggle('active', state.previewShowGrid);
    var rulerTop = $('rulerTop');
    var rulerLeft = $('rulerLeft');
    if (rulerTop) rulerTop.style.display = state.previewShowRuler ? 'block' : 'none';
    if (rulerLeft) rulerLeft.style.display = state.previewShowRuler ? 'block' : 'none';
    updateRulers();
  }

  function setupPreviewControls() {
    var ch = $('previewShowCrosshair');
    if (ch) {
      ch.checked = state.previewShowCrosshair;
      ch.addEventListener('change', function() {
        state.previewShowCrosshair = ch.checked;
        updatePreviewToggles();
      });
    }
    var ru = $('previewShowRuler');
    if (ru) {
      ru.checked = state.previewShowRuler;
      ru.addEventListener('change', function() {
        state.previewShowRuler = ru.checked;
        updatePreviewToggles();
      });
    }
    var gr = $('previewShowGrid');
    if (gr) {
      gr.checked = state.previewShowGrid;
      gr.addEventListener('change', function() {
        state.previewShowGrid = gr.checked;
        updatePreviewToggles();
      });
    }
    var unitSel = $('previewRulerUnit');
    if (unitSel) {
      unitSel.value = state.previewRulerUnit;
      unitSel.addEventListener('change', function() {
        state.previewRulerUnit = unitSel.value;
        updateRulers();
      });
    }
    var zIn = $('previewZoomIn'); if (zIn) zIn.addEventListener('click', zoomIn);
    var zOut = $('previewZoomOut'); if (zOut) zOut.addEventListener('click', zoomOut);
    var zFit = $('previewZoomFit'); if (zFit) zFit.addEventListener('click', zoomFit);
  }

  // ============ TEMPLATE SWITCHER ============
  function setupTemplateSwitcher() {
    var tabs = document.querySelectorAll('.template-tab');
    if (!tabs.length) return;

    tabs.forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-template') === state.activeTemplate);
    });

    tabs.forEach(function(tab) {
      tab.addEventListener('click', function(e) {
        e.preventDefault();
        var tpl = tab.getAttribute('data-template');
        if (tpl === state.activeTemplate) return;

        pushUndo();
        state.activeTemplate = tpl;
        tabs.forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        toggleTemplateSections();
        updatePreview();
      });
    });
  }

  function toggleTemplateSections() {
    var isGov = state.activeTemplate === 'gov';
    var schoolSecs = document.querySelectorAll('.school-template-section');
    var govSecs = document.querySelectorAll('.gov-template-section');

    schoolSecs.forEach(function(s) { s.style.display = isGov ? 'none' : 'block'; });
    govSecs.forEach(function(s) { s.style.display = isGov ? 'block' : 'none'; });
  }

  // ============ LAYOUT CONTROLS ============
  function setupLayoutControls() {
    function bindPair(numId, sliderId, prop, min, max, def) {
      var numEl = $(numId);
      var sliderEl = $(sliderId);
      if (!numEl || !sliderEl) return;
      numEl.value = state[prop];
      sliderEl.value = state[prop];
      numEl.addEventListener('input', function() {
        sliderEl.value = numEl.value;
        state[prop] = parseFloat(numEl.value) || def;
        updatePreview();
      });
      sliderEl.addEventListener('input', function() {
        numEl.value = sliderEl.value;
        state[prop] = parseFloat(sliderEl.value) || def;
        updatePreview();
      });
    }

    bindPair('layoutStartGap', 'layoutStartGapSlider', 'layoutStartGap', 0, 200, 3);
    bindPair('layoutLineGap', 'layoutLineGapSlider', 'layoutLineGap', 5, 80, 24);
    bindPair('layoutYOffset', 'layoutYOffsetSlider', 'layoutYOffset', -200, 100, -100);

    var autoFit = $('layoutAutoFit');
    if (autoFit) {
      autoFit.checked = state.layoutAutoFit;
      autoFit.addEventListener('change', function() {
        state.layoutAutoFit = autoFit.checked;
        updatePreview();
      });
    }

    document.querySelectorAll('.layout-preset-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var preset = btn.getAttribute('data-preset');
        applyLayoutPreset(preset);
        document.querySelectorAll('.layout-preset-btn').forEach(function(b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
      });
    });
  }

  function applyLayoutPreset(preset) {
    pushUndo();
    switch (preset) {
      case 'tight': state.layoutStartGap = 40; state.layoutLineGap = 10; break;
      case 'normal': state.layoutStartGap = 3; state.layoutLineGap = 24; break;
      case 'loose': state.layoutStartGap = 80; state.layoutLineGap = 35; break;
      case 'auto': state.layoutStartGap = 3; state.layoutLineGap = 24; break;
    }
    setVal('layoutStartGap', state.layoutStartGap);
    setVal('layoutStartGapSlider', state.layoutStartGap);
    setVal('layoutLineGap', state.layoutLineGap);
    setVal('layoutLineGapSlider', state.layoutLineGap);
    updatePreview();
  }

  // ============ GOV LINES UI ============
  function renderGovLinesUI() {
    var wrap = $('govLinesContainer');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!state.govLines) state.govLines = [];

    state.govLines.forEach(function(line, i) {
      var div = document.createElement('div');
      div.className = 'gov-line-item';

      var preview = line.text ? escapeHtml(line.text.substring(0, 22)) : '(खाली)';
      if (line.text && line.text.length > 22) preview += '…';

      div.innerHTML =
        '<div class="gov-line-header">' +
          '<span class="gov-line-num">' + (i + 1) + '</span>' +
          '<span class="gov-line-title">' + preview + '</span>' +
          '<div class="gov-line-actions">' +
            '<button class="toggle-vis">' + (line.visible ? '👁️' : '🚫') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="gov-line-body">' +
          '<div class="logo-field">' +
            '<label>Text</label>' +
            '<input type="text" data-gov-text value="' + escapeHtml(line.text) + '">' +
          '</div>' +
          '<div class="gov-slider-row">' +
            buildGovSlider('Size (px)', 'data-gov-size', line.size, 8, 60) +
            buildGovSlider('Curve Radius', 'data-gov-radius', line.curveRadius, 80, 240) +
          '</div>' +
          '<span class="gov-advanced-toggle">⚙️ Advanced ▾</span>' +
          '<div class="gov-advanced-panel">' +
            '<div class="gov-slider-row">' +
              buildGovSlider('Letter Spacing', 'data-gov-letterspacing', line.letterSpacing, -5, 20) +
              buildGovSlider('Offset %', 'data-gov-offset', line.offset, 0, 100) +
            '</div>' +
            '<div class="logo-field">' +
              '<label>Custom Color</label>' +
              '<input type="color" data-gov-color value="' + (line.color || state.govTextStyle.textColor) + '">' +
            '</div>' +
          '</div>' +
        '</div>';

      bindGovLineEvents(div, i);
      wrap.appendChild(div);
    });
  }

  function buildGovSlider(label, attr, value, min, max) {
    return '<div class="logo-slider-group">' +
      '<div class="logo-slider-header">' +
        '<label>' + label + '</label>' +
        '<input type="number" ' + attr + ' value="' + value + '" min="' + min + '" max="' + max + '" class="logo-slider-value">' +
      '</div>' +
      '<input type="range" ' + attr + '-slider value="' + value + '" min="' + min + '" max="' + max + '" class="logo-slider">' +
    '</div>';
  }

  function bindGovLineEvents(div, index) {
    var txt = div.querySelector('[data-gov-text]');
    txt.addEventListener('input', function(e) {
      state.govLines[index].text = e.target.value;
      div.querySelector('.gov-line-title').textContent = e.target.value.substring(0, 22) || '(खाली)';
      updatePreview();
    });

    function bindPair(attr, prop) {
      var numEl = div.querySelector('[' + attr + ']');
      var sliderEl = div.querySelector('[' + attr + '-slider]');
      if (!numEl || !sliderEl) return;
      function apply(val) {
        state.govLines[index][prop] = val;
        updatePreview();
      }
      numEl.addEventListener('input', function() {
        sliderEl.value = numEl.value;
        apply(parseFloat(numEl.value));
      });
      sliderEl.addEventListener('input', function() {
        numEl.value = sliderEl.value;
        apply(parseFloat(sliderEl.value));
      });
    }

    bindPair('data-gov-size', 'size');
    bindPair('data-gov-radius', 'curveRadius');
    bindPair('data-gov-letterspacing', 'letterSpacing');
    bindPair('data-gov-offset', 'offset');

    var colorEl = div.querySelector('[data-gov-color]');
    if (colorEl) colorEl.addEventListener('input', function(e) {
      state.govLines[index].color = e.target.value;
      updatePreview();
    });

    var toggle = div.querySelector('.gov-advanced-toggle');
    var panel = div.querySelector('.gov-advanced-panel');
    toggle.addEventListener('click', function() {
      panel.classList.toggle('open');
      toggle.textContent = panel.classList.contains('open') ? '⚙️ Advanced ▴' : '⚙️ Advanced ▾';
    });

    div.querySelector('.toggle-vis').addEventListener('click', function() {
      state.govLines[index].visible = !state.govLines[index].visible;
      renderGovLinesUI();
      updatePreview();
    });
  }

  // ============ SCHOOL LINES UI ============
  function renderTopLines() {
    var wrap = $('logoTopLines');
    if (!wrap) return;
    wrap.innerHTML = '';
    state.topLines.forEach(function(line, i) {
      var div = document.createElement('div');
      div.className = 'logo-line-item';
      div.innerHTML =
        '<div class="logo-line-header"><span>Line ' + (i + 1) + '</span>' +
        '<button class="logo-line-remove">❌</button></div>' +
        '<div class="logo-field"><label>Content</label>' +
        '<input type="text" data-line-text value="' + escapeHtml(line.text) + '"></div>' +
        '<div class="logo-slider-group">' +
          '<div class="logo-slider-header"><label>Font Size (px)</label>' +
          '<input type="number" data-line-size value="' + line.size + '" min="8" max="40" class="logo-slider-value"></div>' +
          '<input type="range" data-line-size-slider value="' + line.size + '" min="8" max="40" class="logo-slider">' +
        '</div>' +
        '<div class="logo-slider-group">' +
          '<div class="logo-slider-header"><label>Curve Radius</label>' +
          '<input type="number" data-line-radius value="' + (line.curveRadius || 150) + '" min="100" max="180" class="logo-slider-value"></div>' +
          '<input type="range" data-line-radius-slider value="' + (line.curveRadius || 150) + '" min="100" max="180" class="logo-slider">' +
        '</div>';
      var txt = div.querySelector('[data-line-text]');
      var size = div.querySelector('[data-line-size]');
      var sizeSl = div.querySelector('[data-line-size-slider]');
      var rad = div.querySelector('[data-line-radius]');
      var radSl = div.querySelector('[data-line-radius-slider]');
      txt.addEventListener('input', function(e) { state.topLines[i].text = e.target.value; updatePreview(); });
      size.addEventListener('input', function(e) { state.topLines[i].size = parseFloat(e.target.value) || 18; sizeSl.value = e.target.value; updatePreview(); });
      sizeSl.addEventListener('input', function(e) { state.topLines[i].size = parseFloat(e.target.value) || 18; size.value = e.target.value; updatePreview(); });
      rad.addEventListener('input', function(e) { state.topLines[i].curveRadius = parseFloat(e.target.value) || 150; radSl.value = e.target.value; updatePreview(); });
      radSl.addEventListener('input', function(e) { state.topLines[i].curveRadius = parseFloat(e.target.value) || 150; rad.value = e.target.value; updatePreview(); });
      div.querySelector('.logo-line-remove').addEventListener('click', function() {
        if (state.topLines.length <= 1) { alert('कम्तीमा १ line चाहिन्छ।'); return; }
        state.topLines.splice(i, 1); renderTopLines(); updatePreview();
      });
      wrap.appendChild(div);
    });
  }

  function renderBottomLines() {
    var wrap = $('logoBottomLines');
    if (!wrap) return;
    wrap.innerHTML = '';
    state.bottomLines.forEach(function(line, i) {
      var div = document.createElement('div');
      div.className = 'logo-line-item';
      div.innerHTML =
        '<div class="logo-line-header"><span>Line ' + (i + 1) + '</span>' +
        '<button class="logo-line-remove">❌</button></div>' +
        '<div class="logo-field"><label>Content</label>' +
        '<input type="text" data-line-text value="' + escapeHtml(line.text) + '"></div>' +
        '<div class="logo-slider-group">' +
          '<div class="logo-slider-header"><label>Font Size (px)</label>' +
          '<input type="number" data-line-size value="' + line.size + '" min="8" max="40" class="logo-slider-value"></div>' +
          '<input type="range" data-line-size-slider value="' + line.size + '" min="8" max="40" class="logo-slider">' +
        '</div>' +
        '<div class="logo-slider-group">' +
          '<div class="logo-slider-header"><label>Curve Radius</label>' +
          '<input type="number" data-line-radius value="' + (line.curveRadius || 150) + '" min="100" max="180" class="logo-slider-value"></div>' +
          '<input type="range" data-line-radius-slider value="' + (line.curveRadius || 150) + '" min="100" max="180" class="logo-slider">' +
        '</div>';
      var txt = div.querySelector('[data-line-text]');
      var size = div.querySelector('[data-line-size]');
      var sizeSl = div.querySelector('[data-line-size-slider]');
      var rad = div.querySelector('[data-line-radius]');
      var radSl = div.querySelector('[data-line-radius-slider]');
      txt.addEventListener('input', function(e) { state.bottomLines[i].text = e.target.value; updatePreview(); });
      size.addEventListener('input', function(e) { state.bottomLines[i].size = parseFloat(e.target.value) || 14; sizeSl.value = e.target.value; updatePreview(); });
      sizeSl.addEventListener('input', function(e) { state.bottomLines[i].size = parseFloat(e.target.value) || 14; size.value = e.target.value; updatePreview(); });
      rad.addEventListener('input', function(e) { state.bottomLines[i].curveRadius = parseFloat(e.target.value) || 150; radSl.value = e.target.value; updatePreview(); });
      radSl.addEventListener('input', function(e) { state.bottomLines[i].curveRadius = parseFloat(e.target.value) || 150; rad.value = e.target.value; updatePreview(); });
      div.querySelector('.logo-line-remove').addEventListener('click', function() {
        if (state.bottomLines.length <= 1) { alert('कम्तीमा १ line चाहिन्छ।'); return; }
        state.bottomLines.splice(i, 1); renderBottomLines(); updatePreview();
      });
      wrap.appendChild(div);
    });
  }

  function setupAddLineButtons() {
    var addTop = $('logoAddTopLine');
    if (addTop) addTop.addEventListener('click', function() {
      if (state.topLines.length >= 5) { alert('अधिकतम ५ line।'); return; }
      state.topLines.push({ text: 'नयाँ line', size: 16, curveRadius: 150, offset: 50 });
      renderTopLines(); updatePreview();
    });
    var addBottom = $('logoAddBottomLine');
    if (addBottom) addBottom.addEventListener('click', function() {
      if (state.bottomLines.length >= 5) { alert('अधिकतम ५ line।'); return; }
      state.bottomLines.push({ text: 'नयाँ line', size: 14, curveRadius: 150, offset: 50 });
      renderBottomLines(); updatePreview();
    });
  }

  // ============ SCHOOL YEAR/STARS ============
  function setupSchoolYearStars() {
    var showYear = $('logoShowYear');
    if (showYear) {
      showYear.checked = state.showYear;
      showYear.addEventListener('change', function() {
        state.showYear = showYear.checked;
        updatePreview();
      });
    }
    var year = $('logoYear');
    if (year) {
      year.value = state.year;
      year.addEventListener('input', function(e) {
        state.year = e.target.value;
        updatePreview();
      });
    }
    var yearSize = $('logoYearSize');
    if (yearSize) {
      yearSize.value = state.yearSize;
      yearSize.addEventListener('input', function(e) {
        state.yearSize = parseFloat(e.target.value) || 23;
        updatePreview();
      });
    }
    var showStars = $('logoShowStars');
    if (showStars) {
      showStars.checked = state.showStars;
      showStars.addEventListener('change', function() {
        state.showStars = showStars.checked;
        updatePreview();
      });
    }
    var starIcon = $('logoStarIcon');
    if (starIcon) {
      starIcon.value = state.starIcon;
      starIcon.addEventListener('input', function(e) {
        state.starIcon = e.target.value;
        updatePreview();
      });
    }
    var starSize = $('logoStarSize');
    if (starSize) {
      starSize.value = state.starSize;
      starSize.addEventListener('input', function(e) {
        state.starSize = parseFloat(e.target.value) || 44;
        updatePreview();
      });
    }
    var starX = $('logoStarPosX');
    if (starX) {
      starX.value = state.starPosX;
      starX.addEventListener('input', function(e) {
        state.starPosX = parseFloat(e.target.value) || 161;
        updatePreview();
      });
    }
    var starY = $('logoStarPosY');
    if (starY) {
      starY.value = state.starPosY;
      starY.addEventListener('input', function(e) {
        state.starPosY = parseFloat(e.target.value) || 8;
        updatePreview();
      });
    }
    var starCorners = $('logoStarCorners');
    if (starCorners) {
      starCorners.checked = state.starCorners;
      starCorners.addEventListener('change', function() {
        state.starCorners = starCorners.checked;
        updatePreview();
      });
    }
  }

  // ============ IMAGE UPLOAD (दुई अलग) ============
  function setupImageUpload(prefix, stateKey) {
    var dropZone = $(prefix + 'ImageDrop');
    var input = $(prefix + 'ImageInput');
    if (!dropZone || !input) return;

    dropZone.addEventListener('click', function() { input.click(); });
    dropZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', function() {
      dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      var files = e.dataTransfer.files;
      if (files && files[0]) handleImageFile(files[0], prefix, stateKey);
    });
    input.addEventListener('change', function() {
      if (input.files && input.files[0]) handleImageFile(input.files[0], prefix, stateKey);
      input.value = '';
    });

    var removeBtn = $(prefix + 'ImageRemoveBtn');
    if (removeBtn) removeBtn.addEventListener('click', function() {
      if (!state[stateKey]) return;
      if (!confirm('Image हटाउने?')) return;
      pushUndo();
      state[stateKey] = null;
      refreshImageUI(prefix, stateKey);
      updatePreview();
    });

    var replaceBtn = $(prefix + 'ImageReplaceBtn');
    if (replaceBtn) replaceBtn.addEventListener('click', function() { input.click(); });
  }

  function handleImageFile(file, prefix, stateKey) {
    var isImageType = file.type && file.type.indexOf('image/') === 0;
    var ext = (file.name || '').toLowerCase().split('.').pop();
    var validExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    if (!isImageType && validExts.indexOf(ext) === -1) {
      alert('कृपया image file मात्र upload गर्नुहोस्।');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File 5 MB भन्दा सानो हुनुपर्छ।');
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      var dataURL = e.target.result;
      var img = new Image();
      img.onload = function() {
        var maxSize = 800;
        var origW = img.width;
        var origH = img.height;
        var dataURLFinal = dataURL;

        if (origW > maxSize || origH > maxSize) {
          var ratio = Math.min(maxSize / origW, maxSize / origH);
          var newW = Math.round(origW * ratio);
          var newH = Math.round(origH * ratio);
          var canvas = document.createElement('canvas');
          canvas.width = newW;
          canvas.height = newH;
          canvas.getContext('2d').drawImage(img, 0, 0, newW, newH);
          var fmt = (file.type === 'image/png') ? 'image/png' : 'image/jpeg';
          dataURLFinal = canvas.toDataURL(fmt, 0.92);
        }

        pushUndo();
        var prev = state[stateKey] || {};
        state[stateKey] = {
          dataURL: dataURLFinal,
          name: file.name,
          size: file.size,
          origW: origW,
          origH: origH,
          displaySize: prev.displaySize || (prefix === 'school' ? 150 : 120),
          y: prev.y || 0
        };
        refreshImageUI(prefix, stateKey);
        updatePreview();
      };
      img.onerror = function() { alert('Image load गर्न सकिएन।'); };
      img.src = dataURL;
    };
    reader.onerror = function() { alert('File read गर्न सकिएन।'); };
    reader.readAsDataURL(file);
  }

  function refreshImageUI(prefix, stateKey) {
    var img = state[stateKey];
    var hasImg = img && img.dataURL;
    var controlsWrap = $(prefix + 'ImageControls');
    var previewWrap = $(prefix + 'ImagePreviewWrap');
    var dropZone = $(prefix + 'ImageDrop');
    var emojiField = $(prefix + 'EmojiField');

    if (hasImg) {
      if (controlsWrap) controlsWrap.style.display = 'block';
      if (previewWrap) previewWrap.style.display = 'block';
      if (dropZone) dropZone.style.display = 'none';
      if (emojiField) emojiField.style.display = 'none';

      var previewImg = $(prefix + 'ImagePreview');
      if (previewImg) previewImg.src = img.dataURL;
      var info = $(prefix + 'ImageInfo');
      if (info) info.textContent = img.name + ' • ' + (img.size / 1024).toFixed(1) + ' KB • ' + img.origW + '×' + img.origH + 'px';

      setVal(prefix + 'ImageSize', img.displaySize);
      setVal(prefix + 'ImageSizeSlider', img.displaySize);
      setVal(prefix + 'ImageY', img.y);
      setVal(prefix + 'ImageYSlider', img.y);
    } else {
      if (controlsWrap) controlsWrap.style.display = 'none';
      if (previewWrap) previewWrap.style.display = 'none';
      if (dropZone) dropZone.style.display = 'block';
      if (emojiField) emojiField.style.display = 'block';
    }
  }

  function setupImageSliders(prefix, stateKey) {
    function updateImg(prop, value) {
      if (!state[stateKey]) return;
      state[stateKey][prop] = value;
      updatePreview();
    }

    var sizeSl = $(prefix + 'ImageSizeSlider');
    var sizeNum = $(prefix + 'ImageSize');
    if (sizeSl && sizeNum) {
      sizeSl.addEventListener('input', function() {
        sizeNum.value = sizeSl.value;
        updateImg('displaySize', parseFloat(sizeSl.value));
      });
      sizeNum.addEventListener('input', function() {
        sizeSl.value = sizeNum.value;
        updateImg('displaySize', parseFloat(sizeNum.value) || 120);
      });
    }

    var ySl = $(prefix + 'ImageYSlider');
    var yNum = $(prefix + 'ImageY');
    if (ySl && yNum) {
      ySl.addEventListener('input', function() {
        yNum.value = ySl.value;
        updateImg('y', parseFloat(ySl.value));
      });
      yNum.addEventListener('input', function() {
        ySl.value = yNum.value;
        updateImg('y', parseFloat(yNum.value) || 0);
      });
    }
  }

  // ============ SIZE CONTROLS ============
  function setupSizeControls() {
    var wIn = $('logoWidthInch');
    if (wIn) wIn.addEventListener('input', function() { setLogoWidth(parseFloat(wIn.value) || 2); });
    var wCm = $('logoWidthCm');
    if (wCm) wCm.addEventListener('input', function() { setLogoWidth(cmToInch(parseFloat(wCm.value) || 5)); });
    var wPx = $('logoWidthPx');
    if (wPx) wPx.addEventListener('input', function() { setLogoWidth(pxToInch(parseFloat(wPx.value) || 300, state.logoDPI)); });
    var hIn = $('logoHeightInch');
    if (hIn) hIn.addEventListener('input', function() { setLogoHeight(parseFloat(hIn.value) || 2); });
    var hCm = $('logoHeightCm');
    if (hCm) hCm.addEventListener('input', function() { setLogoHeight(cmToInch(parseFloat(hCm.value) || 5)); });
    var hPx = $('logoHeightPx');
    if (hPx) hPx.addEventListener('input', function() { setLogoHeight(pxToInch(parseFloat(hPx.value) || 300, state.logoDPI)); });

    var lock = $('logoLockRatio');
    if (lock) {
      lock.checked = state.logoLockRatio;
      lock.addEventListener('change', function() {
        state.logoLockRatio = lock.checked;
        if (lock.checked) {
          state.logoHeightInch = state.logoWidthInch;
          syncSizeInputs();
          updateRulers();
        }
      });
    }

    var dpiSel = $('logoDPI');
    if (dpiSel) {
      dpiSel.value = state.logoDPI;
      dpiSel.addEventListener('change', function() {
        state.logoDPI = parseInt(dpiSel.value);
        syncSizeInputs();
      });
    }

    document.querySelectorAll('.size-preset-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var inch = parseFloat(btn.getAttribute('data-inch'));
        setLogoWidth(inch);
        document.querySelectorAll('.size-preset-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });

    syncSizeInputs();
  }

  // ============ COMMON INPUTS ============
  function setupInputs() {
    var bgColor = $('logoBgColor');
    if (bgColor) {
      bgColor.value = state.bgColor;
      bgColor.addEventListener('input', function(e) {
        state.bgColor = e.target.value;
        updatePreview();
      });
    }

    var borderW = $('logoBorderWidth');
    var borderWSl = $('logoBorderWidthSlider');
    if (borderW && borderWSl) {
      borderW.value = state.borderWidth;
      borderWSl.value = state.borderWidth;
      borderW.addEventListener('input', function() {
        borderWSl.value = borderW.value;
        state.borderWidth = parseFloat(borderW.value) || 6;
        updatePreview();
      });
      borderWSl.addEventListener('input', function() {
        borderW.value = borderWSl.value;
        state.borderWidth = parseFloat(borderWSl.value) || 6;
        updatePreview();
      });
    }

    var innerR = $('logoInnerCircleRadius');
    var innerRSl = $('logoInnerCircleRadiusSlider');
    if (innerR && innerRSl) {
      innerR.value = state.innerCircleRadius;
      innerRSl.value = state.innerCircleRadius;
      innerR.addEventListener('input', function() {
        innerRSl.value = innerR.value;
        state.innerCircleRadius = parseFloat(innerR.value) || 135;
        updatePreview();
      });
      innerRSl.addEventListener('input', function() {
        innerR.value = innerRSl.value;
        state.innerCircleRadius = parseFloat(innerRSl.value) || 135;
        updatePreview();
      });
    }

    var iconEl = $('logoIcon');
    if (iconEl) {
      iconEl.value = state.icon;
      iconEl.addEventListener('input', function(e) {
        state.icon = e.target.value;
        updatePreview();
      });
    }
  }

  function setupGovFontColor() {
    var fontFam = $('govFontFamily');
    if (fontFam) {
      fontFam.value = state.govTextStyle.fontFamily;
      fontFam.addEventListener('change', function(e) {
        state.govTextStyle.fontFamily = e.target.value;
        updatePreview();
      });
    }
    var fontWt = $('govFontWeight');
    if (fontWt) {
      fontWt.value = state.govTextStyle.fontWeight;
      fontWt.addEventListener('change', function(e) {
        state.govTextStyle.fontWeight = e.target.value;
        updatePreview();
      });
    }
    var fontSize = $('govFontSize');
    var fontSizeSl = $('govFontSizeSlider');
    if (fontSize && fontSizeSl) {
      fontSize.value = state.govTextStyle.fontSize;
      fontSizeSl.value = state.govTextStyle.fontSize;
      fontSize.addEventListener('input', function() {
        fontSizeSl.value = fontSize.value;
        state.govTextStyle.fontSize = parseFloat(fontSize.value) || 24;
        updatePreview();
      });
      fontSizeSl.addEventListener('input', function() {
        fontSize.value = fontSizeSl.value;
        state.govTextStyle.fontSize = parseFloat(fontSizeSl.value) || 24;
        updatePreview();
      });
    }
    var textColor = $('govTextColor');
    if (textColor) {
      textColor.value = state.govTextStyle.textColor;
      textColor.addEventListener('input', function(e) {
        state.govTextStyle.textColor = e.target.value;
        updatePreview();
      });
    }
  }

  function refreshAllInputs() {
    setVal('logoBgColor', state.bgColor);
    setVal('logoBorderWidth', state.borderWidth);
    setVal('logoBorderWidthSlider', state.borderWidth);
    setVal('logoInnerCircleRadius', state.innerCircleRadius);
    setVal('logoInnerCircleRadiusSlider', state.innerCircleRadius);
    setVal('logoIcon', state.icon);
    setVal('logoLockRatio', state.logoLockRatio);
    setVal('logoDPI', state.logoDPI);
    setVal('previewShowCrosshair', state.previewShowCrosshair);
    setVal('previewShowRuler', state.previewShowRuler);
    setVal('previewShowGrid', state.previewShowGrid);
    setVal('previewRulerUnit', state.previewRulerUnit);
    setVal('layoutStartGap', state.layoutStartGap);
    setVal('layoutStartGapSlider', state.layoutStartGap);
    setVal('layoutLineGap', state.layoutLineGap);
    setVal('layoutLineGapSlider', state.layoutLineGap);
    setVal('layoutYOffset', state.layoutYOffset);
    setVal('layoutYOffsetSlider', state.layoutYOffset);
    setVal('layoutAutoFit', state.layoutAutoFit);
    setVal('govFontFamily', state.govTextStyle.fontFamily);
    setVal('govFontWeight', state.govTextStyle.fontWeight);
    setVal('govFontSize', state.govTextStyle.fontSize);
    setVal('govFontSizeSlider', state.govTextStyle.fontSize);
    setVal('govTextColor', state.govTextStyle.textColor);
    setVal('logoYear', state.year);
    setVal('logoYearSize', state.yearSize);
    setVal('logoShowYear', state.showYear);
    setVal('logoShowStars', state.showStars);
    setVal('logoStarIcon', state.starIcon);
    setVal('logoStarSize', state.starSize);
    setVal('logoStarPosX', state.starPosX);
    setVal('logoStarPosY', state.starPosY);
    setVal('logoStarCorners', state.starCorners);

    var tabs = document.querySelectorAll('.template-tab');
    tabs.forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-template') === state.activeTemplate);
    });
    toggleTemplateSections();

    syncSizeInputs();
    refreshImageUI('school', 'schoolImage');
    refreshImageUI('gov', 'govImage');
    renderGovLinesUI();
    renderTopLines();
    renderBottomLines();
    updatePreview();
    updatePreviewToggles();
    applyPreviewZoom();
  }

  // ============ SAVE / LOAD ============
  var STORAGE_KEY = 'logo_builder_v15';

  function saveLogo() {
    try {
      var name = prompt('Save गर्ने नाम:', 'मेरो logo');
      if (!name) return;
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      saved[name] = { state: state, savedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      alert('✅ "' + name + '" save भयो!');
      refreshSavedList();
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  }

  function loadSaved(name) {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!saved[name]) return;
      pushUndo();
      state = JSON.parse(JSON.stringify(saved[name].state));
      // Backward compat
      if (state.layoutStartGap === undefined) state.layoutStartGap = 3;
      if (state.layoutLineGap === undefined) state.layoutLineGap = 24;
      if (state.layoutYOffset === undefined) state.layoutYOffset = -100;
      if (state.layoutAutoFit === undefined) state.layoutAutoFit = true;
      refreshAllInputs();
    } catch (e) {
      alert('Load failed: ' + e.message);
    }
  }

  function deleteSaved(name) {
    if (!confirm('"' + name + '" delete गर्ने?')) return;
    var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    delete saved[name];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    refreshSavedList();
  }

  function refreshSavedList() {
    var wrap = $('logoSavedList');
    if (!wrap) return;
    var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    var keys = Object.keys(saved);
    if (keys.length === 0) {
      wrap.innerHTML = '<div style="font-size:12px;color:#999;text-align:center;padding:10px;">अझै केही save गरिएको छैन</div>';
      return;
    }
    wrap.innerHTML = '';
    keys.forEach(function(name) {
      var item = document.createElement('div');
      item.className = 'logo-saved-item';
      item.innerHTML = '<span>' + escapeHtml(name) + '</span>' +
        '<div><button data-load>📂</button><button data-del>🗑️</button></div>';
      item.querySelector('[data-load]').addEventListener('click', function() { loadSaved(name); });
      item.querySelector('[data-del]').addEventListener('click', function() { deleteSaved(name); });
      wrap.appendChild(item);
    });
  }

  // ============ EXPORT ============
  function downloadPNG() {
    var svgStr = renderSVG();
    var dpi = state.logoDPI;
    var wPx = inchToPx(state.logoWidthInch, dpi);
    var hPx = inchToPx(state.logoHeightInch, dpi);
    if (wPx < 50) wPx = 50;
    if (hPx < 50) hPx = 50;
    if (wPx > 8000) wPx = 8000;
    if (hPx > 8000) hPx = 8000;

    var canvas = document.createElement('canvas');
    canvas.width = wPx;
    canvas.height = hPx;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, wPx, hPx);

    var img = new Image();
    var svg64 = btoa(unescape(encodeURIComponent(svgStr)));
    img.onload = function() {
      ctx.drawImage(img, 0, 0, wPx, hPx);
      canvas.toBlob(function(blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'logo-' + wPx + 'x' + hPx + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
      }, 'image/png');
    };
    img.onerror = function() { alert('PNG failed. Try SVG.'); };
    img.src = 'data:image/svg+xml;base64,' + svg64;
  }

  function downloadSVG() {
    var svgStr = renderSVG();
    var wIn = state.logoWidthInch;
    var hIn = state.logoHeightInch;
    svgStr = svgStr.replace(/<svg([^>]*?)>/, '<svg$1 width="' + wIn + 'in" height="' + hIn + 'in">');
    var blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'logo-' + wIn + 'x' + hIn + 'in.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
  }

  function printLogo() {
    var svgStr = renderSVG();
    var wIn = state.logoWidthInch;
    var hIn = state.logoHeightInch;
    var html = '<!DOCTYPE html><html><head><title>Print Logo</title><style>';
    html += '@page { size: auto; margin: 10mm; }';
    html += 'body { margin:0; padding:0; display:flex; align-items:center; justify-content:center; min-height:100vh; background:white; }';
    html += '.l { width:' + wIn + 'in; height:' + hIn + 'in; }';
    html += '.l svg { width:100%; height:100%; display:block; }';
    html += '</style></head><body><div class="l">' + svgStr + '</div></body></html>';
    var win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(function() { win.print(); }, 700);
  }

  function resetLogo() {
    if (!confirm('Reset गर्ने? सबै change हराउनेछ।')) return;
    pushUndo();
    state = defaultState();
    refreshAllInputs();
  }

  // ============ KEYBOARD ============
  function setupKeyboard() {
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        e.preventDefault();
        doUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveLogo();
      }
    });
    window.addEventListener('resize', function() { updateRulers(); });
  }

  // ============ INIT ============
  function init() {
    if (!$('logoPreview')) return;

    setupInputs();
    setupGovFontColor();
    setupSchoolYearStars();
    setupImageUpload('school', 'schoolImage');
    setupImageUpload('gov', 'govImage');
    setupImageSliders('school', 'schoolImage');
    setupImageSliders('gov', 'govImage');
    setupSizeControls();
    setupLayoutControls();
    setupPreviewControls();
    setupTemplateSwitcher();
    setupAddLineButtons();
    setupKeyboard();

    toggleTemplateSections();
    refreshImageUI('school', 'schoolImage');
    refreshImageUI('gov', 'govImage');
    refreshSavedList();
    renderTopLines();
    renderBottomLines();
    renderGovLinesUI();
    updatePreview();
    updatePreviewToggles();
    applyPreviewZoom();

    document.querySelectorAll('.layout-preset-btn').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-preset') === 'normal');
    });

    var pngBtn = $('logoDownloadPng'); if (pngBtn) pngBtn.addEventListener('click', downloadPNG);
    var svgBtn = $('logoDownloadSvg'); if (svgBtn) svgBtn.addEventListener('click', downloadSVG);
    var printBtn = $('logoPrintBtn'); if (printBtn) printBtn.addEventListener('click', printLogo);
    var resetBtn = $('logoResetBtn'); if (resetBtn) resetBtn.addEventListener('click', resetLogo);
    var undoBtn = $('logoUndoBtn'); if (undoBtn) undoBtn.addEventListener('click', doUndo);
    var saveBtn = $('logoSaveBtn'); if (saveBtn) saveBtn.addEventListener('click', saveLogo);

    console.log('🎨 Logo Builder v15 ready — School + Gov (Separate Images)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

})();