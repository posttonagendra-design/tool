/* Notes UI + Countdown */
(function() {
  'use strict';
  function $(id) { return document.getElementById(id); }

  var editId = null;
  var editColor = 'yellow';
  var search = '';
  var countdownTimer = null;

  // ============ HELPERS ============
  function toNepali(str) {
    var m = {'0':'०','1':'१','2':'२','3':'३','4':'४','5':'५','6':'६','7':'७','8':'८','9':'९'};
    return String(str).replace(/[0-9]/g, function(d) { return m[d]; });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function(c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function truncate(s, n) {
    s = String(s || '');
    return s.length > n ? s.substring(0, n) + '...' : s;
  }

  // ============ COUNTDOWN FORMAT ============
  function formatCountdown(ms) {
    if (ms < 0) {
      ms = Math.abs(ms);
      var d = Math.floor(ms / 86400000);
      var h = Math.floor((ms % 86400000) / 3600000);
      var m = Math.floor((ms % 3600000) / 60000);
      if (d > 0) return toNepali(d) + ' दिन अघि भयो';
      if (h > 0) return toNepali(h) + ' घण्टा अघि भयो';
      if (m > 0) return toNepali(m) + ' मिनेट अघि भयो';
      return 'भर्खरै भयो';
    }
    var d = Math.floor(ms / 86400000);
    var h = Math.floor((ms % 86400000) / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    var s = Math.floor((ms % 60000) / 1000);
    if (d > 0) return toNepali(d) + ' दिन' + (h > 0 ? ' ' + toNepali(h) + ' घण्टा' : '') + ' बाँकी';
    if (h > 0) return toNepali(h) + ' घण्टा' + (m > 0 ? ' ' + toNepali(m) + ' मिनेट' : '') + ' बाँकी';
    if (m > 0) return toNepali(m) + ' मिनेट' + (s > 0 ? ' ' + toNepali(s) + ' सेकेन्ड' : '') + ' बाँकी';
    return toNepali(s) + ' सेकेन्ड बाँकी';
  }

  function getReminderStatus(iso) {
    if (!iso) return null;
    var diff = new Date(iso).getTime() - Date.now();
    if (diff < 0) return 'overdue';
    if (diff < 15 * 60000) return 'urgent';
    if (diff < 60 * 60000) return 'soon';
    if (diff < 24 * 3600000) return 'today';
    if (diff < 7 * 86400000) return 'week';
    return 'later';
  }

  function getStatusIcon(status) {
    return { overdue: '⏰', urgent: '🚨', soon: '🔔', today: '⏳', week: '📅', later: '📅' }[status] || '📅';
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + mo[d.getMonth()] + ' ' + d.getFullYear();
  }

   function fmtDateTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');

    // Short English date — "26 Sep" (वर्ष छुटाउने)
    var adShort = d.getDate() + ' ' + mo[d.getMonth()];

    // नेपाली मिति थप्ने प्रयास
    var bsStr = '';
    try {
      if (ND) {
        var nd = new ND(d);
        bsStr = toNepali(nd.getYear()) + ' ' + NEPALI_MONTHS[nd.getMonth()] + ' ' + toNepali(nd.getDate()) + ', ' + toNepali(hh) + ':' + toNepali(mm);
      }
    } catch (e) {
      console.warn('BS date error:', e);
    }

    if (bsStr) {
      return bsStr + ' • ' + adShort;
    }
    return d.getDate() + ' ' + mo[d.getMonth()] + ' ' + d.getFullYear() + ', ' + hh + ':' + mm;
  }

  // ============ RENDER ============
  function renderNotes(notes) {
    var grid = $('notesGrid');
    var empty = $('notesEmpty');

    if (!notes || notes.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    grid.innerHTML = '';

    notes.forEach(function(note) {
      var card = document.createElement('div');
      card.className = 'note-card note-color-' + (note.color || 'yellow');
      if (note.pinned) card.classList.add('pinned');
      if (note.reminder) {
        var status = getReminderStatus(note.reminder);
        if (status) card.classList.add('reminder-' + status);
      }
      card.setAttribute('data-id', note.id);

      var reminderHTML = '';
      if (note.reminder) {
        var status = getReminderStatus(note.reminder);
        reminderHTML =
          '<div class="note-reminder">' +
            '<div class="note-reminder-date">' +
              getStatusIcon(status) + ' ' + fmtDateTime(note.reminder) +
            '</div>' +
            '<div class="note-countdown" data-reminder="' + note.reminder + '">' +
              formatCountdown(new Date(note.reminder).getTime() - Date.now()) +
            '</div>' +
          '</div>';
      }

      card.innerHTML =
        (note.pinned ? '<span class="note-pin">📌</span>' : '') +
        '<div class="note-title">' + (escapeHtml(note.title) || '<em style="color:#999">(शीर्षक छैन)</em>') + '</div>' +
        (reminderHTML) +
        '<div class="note-body">' + (escapeHtml(truncate(note.body, 120)) || '<em style="color:#bbb">(खाली)</em>') + '</div>' +
        '<div class="note-footer">' +
          '<span class="note-date">' + fmtDate(note.updated_at) + '</span>' +
          '<div class="note-actions">' +
            '<button class="note-btn" data-action="pin" title="' + (note.pinned ? 'Unpin' : 'Pin') + '">' + (note.pinned ? '📌' : '📍') + '</button>' +
            '<button class="note-btn" data-action="edit" title="Edit">✏️</button>' +
            '<button class="note-btn danger" data-action="delete" title="Delete">🗑️</button>' +
          '</div>' +
        '</div>';

      card.querySelector('[data-action="edit"]').addEventListener('click', function(e) {
        e.stopPropagation();
        openEditor(note);
      });
      card.querySelector('[data-action="delete"]').addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('यो note हटाउने?')) {
          window.NotesStorage.delete(note.id).then(loadNotes);
        }
      });
      card.querySelector('[data-action="pin"]').addEventListener('click', function(e) {
        e.stopPropagation();
        var updated = Object.assign({}, note, { pinned: !note.pinned });
        window.NotesStorage.save(updated).then(loadNotes);
      });
      card.addEventListener('click', function() { openEditor(note); });

      grid.appendChild(card);
    });

    startCountdown();
  }

  // ============ COUNTDOWN TICKER ============
  function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(function() {
      document.querySelectorAll('.note-countdown').forEach(function(el) {
        var iso = el.getAttribute('data-reminder');
        if (!iso) return;
        var diff = new Date(iso).getTime() - Date.now();
        el.textContent = formatCountdown(diff);
        var card = el.closest('.note-card');
        if (card) {
          card.classList.remove('reminder-overdue','reminder-urgent','reminder-soon','reminder-today','reminder-week','reminder-later');
          var status = getReminderStatus(iso);
          if (status) card.classList.add('reminder-' + status);
        }
      });
    }, 1000);
  }

  // ============ LOAD ============
  function loadNotes() {
    var fn = search ? window.NotesStorage.search(search) : window.NotesStorage.getAll();
    return fn.then(renderNotes);
  }

  // ============ EDITOR ============
  
  // ============ BS DATE PICKER ============
  var NEPALI_MONTHS = ['बैशाख','जेठ','असार','साउन','भदौ','असोज','कात्तिक','मंसिर','पुष','माघ','फाल्गुन','चैत'];

  // Unwrap NepaliDate if ES module
  var ND = window.NepaliDate;
  if (ND && ND.default && typeof ND.default === 'function') {
    ND = ND.default;
  }

  function getBsYearRange() {
    // अहिलेको BS वर्ष - 1 देखि +10 सम्म
    var now = new Date();
    var currentBS = 2083;
    try {
      var nd = new ND(now);
      currentBS = nd.getYear();
    } catch (e) {}
    var years = [];
    for (var y = currentBS - 1; y <= currentBS + 10; y++) years.push(y);
    return years;
  }

  function getDaysInBsMonth(year, month) {
    // महिना अनुसार दिन: २९ देखि ३२
    try {
      var nd = new ND(year, month, 1);
      var next;
      if (month === 11) {
        next = new ND(year + 1, 0, 1);
      } else {
        next = new ND(year, month + 1, 1);
      }
      var days = Math.round((next.toJsDate() - nd.toJsDate()) / 86400000);
      return days > 0 ? days : 30;
    } catch (e) {
      return 30;
    }
  }

  function initBsPicker() {
    var yearSel = $('bsYearSelect');
    var monthSel = $('bsMonthSelect');
    var daySel = $('bsDaySelect');
    var hourSel = $('bsHourSelect');
    var minSel = $('bsMinSelect');
    if (!yearSel) return;

    // Years
    yearSel.innerHTML = '';
    getBsYearRange().forEach(function(y) {
      var opt = document.createElement('option');
      opt.value = y;
      opt.textContent = toNepali(y);
      yearSel.appendChild(opt);
    });

    // Months
    monthSel.innerHTML = '';
    NEPALI_MONTHS.forEach(function(m, i) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = m;
      monthSel.appendChild(opt);
    });

    // Hours
    hourSel.innerHTML = '';
    for (var h = 0; h < 24; h++) {
      var opt = document.createElement('option');
      opt.value = h;
      opt.textContent = toNepali(String(h).padStart(2, '0'));
      hourSel.appendChild(opt);
    }

    // Minutes (0, 5, 10... 55) — simpler
    minSel.innerHTML = '';
    for (var m = 0; m < 60; m += 5) {
      var opt = document.createElement('option');
      opt.value = m;
      opt.textContent = toNepali(String(m).padStart(2, '0'));
      minSel.appendChild(opt);
    }

    // Update days on year/month change
    function updateDays() {
      var y = parseInt(yearSel.value);
      var mo = parseInt(monthSel.value);
      var maxD = getDaysInBsMonth(y, mo);
      var currentD = parseInt(daySel.value) || 1;
      daySel.innerHTML = '';
      for (var d = 1; d <= maxD; d++) {
        var opt = document.createElement('option');
        opt.value = d;
        opt.textContent = toNepali(d);
        daySel.appendChild(opt);
      }
      daySel.value = Math.min(currentD, maxD);
    }

    yearSel.addEventListener('change', updateDays);
    monthSel.addEventListener('change', updateDays);

    // Init days
    updateDays();
  }

  function setBsPickerValue(iso) {
    var yearSel = $('bsYearSelect');
    if (!yearSel || !iso) {
      // Default: now
      try {
        var nd = new ND(new Date());
        yearSel.value = nd.getYear();
        $('bsMonthSelect').value = nd.getMonth();
        // Trigger update
        yearSel.dispatchEvent(new Event('change'));
        $('bsDaySelect').value = nd.getDate();
        $('bsHourSelect').value = new Date().getHours();
        $('bsMinSelect').value = Math.floor(new Date().getMinutes() / 5) * 5;
      } catch (e) {}
      return;
    }
    try {
      var d = new Date(iso);
      var nd = new ND(d);
      yearSel.value = nd.getYear();
      $('bsMonthSelect').value = nd.getMonth();
      yearSel.dispatchEvent(new Event('change'));
      $('bsDaySelect').value = nd.getDate();
      $('bsHourSelect').value = d.getHours();
      $('bsMinSelect').value = Math.floor(d.getMinutes() / 5) * 5;
    } catch (e) {
      console.error('BS picker set error:', e);
    }
  }

  function getBsPickerValue() {
    var year = parseInt($('bsYearSelect').value);
    var month = parseInt($('bsMonthSelect').value);
    var day = parseInt($('bsDaySelect').value);
    var hour = parseInt($('bsHourSelect').value);
    var min = parseInt($('bsMinSelect').value);

    if (!year || isNaN(month) || !day) return null;

    try {
      var nd = new ND(year, month, day);
      var ad = nd.toJsDate();
      ad.setHours(hour, min, 0, 0);
      return ad.toISOString();
    } catch (e) {
      console.error('BS picker get error:', e);
      return null;
    }
  }

  function isBsPickerEmpty() {
    return !$('bsYearSelect').value;
  }

  function clearBsPicker() {
    // Reset to now
    setBsPickerValue(null);
  }



  function openEditor(note) {
    editId = note ? note.id : null;
    editColor = (note && note.color) || 'yellow';

    $('noteEditorTitle').textContent = note ? '✏️ Note Edit' : '➕ नयाँ Note';
    $('noteTitleInput').value = note ? (note.title || '') : '';
    $('noteBodyInput').value = note ? (note.body || '') : '';
       setBsPickerValue((note && note.reminder) ? note.reminder : null);

    document.querySelectorAll('.note-color-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-color') === editColor);
    });

    $('noteEditorModal').classList.add('show');
    setTimeout(function() { $('noteTitleInput').focus(); }, 100);
  }

  function closeEditor() {
    $('noteEditorModal').classList.remove('show');
    editId = null;
  }

  function saveNote() {
    var title = $('noteTitleInput').value.trim();
    var body = $('noteBodyInput').value.trim();
        var reminderISO = getBsPickerValue();


    if (!title && !body) {
      alert('कम्तीमा शीर्षक वा content भर्नुहोस्।');
      return;
    }

    var note = {
      title: title,
      body: body,
      color: editColor,
            reminder: reminderISO
    };

    if (editId) {
      note.id = editId;
      window.NotesStorage.get(editId).then(function(existing) {
        if (existing) note.pinned = existing.pinned;
        return window.NotesStorage.save(note);
      }).then(function() {
        closeEditor();
        loadNotes();
      });
    } else {
      window.NotesStorage.save(note).then(function() {
        closeEditor();
        loadNotes();
      });
    }
  }

  // ============ EXPORT/IMPORT ============
  function exportNotes() {
    window.NotesStorage.exportAll().then(function(data) {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'notes-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
    });
  }

  function importNotes() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = function() {
      var f = input.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function() {
        try {
          var data = JSON.parse(r.result);
          if (!confirm('अहिलेका सबै notes replace हुनेछन्। Continue?')) return;
          window.NotesStorage.importAll(data).then(function(count) {
            alert('✅ ' + count + ' notes import भयो!');
            loadNotes();
          }).catch(function(err) {
            alert('❌ ' + err.message);
          });
        } catch (e) {
          alert('❌ Invalid JSON: ' + e.message);
        }
      };
      r.readAsText(f);
    };
    input.click();
  }

  // ============ INIT ============
  function init() {
    if (!window.NotesStorage) {
      console.error('❌ NotesStorage load भएको छैन');
      return;
    }

    window.NotesStorage.init().then(loadNotes);
    window.NotesStorage.init().then(loadNotes);
    initBsPicker();

    $('notesNewBtn').addEventListener('click', function() { openEditor(null); });
    $('noteSaveBtn').addEventListener('click', saveNote);
    $('noteCancelBtn').addEventListener('click', closeEditor);
    $('noteEditorClose').addEventListener('click', closeEditor);
    $('noteEditorModal').addEventListener('click', function(e) {
      if (e.target === this) closeEditor();
    });

    document.querySelectorAll('.note-color-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        editColor = btn.getAttribute('data-color');
        document.querySelectorAll('.note-color-btn').forEach(function(b) {
          b.classList.toggle('active', b === btn);
        });
      });
    });

    var searchTimer;
    $('notesSearch').addEventListener('input', function() {
      clearTimeout(searchTimer);
      var val = this.value;
      searchTimer = setTimeout(function() {
        search = val;
        loadNotes();
      }, 250);
    });

    $('notesExportBtn').addEventListener('click', exportNotes);
    $('notesImportBtn').addEventListener('click', importNotes);

        var clearBtn = $('noteReminderClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        clearBsPicker();
      });
    }

    document.addEventListener('keydown', function(e) {
      if ($('noteEditorModal').classList.contains('show')) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          saveNote();
        }
        if (e.key === 'Escape') closeEditor();
      }
    });

 initBsPicker();
    console.log('📝 Notes UI ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

})();