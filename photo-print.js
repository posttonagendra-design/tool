/* ============================================================
   PHOTO PRINT — Auto-detect + Copies + Layout + Print/PDF/PNG
   ============================================================ */
(function() {
  'use strict';
  function $(id) { return document.getElementById(id); }

  var PAPER_SIZES = {
    'a4': { w: 210, h: 297 },
    '4r': { w: 102, h: 152 },
    '3r': { w: 89, h: 127 }
  };

  var DPI = 300;
  var MM_PER_INCH = 25.4;
  var MM_TO_PX = DPI / MM_PER_INCH;
  var files = [];

  function mmToPx(mm) { return Math.round(mm * MM_TO_PX); }

  function readAsDataURL(file) {
    return new Promise(function(res, rej) {
      var r = new FileReader();
      r.onload = function() { res(r.result); };
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise(function(res, rej) {
      var img = new Image();
      img.onload = function() { res(img); };
      img.onerror = rej;
      img.src = src;
    });
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
  }

  // ============ AUTO-DETECT SIZE ============
  function detectPhotoSize(img) {
    var w_mm = (img.width / DPI) * MM_PER_INCH;
    var h_mm = (img.height / DPI) * MM_PER_INCH;
    var tol = 3;
    if (Math.abs(w_mm - 35) <= tol && Math.abs(h_mm - 45) <= tol) {
      return { preset: 'passport', w: 35, h: 45, detectedW: w_mm, detectedH: h_mm };
    }
    if (Math.abs(w_mm - 25) <= tol && Math.abs(h_mm - 30) <= tol) {
      return { preset: 'auto', w: 25, h: 30, detectedW: w_mm, detectedH: h_mm };
    }
    return { preset: 'auto', w: 25, h: 30, detectedW: w_mm, detectedH: h_mm, unmatched: true };
  }

  // ============ COPIES LOGIC ============
  function getExpandedPhotos() {
    var copies = parseInt($('photoCopies') && $('photoCopies').value) || 1;
    if (copies < 1) copies = 1;
    if (copies > 500) copies = 500;
    var expanded = [];
    files.forEach(function(f) {
      for (var c = 0; c < copies; c++) {
        expanded.push(f);
      }
    });
    return expanded;
  }

  function getPhotoSize() {
    var key = $('photoSize').value;
    if (key === 'passport') return { w: 35, h: 45, preset: 'passport' };
    if (key === 'detect' && files.length && files[0].detected) {
      return { w: files[0].detected.w, h: files[0].detected.h, preset: files[0].detected.preset };
    }
    return { w: 25, h: 30, preset: 'auto' };
  }

  function getPaperSize() {
    var key = $('paperSize').value;
    var p = PAPER_SIZES[key] || PAPER_SIZES['4r'];
    var orient = $('paperOrientation') ? $('paperOrientation').value : 'portrait';
    if (orient === 'landscape' && p.h > p.w) return { w: p.h, h: p.w };
    if (orient === 'portrait' && p.w > p.h) return { w: p.h, h: p.w };
    return p;
  }

  function getMargin() {
    return parseFloat($('photoMargin') && $('photoMargin').value) || 1;
  }

  // ============ UPLOAD ============
  function setupUpload() {
    var drop = $('photoDrop');
    var input = $('photoInput');
    if (!drop || !input) return;
    drop.addEventListener('click', function() { input.click(); });
    drop.addEventListener('dragover', function(e) {
      e.preventDefault(); drop.classList.add('dragover');
    });
    drop.addEventListener('dragleave', function() { drop.classList.remove('dragover'); });
    drop.addEventListener('drop', function(e) {
      e.preventDefault(); drop.classList.remove('dragover');
      addFiles(Array.prototype.slice.call(e.dataTransfer.files));
    });
    input.addEventListener('change', function() {
      addFiles(Array.prototype.slice.call(input.files));
      input.value = '';
    });
  }

  function addFiles(list) {
    var imgs = list.filter(function(f) {
      return f.type && f.type.indexOf('image/') === 0;
    });
    if (!imgs.length) { alert('Image file मात्र upload गर्नुहोस्।'); return; }
    var done = 0;
    imgs.forEach(function(f) {
      readAsDataURL(f).then(function(url) {
        return loadImage(url).then(function(img) {
          var detected = detectPhotoSize(img);
          files.push({
            id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: f.name,
            dataURL: url,
            originalW: img.width,
            originalH: img.height,
            detected: detected,
            rotation: 0
          });
          done++;
          if (done === imgs.length) render();
        });
      }).catch(function() {
        done++;
        if (done === imgs.length) render();
      });
    });
  }

  // ============ RENDER PHOTO GRID ============
  function render() {
    var grid = $('photoGrid');
    var empty = $('photoEmpty');
    var topBar = $('photoTopBar');
    var cnt = $('photoCount');
    if (!grid) return;

    if (!files.length) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      if (topBar) topBar.style.display = 'none';
      renderPreview();
      return;
    }
    if (empty) empty.style.display = 'none';
    if (topBar) topBar.style.display = 'flex';
    if (cnt) cnt.textContent = files.length + ' photo' + (files.length > 1 ? 's' : '');

    grid.innerHTML = '';
    files.forEach(function(f, i) {
      var card = document.createElement('div');
      card.className = 'photo-item';
      card.draggable = true;
      card.dataset.index = i;

      var img = document.createElement('img');
      img.src = f.dataURL;
      var rc = f.rotation === 90 ? 'rot-90' : f.rotation === 180 ? 'rot-180' : f.rotation === 270 ? 'rot-270' : '';
      if (rc) img.className = rc;
      card.appendChild(img);

      var badge = document.createElement('span');
      badge.className = 'photo-order';
      badge.textContent = i + 1;
      card.appendChild(badge);

      if (f.detected) {
        var det = document.createElement('span');
        det.className = 'photo-detect-badge';
        var label = f.detected.preset === 'passport' ? 'Passport' : 'Auto';
        det.textContent = label + ' • ' + f.detected.w + '×' + f.detected.h;
        card.appendChild(det);
      }

      var actions = document.createElement('div');
      actions.className = 'photo-actions';

      var rotBtn = document.createElement('button');
      rotBtn.title = 'Rotate 90°';
      rotBtn.textContent = '↻';
      rotBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        f.rotation = ((f.rotation || 0) + 90) % 360;
        render();
      });
      actions.appendChild(rotBtn);

      var delBtn = document.createElement('button');
      delBtn.className = 'danger';
      delBtn.title = 'Remove';
      delBtn.textContent = '×';
      delBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        files.splice(i, 1);
        render();
      });
      actions.appendChild(delBtn);
      card.appendChild(actions);

      card.addEventListener('dragstart', function(e) {
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', i);
      });
      card.addEventListener('dragend', function() {
        card.classList.remove('dragging');
        grid.querySelectorAll('.photo-item').forEach(function(el) {
          el.classList.remove('drag-over');
        });
      });
      card.addEventListener('dragover', function(e) {
        e.preventDefault();
        card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', function() { card.classList.remove('drag-over'); });
      card.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        card.classList.remove('drag-over');
        var from = parseInt(e.dataTransfer.getData('text/plain'), 10);
        var to = i;
        if (from === to || isNaN(from)) return;
        var moved = files.splice(from, 1)[0];
        files.splice(to, 0, moved);
        render();
      });

      grid.appendChild(card);
    });

    renderPreview();
  }

  // ============ RENDER PREVIEW ============
  function renderPreview() {
    var wrap = $('photoPreview');
    if (!wrap) return;

    if (!files.length) {
      wrap.innerHTML = '<div class="preview-empty">📷 Photo upload गर्नुहोस् — preview यहाँ देखिन्छ</div>';
      return;
    }

    var photoSize = getPhotoSize();
    var paper = getPaperSize();
    var cols = parseInt($('photoCols').value) || 4;
    var rows = parseInt($('photoRows').value) || 3;
    var cropMarks = $('photoCropMarks') && $('photoCropMarks').checked;
    var bgColor = ($('photoBgColor') && $('photoBgColor').value) || '#ffffff';
    var gap = parseFloat($('photoGap').value) || 0;
    var marginVal = getMargin();

    var maxW = 420, maxH = 420;
    var scale = Math.min(maxW / paper.w, maxH / paper.h);

    var paperWpx = paper.w * scale;
    var paperHpx = paper.h * scale;

    var totalW = cols * photoSize.w + (cols - 1) * gap;
    var totalH = rows * photoSize.h + (rows - 1) * gap;

    // Top-aligned with margin
    var offsetX = Math.max(marginVal, (paper.w - totalW) / 2);
    var offsetY = marginVal;

    var html = '<div class="preview-paper" style="';
    html += 'width:' + paperWpx + 'px;';
    html += 'height:' + paperHpx + 'px;';
    html += 'background:' + bgColor + ';';
    html += 'position:relative;';
    html += 'box-shadow:0 4px 16px rgba(0,0,0,0.15);';
    html += 'border:1px solid #ddd;';
    html += 'flex-shrink:0;';
    html += '">';

    var expandedPhotos = getExpandedPhotos();
    var photoIdx = 0;
    var maxPhotos = cols * rows;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (photoIdx >= expandedPhotos.length) break;
        if (photoIdx >= maxPhotos) break;

        var f = expandedPhotos[photoIdx];
        var x = (offsetX + c * (photoSize.w + gap)) * scale;
        var y = (offsetY + r * (photoSize.h + gap)) * scale;
        var pw = photoSize.w * scale;
        var ph = photoSize.h * scale;

        var rc = f.rotation === 90 ? 'rot-90' : f.rotation === 180 ? 'rot-180' : f.rotation === 270 ? 'rot-270' : '';

        html += '<div class="preview-photo" style="';
        html += 'position:absolute;';
        html += 'left:' + x + 'px;';
        html += 'top:' + y + 'px;';
        html += 'width:' + pw + 'px;';
        html += 'height:' + ph + 'px;';
        html += 'overflow:hidden;';
        html += 'background:#f0f0f0;';
        html += '">';
        html += '<img src="' + f.dataURL + '" class="' + rc + '" style="';
        html += 'width:100%;height:100%;object-fit:cover;display:block;';
        html += '">';
        if (cropMarks) {
          html += '<div style="position:absolute;inset:0;border:1px dashed #888;pointer-events:none;"></div>';
        }
        html += '</div>';
        photoIdx++;
      }
    }

    if (expandedPhotos.length > maxPhotos) {
      html += '<div style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);';
      html += 'background:rgba(0,0,0,0.7);color:white;padding:4px 12px;border-radius:6px;font-size:11px;white-space:nowrap;">';
      html += '+' + (expandedPhotos.length - maxPhotos) + ' more copies (next page)';
      html += '</div>';
    }
    html += '</div>';

    var copies = parseInt($('photoCopies') && $('photoCopies').value) || 1;
    html += '<div class="preview-info">';
    html += '📐 ' + paper.w + ' × ' + paper.h + ' mm &nbsp;•&nbsp; ';
    html += '📷 ' + photoSize.w + ' × ' + photoSize.h + ' mm &nbsp;•&nbsp; ';
    html += '📊 ' + cols + ' × ' + rows + ' = ' + (cols * rows) + ' per page &nbsp;•&nbsp; ';
    html += '🔢 ' + files.length + ' photo × ' + copies + ' copies = <strong>' + expandedPhotos.length + ' prints</strong>';
    if (totalW > paper.w || totalH > paper.h) {
      html += '<br><span style="color:#c42621;font-weight:700;">⚠️ Photos paper भन्दा ठूलो — Rows/Cols घटाउनुहोस्</span>';
    }
    html += '</div>';

    wrap.innerHTML = html;
  }

  // ============ SETTINGS ============
  function setupSettings() {
    ['photoSize', 'paperSize', 'paperOrientation', 'photoCols', 'photoRows',
     'photoGap', 'photoMargin', 'photoCropMarks', 'photoBgColor', 'photoCopies'].forEach(function(id) {
      var el = $(id);
      if (el) {
        el.addEventListener('input', renderPreview);
        el.addEventListener('change', renderPreview);
      }
    });
  }

  // ============ GENERATE PDF ============
  async function generatePDF() {
    if (!files.length) { alert('कृपया कम्तीमा १ photo upload गर्नुहोस्।'); return; }
    if (!window.jspdf || !window.jspdf.jsPDF) { alert('jsPDF library छैन।'); return; }

    var photoSize = getPhotoSize();
    var paper = getPaperSize();
    var cols = parseInt($('photoCols').value) || 4;
    var rows = parseInt($('photoRows').value) || 3;
    var gap = parseFloat($('photoGap').value) || 0;
    var cropMarks = $('photoCropMarks') && $('photoCropMarks').checked;
    var marginVal = getMargin();

    var expandedPhotos = getExpandedPhotos();
    var perPage = cols * rows;
    var totalPages = Math.ceil(expandedPhotos.length / perPage);

    var jsPDF = window.jspdf.jsPDF;
    var pdf = new jsPDF({
      unit: 'mm',
      format: [paper.w, paper.h],
      orientation: paper.w > paper.h ? 'landscape' : 'portrait'
    });

    for (var p = 0; p < totalPages; p++) {
      if (p > 0) {
        pdf.addPage([paper.w, paper.h], paper.w > paper.h ? 'landscape' : 'portrait');
      }
      var totalW = cols * photoSize.w + (cols - 1) * gap;
      var totalH = rows * photoSize.h + (rows - 1) * gap;
      var offsetX = Math.max(marginVal, (paper.w - totalW) / 2);
      var offsetY = marginVal;

      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var idx = p * perPage + r * cols + c;
          if (idx >= expandedPhotos.length) break;
          var f = expandedPhotos[idx];
          var x = offsetX + c * (photoSize.w + gap);
          var y = offsetY + r * (photoSize.h + gap);

          var img = await loadImage(f.dataURL);
          var rotation = f.rotation || 0;
          var isSideways = rotation % 180 !== 0;
          var targetW = mmToPx(photoSize.w);
          var targetH = mmToPx(photoSize.h);
          var canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.save();
          ctx.translate(targetW / 2, targetH / 2);
          ctx.rotate(rotation * Math.PI / 180);
          var fitW = isSideways ? targetH : targetW;
          var fitH = isSideways ? targetW : targetH;
          var ratio = Math.max(fitW / img.width, fitH / img.height);
          var drawW = img.width * ratio;
          var drawH = img.height * ratio;
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();
          var jpegData = canvas.toDataURL('image/jpeg', 0.92);
          pdf.addImage(jpegData, 'JPEG', x, y, photoSize.w, photoSize.h);
          if (cropMarks) {
            pdf.setDrawColor(180);
            pdf.setLineWidth(0.1);
            pdf.rect(x, y, photoSize.w, photoSize.h);
          }
        }
      }
    }
    pdf.save('photos-print.pdf');
  }

  // ============ PRINT ============
  function printPhotos() {
    if (!files.length) { alert('कृपया कम्तीमा १ photo upload गर्नुहोस्।'); return; }

    var photoSize = getPhotoSize();
    var paper = getPaperSize();
    var cols = parseInt($('photoCols').value) || 4;
    var rows = parseInt($('photoRows').value) || 3;
    var gap = parseFloat($('photoGap').value) || 0;
    var cropMarks = $('photoCropMarks') && $('photoCropMarks').checked;
    var bgColor = ($('photoBgColor') && $('photoBgColor').value) || '#ffffff';
    var marginVal = getMargin();

    var expandedPhotos = getExpandedPhotos();
    var perPage = cols * rows;
    var totalPages = Math.ceil(expandedPhotos.length / perPage);

    var html = '<!DOCTYPE html><html><head><title>Print</title><style>';
    html += '@page { size: ' + paper.w + 'mm ' + paper.h + 'mm; margin: 0; }';
    html += '* { box-sizing: border-box; }';
    html += 'body { margin:0; padding:0; background:#f0f0f0; font-family:sans-serif; }';
    html += '.page { width:' + paper.w + 'mm; height:' + paper.h + 'mm; background:' + bgColor + '; position:relative; overflow:hidden; page-break-after:always; margin:0 auto; }';
    html += '.page:last-child { page-break-after:auto; }';
    html += '.photo { position:absolute; overflow:hidden; background:#eee; }';
    html += '.photo img { width:100%; height:100%; object-fit:cover; display:block; }';
    html += '.rot-90 { transform:rotate(90deg); }';
    html += '.rot-180 { transform:rotate(180deg); }';
    html += '.rot-270 { transform:rotate(270deg); }';
    html += '.crop { position:absolute; inset:0; border:1px dashed #999; pointer-events:none; }';
    html += '@media print { body { background:white; } .page { margin:0; box-shadow:none; } }';
    html += '@media screen { .page { margin:20px auto; box-shadow:0 2px 8px rgba(0,0,0,0.15); } }';
    html += '</style></head><body>';

    for (var p = 0; p < totalPages; p++) {
      var totalW = cols * photoSize.w + (cols - 1) * gap;
      var totalH = rows * photoSize.h + (rows - 1) * gap;
      var offsetX = Math.max(marginVal, (paper.w - totalW) / 2);
      var offsetY = marginVal;
      html += '<div class="page">';
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var idx = p * perPage + r * cols + c;
          if (idx >= expandedPhotos.length) break;
          var f = expandedPhotos[idx];
          var x = offsetX + c * (photoSize.w + gap);
          var y = offsetY + r * (photoSize.h + gap);
          var rc = f.rotation === 90 ? 'rot-90' : f.rotation === 180 ? 'rot-180' : f.rotation === 270 ? 'rot-270' : '';
          html += '<div class="photo" style="left:' + x + 'mm;top:' + y + 'mm;width:' + photoSize.w + 'mm;height:' + photoSize.h + 'mm;">';
          html += '<img src="' + f.dataURL + '" class="' + rc + '">';
          if (cropMarks) html += '<div class="crop"></div>';
          html += '</div>';
        }
      }
      html += '</div>';
    }
    html += '</body></html>';

    var win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(function() { win.print(); }, 700);
  }

  // ============ SAVE AS PNG ============
  async function saveAsImage() {
    if (!files.length) { alert('कृपया कम्तीमा १ photo upload गर्नुहोस्।'); return; }

    var photoSize = getPhotoSize();
    var paper = getPaperSize();
    var cols = parseInt($('photoCols').value) || 4;
    var rows = parseInt($('photoRows').value) || 3;
    var gap = parseFloat($('photoGap').value) || 0;
    var bgColor = ($('photoBgColor') && $('photoBgColor').value) || '#ffffff';
    var cropMarks = $('photoCropMarks') && $('photoCropMarks').checked;
    var marginVal = getMargin();

    var expandedPhotos = getExpandedPhotos();
    var perPage = cols * rows;
    var totalPages = Math.ceil(expandedPhotos.length / perPage);

    for (var p = 0; p < totalPages; p++) {
      var canvas = document.createElement('canvas');
      canvas.width = mmToPx(paper.w);
      canvas.height = mmToPx(paper.h);
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      var totalW = cols * photoSize.w + (cols - 1) * gap;
      var totalH = rows * photoSize.h + (rows - 1) * gap;
      var offsetX = Math.max(marginVal, (paper.w - totalW) / 2);
      var offsetY = marginVal;

      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var idx = p * perPage + r * cols + c;
          if (idx >= expandedPhotos.length) break;
          var f = expandedPhotos[idx];
          var px = mmToPx(offsetX + c * (photoSize.w + gap));
          var py = mmToPx(offsetY + r * (photoSize.h + gap));
          var pw = mmToPx(photoSize.w);
          var ph = mmToPx(photoSize.h);

          var img = await loadImage(f.dataURL);
          var rotation = f.rotation || 0;
          var isSideways = rotation % 180 !== 0;

          ctx.save();
          ctx.beginPath();
          ctx.rect(px, py, pw, ph);
          ctx.clip();
          ctx.translate(px + pw / 2, py + ph / 2);
          ctx.rotate(rotation * Math.PI / 180);
          var fitW = isSideways ? ph : pw;
          var fitH = isSideways ? pw : ph;
          var ratio = Math.max(fitW / img.width, fitH / img.height);
          var drawW = img.width * ratio;
          var drawH = img.height * ratio;
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();

          if (cropMarks) {
            ctx.strokeStyle = '#999';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(px, py, pw, ph);
            ctx.setLineDash([]);
          }
        }
      }

      await new Promise(function(res) {
        canvas.toBlob(function(blob) {
          var name = totalPages > 1 ? 'photos-page-' + (p + 1) + '.png' : 'photos.png';
          download(blob, name);
          setTimeout(res, 400);
        }, 'image/png');
      });
    }
  }

  // ============ INIT ============
  function init() {
    if (!$('photoDrop')) return;
    setupUpload();
    setupSettings();
    render();

    var p = $('photoPrintBtn');
    if (p) p.addEventListener('click', printPhotos);
    var d = $('photoPdfBtn');
    if (d) d.addEventListener('click', generatePDF);
    var i = $('photoImageBtn');
    if (i) i.addEventListener('click', saveAsImage);
    var c = $('photoClearBtn');
    if (c) c.addEventListener('click', function() {
      if (!files.length) return;
      if (confirm('सबै photos हटाउने?')) { files = []; render(); }
    });

    console.log('🖼️ Photo Print ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();