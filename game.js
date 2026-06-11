// ============================================================
// LEMON-TIMBANG — game + shared Firebase leaderboard
// ============================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getDatabase, ref, push, query, orderByChild, limitToLast, onValue
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

// ---------- FIREBASE CONFIG ----------
// PASTE YOUR CONFIG OBJECT BELOW (from Firebase console → Project settings)
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
let firebaseReady = false;
try {
  if (firebaseConfig.apiKey !== "PASTE_HERE") {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    firebaseReady = true;
  }
} catch (e) {
  console.warn('Firebase not configured yet:', e);
}

// ============================================================
// GAME
// ============================================================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('game-score');
const bestEl = document.getElementById('game-best');
const overlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySub = document.getElementById('overlay-sub');
const startBtn = document.getElementById('game-start-btn');
const submitWrap = document.getElementById('game-submit');
const nameInput = document.getElementById('game-name');
const submitBtn = document.getElementById('game-submit-btn');
const submitMsg = document.getElementById('game-submit-msg');

// Responsive canvas sizing (keep internal resolution, scale via CSS)
const W = canvas.width;   // 360
const H = canvas.height;  // 480

const GRAV = 0.42;        // gravity per frame
const BOUNCE = -11.5;     // upward velocity on tap
const BALL_R = 30;

let ball = { x: W/2, y: H/2, vx: 0, vy: 0 };
let score = 0;
let best = parseInt(localStorage.getItem('lemonKeepyBest') || '0', 10);
let running = false;
let animId = null;

bestEl.textContent = best > 0 ? `BEST ${best}` : '';

function resetBall() {
  ball.x = W/2;
  ball.y = H/2;
  ball.vx = 0;
  ball.vy = 0;
}

function startGame() {
  score = 0;
  scoreEl.textContent = '0';
  resetBall();
  ball.vy = BOUNCE * 0.6; // gentle lob up to begin
  running = true;
  overlay.style.display = 'none';
  submitWrap.style.display = 'none';
  submitMsg.textContent = '';
  if (animId) cancelAnimationFrame(animId);
  loop();
}

function gameOver() {
  running = false;
  if (animId) cancelAnimationFrame(animId);
  if (score > best) {
    best = score;
    localStorage.setItem('lemonKeepyBest', String(best));
    bestEl.textContent = `BEST ${best}`;
  }
  overlayTitle.textContent = 'DROPPED! 🍋';
  overlaySub.textContent = `You scored ${score}`;
  startBtn.textContent = '▶ Play Again';
  overlay.style.display = 'flex';

  // Offer score submission if Firebase is ready and score > 0
  if (firebaseReady && score > 0) {
    submitWrap.style.display = 'flex';
    const saved = localStorage.getItem('lemonKeepyName');
    if (saved) nameInput.value = saved;
  }
}

function tapAt(px, py) {
  if (!running) return;
  // Did the tap land on (or near) the ball?
  const dx = px - ball.x;
  const dy = py - ball.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist <= BALL_R + 14) {
    score++;
    scoreEl.textContent = String(score);
    ball.vy = BOUNCE;
    // horizontal nudge based on where you hit (off-centre = more spin)
    ball.vx += (-dx / BALL_R) * 2.2;
    ball.vx = Math.max(-7, Math.min(7, ball.vx));
    // tiny haptic on supported devices
    if (navigator.vibrate) navigator.vibrate(10);
  }
}

function loop() {
  // physics
  ball.vy += GRAV;
  ball.x += ball.vx;
  ball.y += ball.vy;

  // wall bounce
  if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx) * 0.8; }
  if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx) * 0.8; }
  // ceiling
  if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy) * 0.5; }

  // floor = game over
  if (ball.y > H - BALL_R) {
    drawScene();
    gameOver();
    return;
  }

  drawScene();
  animId = requestAnimationFrame(loop);
}

function drawScene() {
  ctx.clearRect(0, 0, W, H);

  // pitch background
  ctx.fillStyle = '#0d1f0d';
  ctx.fillRect(0, 0, W, H);
  // subtle pitch stripes
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let i = 0; i < H; i += 48) ctx.fillRect(0, i, W, 24);
  // ground line
  ctx.strokeStyle = 'rgba(245,208,0,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 4);
  ctx.lineTo(W, H - 4);
  ctx.stroke();

  drawLemon(ball.x, ball.y, BALL_R);
}

