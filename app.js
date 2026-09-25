(function() {
  'use strict';
  function $(id) { return document.getElementById(id); }

  // ============ LIBRARY CHECK ============
  var hasJsPDF = window.jspdf && window.jspdf.jsPDF;
  var hasPdfLib = window.PDFLib && window.PDFLib.PDFDocument;
  var hasPdfJs = window.pdfjsLib;
  var hasJSZip = window.JSZip;

  if (hasPdfJs) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
  }

  var missing = [];
  if (!hasJsPDF) missing.push('jspdf.umd.min.js');
  if (!hasPdfLib) missing.push('pdf-lib.min.js');
  if (!hasPdfJs) missing.push('pdf.min.js + pdf.worker.min.js');
  if (!hasJSZip) missing.push('jszip.min.js');

  if (missing.length === 0) {
    $('libStatus').textContent = '✅ सबै library load भयो — तयार छ (offline)';
    $('libStatus').className = 'lib-status ok';
  } else {
    $('libStatus').textContent = '❌ भेटिएन: ' + missing.join(', ');
    $('libStatus').className = 'lib-status fail';
  }

  // ============ HELPERS ============
  function setStatus(id, msg, type) {
    $(id).textContent = msg;
    $(id).className = 'status ' + type;
  }
  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  }
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
  function setupDrop(zoneEl, inputEl, onFiles) {
    zoneEl.addEventListener('click', function() { inputEl.click(); });
    zoneEl.addEventListener('dragover', function(e) { e.preventDefault(); zoneEl.classList.add('dragover'); });
    zoneEl.addEventListener('dragleave', function(e) { e.preventDefault(); zoneEl.classList.remove('dragover'); });
    zoneEl.addEventListener('drop', function(e) {
      e.preventDefault();
      zoneEl.classList.remove('dragover');
      onFiles(Array.prototype.slice.call(e.dataTransfer.files));
    });
    inputEl.addEventListener('change', function() {
      onFiles(Array.prototype.slice.call(inputEl.files));
      inputEl.value = '';
    });
  }
  async function isPdfFile(file) {
    try {
      var buf = await file.slice(0, 5).arrayBuffer();
      var bytes = new Uint8Array(buf);
      var header = '';
      for (var i = 0; i < 5; i++) header += String.fromCharCode(bytes[i]);
      return header === '%PDF-';
    } catch (e) { return false; }
  }

  // ============ ROTATION HELPERS ============
  function getRotationClass(deg) {
    deg = ((deg % 360) + 360) % 360;
    if (deg === 90) return 'rot-90';
    if (deg === 180) return 'rot-180';
    if (deg === 270) return 'rot-270';
    return '';
  }

  async function rotateImageDataURL(dataUrl, rotationDeg) {
    if (!rotationDeg || rotationDeg % 360 === 0) return dataUrl;
    var img = await loadImage(dataUrl);
    var rad = rotationDeg * Math.PI / 180;
    var isSideways = (rotationDeg % 180) !== 0;
    var newW = isSideways ? img.height : img.width;
    var newH = isSideways ? img.width : img.height;
    var canvas = document.createElement('canvas');
    canvas.width = newW;
    canvas.height = newH;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, newW, newH);
    ctx.translate(newW / 2, newH / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    return canvas.toDataURL('image/jpeg', 0.95);
  }

  // ============ GRID RENDERER ============
  function renderGrid(opts) {
    var el = opts.listEl;
    var hintEl = opts.hintEl;
    el.innerHTML = '';
    if (opts.items.length === 0) {
      if (hintEl) hintEl.style.display = 'none';
      return;
    }
    if (hintEl) hintEl.style.display = opts.items.length > 1 ? 'block' : 'none';

    opts.items.forEach(function(item, i) {
      if (typeof item._rotation !== 'number') item._rotation = 0;

      var card = document.createElement('div');
      card.className = 'grid-item';
      card.draggable = true;
      card.dataset.index = i;

      var thumb = document.createElement('div');
      thumb.className = 'thumb';
      if (item._preview) {
        var img = document.createElement('img');
        img.src = item._preview;
        img.alt = item.name;
        var rc = getRotationClass(item._rotation);
        if (rc) img.classList.add(rc);
        thumb.appendChild(img);
      } else {
        var icon = document.createElement('div');
        icon.className = 'pdf-icon';
        icon.textContent = item._isImage ? '🖼️' : '📄';
        var rc2 = getRotationClass(item._rotation);
        if (rc2) icon.classList.add(rc2);
        thumb.appendChild(icon);
      }
      card.appendChild(thumb);

      var badge = document.createElement('div');
      badge.className = 'order-badge';
      badge.textContent = i + 1;
      card.appendChild(badge);

      var topBtns = document.createElement('div');
      topBtns.className = 'top-right-btns';
      var rotateBtn = document.createElement('button');
      rotateBtn.title = 'Rotate 90° clockwise';
      rotateBtn.textContent = '↻';
      rotateBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        item._rotation = ((item._rotation || 0) + 90) % 360;
        opts.onReorder();
      });
      topBtns.appendChild(rotateBtn);
      card.appendChild(topBtns);

      var btn = document.createElement('button');
      btn.className = 'remove';
      btn.textContent = '×';
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        opts.items.splice(i, 1);
        opts.onReorder();
      });
      card.appendChild(btn);

      var info = document.createElement('div');
      info.className = 'info';
      var name = document.createElement('span');
      name.className = 'name';
      name.textContent = item.name;
      name.title = item.name;
      var meta = document.createElement('span');
      meta.className = 'meta';
      meta.textContent = fmtSize(item.size) + (item._pages ? ' • ' + item._pages + ' pages' : '');
      if (item._rotation && item._rotation % 360 !== 0) {
        var tag = document.createElement('span');
        tag.className = 'rotation-tag';
        tag.textContent = item._rotation + '°';
        meta.appendChild(tag);
      }
      info.appendChild(name);
      info.appendChild(meta);
      card.appendChild(info);

      card.addEventListener('dragstart', function(e) {
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', i);
      });
      card.addEventListener('dragend', function() {
        card.classList.remove('dragging');
        el.querySelectorAll('.grid-item').forEach(function(it) { it.classList.remove('drag-over'); });
      });
      card.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
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
        var moved = opts.items.splice(from, 1)[0];
        opts.items.splice(to, 0, moved);
        opts.onReorder();
      });

      el.appendChild(card);
    });
  }

  function updateTopBar(barId, countId, count, label) {
    var bar = $(barId);
    var cnt = $(countId);
    if (count > 0) {
      bar.style.display = 'flex';
      cnt.textContent = count + ' ' + label;
    } else {
      bar.style.display = 'none';
    }
  }

  // ============ TABS ============
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
      btn.classList.add('active');
      $(btn.getAttribute('data-tab')).classList.add('active');
    });
  });

  // ============ 1) JPG TO PDF ============
  var jpgFiles = [];
  function renderJpg() {
    renderGrid({ listEl: $('jpgList'), hintEl: $('jpgHint'), items: jpgFiles, onReorder: renderJpg });
    updateTopBar('jpgTopBar', 'jpgCount', jpgFiles.length, jpgFiles.length === 1 ? 'file' : 'files');
  }

  setupDrop($('jpgDrop'), $('jpgInput'), function(files) {
    var imgs = files.filter(function(f) { return f.type && f.type.indexOf('image/') === 0; });
    if (!imgs.length) { setStatus('jpgStatus', 'Image file मात्र upload गर्नुहोस्।', 'error'); return; }
    var done = 0;
    imgs.forEach(function(f) {
      readAsDataURL(f).then(function(url) {
        f._preview = url; f._isImage = true; f._rotation = 0;
        jpgFiles.push(f); done++;
        if (done === imgs.length) renderJpg();
      }).catch(function() {
        f._isImage = true; f._rotation = 0;
        jpgFiles.push(f); done++;
        if (done === imgs.length) renderJpg();
      });
    });
  });

  function convertJpgToPdf() {
    if (!hasJsPDF) { setStatus('jpgStatus', 'jspdf library load भएको छैन।', 'error'); return; }
    if (!jpgFiles.length) { setStatus('jpgStatus', 'कृपया कम्तीमा १ image upload गर्नुहोस्।', 'error'); return; }
    setStatus('jpgStatus', 'Converting... कृपया पर्खनुहोस्', 'loading');

    var pageSize = $('jpgPageSize').value;
    var orientation = $('jpgOrientation').value;
    var margin = parseFloat($('jpgMargin').value) || 0;
    var quality = parseFloat($('jpgQuality').value) || 0.9;
    if (quality < 0.1) quality = 0.1;
    if (quality > 1) quality = 1;

    var pdf = null, idx = 0;
    function next() {
      if (idx >= jpgFiles.length) {
        try {
          pdf.save('converted.pdf');
          setStatus('jpgStatus', '✅ PDF download भयो! (' + jpgFiles.length + ' pages)', 'success');
        } catch (e) { setStatus('jpgStatus', '❌ Error: ' + e.message, 'error'); }
        return;
      }
      var file = jpgFiles[idx];
      var rotation = file._rotation || 0;
      readAsDataURL(file).then(function(dataUrl) {
        return rotateImageDataURL(dataUrl, rotation);
      }).then(function(dataUrl) {
        return loadImage(dataUrl);
      }).then(function(img) {
        var pw, ph;
        if (pageSize === 'fit') { pw = img.width; ph = img.height; }
        else if (pageSize === 'a4') { pw = 595.28; ph = 841.89; }
        else { pw = 612; ph = 792; }
        if (orientation === 'landscape') { if (pw < ph) { var t = pw; pw = ph; ph = t; } }
        else if (orientation === 'portrait') { if (pw > ph) { var t2 = pw; pw = ph; ph = t2; } }
        else {
          if (img.width > img.height && pw < ph) { var t3 = pw; pw = ph; ph = t3; }
          else if (img.height > img.width && pw > ph) { var t4 = pw; pw = ph; ph = t4; }
        }
        if (!pdf) {
          pdf = new window.jspdf.jsPDF({
            unit: 'pt', format: [pw, ph],
            orientation: pw > ph ? 'landscape' : 'portrait', compress: true
          });
        } else {
          pdf.addPage([pw, ph], pw > ph ? 'landscape' : 'portrait');
        }
        var mPt = margin * 2.8346;
        var availW = pw - mPt * 2, availH = ph - mPt * 2;
        var ratio = Math.min(availW / img.width, availH / img.height);
        var drawW = img.width * ratio, drawH = img.height * ratio;
        var x = (pw - drawW) / 2, y = (ph - drawH) / 2;
        var canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        var jpegData = canvas.toDataURL('image/jpeg', quality);
        pdf.addImage(jpegData, 'JPEG', x, y, drawW, drawH);
        idx++; next();
      }).catch(function(err) { setStatus('jpgStatus', '❌ Error: ' + err.message, 'error'); });
    }
    next();
  }

  $('jpgConvertBtn').addEventListener('click', convertJpgToPdf);
  $('jpgConvertTop').addEventListener('click', convertJpgToPdf);

  // ============ 2) PDF TO JPG ============
  var pdf2jpgFile = null;
  var pdf2jpgPages = [];

  function renderPdf2Jpg() {
    renderGrid({
      listEl: $('pdf2jpgList'), hintEl: null,
      items: pdf2jpgPages.map(function(p) {
        return {
          name: 'Page ' + p.pageNum + '.' + (p.ext || 'jpg'),
          size: p.size,
          _preview: p.dataURL,
          _isImage: true,
          _rotation: p.rotation || 0
        };
      }),
      onReorder: function() {}
    });
    var cnt = pdf2jpgPages.length;
    var bar = $('pdf2jpgTopBar');
    if (cnt > 0) {
      bar.style.display = 'flex';
      $('pdf2jpgCount').textContent = cnt + (cnt === 1 ? ' page' : ' pages');
    } else if (pdf2jpgFile) {
      bar.style.display = 'flex';
      $('pdf2jpgCount').textContent = 'PDF तयार';
    } else {
      bar.style.display = 'none';
    }
  }

  $('pdf2jpgDownloadMode').addEventListener('change', function() {
    var info = $('pdf2jpgModeInfo');
    if (this.value === 'auto') info.classList.add('show');
    else info.classList.remove('show');
  });

  setupDrop($('pdf2jpgDrop'), $('pdf2jpgInput'), async function(files) {
    var pdf = files.filter(function(f) {
      return f.type === 'application/pdf' || f.name.toLowerCase().slice(-4) === '.pdf';
    })[0];
    if (!pdf) { setStatus('pdf2jpgStatus', 'PDF file मात्र upload गर्नुहोस्।', 'error'); return; }
    var ok = await isPdfFile(pdf);
    if (!ok) { setStatus('pdf2jpgStatus', '❌ यो file valid PDF होइन।', 'error'); return; }
    pdf2jpgFile = pdf;
    pdf2jpgPages = [];
    renderPdf2Jpg();
    setStatus('pdf2jpgStatus', '✅ PDF तयार छ — Convert थिच्नुहोस्।', 'success');
  });

  async function convertPdf2Jpg() {
    if (!hasPdfJs) { setStatus('pdf2jpgStatus', 'pdf.js library load भएको छैन।', 'error'); return; }
    if (!pdf2jpgFile) { setStatus('pdf2jpgStatus', 'कृपया PDF file upload गर्नुहोस्।', 'error'); return; }
    setStatus('pdf2jpgStatus', 'PDF load हुँदैछ...', 'loading');

    try {
      var arrayBuffer = await pdf2jpgFile.arrayBuffer();
      var pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      var totalPages = pdf.numPages;
      var scale = parseFloat($('pdf2jpgQuality').value) || 2;
      var format = $('pdf2jpgFormat').value;
      var jpegQuality = parseFloat($('pdf2jpgJpegQuality').value) || 0.92;
      var ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';

      pdf2jpgPages = [];

      for (var p = 1; p <= totalPages; p++) {
        setStatus('pdf2jpgStatus', 'Page ' + p + ' / ' + totalPages + ' render हुँदैछ...', 'loading');
        var page = await pdf.getPage(p);
        var viewport = page.getViewport({ scale: scale });
        var canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        var dataURL = canvas.toDataURL(format, jpegQuality);
        var blob = await new Promise(function(res) { canvas.toBlob(res, format, jpegQuality); });
        pdf2jpgPages.push({
          pageNum: p, dataURL: dataURL, blob: blob,
          size: blob.size, ext: ext,
          width: canvas.width, height: canvas.height,
          rotation: 0
        });
      }

      renderPdf2Jpg();

      var mode = $('pdf2jpgDownloadMode').value;
      var useZip = false;
      if (mode === 'zip') useZip = true;
      else if (mode === 'auto') useZip = totalPages >= 3;
      else useZip = false;

      var baseName = pdf2jpgFile.name.replace(/\.[^.]+$/, '');

      if (useZip) {
        if (!hasJSZip) {
          setStatus('pdf2jpgStatus', '⚠️ ZIP library भेटिएन — अलग-अलग download गर्दैछौं...', 'loading');
          for (var j = 0; j < pdf2jpgPages.length; j++) {
            download(pdf2jpgPages[j].blob, baseName + '_page' + pdf2jpgPages[j].pageNum + '.' + ext);
            await new Promise(function(r) { setTimeout(r, 350); });
          }
          setStatus('pdf2jpgStatus', '✅ सबै ' + totalPages + ' page download भयो!', 'success');
          return;
        }

        setStatus('pdf2jpgStatus', 'ZIP file बन्दैछ...', 'loading');
        var zip = new window.JSZip();
        for (var k = 0; k < pdf2jpgPages.length; k++) {
          var fileName = baseName + '_page' + String(pdf2jpgPages[k].pageNum).padStart(3, '0') + '.' + ext;
          zip.file(fileName, pdf2jpgPages[k].blob);
        }
        var zipBlob = await zip.generateAsync({ type: 'blob' });
        download(zipBlob, baseName + '_images.zip');
        setStatus('pdf2jpgStatus', '✅ ZIP download भयो! (' + totalPages + ' pages, ' + fmtSize(zipBlob.size) + ')', 'success');
      } else {
        for (var i = 0; i < pdf2jpgPages.length; i++) {
          download(pdf2jpgPages[i].blob, baseName + '_page' + pdf2jpgPages[i].pageNum + '.' + ext);
          await new Promise(function(r) { setTimeout(r, 350); });
        }
        setStatus('pdf2jpgStatus', '✅ सबै ' + totalPages + ' page अलग-अलग download भयो!', 'success');
      }
    } catch (err) {
      console.error(err);
      setStatus('pdf2jpgStatus', '❌ Error: ' + err.message, 'error');
    }
  }

  $('pdf2jpgConvertBtn').addEventListener('click', convertPdf2Jpg);
  $('pdf2jpgConvertTop').addEventListener('click', convertPdf2Jpg);

  // ============ 3) PDF MERGE ============
  var mergeFiles = [];
  function renderMerge() {
    renderGrid({ listEl: $('mergeList'), hintEl: $('mergeHint'), items: mergeFiles, onReorder: renderMerge });
    updateTopBar('mergeTopBar', 'mergeCount', mergeFiles.length, mergeFiles.length === 1 ? 'file' : 'files');
  }

  setupDrop($('mergeDrop'), $('mergeInput'), async function(files) {
    var candidates = files.filter(function(f) {
      return f.type === 'application/pdf' || f.name.toLowerCase().slice(-4) === '.pdf';
    });
    if (!candidates.length) { setStatus('mergeStatus', 'PDF file मात्र upload गर्नुहोस्।', 'error'); return; }
    setStatus('mergeStatus', 'File validate हुँदैछ...', 'loading');
    var valid = [], invalid = [];
    for (var i = 0; i < candidates.length; i++) {
      var ok = await isPdfFile(candidates[i]);
      if (ok) valid.push(candidates[i]);
      else invalid.push(candidates[i].name);
    }
    valid.forEach(function(p) { p._isImage = false; p._rotation = 0; mergeFiles.push(p); });
    renderMerge();
    if (invalid.length) setStatus('mergeStatus', '⚠️ ' + invalid.length + ' file valid PDF होइन: ' + invalid.join(', '), 'error');
    else if (valid.length) setStatus('mergeStatus', '✅ ' + valid.length + ' PDF valid छ।', 'success');
  });

  async function mergePdfs() {
    if (!hasPdfLib) { setStatus('mergeStatus', 'pdf-lib library load भएको छैन।', 'error'); return; }
    if (mergeFiles.length < 2) { setStatus('mergeStatus', 'कृपया कम्तीमा २ PDF upload गर्नुहोस्।', 'error'); return; }
    setStatus('mergeStatus', 'Merging... कृपया पर्खनुहोस्', 'loading');
    try {
      var PDFDocument = window.PDFLib.PDFDocument;
      var degrees = window.PDFLib.degrees;
      var merged = await PDFDocument.create();
      for (var i = 0; i < mergeFiles.length; i++) {
        var bytes = await mergeFiles[i].arrayBuffer();
        var src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        var pages = await merged.copyPages(src, src.getPageIndices());
        var rotation = mergeFiles[i]._rotation || 0;
        pages.forEach(function(p) {
          if (rotation) {
            var existing = p.getRotation().angle || 0;
            p.setRotation(degrees((existing + rotation) % 360));
          }
          merged.addPage(p);
        });
      }
      var out = await merged.save();
      download(new Blob([out], { type: 'application/pdf' }), 'merged.pdf');
      setStatus('mergeStatus', '✅ Merged PDF download भयो!', 'success');
    } catch (err) {
      var msg = err.message;
      if (msg.indexOf('No PDF header') !== -1) msg = 'यो file valid PDF होइन।';
      else if (msg.indexOf('encrypted') !== -1 || msg.indexOf('password') !== -1) msg = 'यो PDF password-protected छ।';
      setStatus('mergeStatus', '❌ ' + msg, 'error');
    }
  }

  $('mergeBtn').addEventListener('click', mergePdfs);
  $('mergeTopBtn').addEventListener('click', mergePdfs);

  // ============ 4) IMAGE RESIZER ============
  var imgFiles = [];
  var firstImageSize = null;

  function renderImg() {
    renderGrid({ listEl: $('imgList'), hintEl: null, items: imgFiles, onReorder: renderImg });
    updateTopBar('imgTopBar', 'imgCount', imgFiles.length, imgFiles.length === 1 ? 'file' : 'files');
    updateSizePreview();
  }

  function updateSizePreview() {
    var scale = parseInt($('imgScale').value) || 100;
    var oldEl = $('imgOldSize');
    var newEl = $('imgNewSize');
    if (!firstImageSize) {
      oldEl.textContent = '— × — px';
      newEl.textContent = '— × — px';
      return;
    }
    var rot = imgFiles[0]._rotation || 0;
    var w = firstImageSize.w, h = firstImageSize.h;
    if (rot === 90 || rot === 270) { var t = w; w = h; h = t; }
    var newW = Math.round(w * scale / 100);
    var newH = Math.round(h * scale / 100);
    oldEl.textContent = w + ' × ' + h + ' px';
    newEl.textContent = newW + ' × ' + newH + ' px';
  }

  $('imgScale').addEventListener('input', function() {
    $('imgScaleValue').textContent = this.value + '%';
    updateSizePreview();
  });
  $('imgQuality').addEventListener('input', function() {
    $('imgQualityValue').textContent = this.value + '%';
  });

  setupDrop($('imgDrop'), $('imgInput'), function(files) {
    var imgs = files.filter(function(f) { return f.type && f.type.indexOf('image/') === 0; });
    if (!imgs.length) { setStatus('imgStatus', 'Image file मात्र upload गर्नुहोस्।', 'error'); return; }
    var done = 0;
    var wasEmpty = imgFiles.length === 0;
    imgs.forEach(function(f) {
      readAsDataURL(f).then(function(url) {
        f._preview = url; f._isImage = true; f._rotation = 0;
        imgFiles.push(f); done++;
        if (done === imgs.length) {
          renderImg();
          if (wasEmpty && imgFiles.length > 0) {
            loadImage(imgFiles[0]._preview).then(function(img) {
              firstImageSize = { w: img.width, h: img.height };
              updateSizePreview();
            });
          }
        }
      }).catch(function() {
        f._isImage = true; f._rotation = 0;
        imgFiles.push(f); done++;
        if (done === imgs.length) renderImg();
      });
    });
  });

  async function resizeImages() {
    if (!imgFiles.length) { setStatus('imgStatus', 'कृपया कम्तीमा १ image upload गर्नुहोस्।', 'error'); return; }

    var scalePct = parseInt($('imgScale').value) || 100;
    var qualityPct = parseInt($('imgQuality').value) || 70;
    var format = $('imgFormat').value;
    var quality = qualityPct / 100;
    if (quality < 0.1) quality = 0.1;
    if (quality > 1) quality = 1;

    var ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';

    setStatus('imgStatus', 'Resizing ' + imgFiles.length + ' image(s) at ' + scalePct + '%...', 'loading');

    try {
      for (var i = 0; i < imgFiles.length; i++) {
        var file = imgFiles[i];
        var dataUrl = await readAsDataURL(file);

        if (file._rotation) {
          dataUrl = await rotateImageDataURL(dataUrl, file._rotation);
        }

        var img = await loadImage(dataUrl);
        var w = Math.max(1, Math.round(img.width * scalePct / 100));
        var h = Math.max(1, Math.round(img.height * scalePct / 100));

        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);

        var blob = await new Promise(function(res) {
          if (format === 'image/png') canvas.toBlob(res, format);
          else canvas.toBlob(res, format, quality);
        });

        var baseName = file.name.replace(/\.[^.]+$/, '');
        download(blob, baseName + '_' + scalePct + 'pct.' + ext);
        await new Promise(function(r) { setTimeout(r, 300); });
      }
      setStatus('imgStatus', '✅ ' + imgFiles.length + ' image(s) ' + scalePct + '% size मा download भयो!', 'success');
    } catch (err) {
      console.error(err);
      setStatus('imgStatus', '❌ Error: ' + err.message, 'error');
    }
  }

  $('imgResizeBtn').addEventListener('click', resizeImages);
  $('imgResizeTop').addEventListener('click', resizeImages);

  // ============ 5) PDF RESIZER ============
  var pdfFile = null;
  function renderPdfResize() {
    renderGrid({ listEl: $('pdfList'), hintEl: null, items: pdfFile ? [pdfFile] : [], onReorder: renderPdfResize });
    updateTopBar('pdfResizeTopBar', 'pdfResizeCount', pdfFile ? 1 : 0, 'file');
  }

  setupDrop($('pdfDrop'), $('pdfInput'), async function(files) {
    var pdf = files.filter(function(f) {
      return f.type === 'application/pdf' || f.name.toLowerCase().slice(-4) === '.pdf';
    })[0];
    if (!pdf) { setStatus('pdfStatus', 'PDF file मात्र upload गर्नुहोस्।', 'error'); return; }
    var ok = await isPdfFile(pdf);
    if (!ok) { setStatus('pdfStatus', '❌ यो file valid PDF होइन।', 'error'); return; }
    pdf._isImage = false;
    pdf._rotation = pdf._rotation || 0;
    pdfFile = pdf;
    renderPdfResize();
    setStatus('pdfStatus', '✅ PDF valid छ।', 'success');
  });

  var SIZES = { a4: [595.28, 841.89], letter: [612, 792], legal: [612, 1008], a3: [841.89, 1190.55], a5: [419.53, 595.28] };

  async function resizePdf() {
    if (!hasPdfLib) { setStatus('pdfStatus', 'pdf-lib library load भएको छैन।', 'error'); return; }
    if (!pdfFile) { setStatus('pdfStatus', 'कृपया PDF file upload गर्नुहोस्।', 'error'); return; }
    setStatus('pdfStatus', 'Resizing... कृपया पर्खनुहोस्', 'loading');
    try {
      var PDFDocument = window.PDFLib.PDFDocument;
      var degrees = window.PDFLib.degrees;
      var sizeKey = $('pdfPageSize').value;
      var orientation = $('pdfOrientation').value;
      var scaleMode = $('pdfScaleMode').value;
      var newW = SIZES[sizeKey][0], newH = SIZES[sizeKey][1];
      if (orientation === 'landscape' && newW < newH) { var t = newW; newW = newH; newH = t; }
      if (orientation === 'portrait' && newW > newH) { var t2 = newW; newW = newH; newH = t2; }
      var bytes = await pdfFile.arrayBuffer();
      var src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      var out = await PDFDocument.create();
      var pageIndices = src.getPageIndices();
      var rotation = pdfFile._rotation || 0;
      for (var i = 0; i < pageIndices.length; i++) {
        var copied = await out.copyPages(src, [pageIndices[i]]);
        var copiedPage = copied[0];
        var size = copiedPage.getSize();
        var oldW = size.width, oldH = size.height;

        if (rotation) {
          var existing = copiedPage.getRotation().angle || 0;
          copiedPage.setRotation(degrees((existing + rotation) % 360));
        }

        var scaleX, scaleY, offsetX, offsetY;
        if (scaleMode === 'stretch') {
          scaleX = newW / oldW; scaleY = newH / oldH; offsetX = 0; offsetY = 0;
        } else {
          var r = Math.min(newW / oldW, newH / oldH);
          scaleX = r; scaleY = r;
          offsetX = (newW - oldW * r) / 2; offsetY = (newH - oldH * r) / 2;
        }
        var newPage = out.addPage([newW, newH]);
        var embedded = await out.embedPage(copiedPage);
        newPage.drawPage(embedded, { x: offsetX, y: offsetY, width: oldW * scaleX, height: oldH * scaleY });
      }
      var outBytes = await out.save();
      download(new Blob([outBytes], { type: 'application/pdf' }), 'resized.pdf');
      setStatus('pdfStatus', '✅ Resized PDF download भयो! (' + pageIndices.length + ' pages)', 'success');
    } catch (err) {
      var msg = err.message;
      if (msg.indexOf('No PDF header') !== -1) msg = 'यो file valid PDF होइन।';
      setStatus('pdfStatus', '❌ ' + msg, 'error');
    }
  }

  $('pdfResizeBtn').addEventListener('click', resizePdf);
  $('pdfResizeTopBtn').addEventListener('click', resizePdf);

})();