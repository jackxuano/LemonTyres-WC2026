// ============================================================
// LEMON SPRINT — endless dribble runner (Arcade game)
// Drag the lemon to steer, dodge sliding tackles, score = metres.
// Registers into window.ARCADE; the games controller mounts it.
// Local best for now; shared leaderboard added at launch.
// ============================================================
window.ARCADE = window.ARCADE || { games: [], register(g){ this.games.push(g); } };

(function () {
  let cv, ctx, raf = null, running = false, built = false;
  const W = 360, H = 480;
  let scoreEl, bestEl, overlay, titleEl, subEl, startBtn;

  let best = parseInt(localStorage.getItem('lemonSprintBest') || '0', 10);
  let player, obstacles, scroll, dist, speed, spawnT, targetX, over;

  function build(container) {
    container.innerHTML = `
      <h2 class="section-title">Lemon Sprint 🍋💨</h2>
      <p class="game-tagline">Drag the lemon to steer. Dodge the sliding tackles. Go the distance.</p>
      <div class="game-wrap">
        <div class="game-hud">
          <span class="game-score-label">METRES</span>
          <span class="game-score" id="sp-score">0</span>
          <span class="game-best" id="sp-best"></span>
        </div>
        <canvas id="sp-canvas" width="360" height="480"></canvas>
        <div class="game-overlay" id="sp-overlay">
          <div class="game-overlay-inner">
            <div class="game-overlay-title" id="sp-title">READY?</div>
            <div class="game-overlay-sub" id="sp-sub">Drag to move · dodge the tackles</div>
            <button class="game-btn" id="sp-start">▶ Run</button>
          </div>
        </div>
      </div>`;
    cv = container.querySelector('#sp-canvas');
    ctx = cv.getContext('2d');
    scoreEl = container.querySelector('#sp-score');
    bestEl = container.querySelector('#sp-best');
    overlay = container.querySelector('#sp-overlay');
    titleEl = container.querySelector('#sp-title');
    subEl = container.querySelector('#sp-sub');
    startBtn = container.querySelector('#sp-start');
    bestEl.textContent = best > 0 ? `BEST ${best}m` : '';

    const move = e => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      targetX = Math.max(20, Math.min(W - 20, cx * (W / r.width)));
    };
    cv.addEventListener('touchmove', move, { passive: false });
    cv.addEventListener('mousemove', e => { if (e.buttons) move(e); });
    cv.addEventListener('touchstart', move, { passive: false });
    startBtn.addEventListener('click', start);
    reset(); draw();
  }

  function reset() {
    player = { x: 180, y: 400, r: 14 };
    targetX = 180; obstacles = []; scroll = 0; dist = 0;
    speed = 3.2; spawnT = 0; over = false;
  }
  function start() {
    reset(); overlay.style.display = 'none';
    running = true; if (raf) cancelAnimationFrame(raf); loop();
  }
  function show() { /* waits for Run button */ }
  function hide() { running = false; if (raf) cancelAnimationFrame(raf); }

  function spawn() {
    const w = 40 + Math.random() * 26;
    const x = 24 + Math.random() * (W - 48 - w);
    obstacles.push({ x, y: -28, w, h: 20 });
  }
  function update() {
    player.x += (targetX - player.x) * 0.25;
    speed += 0.0025;                       // gradual ramp
    scroll = (scroll + speed) % 48;
    dist += speed * 0.08;
    scoreEl.textContent = Math.floor(dist);
    spawnT -= speed;
    if (spawnT <= 0) { spawn(); spawnT = 150 - Math.min(80, dist * 0.25); }
    obstacles.forEach(o => o.y += speed);
    obstacles = obstacles.filter(o => o.y < H + 30);
    // collision (circle vs rect)
    for (const o of obstacles) {
      const nx = Math.max(o.x, Math.min(player.x, o.x + o.w));
      const ny = Math.max(o.y, Math.min(player.y, o.y + o.h));
      if ((player.x - nx) ** 2 + (player.y - ny) ** 2 < (player.r - 2) ** 2) { end(); return; }
    }
  }
  function end() {
    running = false; over = true;
    const m = Math.floor(dist);
    if (m > best) { best = m; localStorage.setItem('lemonSprintBest', String(best)); bestEl.textContent = `BEST ${best}m`; }
    titleEl.textContent = 'TACKLED!';
    subEl.textContent = `You ran ${m} metres`;
    startBtn.textContent = '▶ Run Again';
    overlay.style.display = 'flex';
  }
  function draw() {
    ctx.fillStyle = '#0d1f0d'; ctx.fillRect(0, 0, W, H);
    // scrolling pitch lines (speed sense)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
    for (let y = -48 + scroll; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    // obstacles (sliding tackles)
    obstacles.forEach(o => {
      ctx.fillStyle = '#c0392b'; roundRect(o.x, o.y, o.w, o.h, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, 3);
    });
    // player lemon
    drawLemon(player.x, player.y, player.r);
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawLemon(x, y, r) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#F5C400'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.02, r * 0.92, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.3, r * 0.22, r * 0.13, -0.6, 0, 7); ctx.fill();
    ctx.restore();
  }
  function loop() {
    if (!running) return;
    if (cv.offsetParent === null) { raf = requestAnimationFrame(loop); return; } // paused when hidden
    update(); if (running) draw();
    raf = requestAnimationFrame(loop);
  }

  window.ARCADE.register({ id: 'sprint', label: 'Sprint', live: false, build, show, hide });
})();