function drawLemon(x, y, r) {
  ctx.save();
  ctx.translate(x, y);

  // shadow on ground
  const groundY = H - 4 - y;
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, groundY, r * 0.8, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // lemon body
  const grad = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.2, 0, 0, r);
  grad.addColorStop(0, '#FFE94D');
  grad.addColorStop(1, '#F5C400');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.02, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();

  // little nubs top and bottom
  ctx.fillStyle = '#E0B000';
  ctx.beginPath();
  ctx.ellipse(r * 0.98, 0, r * 0.12, r * 0.09, 0, 0, Math.PI * 2);
  ctx.ellipse(-r * 0.98, 0, r * 0.12, r * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  // highlight
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2);
  ctx.fill();

  // tiny face (cute)
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.arc(-r * 0.22, -r * 0.05, 2.6, 0, Math.PI * 2);
  ctx.arc(r * 0.22, -r * 0.05, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, r * 0.08, r * 0.28, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

// ---------- INPUT ----------
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  // map displayed coords → internal resolution
  return { x: cx * (W / rect.width), y: cy * (H / rect.height) };
}

canvas.addEventListener('mousedown', (e) => { const p = canvasPoint(e); tapAt(p.x, p.y); });
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const p = canvasPoint(e);
  tapAt(p.x, p.y);
}, { passive: false });

startBtn.addEventListener('click', startGame);

// Draw the idle scene on load
resetBall();
drawScene();

// ============================================================
// LEADERBOARD
// ============================================================
const lbEl = document.getElementById('game-leaderboard');

function renderLeaderboard(scores) {
  if (!scores || scores.length === 0) {
    lbEl.innerHTML = '<p class="game-lb-loading">No scores yet — be the first! 🍋</p>';
    return;
  }
  // highest first
  scores.sort((a, b) => b.score - a.score);
  const top = scores.slice(0, 15);
  lbEl.innerHTML = top.map((s, i) => {
    const rank = i + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    const rankClass = rank <= 3 ? 'top3' : '';
    return `
      <div class="game-lb-row ${rankClass}">
        <span class="game-lb-rank">${medal}</span>
        <span class="game-lb-name">${escapeHtml(s.name)}</span>
        <span class="game-lb-score">${s.score}</span>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// Live-subscribe to the top scores
if (firebaseReady) {
  const scoresRef = query(ref(db, 'keepyup_scores'), orderByChild('score'), limitToLast(50));
  onValue(scoresRef, (snap) => {
    const arr = [];
    snap.forEach(child => {
      const v = child.val();
      if (v && typeof v.score === 'number' && v.name) arr.push(v);
    });
    renderLeaderboard(arr);
  }, (err) => {
    lbEl.innerHTML = '<p class="game-lb-loading">Leaderboard unavailable. Check Firebase rules.</p>';
    console.error(err);
  });
} else {
  lbEl.innerHTML = '<p class="game-lb-loading">Leaderboard not set up yet — add your Firebase config in game.js.</p>';
}

// ---------- SUBMIT SCORE ----------
submitBtn.addEventListener('click', async () => {
  const name = nameInput.value.trim();
  if (!name) { submitMsg.textContent = 'Enter a name first.'; return; }
  if (score <= 0) { submitMsg.textContent = 'No score to save.'; return; }
  if (!firebaseReady) { submitMsg.textContent = 'Leaderboard not configured.'; return; }

  submitBtn.disabled = true;
  submitMsg.textContent = 'Saving…';
  try {
    await push(ref(db, 'keepyup_scores'), {
      name: name.slice(0, 14),
      score: score,
      ts: Date.now(),
    });
    localStorage.setItem('lemonKeepyName', name);
    submitMsg.textContent = '✅ Saved! Check the leaderboard.';
    submitWrap.style.display = 'none';
  } catch (e) {
    submitMsg.textContent = 'Save failed — try again.';
    console.error(e);
  } finally {
    submitBtn.disabled = false;
  }
});
