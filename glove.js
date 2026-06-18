// ============================================================
// GLOVE UP — you're the keeper (Arcade game)
// Shots fly at the goal; tap the side the ball's heading to dive
// and save. React in time. Score = saves in a row. One goal ends it.
// Local best for now; shared leaderboard added at launch.
// ============================================================
window.ARCADE = window.ARCADE || { games: [], register(g){ this.games.push(g); } };

(function () {
  let cv, ctx, raf = null, running = false;
  const W = 360, H = 480;
  const POST_L = 60, POST_R = 300, BAR_Y = 64, MOUTH_Y = 150, LINE_Y = 120;
  const ZONES = [ (POST_L + POST_R) / 2 - 80, (POST_L + POST_R) / 2, (POST_L + POST_R) / 2 + 80 ]; // L,C,R x
  let scoreEl, bestEl, overlay, titleEl, subEl, startBtn;
  let best = parseInt(localStorage.getItem('lemonGloveBest') || '0', 10);

  let streak, state, ball, targetZone, gloveZone, gloveX, flightT, flightDur, resultText, resTimer;

  function build(container) {
    container.innerHTML = `
      <h2 class="section-title">Glove Up 🧤</h2>
      <p class="game-tagline">You're the keeper now. Tap the side the ball's going to dive and save it. One goal past you ends the run.</p>
      <div class="game-wrap">
        <div class="game-hud">
          <span class="game-score-label">SAVES</span>
          <span class="game-score" id="gl-score">0</span>
          <span class="game-best" id="gl-best"></span>
        </div>
        <canvas id="gl-canvas" width="360" height="480"></canvas>
        <div class="game-overlay" id="gl-overlay">
          <div class="game-overlay-inner">
            <div class="game-overlay-title" id="gl-title">READY?</div>
            <div class="game-overlay-sub" id="gl-sub">Tap left / centre / right to dive</div>
            <button class="game-btn" id="gl-start">▶ Keep</button>
          </div>
        </div>
      </div>`;
    cv = container.querySelector('#gl-canvas');
    ctx = cv.getContext('2d');
    scoreEl = container.querySelector('#gl-score');
    bestEl = container.querySelector('#gl-best');
    overlay = container.querySelector('#gl-overlay');
    titleEl = container.querySelector('#gl-title');
    subEl = container.querySelector('#gl-sub');
    startBtn = container.querySelector('#gl-start');
    bestEl.textContent = best > 0 ? `BEST ${best}` : '';

    const tap = e => {
      e.preventDefault();
      if (state !== 'flight') return;
      const r = cv.getBoundingClientRect();
      const cx = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) * (W / r.width);
      gloveZone = cx < W / 3 ? 0 : cx < 2 * W / 3 ? 1 : 2; // which third tapped
    };
    cv.addEventListener('mousedown', tap);
    cv.addEventListener('touchstart', tap, { passive: false });
    startBtn.addEventListener('click', start);
    reset(); draw();
  }

  function reset() { streak = 0; state = 'idle'; gloveZone = 1; gloveX = ZONES[1]; resultText = ''; }
  function start() { reset(); overlay.style.display = 'none'; running = true; if (raf) cancelAnimationFrame(raf); serve(); loop(); }
  function show() {}
  function hide() { running = false; if (raf) cancelAnimationFrame(raf); }

  function serve() {
    targetZone = Math.floor(Math.random() * 3);
    gloveZone = -1;                 // no dive committed yet
    ball = { x: 180, y: 430 };
    flightT = 0;
    flightDur = Math.max(26, 52 - streak * 2);  // shrinking reaction window
    state = 'flight';
  }
  function resolve() {
    if (gloveZone === targetZone) {
      streak++; scoreEl.textContent = String(streak);
      resultText = 'SAVED! 🧤'; resTimer = 26; state = 'result';
    } else {
      resultText = 'GOAL!'; resTimer = 40;
      running = false; state = 'result';
      if (streak > best) { best = streak; localStorage.setItem('lemonGloveBest', String(best)); bestEl.textContent = `BEST ${best}`; }
      setTimeout(() => {
        titleEl.textContent = 'BEATEN!';
        subEl.textContent = `You saved ${streak} in a row`;
        startBtn.textContent = '▶ Keep Again';
        overlay.style.display = 'flex';
      }, 850);
    }
  }
  function update() {
    if (state === 'flight') {
      flightT++;
      const t = flightT / flightDur;
      ball.x = 180 + (ZONES[targetZone] - 180) * t;
      ball.y = 430 + (LINE_Y - 430) * t;
      // glove eases toward committed dive
      if (gloveZone >= 0) gloveX += (ZONES[gloveZone] - gloveX) * 0.35;
      if (t >= 1) resolve();
    } else if (state === 'result') {
      if (gloveZone >= 0) gloveX += (ZONES[gloveZone] - gloveX) * 0.35;
      if (resTimer > 0) { resTimer--; if (resTimer === 0 && running) serve(); }
    }
  }
  function draw() {
    ctx.fillStyle = '#0d1f0d'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < H; i += 44) ctx.fillRect(0, i, W, 22);
    // goal frame
    ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(POST_L, MOUTH_Y); ctx.lineTo(POST_L, BAR_Y);
    ctx.lineTo(POST_R, BAR_Y); ctx.lineTo(POST_R, MOUTH_Y); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    for (let x = POST_L; x <= POST_R; x += 15) { ctx.beginPath(); ctx.moveTo(x, BAR_Y); ctx.lineTo(x, MOUTH_Y); ctx.stroke(); }
    for (let y = BAR_Y; y <= MOUTH_Y; y += 15) { ctx.beginPath(); ctx.moveTo(POST_L, y); ctx.lineTo(POST_R, y); ctx.stroke(); }
    // zone hints
    ctx.fillStyle = 'rgba(245,208,0,0.07)';
    ctx.fillRect(0, BAR_Y, W / 3, MOUTH_Y - BAR_Y);
    ctx.fillRect(2 * W / 3, BAR_Y, W / 3, MOUTH_Y - BAR_Y);
    // gloves (the keeper = you)
    drawGloves(gloveX, LINE_Y);
    // striker
    ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(180, 452, 12, 0, 7); ctx.fill();
    // ball
    if (state === 'flight' || (state === 'result' && resultText.includes('GOAL'))) drawLemon(ball.x, ball.y, 12);
    // result text
    if (resultText && state === 'result') {
      ctx.fillStyle = resultText.includes('SAVED') ? '#1DE54A' : '#FF3B30';
      ctx.font = "bold 32px 'Bebas Neue', sans-serif"; ctx.textAlign = 'center';
      ctx.fillText(resultText, W / 2, 250); ctx.textAlign = 'left';
    }
  }
  function drawGloves(x, y) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-15, 0, 11, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(15, 0, 11, 0, 7); ctx.fill();
    ctx.strokeStyle = '#1DE54A'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(-15, 0, 11, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(15, 0, 11, 0, 7); ctx.stroke();
    ctx.restore();
  }
  function drawLemon(x, y, r) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#F5C400'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.02, r * 0.92, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.3, r * 0.22, r * 0.13, -0.6, 0, 7); ctx.fill();
    ctx.restore();
  }
  function loop() {
    if (!running && state !== 'result') return;
    if (cv.offsetParent === null) { raf = requestAnimationFrame(loop); return; }
    update(); draw();
    raf = requestAnimationFrame(loop);
  }

  window.ARCADE.register({ id: 'glove', label: 'Glove Up', live: false, build, show, hide });
})();
