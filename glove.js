// ============================================================
// GLOVE UP — Joker in goal (Arcade game)
// Shots fly at the goal; tap the side the ball's heading to slide
// Joker (face + gloves, as one keeper unit) and save it. React in
// time. Score = saves in a row. One goal past him ends the run.
// Ball = club logo. Keeper face = img/joker.jpg. Optional glove
// image img/glove.png (transparent PNG) — falls back to drawn gloves.
// Local best for now.
// ============================================================
window.ARCADE = window.ARCADE || { games: [], register(g){ this.games.push(g); } };

(function () {
  let cv, ctx, raf = null, running = false;
  const W = 360, H = 480;
  const POST_L = 56, POST_R = 304, BAR_Y = 54, MOUTH_Y = 158, LINE_Y = 132;
  const ZONES = [128, 180, 232];
  const SPOT = { x: 180, y: 322 };
  const FACE_Y = 100, FACE_R = 23, GLOVE_Y = 130, GLOVE_DX = 27;
  let scoreEl, bestEl, overlay, titleEl, subEl, startBtn;
  let best = parseInt(localStorage.getItem('lemonGloveBest') || '0', 10);

  // images
  const ballImg = new Image(); let ballOk = false; ballImg.onload = () => ballOk = true; ballImg.src = 'logo.jpeg';
  const faceImg = new Image(); let faceOk = false; faceImg.onload = () => faceOk = true; faceImg.src = 'img/joker.jpg';
  const gloveImg = new Image(); let gloveOk = false; gloveImg.onload = () => gloveOk = true; gloveImg.src = 'img/glove.png';

  let streak, state, ball, targetZone, gloveZone, keeperX, flightT, flightDur, resultText, resTimer;

  function build(container) {
    container.innerHTML =
      '<h2 class="section-title">Glove Up 🧤</h2>' +
      '<p class="game-tagline">Joker\u2019s in goal. Tap the side the ball\u2019s heading to dive and save it \u2014 how many can he keep out before one beats him?</p>' +
      '<div class="game-wrap">' +
        '<div class="game-hud"><span class="game-score-label">JOKER SAVES</span>' +
        '<span class="game-score" id="gl-score">0</span><span class="game-best" id="gl-best"></span></div>' +
        '<canvas id="gl-canvas" width="360" height="480"></canvas>' +
        '<div class="game-overlay" id="gl-overlay"><div class="game-overlay-inner">' +
          '<div class="game-overlay-title" id="gl-title">READY?</div>' +
          '<div class="game-overlay-sub" id="gl-sub">Tap left / centre / right to dive</div>' +
          '<button class="game-btn" id="gl-start">\u25b6 Send Joker Out</button>' +
        '</div></div>' +
      '</div>';
    cv = container.querySelector('#gl-canvas');
    ctx = cv.getContext('2d');
    scoreEl = container.querySelector('#gl-score');
    bestEl = container.querySelector('#gl-best');
    overlay = container.querySelector('#gl-overlay');
    titleEl = container.querySelector('#gl-title');
    subEl = container.querySelector('#gl-sub');
    startBtn = container.querySelector('#gl-start');
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
    reset(); draw();
  }
  function reset() { streak = 0; state = 'idle'; gloveZone = 1; keeperX = ZONES[1]; resultText = ''; }
  function start() { reset(); overlay.style.display = 'none'; running = true; if (raf) cancelAnimationFrame(raf); serve(); loop(); }
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
      if (streak > best) { best = streak; localStorage.setItem('lemonGloveBest', String(best)); bestEl.textContent = 'BEST ' + best; }
      setTimeout(() => {
        titleEl.textContent = 'JOKER BEATEN!';
        subEl.textContent = 'He saved ' + streak + ' in a row';
        startBtn.textContent = '▶ Send Him Out Again';
        overlay.style.display = 'flex';
      }, 900);
    }
  }
  function update() {
    if (state === 'flight') {
      flightT++;
      const t = flightT / flightDur;
      ball.x = SPOT.x + (ZONES[targetZone] - SPOT.x) * t;
      ball.y = SPOT.y + (LINE_Y - SPOT.y) * t;
      if (gloveZone >= 0) keeperX += (ZONES[gloveZone] - keeperX) * 0.32; // whole keeper slides
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
    // penalty area
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
    ctx.strokeRect(20, MOUTH_Y, W - 40, 196);
    ctx.strokeRect(104, MOUTH_Y, W - 208, 52);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(SPOT.x, 300, 3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(SPOT.x, 300, 52, Math.PI * 0.18, Math.PI * 0.82); ctx.stroke();
    // goal frame + net
    ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(POST_L, MOUTH_Y); ctx.lineTo(POST_L, BAR_Y);
    ctx.lineTo(POST_R, BAR_Y); ctx.lineTo(POST_R, MOUTH_Y); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    for (let x = POST_L; x <= POST_R; x += 15) { ctx.beginPath(); ctx.moveTo(x, BAR_Y); ctx.lineTo(x, MOUTH_Y); ctx.stroke(); }
    for (let y = BAR_Y; y <= MOUTH_Y; y += 15) { ctx.beginPath(); ctx.moveTo(POST_L, y); ctx.lineTo(POST_R, y); ctx.stroke(); }
    // zone tints
    ctx.fillStyle = 'rgba(245,208,0,0.06)';
    ctx.fillRect(POST_L, BAR_Y, (POST_R - POST_L) / 3, MOUTH_Y - BAR_Y);
    ctx.fillRect(POST_R - (POST_R - POST_L) / 3, BAR_Y, (POST_R - POST_L) / 3, MOUTH_Y - BAR_Y);
    // striker
    drawStriker(SPOT.x, SPOT.y + 14);
    // keeper (Joker) — face + gloves as one unit
    drawKeeper(keeperX);
    // ball
    if (state === 'flight' || (state === 'result' && resultText.includes('GOAL'))) drawBall(ball.x, ball.y, 13);
    // result text
    if (resultText && state === 'result') {
      ctx.fillStyle = resultText.includes('SAVED') ? '#1DE54A' : '#FF3B30';
      ctx.font = "bold 34px 'Bebas Neue', sans-serif"; ctx.textAlign = 'center';
      ctx.fillText(resultText, W / 2, 235); ctx.textAlign = 'left';
    }
  }
  function drawKeeper(x) {
    // gloves first (behind face edge)
    drawGlove(x - GLOVE_DX, GLOVE_Y, false);
    drawGlove(x + GLOVE_DX, GLOVE_Y, true);
    // face (Joker) clipped to circle with a jersey collar
    ctx.save();
    ctx.beginPath(); ctx.arc(x, FACE_Y, FACE_R + 3, 0, 7); ctx.fillStyle = '#F5D000'; ctx.fill(); // yellow ring
    ctx.beginPath(); ctx.arc(x, FACE_Y, FACE_R, 0, 7); ctx.closePath(); ctx.clip();
    if (faceOk) ctx.drawImage(faceImg, x - FACE_R, FACE_Y - FACE_R, FACE_R * 2, FACE_R * 2);
    else { ctx.fillStyle = '#f2c89a'; ctx.fillRect(x - FACE_R, FACE_Y - FACE_R, FACE_R * 2, FACE_R * 2); }
    ctx.restore();
  }
  function drawGlove(gx, gy, flip) {
    if (gloveOk) {
      const gw = 30, gh = 30;
      ctx.save(); ctx.translate(gx, gy);
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(gloveImg, -gw / 2, -gh / 2, gw, gh);
      ctx.restore();
    } else {
      // fallback mitt: yellow palm, black cuff
      ctx.save(); ctx.translate(gx, gy);
      ctx.fillStyle = '#F5D000';
      roundRect(-10, -11, 20, 20, 6); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(-10, 8, 20, 5);            // cuff
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-3, -11); ctx.lineTo(-3, 6); ctx.moveTo(3, -11); ctx.lineTo(3, 6); ctx.stroke();
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
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.closePath(); ctx.clip();
      ctx.drawImage(ballImg, x - r, y - r, r * 2, r * 2);
      ctx.restore();
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

  window.ARCADE.register({ id: 'glove', label: 'Glove Up', live: false, build, show, hide });
})();
