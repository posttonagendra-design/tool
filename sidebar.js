/* ============================================================
   SIDEBAR NAVIGATION
   ============================================================ */
(function() {
  'use strict';

  function init() {
    var sidebar = document.getElementById('sidebar');
    var backdrop = document.getElementById('sidebarBackdrop');
    var hamburger = document.getElementById('hamburger');
    var navItems = document.querySelectorAll('.nav-item');
    var pages = document.querySelectorAll('.page');

    console.log('📄 Sidebar init — nav items:', navItems.length);

    if (navItems.length === 0) {
      console.warn('⚠️ No nav-items found');
      return;
    }

    navItems.forEach(function(item) {
      item.addEventListener('click', function(e) {
        e.preventDefault();

        var page = item.getAttribute('data-page');
        console.log('📄 Switch to:', page);

        // Update nav active
        navItems.forEach(function(n) { n.classList.remove('active'); });
        item.classList.add('active');

        // Update page active
        pages.forEach(function(p) { p.classList.remove('active'); });
        var target = document.getElementById('page-' + page);
        if (target) {
          target.classList.add('active');
          console.log('✅ Page:', target.id);
        } else {
          console.error('❌ Not found: page-' + page);
        }

        // Close sidebar on mobile
        if (window.innerWidth <= 768 && sidebar) {
          sidebar.classList.remove('open');
          if (backdrop) backdrop.classList.remove('show');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    if (hamburger && sidebar) {
      hamburger.addEventListener('click', function() {
        sidebar.classList.toggle('open');
        if (backdrop) backdrop.classList.toggle('show');
      });
    }

    if (backdrop && sidebar) {
      backdrop.addEventListener('click', function() {
        sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('show');
      });
    }

    console.log('✅ Sidebar ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();