// ============================================================
// LEMON PENALTY SHOOTOUT — PREVIEW ONLY (gated behind ?preview=laksa)
// Aim the moving reticle, tap to shoot. Beat the keeper. Score = goals
// in a row; one save or miss ends the run. Local best for now;
// shared Firebase leaderboard wired at launch.
// ============================================================

(function () {
  const PREVIEW = new URLSearchParams(location.search).get('preview') === 'laksa';
  if (!PREVIEW) return;

  let booted = false;
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();

  function init() {
    if (booted) return; booted = true;
    const tabBtn = document.getElementById('tab-btn-penalty');
    const panel = document.getElementById('tab-penalty');
    if (!tabBtn || !panel) return;
    tabBtn.style.display = '';
    panel.innerHTML = `
      <div class="bk-previewbar">PREVIEW · only you can see this</div>
      <h2 class="section-title">Lemon Shoot-out 🍋⚽</h2>
      <p class="game-tagline">Tap when the reticle is where you want it. Beat EDT in goal. One save or miss ends your run.</p>
      <div class="game-wrap">
        <div class="game-hud">
          <span class="game-score-label">STREAK</span>
          <span class="game-score" id="pk-streak">0</span>
          <span class="game-best" id="pk-best"></span>
        </div>
        <canvas id="pk-canvas" width="360" height="480"></canvas>
        <div class="game-overlay" id="pk-overlay">
          <div class="game-overlay-inner">
            <div class="game-overlay-title" id="pk-title">READY?</div>
            <div class="game-overlay-sub" id="pk-sub">Tap to take your first penalty</div>
            <button class="game-btn" id="pk-start">▶ Shoot</button>
          </div>
        </div>
      </div>`;
    setupGame();
  }

  function setupGame() {
    const cv = document.getElementById('pk-canvas');
    const ctx = cv.getContext('2d');
    const streakEl = document.getElementById('pk-streak');
    const bestEl = document.getElementById('pk-best');
    const overlay = document.getElementById('pk-overlay');
    const titleEl = document.getElementById('pk-title');
    const subEl = document.getElementById('pk-sub');
    const startBtn = document.getElementById('pk-start');

    const W = 360, H = 480;
    const POST_L = 64, POST_R = 296, BAR_Y = 70, MOUTH_Y = 150; // goal frame
    const RET_MIN = 52, RET_MAX = 308;   // reticle sweep (slightly past posts = miss risk)
    const GOAL_Y = 128;                  // where the ball crosses the line
    const SPOT = { x: 180, y: 408 };

    // Keeper identity — change KEEPER_NAME freely. Drop img/edt.jpg in the
    // img/ folder and his face shows automatically; otherwise a drawn keeper.
    const KEEPER_NAME = 'EDT';
    const keeperImg = new Image();
    let keeperImgOk = false;
    keeperImg.onload = () => { keeperImgOk = true; };
    keeperImg.src = 'img/edt.jpg';

    let streak = 0;
    let best = parseInt(localStorage.getItem('lemonPenaltyBest') || '0', 10);
    bestEl.textContent = best > 0 ? `BEST ${best}` : '';

    let state = 'idle';   // idle | aim | shoot | result | over
    let retX = 180, retDir = 1, retSpeed = 2.2;
    let ball = { x: SPOT.x, y: SPOT.y };
    let shot = null;      // {targetX, t}
    let keeper = { x: 180, target: 180, reach: 36 };
    let resultText = '', resultColor = '#fff', resultTimer = 0;
    let animId = null;

    function difficulty() {
      retSpeed = 2.2 + streak * 0.45;          // reticle sweeps faster
      keeper.reach = 34 + Math.min(10, streak); // keeper covers a touch more
    }

    function startRun() {
      streak = 0; streakEl.textContent = '0';
      overlay.style.display = 'none';
      nextShot();
      if (animId) cancelAnimationFrame(animId);
      loop();
    }
    function nextShot() {
      difficulty();
      state = 'aim';
      retX = RET_MIN; retDir = 1;
      ball.x = SPOT.x; ball.y = SPOT.y;
      keeper.x = 180;
      shot = null;
    }
    function takeShot() {
      if (state !== 'aim') return;
      state = 'shoot';
      // keeper picks a dive: central-biased, spread grows with streak
      const spread = 60 + streak * 7;
      let kx = 180 + (Math.random() - 0.5) * 2 * spread;
      kx = Math.max(POST_L + 20, Math.min(POST_R - 20, kx));
      keeper.target = kx;
      shot = { targetX: retX, t: 0 };
      if (navigator.vibrate) navigator.vibrate(12);
    }
    function resolve() {
      const sx = shot.targetX;
      if (sx < POST_L || sx > POST_R) { // off target
        resultText = 'MISS! 🍋'; resultColor = '#F44336'; endRun();
      } else if (Math.abs(sx - keeper.x) <= keeper.reach) { // saved
        resultText = 'SAVED! 🧤'; resultColor = '#F44336'; endRun();
      } else { // goal
        streak++; streakEl.textContent = String(streak);
        resultText = 'GOAL! ⚽'; resultColor = 'var(--yellow)';
        state = 'result'; resultTimer = 45;
      }
    }
    function endRun() {
      state = 'result'; resultTimer = 55;
      if (streak > best) { best = streak; localStorage.setItem('lemonPenaltyBest', String(best)); bestEl.textContent = `BEST ${best}`; }
      setTimeout(() => {
        titleEl.textContent = resultText.includes('MISS') ? 'MISSED IT' : KEEPER_NAME + ' SAVES';
        subEl.textContent = `You scored ${streak} in a row`;
        startBtn.textContent = '▶ Go Again';
        overlay.style.display = 'flex';
        state = 'over';
      }, 950);
    }

    function update() {
      if (state === 'aim') {
        retX += retDir * retSpeed;
        if (retX >= RET_MAX) { retX = RET_MAX; retDir = -1; }
        if (retX <= RET_MIN) { retX = RET_MIN; retDir = 1; }
      } else if (state === 'shoot') {
        shot.t += 0.04;
        const t = Math.min(1, shot.t);
        ball.x = SPOT.x + (shot.targetX - SPOT.x) * t;
        ball.y = SPOT.y + (GOAL_Y - SPOT.y) * t;
        keeper.x += (keeper.target - keeper.x) * 0.18;
        if (t >= 1) resolve();
      } else if (state === 'result') {
        keeper.x += (keeper.target - keeper.x) * 0.18;
        if (resultTimer > 0) { resultTimer--; if (resultTimer === 0 && resultText.includes('GOAL')) nextShot(); }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // pitch
      ctx.fillStyle = '#0d1f0d'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < H; i += 44) ctx.fillRect(0, i, W, 22);
      // goal frame
      ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(POST_L, MOUTH_Y); ctx.lineTo(POST_L, BAR_Y);
      ctx.lineTo(POST_R, BAR_Y); ctx.lineTo(POST_R, MOUTH_Y);
      ctx.stroke();
      // net hint
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
      for (let x = POST_L; x <= POST_R; x += 16) { ctx.beginPath(); ctx.moveTo(x, BAR_Y); ctx.lineTo(x, MOUTH_Y); ctx.stroke(); }
      for (let y = BAR_Y; y <= MOUTH_Y; y += 16) { ctx.beginPath(); ctx.moveTo(POST_L, y); ctx.lineTo(POST_R, y); ctx.stroke(); }
      // keeper
      drawKeeper(keeper.x, 132);
      // keeper name tag
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = "16px 'Bebas Neue', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('🧤 ' + KEEPER_NAME, W / 2, 38);
      ctx.textAlign = 'left';
      // reticle (aim)
      if (state === 'aim') {
        ctx.strokeStyle = 'rgba(245,208,0,0.9)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(retX, GOAL_Y, 11, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(retX - 16, GOAL_Y); ctx.lineTo(retX + 16, GOAL_Y);
        ctx.moveTo(retX, GOAL_Y - 16); ctx.lineTo(retX, GOAL_Y + 16); ctx.stroke();
      }
      // ball
      drawLemon(ball.x, ball.y, 13);
      // result text
      if (state === 'result' || (state === 'shoot' && shot && shot.t > 0.9)) {
        if (resultText) {
          ctx.fillStyle = resultColor === 'var(--yellow)' ? '#F5D000' : resultColor;
          ctx.font = "bold 30px 'Bebas Neue', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText(resultText, W / 2, 260);
        }
      }
      ctx.textAlign = 'left';
    }

    function drawKeeper(x, y) {
      ctx.save(); ctx.translate(x, y);
      // legs
      ctx.fillStyle = '#111';
      ctx.fillRect(-12, 24, 9, 16); ctx.fillRect(3, 24, 9, 16);
      // jersey (bright GK kit)
      ctx.fillStyle = '#1DE54A';
      ctx.fillRect(-17, -6, 34, 32);
      ctx.fillStyle = '#0d8f2e';
      ctx.fillRect(-17, -6, 34, 5);              // collar shade
      // outstretched arms + gloves
      ctx.fillStyle = '#1DE54A';
      ctx.fillRect(-32, -2, 16, 9); ctx.fillRect(16, -2, 16, 9);
      ctx.fillStyle = '#fff';                     // gloves
      ctx.fillRect(-36, -4, 8, 13); ctx.fillRect(28, -4, 8, 13);
      // head — photo if available, else drawn
      if (keeperImgOk) {
        ctx.save();
        ctx.beginPath(); ctx.arc(0, -16, 12, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
        ctx.drawImage(keeperImg, -12, -28, 24, 24);
        ctx.restore();
        ctx.strokeStyle = '#1DE54A'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, -16, 12, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = '#f2c89a';
        ctx.beginPath(); ctx.arc(0, -16, 11, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    function drawLemon(x, y, r) {
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = '#F5C400';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.02, r * 0.92, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#E0B000';
      ctx.beginPath(); ctx.ellipse(r * 0.98, 0, r * 0.12, r * 0.09, 0, 0, 7);
      ctx.ellipse(-r * 0.98, 0, r * 0.12, r * 0.09, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.3, r * 0.22, r * 0.13, -0.6, 0, 7); ctx.fill();
      ctx.restore();
    }

    function loop() { update(); draw(); animId = requestAnimationFrame(loop); }

    function onTap(e) {
      e.preventDefault();
      if (state === 'aim') takeShot();
    }
    cv.addEventListener('mousedown', onTap);
    cv.addEventListener('touchstart', onTap, { passive: false });
    startBtn.addEventListener('click', startRun);

    // idle draw
    draw();
  }
})();
