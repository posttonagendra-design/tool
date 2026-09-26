(function() {
  'use strict';
  function $(id) { return document.getElementById(id); }

  // ============================================================
  // MAIN FIX: NepaliDate ES Module unwrap
  // ============================================================
  var ND = window.NepaliDate;
  
  // यदि ES module हो भने (default property छ) — त्यसलाई unwrap गर्नुहोस्
  if (ND && ND.default && typeof ND.default === 'function') {
    ND = ND.default;
    console.log('📅 Unwrapped NepaliDate from ES module');
  }
  
  console.log('📅 NepaliDate type:', typeof ND);

  if (!ND || typeof ND !== 'function') {
    console.error('❌ NepaliDate library load भएको छैन वा function छैन');
  }

  var NEPALI_MONTHS = ['बैशाख','जेठ','असार','साउन','भदौ','असोज','कात्तिक','मंसिर','पुष','माघ','फाल्गुन','चैत'];
  var ENGLISH_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function toNepali(str) {
    var m = {'0':'०','1':'१','2':'२','3':'३','4':'४','5':'५','6':'६','7':'७','8':'८','9':'९'};
    return String(str).replace(/[0-9]/g, function(d) { return m[d]; });
  }

  function showResult(el, html, isError) {
    el.innerHTML = html;
    el.className = 'date-result' + (isError ? ' error' : '');
  }

  // ============ BS → AD ============
  function bsToAd() {
    var year = parseInt($('bsYear').value);
    var month = parseInt($('bsMonth').value);
    var day = parseInt($('bsDay').value);
    var result = $('bsToAdResult');

    if (!year || !day) {
      showResult(result, '⚠️ कृपया वर्ष, महिना, र गते सबै भर्नुहोस्।', true);
      return;
    }

    try {
      var nd = new ND(year, month, day);
      var adDate = nd.toJsDate();
      var weekday = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][adDate.getDay()];

      showResult(result,
        '✅ ' + toNepali(year) + ' ' + NEPALI_MONTHS[month] + ' ' + toNepali(day) +
        '<br>↓<br><span style="font-size:18px">' +
        adDate.getFullYear() + ' ' + ENGLISH_MONTHS[adDate.getMonth()] + ' ' + adDate.getDate() +
        '</span><small>' + weekday + '</small>'
      );
    } catch (err) {
      showResult(result, '❌ त्रुटि: ' + err.message, true);
      console.error(err);
    }
  }

  // ============ AD → BS ============
  function adToBs() {
    var year = parseInt($('adYear').value);
    var month = parseInt($('adMonth').value) - 1;
    var day = parseInt($('adDay').value);
    var result = $('adToBsResult');

    if (!year || !day) {
      showResult(result, '⚠️ कृपया Year, Month, र Day सबै भर्नुहोस्।', true);
      return;
    }

    try {
      var jsDate = new Date(year, month, day);
      var nd = new ND(jsDate);
      var weekday = ['आइतबार','सोमबार','मंगलबार','बुधबार','बिहीबार','शुक्रबार','शनिबार'][jsDate.getDay()];

      showResult(result,
        '✅ ' + year + ' ' + ENGLISH_MONTHS[month] + ' ' + day +
        '<br>↓<br><span style="font-size:18px">' +
        toNepali(nd.getYear()) + ' ' + NEPALI_MONTHS[nd.getMonth()] + ' ' + toNepali(nd.getDate()) +
        '</span><small>' + weekday + '</small>'
      );
    } catch (err) {
      showResult(result, '❌ त्रुटि: ' + err.message, true);
      console.error(err);
    }
  }

  // ============ Today ============
  function today() {
    var result = $('todayResult');
    try {
      var now = new Date();
      var nd = new ND(now);
      var weekday = ['आइतबार','सोमबार','मंगलबार','बुधबार','बिहीबार','शुक्रबार','शनिबार'][now.getDay()];

      showResult(result,
        '🇳🇵 <strong>' + toNepali(nd.getYear()) + ' ' + NEPALI_MONTHS[nd.getMonth()] + ' ' + toNepali(nd.getDate()) + '</strong>' +
        '<small>' + weekday + '</small>' +
        '<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(26,127,55,0.2)">' +
        '🇬🇧 ' + now.getFullYear() + ' ' + ENGLISH_MONTHS[now.getMonth()] + ' ' + now.getDate() + '</div>'
      );

      $('bsYear').value = nd.getYear();
      $('bsMonth').value = nd.getMonth();
      $('bsDay').value = nd.getDate();
      $('adYear').value = now.getFullYear();
      $('adMonth').value = now.getMonth() + 1;
      $('adDay').value = now.getDate();
    } catch (err) {
      showResult(result, '❌ त्रुटि: ' + err.message, true);
      console.error(err);
    }
  }

  // Bind buttons
  if ($('bsToAdBtn')) $('bsToAdBtn').addEventListener('click', bsToAd);
  if ($('adToBsBtn')) $('adToBsBtn').addEventListener('click', adToBs);
  if ($('todayBtn')) $('todayBtn').addEventListener('click', today);

  // Auto-run today on load
  setTimeout(today, 200);

  // Enter key support
  ['bsYear', 'bsDay'].forEach(function(id) {
    if ($(id)) $(id).addEventListener('keypress', function(e) {
      if (e.key === 'Enter') bsToAd();
    });
  });
  ['adYear', 'adDay'].forEach(function(id) {
    if ($(id)) $(id).addEventListener('keypress', function(e) {
      if (e.key === 'Enter') adToBs();
    });
  });

})();