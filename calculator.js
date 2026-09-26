/* ============================================================
   CALCULATOR — Basic + Unit Converter + BS Age
   ============================================================ */
(function() {
  'use strict';
  function $(id) { return document.getElementById(id); }

  // ============ TAB SWITCHING ============
  function setupTabs() {
    var tabs = document.querySelectorAll('.calc-tab');
    var panels = document.querySelectorAll('.calc-panel');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = tab.getAttribute('data-calc-tab');
        tabs.forEach(function(t) { t.classList.remove('active'); });
        panels.forEach(function(p) { p.classList.remove('active'); });
        tab.classList.add('active');
        var panel = $('calc-' + target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // ============================================================
  // 1) BASIC CALCULATOR
  // ============================================================
  var display = '0';
  var history = [];       // session only — refresh गर्दा हराउँछ
 var justCalculated = false;   // 🆕 `=` पछि flag

  function updateDisplay() {
    var el = $('calcDisplay');
    if (el) el.textContent = display;
  }

  function pushHistory(expr, result) {
    history.unshift({ expr: expr, result: result });
    if (history.length > 20) history.pop();
    renderHistory();
  }

   function renderHistory() {
    var wrap = $('calcHistory');
    if (!wrap) return;
    if (!history.length) {
      wrap.innerHTML = '<div class="calc-history-empty">अझै कुनै history छैन</div>';
      return;
    }
    var html = '';
    var total = 0;

    history.forEach(function(h) {
      var num = parseFloat(h.result);
      if (!isNaN(num)) total += num;

      html += '<div class="calc-history-item">';
      html += '<span class="calc-history-expr">' + h.expr + '</span>';
      html += '<span class="calc-history-eq">=</span>';
      html += '<span class="calc-history-result">' + h.result + '</span>';
      html += '</div>';
    });

    // Total Sum row
    var totalStr = Math.round(total * 1e10) / 1e10;
    html += '<div class="calc-history-sum">';
    html += '<span class="calc-history-sum-label">💰 Total Sum</span>';
    html += '<span class="calc-history-sum-value">= ' + totalStr + '</span>';
    html += '</div>';

    wrap.innerHTML = html;
  }
    function calcInput(val) {
    // 🆕 C — सधैं reset
    if (val === 'C') {
      display = '0';
      justCalculated = false;
      updateDisplay();
      return;
    }

    // 🆕 ⌫ — backspace
    if (val === '⌫') {
      if (justCalculated) {
        // `=` पछि backspace → सबै clear
        display = '0';
        justCalculated = false;
      } else if (display.length > 1) {
        display = display.slice(0, -1);
      } else {
        display = '0';
      }
      updateDisplay();
      return;
    }

    // 🆕 `=` — calculate
    if (val === '=') {
      // 🔒 Double `=` रोक्ने
      if (justCalculated) {
        return;    // केही नगर्ने
      }

      try {
        var expr = display;
        var safe = display
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/−/g, '-');

        if (!/^[\d+\-*/.()%\s]+$/.test(safe)) {
          display = 'Error';
          updateDisplay();
          return;
        }

        var result = Function('"use strict"; return (' + safe + ')')();

        if (!isFinite(result)) {
          display = 'Error';
        } else {
          var resultStr = String(Math.round(result * 1e10) / 1e10);
          pushHistory(expr, resultStr);
          display = resultStr;
          justCalculated = true;    // 🆕 Flag set
        }
      } catch (e) {
        display = 'Error';
      }
      updateDisplay();
      return;
    }

    // 🆕 Operator थिच्दा — justCalculated reset (result बाट अगाडि बढ्न)
    if (/[+\-×÷−]/.test(val)) {
      justCalculated = false;
      // Operator थप्ने
      if (display === 'Error') {
        display = '0' + val;
      } else {
        display = display + val;
      }
      updateDisplay();
      return;
    }

    // 🆕 % — percent
    if (val === '%') {
      justCalculated = false;
      display = display + '%';
      updateDisplay();
      return;
    }

    // 🆕 Number वा . — यदि justCalculated हो भने fresh सुरुवात
    if (justCalculated) {
      display = val;     // 0 बाट सुरु, सिधै new number
      justCalculated = false;
    } else {
      // सामान्य थप
      if (display === '0' && /[\d.]/.test(val)) {
        display = val;
      } else if (display === 'Error') {
        display = val;
      } else {
        display = display + val;
      }
    }
    updateDisplay();
  }

  function setupBasic() {
    var buttons = document.querySelectorAll('.calc-btn[data-val]');
    buttons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        calcInput(btn.getAttribute('data-val'));
      });
    });

    var clearBtn = $('calcClearHistory');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        history = [];
        renderHistory();
      });
    }

    // Keyboard support
    document.addEventListener('keydown', function(e) {
      // Only if Basic tab active
      var basicPanel = $('calc-basic');
      if (!basicPanel || !basicPanel.classList.contains('active')) return;
      // Only if calculator page visible
      var page = $('page-calculator');
      if (!page || !page.classList.contains('active')) return;

      if (/^[0-9]$/.test(e.key)) { calcInput(e.key); e.preventDefault(); }
      else if (e.key === '.') { calcInput('.'); e.preventDefault(); }
      else if (e.key === '+') { calcInput('+'); e.preventDefault(); }
      else if (e.key === '-') { calcInput('−'); e.preventDefault(); }
      else if (e.key === '*') { calcInput('×'); e.preventDefault(); }
      else if (e.key === '/') { calcInput('÷'); e.preventDefault(); }
      else if (e.key === '%') { calcInput('%'); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === '=') { calcInput('='); e.preventDefault(); }
      else if (e.key === 'Escape') { calcInput('C'); e.preventDefault(); }
      else if (e.key === 'Backspace') { calcInput('⌫'); e.preventDefault(); }
    });

    renderHistory();
    updateDisplay();
  }

  // ============================================================
  // 2) UNIT CONVERTER
  // ============================================================
  // Base units:
  // Length — base = meter
  // Area   — base = sq meter
  // Volume — base = cubic meter
  var UNITS = {
    length: {
      label: 'Length (लम्बाइ)',
      base: 'm',
      units: {
        'mm': 0.001,
        'cm': 0.01,
        'm': 1,
        'feet': 0.3048,
        'inch': 0.0254
      }
    },
    area: {
      label: 'Area (क्षेत्रफल)',
      base: 'sq m',
      units: {
        'sq feet': 0.092903,
        'sq meter': 1,
        'sq inch': 0.00064516,
        'sq cm': 0.0001
      }
    },
    volume: {
      label: 'Volume (आयतन)',
      base: 'cu m',
      units: {
        'cubic feet': 0.0283168,
        'cubic meter': 1,
        'litre': 0.001,
        'ml': 0.000001
      }
    }
  };

  function setupUnit() {
    var catSel = $('unitCategory');
    var fromSel = $('unitFrom');
    var toSel = $('unitTo');
    var fromVal = $('unitFromValue');
    var toVal = $('unitToValue');
    var swapBtn = $('unitSwap');
    if (!catSel) return;

    function refreshUnits() {
      var cat = catSel.value;
      var u = UNITS[cat];
      var opts = '';
      Object.keys(u.units).forEach(function(k) {
        opts += '<option value="' + k + '">' + k + '</option>';
      });
      fromSel.innerHTML = opts;
      toSel.innerHTML = opts;
      // Defaults
      var keys = Object.keys(u.units);
      fromSel.value = keys[0];
      toSel.value = keys[1] || keys[0];
      convertUnit();
    }

    function convertUnit() {
      var cat = catSel.value;
      var u = UNITS[cat];
      var val = parseFloat(fromVal.value) || 0;
      var fromRate = u.units[fromSel.value];
      var toRate = u.units[toSel.value];
      if (!fromRate || !toRate) return;
      var result = val * fromRate / toRate;
      toVal.value = Math.round(result * 1e8) / 1e8;
    }

    catSel.addEventListener('change', refreshUnits);
    fromSel.addEventListener('change', convertUnit);
    toSel.addEventListener('change', convertUnit);
    fromVal.addEventListener('input', convertUnit);

    if (swapBtn) {
      swapBtn.addEventListener('click', function() {
        var tmp = fromSel.value;
        fromSel.value = toSel.value;
        toSel.value = tmp;
        fromVal.value = toVal.value;
        convertUnit();
      });
    }

    refreshUnits();
  }

  // ============================================================
  // 3) BS AGE CALCULATOR
  // ============================================================
  function toNepali(str) {
    var m = {'0':'०','1':'१','2':'२','3':'३','4':'४','5':'५','6':'६','7':'७','8':'८','9':'९'};
    return String(str).replace(/[0-9]/g, function(d) { return m[d]; });
  }

  var NEPALI_MONTHS = ['बैशाख','जेठ','असार','साउन','भदौ','असोज','कात्तिक','मंसिर','पुष','माघ','फाल्गुन','चैत'];

  function getND() {
    var ND = window.NepaliDate;
    if (ND && ND.default && typeof ND.default === 'function') ND = ND.default;
    return ND;
  }

  function setupAge() {
    var yearSel = $('ageYear');
    var monthSel = $('ageMonth');
    var daySel = $('ageDay');
    var btn = $('ageCalcBtn');
    var result = $('ageResult');
    if (!yearSel) return;

    var ND = getND();
    if (!ND) {
      console.warn('Age Calculator: NepaliDate library छैन');
      return;
    }

    // Populate years
    var now = new Date();
    var todayBS = new ND(now);
    var currentBSYear = todayBS.getYear();

    yearSel.innerHTML = '';
    for (var y = currentBSYear - 100; y <= currentBSYear; y++) {
      var opt = document.createElement('option');
      opt.value = y;
      opt.textContent = toNepali(y);
      yearSel.appendChild(opt);
    }
    yearSel.value = currentBSYear - 25; // default: 25 years ago

    // Populate months
    monthSel.innerHTML = '';
    NEPALI_MONTHS.forEach(function(m, i) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = m;
      monthSel.appendChild(opt);
    });
    monthSel.value = 0;

    // Days — dynamic based on year/month
    function refreshDays() {
      var y = parseInt(yearSel.value);
      var m = parseInt(monthSel.value);
      var maxD = 32;
      try {
        var nd = new ND(y, m, 1);
        var next;
        if (m === 11) next = new ND(y + 1, 0, 1);
        else next = new ND(y, m + 1, 1);
        var diff = Math.round((next.toJsDate() - nd.toJsDate()) / 86400000);
        if (diff > 0 && diff < 33) maxD = diff;
      } catch (e) {}
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

    yearSel.addEventListener('change', refreshDays);
    monthSel.addEventListener('change', refreshDays);
    refreshDays();
    daySel.value = 15;

    if (btn) {
      btn.addEventListener('click', function() {
        try {
          var y = parseInt(yearSel.value);
          var m = parseInt(monthSel.value);
          var d = parseInt(daySel.value);
          var birthBS = new ND(y, m, d);
          var birthAD = birthBS.toJsDate();
          var nowAD = new Date();

          // Calculate age
          var years = nowAD.getFullYear() - birthAD.getFullYear();
          var months = nowAD.getMonth() - birthAD.getMonth();
          var days = nowAD.getDate() - birthAD.getDate();

          if (days < 0) {
            months--;
            var prevMonth = new Date(nowAD.getFullYear(), nowAD.getMonth(), 0);
            days += prevMonth.getDate();
          }
          if (months < 0) {
            years--;
            months += 12;
          }

          var totalDays = Math.floor((nowAD - birthAD) / 86400000);

          // Next birthday
          var nextBD = new Date(nowAD.getFullYear(), birthAD.getMonth(), birthAD.getDate());
          if (nextBD < nowAD) nextBD.setFullYear(nextBD.getFullYear() + 1);
          var daysToNext = Math.ceil((nextBD - nowAD) / 86400000);

          var html = '';
          html += '<div class="age-result-row">';
          html += '<span class="age-label">🎂 उमेर:</span>';
          html += '<span class="age-value">' + toNepali(years) + ' वर्ष ' + toNepali(months) + ' महिना ' + toNepali(days) + ' दिन</span>';
          html += '</div>';
          html += '<div class="age-result-row">';
          html += '<span class="age-label">📅 कुल दिन:</span>';
          html += '<span class="age-value">' + toNepali(totalDays.toLocaleString()) + ' दिन</span>';
          html += '</div>';
          html += '<div class="age-result-row">';
          html += '<span class="age-label">🎉 अर्को जन्मदिन:</span>';
          html += '<span class="age-value">' + toNepali(daysToNext) + ' दिन बाँकी</span>';
          html += '</div>';

          result.innerHTML = html;
        } catch (err) {
          result.innerHTML = '<div class="age-error">❌ त्रुटि: ' + err.message + '</div>';
        }
      });
    }

    // Auto calculate today
    setTimeout(function() { if (btn) btn.click(); }, 200);
  }

  // ============================================================
  // 4) DATE DIFFERENCE (BS + AD)
  // ============================================================
  var dateMode = 'BS';

  function setupDateDiff() {
    var modeBtns = document.querySelectorAll('.datediff-mode-btn');
    var calcBtn = $('dateCalcBtn');
    var todayBtn = $('dateTodayBtn');
    if (!calcBtn) {
      console.warn('Date Diff: dateCalcBtn भेटिएन');
      return;
    }

    modeBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        modeBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        dateMode = btn.getAttribute('data-mode');
        var r = $('dateResult');
        if (r) r.innerHTML = '';
      });
    });

    if (todayBtn) {
      todayBtn.addEventListener('click', function() {
        var ND = getND();
        if (!ND) return;
        var today = new Date();

        if (dateMode === 'BS') {
          try {
            var nd = new ND(today);
            $('dateFromYear').value = nd.getYear();
            $('dateFromMonth').value = nd.getMonth() + 1;
            $('dateFromDay').value = nd.getDate();
          } catch (e) {
            console.error('Today BS error:', e);
          }
        } else {
          $('dateFromYear').value = today.getFullYear();
          $('dateFromMonth').value = today.getMonth() + 1;
          $('dateFromDay').value = today.getDate();
        }
      });
    }

    calcBtn.addEventListener('click', function() {
      var result = $('dateResult');
      var fy = parseInt($('dateFromYear').value);
      var fm = parseInt($('dateFromMonth').value);
      var fd = parseInt($('dateFromDay').value);
      var ty = parseInt($('dateToYear').value);
      var tm = parseInt($('dateToMonth').value);
      var td = parseInt($('dateToDay').value);

      if (!fy || !fm || !fd || !ty || !tm || !td) {
        result.innerHTML = '<div class="datediff-error">⚠️ कृपया सबै field भर्नुहोस्।</div>';
        return;
      }

      var ND = getND();
      if (!ND) {
        result.innerHTML = '<div class="datediff-error">❌ NepaliDate library load भएको छैन।</div>';
        return;
      }

      try {
        var fromDate, toDate;

        if (dateMode === 'BS') {
          if (fy < 1975 || fy > 2099 || ty < 1975 || ty > 2099) {
            result.innerHTML = '<div class="datediff-error">⚠️ BS वर्ष 1975-2099 भित्र हुनुपर्छ।</div>';
            return;
          }
          var fromBS = new ND(fy, fm - 1, fd);
          var toBS = new ND(ty, tm - 1, td);
          fromDate = fromBS.toJsDate();
          toDate = toBS.toJsDate();
        } else {
          if (fy < 1918 || fy > 2043 || ty < 1918 || ty > 2043) {
            result.innerHTML = '<div class="datediff-error">⚠️ AD वर्ष 1918-2043 भित्र हुनुपर्छ।</div>';
            return;
          }
          fromDate = new Date(fy, fm - 1, fd);
          toDate = new Date(ty, tm - 1, td);
        }

        var diffMs = toDate - fromDate;
        var diffDays = Math.round(diffMs / 86400000);

        if (diffDays < 0) {
          result.innerHTML = '<div class="datediff-error">⚠️ "To" मिति "From" भन्दा पछि हुनुपर्छ।</div>';
          return;
        }

        var y1 = fromDate.getFullYear();
        var m1 = fromDate.getMonth();
        var d1 = fromDate.getDate();
        var y2 = toDate.getFullYear();
        var m2 = toDate.getMonth();
        var d2 = toDate.getDate();

        var years = y2 - y1;
        var months = m2 - m1;
        var days = d2 - d1;

        if (days < 0) {
          months--;
          var prevMonth = new Date(y2, m2, 0).getDate();
          days += prevMonth;
        }
        if (months < 0) {
          years--;
          months += 12;
        }

        var totalWeeks = Math.floor(diffDays / 7);
        var totalMonths = (years * 12 + months) + (days / 30);
        var totalYears = years + (months / 12) + (days / 365);

        var html = '';
        html += '<div class="datediff-main">';
        html += '📊 फरक: ';
        if (years > 0) html += toNepali(years) + ' वर्ष ';
        if (months > 0) html += toNepali(months) + ' महिना ';
        if (days > 0) html += toNepali(days) + ' दिन';
        if (years === 0 && months === 0 && days === 0) html += '० दिन';
        html += '</div>';

        html += '<div class="datediff-row">';
        html += '<span class="datediff-row-label">📅 कुल दिन</span>';
        html += '<span class="datediff-row-value">' + toNepali(diffDays) + '</span>';
        html += '</div>';

        html += '<div class="datediff-row">';
        html += '<span class="datediff-row-label">📆 कुल हप्ता</span>';
        html += '<span class="datediff-row-value">' + toNepali(totalWeeks) + '</span>';
        html += '</div>';

        html += '<div class="datediff-row">';
        html += '<span class="datediff-row-label">🗓️ कुल महिना</span>';
        html += '<span class="datediff-row-value">' + toNepali(totalMonths.toFixed(1)) + '</span>';
        html += '</div>';

        html += '<div class="datediff-row">';
        html += '<span class="datediff-row-label">📊 कुल वर्ष</span>';
        html += '<span class="datediff-row-value">' + toNepali(totalYears.toFixed(2)) + '</span>';
        html += '</div>';

        result.innerHTML = html;

      } catch (err) {
        console.error('Date diff error:', err);
        result.innerHTML = '<div class="datediff-error">❌ त्रुटि: ' + err.message + '</div>';
      }
    });

    setTimeout(function() { if (todayBtn) todayBtn.click(); }, 200);
  }


  // ============ INIT ============
  function init() {
    if (!$('page-calculator')) return;
    setupTabs();
    setupBasic();
    setupUnit();
    setupAge();
setupDateDiff();
    console.log('🧮 Calculator ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();