/* Notes Storage — LocalStorage */
(function() {
  'use strict';
  var KEY = 'pdftool_notes_v1';

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch (e) { return []; }
  }
  function writeAll(notes) {
    localStorage.setItem(KEY, JSON.stringify(notes));
  }
  function genId() {
    return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }
  function nowISO() { return new Date().toISOString(); }

  var Storage = {
    name: 'local',
    init: function() { return Promise.resolve(); },

    getAll: function() {
      var notes = readAll();
      notes.sort(function(a, b) {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (a.reminder && b.reminder) {
          return new Date(a.reminder) - new Date(b.reminder);
        }
        if (a.reminder && !b.reminder) return -1;
        if (!a.reminder && b.reminder) return 1;
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
      return Promise.resolve(notes);
    },

    get: function(id) {
      var n = readAll().find(function(x) { return x.id === id; });
      return Promise.resolve(n || null);
    },

    save: function(note) {
      var notes = readAll();
      var now = nowISO();
      if (note.id) {
        var i = notes.findIndex(function(n) { return n.id === note.id; });
        if (i === -1) return Promise.reject(new Error('Note भेटिएन'));
        notes[i] = Object.assign({}, notes[i], note, { updated_at: now });
        writeAll(notes);
        return Promise.resolve(notes[i]);
      }
      var newNote = {
        id: genId(),
        title: note.title || '',
        body: note.body || '',
        color: note.color || 'yellow',
        pinned: !!note.pinned,
        reminder: note.reminder || null,
        created_at: now,
        updated_at: now
      };
      notes.push(newNote);
      writeAll(notes);
      return Promise.resolve(newNote);
    },

    delete: function(id) {
      writeAll(readAll().filter(function(n) { return n.id !== id; }));
      return Promise.resolve(true);
    },

    search: function(q) {
      q = (q || '').toLowerCase().trim();
      if (!q) return this.getAll();
      return this.getAll().then(function(notes) {
        return notes.filter(function(n) {
          return (n.title || '').toLowerCase().indexOf(q) !== -1 ||
                 (n.body || '').toLowerCase().indexOf(q) !== -1;
        });
      });
    },

    exportAll: function() {
      return Promise.resolve({
        version: 1,
        exported_at: nowISO(),
        notes: readAll()
      });
    },

    importAll: function(data) {
      if (!data || !Array.isArray(data.notes)) {
        return Promise.reject(new Error('Invalid backup'));
      }
      var imported = data.notes.map(function(n) {
        return {
          id: n.id || genId(),
          title: n.title || '',
          body: n.body || '',
          color: n.color || 'yellow',
          pinned: !!n.pinned,
          reminder: n.reminder || null,
          created_at: n.created_at || nowISO(),
          updated_at: n.updated_at || nowISO()
        };
      });
      writeAll(imported);
      return Promise.resolve(imported.length);
    },

    clearAll: function() {
      localStorage.removeItem(KEY);
      return Promise.resolve(true);
    }
  };

  window.NotesStorageLocal = Storage;
  console.log('📝 NotesStorageLocal loaded');
})();