// ============================================================
// LEMON SPRINT — Joker on a dribble (Arcade game)
// Drag Joker left/right down the pitch, dodge sliding tackles.
// Score = metres survived. Speeds up as you go. One tackle ends it.
// Joker = running figure (img/joker.png head + kit + striding legs +
// lemon ball at feet). Shared leaderboard on arcade/sprint.
// ============================================================
window.ARCADE = window.ARCADE || { games: [], register(g){ this.games.push(g); } };

(function () {
  let cv, ctx, raf = null, running = false;
  const W = 360, H = 480;
  let scoreEl, bestEl, overlay, titleEl, subEl, startBtn;
  let lbEl, submitWrap, nameInput, submitBtn, submitMsg;
  let best = parseInt(localStorage.getItem('lemonSprintBest') || '0', 10);
  let lastDist = 0;

  // images
  const headImg = new Image(); let headOk = false; headImg.onload = () => headOk = true; headImg.src = 'img/joker.png';
  const ballImg = new Image(); let ballOk = false; ballImg.onload = () => ballOk = true; ballImg.src = 'logo.jpeg';

  let player, obstacles, scroll, dist, speed, spawnT, targetX, stridePhase;

  function build(container) {
    container.innerHTML =
      '<h2 class="section-title">Lemon Sprint 🍋💨</h2>' +
      '<p class="game-tagline">Joker\u2019s off on one of his mazy runs. Drag him left/right to dodge the sliding tackles \u2014 how far can he get before someone clatters him?</p>' +
      '<div class="game-wrap">' +
        '<div class="game-hud"><span class="game-score-label">METRES</span>' +
        '<span class="game-score" id="sp-score">0</span><span class="game-best" id="sp-best"></span></div>' +
        '<canvas id="sp-canvas" width="360" height="480"></canvas>' +
        '<div class="game-overlay" id="sp-overlay"><div class="game-overlay-inner">' +
          '<div class="game-overlay-title" id="sp-title">READY?</div>' +
          '<div class="game-overlay-sub" id="sp-sub">Drag Joker to dodge the tackles</div>' +
          '<button class="game-btn" id="sp-start">\u25b6 Set Joker Off</button>' +
        '</div></div>' +
      '</div>' +
      '<h3 class="game-lb-title">🏆 Longest Runs</h3>' +
      '<div class="game-submit" id="sp-submit" style="display:none">' +
        '<input class="game-name-input" id="sp-name" maxlength="14" placeholder="Your name" />' +
        '<button class="game-btn" id="sp-submit-btn">Submit run</button>' +
        '<span class="game-submit-msg" id="sp-submit-msg"></span>' +
      '</div>' +
      '<div class="game-leaderboard" id="sp-leaderboard"><p class="game-lb-loading">Loading leaderboard…</p></div>';

    cv = container.querySelector('#sp-canvas'); ctx = cv.getContext('2d');
    scoreEl = container.querySelector('#sp-score');
    bestEl = container.querySelector('#sp-best');
    overlay = container.querySelector('#sp-overlay');
    titleEl = container.querySelector('#sp-title');
    subEl = container.querySelector('#sp-sub');
    startBtn = container.querySelector('#sp-start');
    lbEl = container.querySelector('#sp-leaderboard');
    submitWrap = container.querySelector('#sp-submit');
    nameInput = container.querySelector('#sp-name');
    submitBtn = container.querySelector('#sp-submit-btn');
    submitMsg = container.querySelector('#sp-submit-msg');
    bestEl.textContent = best > 0 ? 'BEST ' + best + 'm' : '';

    const move = e => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      targetX = Math.max(22, Math.min(W - 22, cx * (W / r.width)));
    };
    cv.addEventListener('touchmove', move, { passive: false });
    cv.addEventListener('mousemove', e => { if (e.buttons) move(e); });
    cv.addEventListener('touchstart', move, { passive: false });
    startBtn.addEventListener('click', start);
    initLeaderboard();
    reset(); draw();
  }

  function reset() { player = { x: 180, y: 392 }; targetX = 180; obstacles = []; scroll = 0; dist = 0; speed = 3.2; spawnT = 0; stridePhase = 0; }
  function start() { reset(); overlay.style.display = 'none'; submitWrap.style.display = 'none'; running = true; if (raf) cancelAnimationFrame(raf); loop(); }
  function show() {}
  function hide() { running = false; if (raf) cancelAnimationFrame(raf); }

  function spawn() { const w = 40 + Math.random() * 26; obstacles.push({ x: 24 + Math.random() * (W - 48 - w), y: -28, w, h: 20 }); }
  function update() {
    player.x += (targetX - player.x) * 0.25;
    speed += 0.0025;
    scroll = (scroll + speed) % 48;
    stridePhase += speed * 0.12;
    dist += speed * 0.08;
    scoreEl.textContent = Math.floor(dist);
    spawnT -= speed;
    if (spawnT <= 0) { spawn(); spawnT = 150 - Math.min(80, dist * 0.25); }
    obstacles.forEach(o => o.y += speed);
    obstacles = obstacles.filter(o => o.y < H + 30);
    // collision around Joker's body/feet
    for (const o of obstacles) {
      const nx = Math.max(o.x, Math.min(player.x, o.x + o.w));
      const ny = Math.max(o.y, Math.min(player.y, o.y + o.h));
      if ((player.x - nx) ** 2 + (player.y - ny) ** 2 < 14 ** 2) { end(); return; }
    }
  }
  function end() {
    running = false;
    lastDist = Math.floor(dist);
    if (lastDist > best) { best = lastDist; localStorage.setItem('lemonSprintBest', String(best)); bestEl.textContent = 'BEST ' + best + 'm'; }
    titleEl.textContent = 'JOKER TACKLED!';
    subEl.textContent = 'He made it ' + lastDist + ' metres';
    startBtn.textContent = '▶ Send Him Again';
    overlay.style.display = 'flex';
    if (lastDist > 0 && window.LemonDB && window.LemonDB.ready()) {
      submitWrap.style.display = 'flex'; submitMsg.textContent = '';
      submitBtn.disabled = false; submitBtn.textContent = 'Submit run (' + lastDist + 'm)';
    }
  }
  function draw() {
    ctx.fillStyle = '#0d1f0d'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
    for (let y = -48 + scroll; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    obstacles.forEach(o => {
      ctx.fillStyle = '#c0392b'; roundRect(o.x, o.y, o.w, o.h, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, 3);
    });
    drawJoker(player.x, player.y);
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawJoker(cx, cy) {
    const sw = running ? Math.sin(stridePhase) : 0; // stride swing
    // legs (running)
    ctx.strokeStyle = '#f2c89a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 4, cy + 14); ctx.lineTo(cx - 4 + sw * 8, cy + 32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 4, cy + 14); ctx.lineTo(cx + 4 - sw * 8, cy + 32); ctx.stroke();
    ctx.fillStyle = '#1a2424';
    ctx.beginPath(); ctx.arc(cx - 4 + sw * 8, cy + 33, 4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4 - sw * 8, cy + 33, 4, 0, 7); ctx.fill();
    ctx.lineCap = 'butt';
    // body (kit)
    ctx.fillStyle = '#c0392b'; roundRect(cx - 13, cy - 8, 26, 24, 7); ctx.fill();
    // head
    if (headOk) ctx.drawImage(headImg, cx - 17, cy - 46, 34, 40);
    else { ctx.fillStyle = '#f2c89a'; ctx.beginPath(); ctx.arc(cx, cy - 24, 14, 0, 7); ctx.fill(); }
    // ball at feet (bobs ahead)
    const bx = cx + 11 + sw * 3, by = cy + 40, r = 9;
    if (ballOk) {
      ctx.save(); ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.closePath(); ctx.clip();
      ctx.drawImage(ballImg, bx - r, by - r, r * 2, r * 2); ctx.restore();
    } else { ctx.fillStyle = '#F5C400'; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill(); }
  }
  function loop() {
    if (!running) return;
    if (cv.offsetParent === null) { raf = requestAnimationFrame(loop); return; }
    update(); if (running) draw();
    raf = requestAnimationFrame(loop);
  }

  // ---- shared leaderboard (best metres per person) ----
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function renderLB(arr) {
    const bestBy = {};
    arr.forEach(s => { const k = s.name.trim().toLowerCase(); if (!bestBy[k] || s.score > bestBy[k].score) bestBy[k] = { name: s.name.trim(), score: s.score }; });
    const rows = Object.values(bestBy).sort((a, b) => b.score - a.score).slice(0, 15);
    if (!rows.length) { lbEl.innerHTML = '<p class="game-lb-loading">No runs yet — be the first! 🍋</p>'; return; }
    lbEl.innerHTML = rows.map((s, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
      return '<div class="game-lb-row"><span class="game-lb-rank">' + medal + '</span>' +
        '<span class="game-lb-name">' + escapeHtml(s.name) + '</span>' +
        '<span class="game-lb-score">' + s.score + 'm</span></div>';
    }).join('');
  }
  function initLeaderboard() {
    if (window.LemonDB && window.LemonDB.ready()) {
      const saved = localStorage.getItem('lemonPlayerName') || '';
      if (saved) nameInput.value = saved;
      window.LemonDB.subscribe('arcade/sprint', (arr, err) => {
        if (err || !arr) { lbEl.innerHTML = '<p class="game-lb-loading">Leaderboard unavailable — check Firebase rules.</p>'; return; }
        renderLB(arr);
      });
      submitBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) { submitMsg.textContent = 'Enter a name first'; return; }
        submitBtn.disabled = true; submitMsg.textContent = 'Saving…';
        localStorage.setItem('lemonPlayerName', name);
        window.LemonDB.submit('arcade/sprint', { name, score: lastDist, ts: Date.now() })
          .then(() => { submitMsg.textContent = 'Submitted! 🍋'; submitWrap.style.display = 'none'; })
          .catch(() => { submitBtn.disabled = false; submitMsg.textContent = 'Failed — check connection'; });
      });
    } else {
      lbEl.innerHTML = '<p class="game-lb-loading">Leaderboard loading… (or offline)</p>';
    }
  }

  window.ARCADE.register({ id: 'sprint', label: 'Sprint', live: false, build, show, hide });
})();
