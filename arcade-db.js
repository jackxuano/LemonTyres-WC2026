// ============================================================
// ARCADE DB — shared Firebase leaderboard helper for the Arcade games.
// Reuses the SAME Firebase app that game.js initialises (no double-init,
// via getApps/getApp). Exposes window.LemonDB.subscribe / .submit.
// All arcade games live under the "arcade" node, e.g. arcade/shootout,
// so a SINGLE Firebase rule covers every arcade game.
// MUST load AFTER game.js so the default app exists first.
// ============================================================
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getDatabase, ref, push, onValue } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyD4wGcrDcfVO0pyQ33v3oh2ZxDrcXTkJfY",
  authDomain: "lemon-tyres.firebaseapp.com",
  databaseURL: "https://lemon-tyres-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lemon-tyres",
  storageBucket: "lemon-tyres.firebasestorage.app",
  messagingSenderId: "457298261963",
  appId: "1:457298261963:web:958ab24c6f9441fc33284e",
};

let db = null;
try {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (e) {
  console.warn('LemonDB init failed:', e);
}

window.LemonDB = {
  ready() { return !!db; },
  // subscribe(path, cb): cb(arrayOfEntries) on every update; cb(null, err) on error
  subscribe(path, cb) {
    if (!db) { cb(null, new Error('no-db')); return; }
    onValue(ref(db, path), (snap) => {
      const arr = [];
      snap.forEach((c) => { const v = c.val(); if (v && typeof v.score === 'number' && v.name) arr.push(v); });
      cb(arr);
    }, (err) => cb(null, err));
  },
  // submit(path, entry): returns the push promise
  submit(path, entry) {
    if (!db) return Promise.reject(new Error('no-db'));
    return push(ref(db, path), entry);
  }
};
