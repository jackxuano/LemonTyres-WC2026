// ============================================================
// GLOVE UP — keeper reaction game (Arcade game)
// Shots fly at the goal; tap the side the ball's heading to dive the
// teal keeper gloves and save. React in time. Score = saves in a row.
// One goal past you ends the run. Ball = club logo. Neutral keeper
// (no featured player). Shared leaderboard on arcade/glove.
// ============================================================
window.ARCADE = window.ARCADE || { games: [], register(g){ this.games.push(g); } };

(function () {
  let cv, ctx, raf = null, running = false;
  const W = 360, H = 480;
  const POST_L = 56, POST_R = 304, BAR_Y = 54, MOUTH_Y = 158, LINE_Y = 132;
  const ZONES = [128, 180, 232];
  const SPOT = { x: 180, y: 322 };
  const GLOVE_Y = 126, GLOVE_DX = 30;
  let scoreEl, bestEl, overlay, titleEl, subEl, startBtn;
  let lbEl, submitWrap, nameInput, submitBtn, submitMsg;
  let best = parseInt(localStorage.getItem('lemonGloveBest') || '0', 10);
  let lastStreak = 0;

  const ballImg = new Image(); let ballOk = false; ballImg.onload = () => ballOk = true; ballImg.src = 'logo.jpeg';
  const gloveImg = new Image(); let gloveOk = false; gloveImg.onload = () => gloveOk = true; gloveImg.src = 'img/glove.png';

  let streak, state, ball, targetZone, gloveZone, keeperX, flightT, flightDur, resultText, resTimer;

  function build(container) {
    container.innerHTML =
      '<h2 class="section-title">Glove Up 🧤</h2>' +
      '<p class="game-tagline">You\u2019re the last line. Tap left / centre / right to dive the way the ball\u2019s heading and keep it out. One goal past you ends the run.</p>' +
      '<div class="game-wrap">' +
        '<div class="game-hud"><span class="game-score-label">SAVES</span>' +
        '<span class="game-score" id="gl-score">0</span><span class="game-best" id="gl-best"></span></div>' +
        '<canvas id="gl-canvas" width="360" height="480"></canvas>' +
        '<div class="game-overlay" id="gl-overlay"><div class="game-overlay-inner">' +
          '<div class="game-overlay-title" id="gl-title">READY?</div>' +
          '<div class="game-overlay-sub" id="gl-sub">Tap left / centre / right to dive</div>' +
          '<button class="game-btn" id="gl-start">\u25b6 Keep</button>' +
        '</div></div>' +
      '</div>' +
      '<h3 class="game-lb-title">🏆 Top Keepers</h3>' +
      '<div class="game-submit" id="gl-submit" style="display:none">' +
        '<input class="game-name-input" id="gl-name" maxlength="14" placeholder="Your name" />' +
        '<button class="game-btn" id="gl-submit-btn">Submit saves</button>' +
        '<span class="game-submit-msg" id="gl-submit-msg"></span>' +
      '</div>' +
      '<div class="game-leaderboard" id="gl-leaderboard"><p class="game-lb-loading">Loading leaderboard…</p></div>';

    cv = container.querySelector('#gl-canvas'); ctx = cv.getContext('2d');
    scoreEl = container.querySelector('#gl-score');
    bestEl = container.querySelector('#gl-best');
    overlay = container.querySelector('#gl-overlay');
    titleEl = container.querySelector('#gl-title');
    subEl = container.querySelector('#gl-sub');
    startBtn = container.querySelector('#gl-start');
    lbEl = container.querySelector('#gl-leaderboard');
    submitWrap = container.querySelector('#gl-submit');
    nameInput = container.querySelector('#gl-name');
    submitBtn = container.querySelector('#gl-submit-btn');
    submitMsg = container.querySelector('#gl-submit-msg');
    bestEl.textContent = best > 0 ? 'BEST ' + best : '';

    const tap = e => {
      e.preventDefault();
      if (state !== 'flight') return;
      const r = cv.getBoundingClientRect();
      const cx = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) * (W / r.width);
      gloveZone = cx < W / 3 ? 0 : cx < 2 * W / 3 ? 1 : 2;
    };
    cv.addEventListener('mousedown', tap);
    cv.addEventListener('touchstart', tap, { passive: false });
    startBtn.addEventListener('click', start);
    initLeaderboard();
    reset(); draw();
  }
  function reset() { streak = 0; state = 'idle'; gloveZone = 1; keeperX = ZONES[1]; resultText = ''; }
  function start() { reset(); overlay.style.display = 'none'; submitWrap.style.display = 'none'; running = true; if (raf) cancelAnimationFrame(raf); serve(); loop(); }
  function show() {}
  function hide() { running = false; if (raf) cancelAnimationFrame(raf); }

  function serve() {
    targetZone = Math.floor(Math.random() * 3);
    gloveZone = -1;
    ball = { x: SPOT.x, y: SPOT.y };
    flightT = 0; flightDur = Math.max(26, 54 - streak * 2);
    state = 'flight';
  }
  function resolve() {
    if (gloveZone === targetZone) {
      streak++; scoreEl.textContent = String(streak);
      resultText = 'SAVED! 🧤'; resTimer = 26; state = 'result';
    } else {
      resultText = 'GOAL!'; resTimer = 40; running = false; state = 'result';
      lastStreak = streak;
      if (streak > best) { best = streak; localStorage.setItem('lemonGloveBest', String(best)); bestEl.textContent = 'BEST ' + best; }
      setTimeout(() => {
        titleEl.textContent = 'BEATEN!';
        subEl.textContent = 'You saved ' + streak + ' in a row';
        startBtn.textContent = '▶ Keep Again';
        overlay.style.display = 'flex';
        if (streak > 0 && window.LemonDB && window.LemonDB.ready()) {
          submitWrap.style.display = 'flex'; submitMsg.textContent = '';
          submitBtn.disabled = false; submitBtn.textContent = 'Submit saves (' + streak + ')';
        }
      }, 900);
    }
  }
  function update() {
    if (state === 'flight') {
      flightT++;
      const t = flightT / flightDur;
      ball.x = SPOT.x + (ZONES[targetZone] - SPOT.x) * t;
      ball.y = SPOT.y + (LINE_Y - SPOT.y) * t;
      if (gloveZone >= 0) keeperX += (ZONES[gloveZone] - keeperX) * 0.32;
      if (t >= 1) resolve();
    } else if (state === 'result') {
      if (gloveZone >= 0) keeperX += (ZONES[gloveZone] - keeperX) * 0.32;
      if (resTimer > 0) { resTimer--; if (resTimer === 0 && running) serve(); }
    }
  }
  function draw() {
    ctx.fillStyle = '#0d1f0d'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let i = 0; i < H; i += 46) ctx.fillRect(0, i, W, 23);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
    ctx.strokeRect(20, MOUTH_Y, W - 40, 196);
    ctx.strokeRect(104, MOUTH_Y, W - 208, 52);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(SPOT.x, 300, 3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(SPOT.x, 300, 52, Math.PI * 0.18, Math.PI * 0.82); ctx.stroke();
    ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(POST_L, MOUTH_Y); ctx.lineTo(POST_L, BAR_Y);
    ctx.lineTo(POST_R, BAR_Y); ctx.lineTo(POST_R, MOUTH_Y); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    for (let x = POST_L; x <= POST_R; x += 15) { ctx.beginPath(); ctx.moveTo(x, BAR_Y); ctx.lineTo(x, MOUTH_Y); ctx.stroke(); }
    for (let y = BAR_Y; y <= MOUTH_Y; y += 15) { ctx.beginPath(); ctx.moveTo(POST_L, y); ctx.lineTo(POST_R, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(245,208,0,0.06)';
    ctx.fillRect(POST_L, BAR_Y, (POST_R - POST_L) / 3, MOUTH_Y - BAR_Y);
    ctx.fillRect(POST_R - (POST_R - POST_L) / 3, BAR_Y, (POST_R - POST_L) / 3, MOUTH_Y - BAR_Y);
    drawStriker(SPOT.x, SPOT.y + 14);
    drawGloves(keeperX);
    if (state === 'flight' || (state === 'result' && resultText.includes('GOAL'))) drawBall(ball.x, ball.y, 13);
    if (resultText && state === 'result') {
      ctx.fillStyle = resultText.includes('SAVED') ? '#1DE54A' : '#FF3B30';
      ctx.font = "bold 34px 'Bebas Neue', sans-serif"; ctx.textAlign = 'center';
      ctx.fillText(resultText, W / 2, 235); ctx.textAlign = 'left';
    }
  }
  function drawGloves(x) {
    drawGlove(x - GLOVE_DX, GLOVE_Y, false);
    drawGlove(x + GLOVE_DX, GLOVE_Y, true);
  }
  function drawGlove(gx, gy, flip) {
    if (gloveOk) {
      const gw = 30, gh = 30;
      ctx.save(); ctx.translate(gx, gy); if (flip) ctx.scale(-1, 1);
      ctx.drawImage(gloveImg, -gw / 2, -gh / 2, gw, gh); ctx.restore();
    } else {
      ctx.save(); ctx.translate(gx, gy);
      ctx.fillStyle = '#00c8be'; roundRect(-11, -12, 22, 22, 7); ctx.fill();   // teal palm
      ctx.fillStyle = '#13201f'; ctx.fillRect(-11, 8, 22, 5);                   // cuff
      ctx.strokeStyle = 'rgba(0,90,86,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-4, -12); ctx.lineTo(-4, 6); ctx.moveTo(4, -12); ctx.lineTo(4, 6); ctx.stroke();
      ctx.restore();
    }
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawStriker(x, y) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#d24'; ctx.fillRect(-9, -4, 18, 20);
    ctx.fillStyle = '#f2c89a'; ctx.beginPath(); ctx.arc(0, -12, 8, 0, 7); ctx.fill();
    ctx.restore();
  }
  function drawBall(x, y, r) {
    if (ballOk) {
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.closePath(); ctx.clip();
      ctx.drawImage(ballImg, x - r, y - r, r * 2, r * 2); ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    } else {
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = '#F5C400'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.02, r * 0.92, 0, 0, 7); ctx.fill();
      ctx.restore();
    }
  }
  function loop() {
    if (!running && state !== 'result') return;
    if (cv.offsetParent === null) { raf = requestAnimationFrame(loop); return; }
    update(); draw();
    raf = requestAnimationFrame(loop);
  }

  // ---- shared leaderboard (best saves per person) ----
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function renderLB(arr) {
    const bestBy = {};
    arr.forEach(s => { const k = s.name.trim().toLowerCase(); if (!bestBy[k] || s.score > bestBy[k].score) bestBy[k] = { name: s.name.trim(), score: s.score }; });
    const rows = Object.values(bestBy).sort((a, b) => b.score - a.score).slice(0, 15);
    if (!rows.length) { lbEl.innerHTML = '<p class="game-lb-loading">No saves yet — be the first! 🍋</p>'; return; }
    lbEl.innerHTML = rows.map((s, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
      return '<div class="game-lb-row"><span class="game-lb-rank">' + medal + '</span>' +
        '<span class="game-lb-name">' + escapeHtml(s.name) + '</span>' +
        '<span class="game-lb-score">' + s.score + '</span></div>';
    }).join('');
  }
  function initLeaderboard() {
    if (window.LemonDB && window.LemonDB.ready()) {
      const saved = localStorage.getItem('lemonPlayerName') || '';
      if (saved) nameInput.value = saved;
      window.LemonDB.subscribe('arcade/glove', (arr, err) => {
        if (err || !arr) { lbEl.innerHTML = '<p class="game-lb-loading">Leaderboard unavailable — check Firebase rules.</p>'; return; }
        renderLB(arr);
      });
      submitBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) { submitMsg.textContent = 'Enter a name first'; return; }
        submitBtn.disabled = true; submitMsg.textContent = 'Saving…';
        localStorage.setItem('lemonPlayerName', name);
        window.LemonDB.submit('arcade/glove', { name, score: lastStreak, ts: Date.now() })
          .then(() => { submitMsg.textContent = 'Submitted! 🍋'; submitWrap.style.display = 'none'; })
          .catch(() => { submitBtn.disabled = false; submitMsg.textContent = 'Failed — check connection'; });
      });
    } else {
      lbEl.innerHTML = '<p class="game-lb-loading">Leaderboard loading… (or offline)</p>';
    }
  }

  window.ARCADE.register({ id: 'glove', label: 'Glove Up', live: false, build, show, hide });
})();
