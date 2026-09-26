/* ============================================================
   NOTES STORAGE — Config
   🎯 कुन storage use गर्ने? यहाँ १ line बदल्नुहोस्!
   ============================================================ */
(function() {
  'use strict';

  // ========================================
  // 👇 यो line मात्र बदल्नुहोस् पछि 👇
  // ========================================
  var STORAGE_TYPE = 'local';   // 'local' | 'api'
  // ========================================

  var impl;

  if (STORAGE_TYPE === 'api') {
    if (window.NotesStorageAPI) {
      impl = window.NotesStorageAPI;
      console.log('📝 Notes: Using API storage');
    } else {
      console.warn('⚠️ API storage भेटिएन — Local मा fallback');
      impl = window.NotesStorageLocal;
    }
  } else {
    impl = window.NotesStorageLocal;
    console.log('📝 Notes: Using LocalStorage');
  }

  window.NotesStorage = impl;
})();