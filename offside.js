// ============================================================
// 抓鸡王 · OFFSIDE KING — Arcade game (featuring Jacko)
// The defensive line slides up/down. Tap while ONSIDE ✓ to release
// the through-ball; Jacko breaks, collects in the channel, taps in:
// 抓到鸡! +1 🐔. Tap while OFFSIDE ✗ → flag up, run over. Dawdle and
// the presser dispossesses your passer (犹豫就会败北).
// Score = chickens per run. Shared leaderboard on arcade/offside.
// Head: img/jacko.png (falls back to a drawn head until uploaded).
// Ball: Lemon Tyres logo (logo.jpeg). Sponsor 上善如水 on red shirts.
// ============================================================
window.ARCADE = window.ARCADE || { games: [], register(g){ this.games.push(g); } };

(function () {

  function build(container) {
    container.innerHTML = `
      <h2 class="section-title">Offside King \u6293\u9e21\u738b \ud83d\udc14</h2>
      <p class="game-tagline">Our resident \u6293\u9e21\u738b lives on the last defender\u2019s shoulder. Tap while it shows <b style="color:#1DE54A">ONSIDE \u2713</b> to spring the trap and tap home another cheeky chicken \ud83d\udc14. Flag goes up? Classic Jacko. Dawdle on the ball and the presser takes it off you \u2014 \u72b9\u8c6b\u5c31\u4f1a\u8d25\u5317.</p>
      <div class="game-wrap">
        <div class="game-hud">
          <span class="game-score-label">CHICKENS</span>
          <span class="game-score" id="ok-score">0</span>
          <span class="game-best" id="ok-best"></span>
        </div>
        <canvas id="ok-canvas" width="360" height="480" style="display:block;width:100%;height:auto;border-radius:12px;background:#0d1f0d;touch-action:manipulation;"></canvas>
        <div class="game-overlay" id="ok-overlay">
          <div class="game-overlay-inner">
            <div class="game-overlay-title" id="ok-title">Offside King \u6293\u9e21\u738b</div>
            <div class="game-overlay-sub" id="ok-sub">Tap while ONSIDE \u2713 to spring the trap \u2014 don\u2019t get flagged, don\u2019t get pressed</div>
            <button class="game-btn" id="ok-start">\u25b6 Make the run</button>
          </div>
        </div>
      </div>
      <h3 class="game-lb-title">\ud83c\udfc6 Chicken Kings</h3>
      <div class="game-submit" id="ok-submit" style="display:none">
        <input class="game-name-input" id="ok-name" maxlength="14" placeholder="Your name" />
        <button class="game-btn" id="ok-submit-btn">Submit chickens</button>
        <span class="game-submit-msg" id="ok-submit-msg"></span>
      </div>
      <div class="game-leaderboard" id="ok-leaderboard">
        <p class="game-lb-loading">Loading leaderboard\u2026</p>
      </div>`;
    setupGame(container);
  }

  function setupGame(container) {
    const cv = container.querySelector('#ok-canvas');
    const ctx = cv.getContext('2d');
    const scoreEl = container.querySelector('#ok-score');
    const bestEl = container.querySelector('#ok-best');
    const overlay = container.querySelector('#ok-overlay');
    const titleEl = container.querySelector('#ok-title');
    const subEl = container.querySelector('#ok-sub');
    const startBtn = container.querySelector('#ok-start');
    const lbEl = container.querySelector('#ok-leaderboard');
    const submitWrap = container.querySelector('#ok-submit');
    const nameInput = container.querySelector('#ok-name');
    const submitBtn = container.querySelector('#ok-submit-btn');
    const submitMsg = container.querySelector('#ok-submit-msg');

    const JX = 140, JY = 295, PX = 205, PY = 420;

    const headImg = new Image(); let headOk = false;
    headImg.onload = () => { headOk = true; };
    headImg.src = 'img/jacko.png';
    const ballImg = new Image(); let ballOk = false;
    ballImg.onload = () => { ballOk = true; };
    ballImg.src = 'logo.jpeg';
    const keeperImg = new Image(); let keeperOk = false;
    keeperImg.onload = () => { keeperOk = true; };
    keeperImg.src = 'img/edt.jpg';   // same Teck photo as Shoot-out

    let playing = false, over = false, overKind = 'flag';
    let chickens = 0, best = +(localStorage.getItem('lemonOffsideBest') || 0), lastScore = 0;
    let lineY = 220, target = 200, speed = 0.9;
    let state = 'wait', anim = 0, lineTap = 220;
    let msg = '', msgT = 0, bob = 0, legT = 0;
    let pressX = 352, pressSpd = 0.55;
    if (best > 0) bestEl.textContent = 'BEST ' + best;

    function newTarget() {
      const lo = 170, hi = Math.min(388, 330 + chickens * 6);
      target = lo + Math.random() * (hi - lo);
      speed = 0.9 + chickens * 0.28 + Math.random() * 0.4;
    }
    function newRound() { state = 'wait'; anim = 0; pressX = 352; pressSpd = 0.55 + chickens * 0.02; newTarget(); }
    function startRun() {
      playing = true; over = false; chickens = 0;
      scoreEl.textContent = '0';
      overlay.style.display = 'none';
      submitWrap.style.display = 'none';
      submitMsg.textContent = '';
      newRound();
    }
    function endRun(kind) {
      playing = false; over = true; overKind = kind;
      lastScore = chickens;
      if (chickens > best) { best = chickens; localStorage.setItem('lemonOffsideBest', best); }
      bestEl.textContent = best > 0 ? 'BEST ' + best : '';
      if (kind === 'flag') {
        titleEl.textContent = 'OFFSIDE! \ud83d\udea9';
        subEl.textContent = '\u6293\u9e21\u738b does it again \ud83d\ude02 Chickens: ' + chickens;
      } else {
        titleEl.textContent = 'DISPOSSESSED! \ud83d\ude05';
        subEl.textContent = '\u72b9\u8c6b\u5c31\u4f1a\u8d25\u5317 \u2014 pressed off it. Chickens: ' + chickens;
      }
      startBtn.textContent = '\u25b6 Go again';
      overlay.style.display = 'flex';
      if (chickens > 0 && window.LemonDB && window.LemonDB.ready()) {
        submitWrap.style.display = 'flex';
        submitBtn.disabled = false;
      }
    }

    // ---------- drawing ----------
    function rr(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function ball(x, y, r) {
      if (ballOk) {
        ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
        ctx.drawImage(ballImg, x - r, y - r, r * 2, r * 2); ctx.restore();
        ctx.strokeStyle = '#b49600'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
      } else {
        ctx.fillStyle = '#F5D000'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        ctx.strokeStyle = '#b49600'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
      }
    }
    function sponsor(x, y) {
      ctx.fillStyle = '#fff';
      ctx.font = '700 6px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\u4e0a', x - 4, y); ctx.fillText('\u5584', x + 4, y);
      ctx.fillText('\u5982', x - 4, y + 7); ctx.fillText('\u6c34', x + 4, y + 7);
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }
    function drawDefender(x, y, kit) {
      const sh = Math.sin(legT + x) * 2;
      ctx.lineCap = 'round'; ctx.strokeStyle = '#f2c89a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x - 4, y + 12); ctx.lineTo(x - 6 + sh, y + 26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 4, y + 12); ctx.lineTo(x + 6 - sh, y + 26); ctx.stroke();
      ctx.fillStyle = '#141414';
      ctx.beginPath(); ctx.arc(x - 6 + sh, y + 28, 4, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 6 - sh, y + 28, 4, 0, 7); ctx.fill();
      ctx.fillStyle = kit || '#4a6edc'; rr(x - 9, y - 6, 18, 20, 5); ctx.fill();
      ctx.fillStyle = '#f2c89a'; ctx.beginPath(); ctx.arc(x, y - 13, 7, 0, 7); ctx.fill();
    }
    function drawRed(x, y, mode, isJacko) {
      ctx.lineCap = 'round'; ctx.strokeStyle = '#f2c89a'; ctx.lineWidth = 6;
      if (mode === 'run') {
        ctx.beginPath(); ctx.moveTo(x - 3, y + 12); ctx.lineTo(x - 13, y + 23); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 3, y + 12); ctx.lineTo(x + 14, y + 18); ctx.stroke();
        ctx.fillStyle = '#141414';
        ctx.beginPath(); ctx.arc(x + 16, y + 18, 4.5, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(x - 15, y + 24, 4.5, 0, 7); ctx.fill();
      } else if (mode === 'kick') {
        ctx.beginPath(); ctx.moveTo(x - 3, y + 12); ctx.lineTo(x - 6, y + 27); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 3, y + 12); ctx.lineTo(x + 16, y + 6); ctx.stroke();
        ctx.fillStyle = '#141414';
        ctx.beginPath(); ctx.arc(x + 18, y + 5, 4.5, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(x - 6, y + 29, 4.5, 0, 7); ctx.fill();
      } else {
        const sh = Math.sin(legT * 1.4 + x) * 2;
        ctx.beginPath(); ctx.moveTo(x - 3, y + 12); ctx.lineTo(x - 5 + sh, y + 27); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 3, y + 12); ctx.lineTo(x + 5 - sh, y + 27); ctx.stroke();
        ctx.fillStyle = '#141414';
        ctx.beginPath(); ctx.arc(x - 5 + sh, y + 29, 4.5, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 5 - sh, y + 29, 4.5, 0, 7); ctx.fill();
      }
      if (isJacko) {
        // Adrian Mutu cosplay: royal blue No.7 kit
        ctx.fillStyle = '#1747c9'; rr(x - 10, y - 7, 20, 21, 6); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '700 4.5px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('MUTU', x, y - 2);
        ctx.font = '700 9px Inter, sans-serif';
        ctx.fillText('7', x, y + 6);
        ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#fff'; ctx.fillRect(x - 10, y + 11, 20, 2);
      } else {
        ctx.fillStyle = '#c8102e'; rr(x - 10, y - 7, 20, 21, 6); ctx.fill();
        sponsor(x, y + 1);
        ctx.fillStyle = '#fff'; ctx.fillRect(x - 10, y + 10, 20, 2.5);
      }
      if (isJacko && headOk) {
        const hw = 24, hh = hw * headImg.naturalHeight / headImg.naturalWidth;
        ctx.drawImage(headImg, x - hw / 2, y - 8 - hh + 4, hw, hh);
      } else {
        ctx.fillStyle = '#f2c89a'; ctx.beginPath(); ctx.ellipse(x, y - 19, 11, 12, 0, 0, 7); ctx.fill();
        if (isJacko) {
          ctx.fillStyle = '#8a6a48'; ctx.font = 'bold 12px Inter, sans-serif';
          ctx.textAlign = 'center'; ctx.fillText('?', x, y - 15); ctx.textAlign = 'start';
        }
      }
    }
    function drawLinesman(x, y, up) {
      ctx.fillStyle = '#222'; rr(x - 7, y - 4, 14, 20, 4); ctx.fill();
      ctx.fillStyle = '#f2c89a'; ctx.beginPath(); ctx.arc(x, y - 11, 6, 0, 7); ctx.fill();
      ctx.strokeStyle = '#f2c89a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      if (up) {
        ctx.beginPath(); ctx.moveTo(x + 6, y); ctx.lineTo(x + 15, y - 20); ctx.stroke();
        ctx.fillStyle = '#ff7800'; ctx.beginPath();
        ctx.moveTo(x + 15, y - 32); ctx.lineTo(x + 28, y - 26); ctx.lineTo(x + 15, y - 20);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + 15, y - 32); ctx.lineTo(x + 15, y - 20); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(x + 6, y + 2); ctx.lineTo(x + 12, y + 12); ctx.stroke();
        ctx.fillStyle = '#ff7800'; ctx.beginPath();
        ctx.moveTo(x + 12, y + 12); ctx.lineTo(x + 23, y + 15); ctx.lineTo(x + 12, y + 20);
        ctx.closePath(); ctx.fill();
      }
    }
    function draw() {
      ctx.clearRect(0, 0, 360, 480);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      for (let y = 0; y < 480; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(360, y); ctx.stroke(); }
      // goal + keeper (dives when beaten)
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(110, 86, 140, 5); ctx.fillRect(110, 86, 4, 44); ctx.fillRect(246, 86, 4, 44);
      let kx = 180, krot = 0;
      if (state === 'run' && anim > 0.72) { const k = Math.min(1, (anim - 0.72) / 0.28); kx = 180 - 38 * k; krot = -0.6 * k; }
      ctx.save(); ctx.translate(kx, 108); ctx.rotate(krot);
      ctx.fillStyle = '#f2a030'; rr(-9, -10, 18, 20, 5); ctx.fill();
      if (keeperOk) {
        ctx.save(); ctx.beginPath(); ctx.arc(0, -17, 9, 0, 7); ctx.clip();
        ctx.drawImage(keeperImg, -9, -26, 18, 18); ctx.restore();
        ctx.strokeStyle = '#f2a030'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, -17, 9, 0, 7); ctx.stroke();
      } else {
        ctx.fillStyle = '#f2c89a'; ctx.beginPath(); ctx.arc(0, -16, 7, 0, 7); ctx.fill();
      }
      ctx.restore();
      const onside = lineY < JY;
      ctx.strokeStyle = onside ? 'rgba(29,229,74,0.85)' : 'rgba(255,45,45,0.9)';
      ctx.setLineDash([9, 7]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(8, lineY); ctx.lineTo(352, lineY); ctx.stroke(); ctx.setLineDash([]);
      drawDefender(70, lineY - 2); drawDefender(180, lineY - 2); drawDefender(285, lineY - 2);
      if (state === 'wait' || !playing) {
        drawRed(PX, PY, 'idle', false);
        ball(PX + 13 + Math.sin(bob * 3) * 3, PY + 26, 7);
        drawRed(JX, JY, 'idle', true);
        if (playing && !over) {
          drawDefender(pressX, PY - 2, '#1c1c1c');
          if (pressX - PX < 70) {
            ctx.strokeStyle = 'rgba(255,45,45,0.5)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(PX, PY, 34 + Math.sin(bob * 6) * 3, 0, 7); ctx.stroke();
          }
        }
      }
      if (state === 'run') {
        const t = anim;
        const MX = 225, MY = lineTap - 52;
        drawRed(PX, PY, t < 0.25 ? 'kick' : 'idle', false);
        if (t < 0.55) {
          const k = t / 0.55;
          ball(PX + 13 + (MX - PX - 13) * k, PY + 26 + (MY - PY - 26) * k, 7);
          drawRed(JX + (MX - 18 - JX) * k, JY + (MY - JY) * k, 'run', true);
        } else {
          const k = (t - 0.55) / 0.45;
          const gx = 168, gy = 112;
          const cx2 = MX + (gx - MX) * k, cy2 = MY + (gy - MY) * k;
          drawRed(cx2 - 16, cy2 + 6, 'run', true);
          ball(cx2, cy2, 7 - 2 * k);
        }
        drawDefender(pressX, PY - 2, '#1c1c1c');
      }
      drawLinesman(330, 300, over && overKind === 'flag');
      const pw = 104;
      ctx.fillStyle = onside ? '#0e2a14' : '#2a0e0e'; rr(180 - pw / 2, 8, pw, 24, 12); ctx.fill();
      ctx.strokeStyle = onside ? '#1DE54A' : '#FF2D2D'; ctx.lineWidth = 1.5; rr(180 - pw / 2, 8, pw, 24, 12); ctx.stroke();
      ctx.fillStyle = onside ? '#1DE54A' : '#FF2D2D'; ctx.font = 'bold 13px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(onside ? 'ONSIDE \u2713' : 'OFFSIDE \u2717', 180, 25); ctx.textAlign = 'start';
      if (msgT > 0) {
        ctx.fillStyle = '#F5D000'; ctx.font = 'bold 24px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(msg, 180, 205); ctx.textAlign = 'start'; msgT--;
      }
    }

    // ---------- loop ----------
    function loop() {
      requestAnimationFrame(loop);
      if (!cv.offsetParent) return;
      bob += 0.06; legT += 0.12;
      if (playing && !over) {
        if (state === 'wait') {
          const d = target - lineY;
          lineY += Math.sign(d) * Math.min(Math.abs(d), speed);
          if (Math.abs(d) < 1) newTarget();
          pressX -= pressSpd;
          if (pressX <= PX + 24) endRun('press');
        } else if (state === 'run') {
          anim += 0.02;
          if (anim >= 1) {
            chickens++;
            scoreEl.textContent = chickens;
            msg = '\u6293\u5230\u9e21! +1 \ud83d\udc14'; msgT = 42;
            newRound();
          }
        }
      }
      draw();
    }
    function tap() {
      if (!playing || over || state !== 'wait') return;
      if (lineY < JY) { lineTap = lineY; state = 'run'; anim = 0; }
      else endRun('flag');
    }
    cv.addEventListener('pointerdown', tap);
    startBtn.addEventListener('click', startRun);

    // ---------- leaderboard (mirrors volley) ----------
    function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
    function renderLB(arr) {
      const bestByName = {};
      arr.forEach(s => {
        if (!s || !s.name || typeof s.score !== 'number') return;
        const k = s.name.trim().toLowerCase();
        if (!bestByName[k] || s.score > bestByName[k].score) bestByName[k] = { name: s.name.trim(), score: s.score };
      });
      const rows = Object.values(bestByName).sort((a, b) => b.score - a.score).slice(0, 15);
      if (!rows.length) { lbEl.innerHTML = '<p class="game-lb-loading">No chickens caught yet \u2014 be the first! \ud83d\udc14</p>'; return; }
      lbEl.innerHTML = rows.map((s, i) => {
        const medal = i === 0 ? '\ud83e\udd47' : i === 1 ? '\ud83e\udd48' : i === 2 ? '\ud83e\udd49' : (i + 1);
        return `<div class="game-lb-row"><span class="game-lb-rank">${medal}</span>` +
          `<span class="game-lb-name">${escapeHtml(s.name)}</span>` +
          `<span class="game-lb-score">${s.score} \ud83d\udc14</span></div>`;
      }).join('');
    }
    if (window.LemonDB && window.LemonDB.ready()) {
      const savedName = localStorage.getItem('lemonPlayerName') || '';
      if (savedName) nameInput.value = savedName;
      window.LemonDB.subscribe('arcade/offside', (arr, err) => {
        if (err || !arr) { lbEl.innerHTML = '<p class="game-lb-loading">Leaderboard unavailable \u2014 check Firebase rules.</p>'; return; }
        renderLB(arr);
      });
      submitBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) { submitMsg.textContent = 'Enter a name first'; return; }
        submitBtn.disabled = true; submitMsg.textContent = 'Saving\u2026';
        localStorage.setItem('lemonPlayerName', name);
        window.LemonDB.submit('arcade/offside', { name, score: lastScore, ts: Date.now() })
          .then(() => { submitMsg.textContent = 'Submitted! \ud83d\udc14'; submitWrap.style.display = 'none'; })
          .catch(() => { submitBtn.disabled = false; submitMsg.textContent = 'Failed \u2014 check connection'; });
      });
    } else {
      lbEl.innerHTML = '<p class="game-lb-loading">Leaderboard loading\u2026 (or offline)</p>';
    }

    draw();
    loop();
  }

  window.ARCADE.register({
    id: 'offside', label: 'Offside King \u6293\u9e21\u738b', live: true, isNew: true,
    build,
    show() {},
    hide() { /* loop self-pauses via offsetParent */ }
  });
})();
