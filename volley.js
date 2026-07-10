// ============================================================
// ZHUNNY'S GOLDEN VOLLEY — Arcade game
// The lemon slides across the strike bar; tap while it's in the
// green zone and Zhunny volleys it home. Dead-centre = PERFECT (combo).
// Tap outside the zone (or let it slide off) = Zhunny skies it. Score =
// goals in a run. Shared leaderboard on arcade/volley.
// Striker: img/zhunny.png head; kicks with the leg on the side the ball
// came from, facing that side. Registers into window.ARCADE.
// ============================================================
window.ARCADE = window.ARCADE || { games: [], register(g){ this.games.push(g); } };

(function () {

  function build(container) {
    container.innerHTML = `
      <h2 class="section-title">Kapitan\u2019s Volley 🍋</h2>
      <p class="game-tagline">The lemon slides across \u2014 tap while it\u2019s in the green and our Kapitan buries the volley. Dead-centre = PERFECT 🔥. Miss the zone and he skies it into Row Z. How many can you bury?</p>
      <div class="game-wrap">
        <div class="game-hud">
          <span class="game-score-label">GOALS</span>
          <span class="game-score" id="vl-goals">0</span>
          <span class="game-best" id="vl-best"></span>
        </div>
        <canvas id="vl-canvas" width="360" height="480" style="display:block;width:100%;height:auto;border-radius:12px;background:#0d1f0d;touch-action:manipulation;"></canvas>
        <div class="game-overlay" id="vl-overlay">
          <div class="game-overlay-inner">
            <div class="game-overlay-title" id="vl-title">READY?</div>
            <div class="game-overlay-sub" id="vl-sub">Tap in the green zone \u2014 the Kapitan does the rest (allegedly)</div>
            <button class="game-btn" id="vl-start">\u25b6 Volley</button>
          </div>
        </div>
      </div>
      <h3 class="game-lb-title">🏆 Kapitan\u2019s Volley Leaders</h3>
      <div class="game-submit" id="vl-submit" style="display:none">
        <input class="game-name-input" id="vl-name" maxlength="14" placeholder="Your name" />
        <button class="game-btn" id="vl-submit-btn">Submit goals</button>
        <span class="game-submit-msg" id="vl-submit-msg"></span>
      </div>
      <div class="game-leaderboard" id="vl-leaderboard">
        <p class="game-lb-loading">Loading leaderboard\u2026</p>
      </div>`;
    setupGame(container);
  }

  function setupGame(container) {
    const cv = container.querySelector('#vl-canvas');
    const ctx = cv.getContext('2d');
    const goalsEl = container.querySelector('#vl-goals');
    const bestEl = container.querySelector('#vl-best');
    const overlay = container.querySelector('#vl-overlay');
    const titleEl = container.querySelector('#vl-title');
    const subEl = container.querySelector('#vl-sub');
    const startBtn = container.querySelector('#vl-start');
    const lbEl = container.querySelector('#vl-leaderboard');
    const submitWrap = container.querySelector('#vl-submit');
    const nameInput = container.querySelector('#vl-name');
    const submitBtn = container.querySelector('#vl-submit-btn');
    const submitMsg = container.querySelector('#vl-submit-msg');

    const W = 360, H = 480;
    const ZY = 300;                       // slide bar centre y
    const SX = 180, SY = 392;             // striker centre
    const GY = 128;                       // goal mouth y (for ball flight)

    const headImg = new Image();
    let headOk = false;
    headImg.onload = () => { headOk = true; };
    headImg.src = 'img/zhunny.png';
    const ballImg = new Image();
    let ballOk = false;
    ballImg.onload = () => { ballOk = true; };
    ballImg.src = 'logo.jpeg';

    let playing = false, state = 'idle';  // idle | slide | fly
    let goals = 0, best = +(localStorage.getItem('lemonVolleyBest') || 0), lastScore = 0;
    let combo = 1;
    let bx = 40, dirn = 1, speed = 2.4;
    let zoneX = 200, zoneW = 64;
    let facing = 1;                       // 1 = ball from right (right kick), -1 = left
    let fly = 0, flyPerfect = false, flyTX = 180;
    let msg = '', msgT = 0, msgCol = '#F5D000';
    let bob = 0;
    if (best > 0) bestEl.textContent = 'BEST ' + best;

    function newRound() {
      state = 'slide'; fly = 0;
      const fromLeft = Math.random() < 0.5;
      bx = fromLeft ? 40 : 320;
      dirn = fromLeft ? 1 : -1;
      facing = fromLeft ? -1 : 1;         // ball from left -> left leg, face left
      speed = 2.4 + goals * 0.18;
      zoneW = Math.max(30, 64 - goals * 1.6);
      zoneX = 90 + Math.random() * 180;
    }

    function startRun() {
      playing = true; goals = 0; combo = 1;
      goalsEl.textContent = '0';
      overlay.style.display = 'none';
      submitWrap.style.display = 'none';
      submitMsg.textContent = '';
      newRound();
    }

    function endRun() {
      playing = false; state = 'idle';
      lastScore = goals;
      if (goals > best) { best = goals; localStorage.setItem('lemonVolleyBest', best); }
      bestEl.textContent = best > 0 ? 'BEST ' + best : '';
      titleEl.textContent = 'SKIED IT! 😂';
      subEl.textContent = 'Row Z again \u2014 classic Kapitan. Goals: ' + goals;
      startBtn.textContent = '\u25b6 Go again';
      overlay.style.display = 'flex';
      if (goals > 0 && window.LemonDB && window.LemonDB.ready()) {
        submitWrap.style.display = 'flex';
        submitBtn.disabled = false;
      }
    }

    // ---------- drawing ----------
    function roundRect(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function lemon(x, y, r) {
      if (ballOk) {
        ctx.save();
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
        ctx.drawImage(ballImg, x - r, y - r, r * 2, r * 2);
        ctx.restore();
        ctx.strokeStyle = '#b49600'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
      } else {
        ctx.fillStyle = '#F5D000'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        ctx.strokeStyle = '#b49600'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
      }
    }
    function drawStriker(swingT) {
      const f = facing;
      const cy = SY + Math.sin(bob) * 2;
      const SKIN = '#f2c89a', RED = '#c8102e', WHT = '#f0f0f0', SOCK = '#c8102e', BOOT = '#141414';
      // leg keyframes only — clean body, the kick does the talking
      const KF = {
        idle:   { kk: [ 6, 40], kf: [  9, 56] },
        wind:   { kk: [-2, 38], kf: [-16, 48] },
        strike: { kk: [18, 26], kf: [ 36, 20] }
      };
      function lerpKF(a, b, k) {
        return { kk: [a.kk[0]+(b.kk[0]-a.kk[0])*k, a.kk[1]+(b.kk[1]-a.kk[1])*k],
                 kf: [a.kf[0]+(b.kf[0]-a.kf[0])*k, a.kf[1]+(b.kf[1]-a.kf[1])*k] };
      }
      let P;
      if (swingT == null) P = KF.idle;
      else if (swingT < 0.3) P = lerpKF(KF.idle, KF.wind, swingT / 0.3);
      else { const k = Math.min(1, (swingT - 0.3) / 0.5); P = lerpKF(KF.wind, KF.strike, 1 - (1 - k) * (1 - k)); }
      ctx.lineCap = 'round';
      function seg(x1, y1, x2, y2, w, col) {
        ctx.strokeStyle = col; ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      function bootAt(x, y, dir) {
        ctx.fillStyle = BOOT;
        ctx.beginPath();
        ctx.moveTo(x - dir * 4, y - 5); ctx.lineTo(x + dir * 12, y - 2);
        ctx.lineTo(x + dir * 14, y + 4); ctx.lineTo(x - dir * 6, y + 5);
        ctx.closePath(); ctx.fill();
      }
      const hip = [SX, cy + 24];
      // plant leg (knee bend + sock)
      const pk = [SX - f * 7, cy + 40], pf = [SX - f * 10, cy + 56];
      seg(hip[0] - f * 4, hip[1], pk[0], pk[1], 8, SKIN);
      seg(pk[0], pk[1], pf[0], pf[1], 7, SKIN);
      seg(pk[0] + (pf[0] - pk[0]) * 0.5, pk[1] + (pf[1] - pk[1]) * 0.5, pf[0], pf[1], 8, SOCK);
      bootAt(pf[0], pf[1], -f);
      // kicking leg
      const kk = [SX + f * P.kk[0], cy + P.kk[1]], kf2 = [SX + f * P.kf[0], cy + P.kf[1]];
      seg(hip[0] + f * 4, hip[1], kk[0], kk[1], 8, SKIN);
      seg(kk[0], kk[1], kf2[0], kf2[1], 7, SKIN);
      seg(kk[0] + (kf2[0] - kk[0]) * 0.5, kk[1] + (kf2[1] - kk[1]) * 0.5, kf2[0], kf2[1], 8, SOCK);
      bootAt(kf2[0], kf2[1], f);
      // slim shorts
      ctx.fillStyle = WHT; roundRect(SX - 11, cy + 16, 22, 12, 5); ctx.fill();
      // clean shirt + trim, no sleeves, no arms
      ctx.fillStyle = RED; roundRect(SX - 12, cy - 8, 24, 27, 7); ctx.fill();
      ctx.fillStyle = WHT; ctx.fillRect(SX - 12, cy + 13, 24, 3);
      // sponsor 上善如水 on the chest (2x2, same as Joker's kit)
      ctx.fillStyle = '#fff';
      ctx.font = '700 7px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\u4e0a', SX - 5, cy + 3); ctx.fillText('\u5584', SX + 5, cy + 3);
      ctx.fillText('\u5982', SX - 5, cy + 10); ctx.fillText('\u6c34', SX + 5, cy + 10);
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
      // head (natural aspect, flipped to face the ball side)
      if (headOk) {
        const hw2 = 36, hh2 = hw2 * headImg.naturalHeight / headImg.naturalWidth;
        ctx.save();
        if (f === -1) { ctx.translate(SX, 0); ctx.scale(-1, 1); ctx.translate(-SX, 0); }
        ctx.drawImage(headImg, SX - hw2 / 2, cy - 8 - hh2 + 8, hw2, hh2);
        ctx.restore();
      } else {
        ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(SX, cy - 28, 16, 0, 7); ctx.fill();
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // goal
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(85, 92, 190, 6); ctx.fillRect(85, 92, 5, 68); ctx.fillRect(270, 92, 5, 68);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      for (let i = 1; i < 9; i++) { ctx.beginPath(); ctx.moveTo(85 + i * 21, 98); ctx.lineTo(85 + i * 21, 158); ctx.stroke(); }
      // slide bar + zone
      ctx.fillStyle = '#1e1e1e'; roundRect(30, ZY - 18, 300, 36, 10); ctx.fill();
      ctx.fillStyle = '#12401c'; roundRect(zoneX - zoneW / 2, ZY - 18, zoneW, 36, 10); ctx.fill();
      ctx.strokeStyle = '#1DE54A'; ctx.lineWidth = 2; roundRect(zoneX - zoneW / 2, ZY - 18, zoneW, 36, 10); ctx.stroke();
      ctx.fillStyle = 'rgba(29,229,74,0.45)'; roundRect(zoneX - 9, ZY - 18, 18, 36, 6); ctx.fill();
      // ball + striker
      if (state === 'slide') { lemon(bx, ZY, 12); drawStriker(null); }
      else if (state === 'fly') {
        const t = fly;
        const x = bx + (flyTX - bx) * t;
        const y = ZY + (GY - ZY) * t - 90 * Math.sin(Math.PI * t);
        lemon(x, y, 12 - 4 * t);
        drawStriker(Math.min(1, t * 1.6));  // whip through with follow-through
      } else { drawStriker(null); }
      // combo flair
      if (playing && combo > 1) {
        ctx.fillStyle = '#1DE54A'; ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText('COMBO \u00d7' + combo + ' \ud83d\udd25', 14, 30);
      }
      if (msgT > 0) {
        ctx.fillStyle = msgCol; ctx.font = 'bold 26px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(msg, 180, 236); ctx.textAlign = 'start'; msgT--;
      }
    }

    // ---------- loop ----------
    function loop() {
      requestAnimationFrame(loop);
      if (!cv.offsetParent) return;       // tab hidden — pause cheaply
      bob += 0.08;
      if (state === 'slide' && playing) {
        bx += dirn * speed;
        if (bx < 28 || bx > 332) { msg = ''; endRun(); }
      } else if (state === 'fly') {
        fly += 0.05;
        if (fly >= 1) {
          goals++;
          goalsEl.textContent = goals;
          combo = flyPerfect ? Math.min(5, combo + 1) : 1;
          newRound();
        }
      }
      draw();
    }

    function tap(e) {
      if (!playing || state !== 'slide') return;
      const inZone = Math.abs(bx - zoneX) <= zoneW / 2;
      if (inZone) {
        flyPerfect = Math.abs(bx - zoneX) <= 9;
        msg = flyPerfect ? 'PERFECT!' : 'GOAL!';
        msgCol = flyPerfect ? '#1DE54A' : '#F5D000';
        msgT = 30;
        flyTX = 130 + Math.random() * 100;
        state = 'fly'; fly = 0;
      } else {
        endRun();
      }
    }
    cv.addEventListener('pointerdown', tap);
    startBtn.addEventListener('click', startRun);

    // ---------- leaderboard (mirrors shootout) ----------
    function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
    function renderLB(arr) {
      const bestByName = {};
      arr.forEach(s => {
        if (!s || !s.name || typeof s.score !== 'number') return;
        const k = s.name.trim().toLowerCase();
        if (!bestByName[k] || s.score > bestByName[k].score) bestByName[k] = { name: s.name.trim(), score: s.score };
      });
      const rows = Object.values(bestByName).sort((a, b) => b.score - a.score).slice(0, 15);
      if (!rows.length) { lbEl.innerHTML = '<p class="game-lb-loading">No scores yet \u2014 be the first! 🍋</p>'; return; }
      lbEl.innerHTML = rows.map((s, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
        return `<div class="game-lb-row"><span class="game-lb-rank">${medal}</span>` +
          `<span class="game-lb-name">${escapeHtml(s.name)}</span>` +
          `<span class="game-lb-score">${s.score}</span></div>`;
      }).join('');
    }
    if (window.LemonDB && window.LemonDB.ready()) {
      const savedName = localStorage.getItem('lemonPlayerName') || '';
      if (savedName) nameInput.value = savedName;
      window.LemonDB.subscribe('arcade/volley', (arr, err) => {
        if (err || !arr) { lbEl.innerHTML = '<p class="game-lb-loading">Leaderboard unavailable \u2014 check Firebase rules.</p>'; return; }
        renderLB(arr);
      });
      submitBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) { submitMsg.textContent = 'Enter a name first'; return; }
        submitBtn.disabled = true; submitMsg.textContent = 'Saving\u2026';
        localStorage.setItem('lemonPlayerName', name);
        window.LemonDB.submit('arcade/volley', { name, score: lastScore, ts: Date.now() })
          .then(() => { submitMsg.textContent = 'Submitted! 🍋'; submitWrap.style.display = 'none'; })
          .catch(() => { submitBtn.disabled = false; submitMsg.textContent = 'Failed \u2014 check connection'; });
      });
    } else {
      lbEl.innerHTML = '<p class="game-lb-loading">Leaderboard loading\u2026 (or offline)</p>';
    }

    draw();
    loop();
  }

  window.ARCADE.register({
    id: 'volley', label: 'Kapitan\u2019s Volley', live: true,
    build,
    show() {},
    hide() { /* loop self-pauses via offsetParent; nothing required */ }
  });
})();
