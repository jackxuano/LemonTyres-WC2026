// ============================================================
// CHAMPIONS BANNER — the "hall of fame" that appears at the top of
// Standings ONCE THE FINAL IS DECIDED. Before that it renders nothing,
// so this file is safe to ship early: it switches itself on.
//
// Shows:  🥇🥈🥉 our top three  ·  ⚽ Golden Boot (best hero)
//         🛡️ Golden Team (most team pts of the 17)  ·  world champions
//
// Reuses app.js's own numbers (teamPoints, calcHeroPoints, p.heroGoals)
// so it can never disagree with the standings table below it.
// ============================================================
(function () {

  function decided(score) {
    if (!score) return null;
    if (score.ft && score.ft[0] !== score.ft[1]) return score.ft[0] > score.ft[1] ? 0 : 1;
    if (score.et && score.et[0] !== score.et[1]) return score.et[0] > score.et[1] ? 0 : 1;
    if (score.p && score.p[0] !== score.p[1]) return score.p[0] > score.p[1] ? 0 : 1;
    return null;
  }

  const THIRD = ['Match for third place', 'Third-place play-off', 'Third place play-off'];

  function worldResult(matches) {
    const f = matches.find(m => m.round === 'Final');
    if (!f) return null;
    const w = decided(f.score);
    if (w === null) return null;                       // final not played -> banner stays hidden
    const t3 = matches.find(m => THIRD.includes(m.round));
    const w3 = t3 ? decided(t3.score) : null;
    return {
      champ: w === 0 ? f.team1 : f.team2,
      runner: w === 0 ? f.team2 : f.team1,
      third: (t3 && w3 !== null) ? (w3 === 0 ? t3.team1 : t3.team2) : null
    };
  }

  function flagFor(team) {
    // reuse app.js's FLAGS map if present
    if (typeof FLAGS !== 'undefined' && FLAGS[team]) return FLAGS[team];
    const p = (typeof PLAYERS !== 'undefined') ? PLAYERS.find(x => x.team === team) : null;
    return p ? p.flag : '\u26bd';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function num(v) { return (typeof fmt === 'function') ? fmt(v) : v; }

  function render() {
    if (typeof PLAYERS === 'undefined') return;
    if (typeof allMatches === 'undefined' || !allMatches.length) return;
    const host = document.getElementById('standings-table');
    if (!host || !host.parentNode) return;

    const wr = worldResult(allMatches);
    const old = document.getElementById('champs-banner');
    if (!wr) { if (old) old.remove(); return; }        // WC not finished yet — nothing to show

    // --- our 17, scored exactly as the table does ---
    const rows = PLAYERS.map(p => {
      const tp = (typeof teamPoints !== 'undefined' && teamPoints[p.teamCode]) ? teamPoints[p.teamCode].pts : 0;
      const hp = (typeof calcHeroPoints === 'function') ? calcHeroPoints(p) : 0;
      return { p, teamPts: tp, heroPts: hp, total: tp + hp };
    }).sort((a, b) => b.total - a.total || b.heroPts - a.heroPts);

    const podium = rows.slice(0, 3);

    // --- Golden Boot: most goals among our picked heroes (ties = co-winners) ---
    const goalsByHero = {};
    PLAYERS.forEach(p => { goalsByHero[p.hero] = Math.max(goalsByHero[p.hero] || 0, p.heroGoals || 0); });
    const maxGoals = Object.values(goalsByHero).reduce((a, b) => Math.max(a, b), 0);
    const bootHeroes = Object.keys(goalsByHero).filter(h => goalsByHero[h] === maxGoals && maxGoals > 0);
    const boot = bootHeroes.length ? {
      goals: maxGoals,
      heroes: bootHeroes,
      // every owner of every tied hero
      owners: [...new Set(PLAYERS.filter(p => bootHeroes.includes(p.hero)).map(p => p.name))]
    } : null;

    // --- Golden Team: most team points among the 17 owned nations ---
    let gteam = null;
    const seen = {};
    PLAYERS.forEach(p => {
      if (seen[p.teamCode]) return;
      seen[p.teamCode] = true;
      const pts = (typeof teamPoints !== 'undefined' && teamPoints[p.teamCode]) ? teamPoints[p.teamCode].pts : 0;
      if (!gteam || pts > gteam.pts) {
        gteam = { team: p.team, teamCode: p.teamCode, flag: p.flag, cls: p.cls, pts,
                  owners: PLAYERS.filter(x => x.teamCode === p.teamCode).map(x => x.name) };
      }
    });

    const medals = ['\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49'];
    const podiumHtml = podium.map((r, i) => `
      <div class="champ-row champ-${i + 1}">
        <span class="champ-medal">${medals[i]}</span>
        <span class="champ-name">${esc(r.p.name)}</span>
        <span class="champ-sub">${r.p.flag} ${esc(r.p.team)} \u00b7 \u26bd ${esc(r.p.hero)}</span>
        <span class="champ-pts">${num(r.total)}</span>
      </div>`).join('');

    const html = `
      <div class="champs" id="champs-banner">
        <div class="champs-head">
          <div class="champs-title">\ud83c\udfc6 WC2026 \u2014 FINAL STANDINGS</div>
          <div class="champs-world">
            World Champions: <b>${flagFor(wr.champ)} ${esc(wr.champ)}</b>
            <span class="champs-dim">\u00b7 runners-up ${esc(wr.runner)}${wr.third ? ' \u00b7 3rd ' + esc(wr.third) : ''}</span>
          </div>
        </div>
        <div class="champs-podium">${podiumHtml}</div>
        <div class="champs-awards">
          <div class="champs-award">
            <div class="ca-label">\u26bd GOLDEN BOOT</div>
            <div class="ca-main">${boot ? boot.heroes.map(esc).join(' &amp; ') : '\u2014'}</div>
            <div class="ca-sub">${boot ? boot.goals + ' goal' + (boot.goals === 1 ? '' : 's') + ' \u00b7 ' + esc(boot.owners.join('/')) : ''}</div>
          </div>
          <div class="champs-award">
            <div class="ca-label">\ud83d\udee1\ufe0f GOLDEN TEAM</div>
            <div class="ca-main">${gteam ? gteam.flag + ' ' + esc(gteam.team) : '\u2014'}</div>
            <div class="ca-sub">${gteam ? num(gteam.pts) + ' team pts \u00b7 Class ' + gteam.cls + ' \u00b7 ' + esc(gteam.owners.join('/')) : ''}</div>
          </div>
        </div>
      </div>`;

    if (old) old.outerHTML = html;
    else host.insertAdjacentHTML('beforebegin', html);

    // The "Next Up" banner has nothing left to say once the final is done —
    // turn it into the closing card instead of "no more games".
    const nmBody = document.getElementById('nm-body');
    const nmTime = document.getElementById('nm-time');
    const nmLabel = document.querySelector('.nm-label');
    if (nmBody && podium.length) {
      if (nmLabel) nmLabel.textContent = '\ud83c\udfc6 WC2026 CHAMPION';
      nmBody.innerHTML = `<span class="nm-match">${podium[0].p.flag} ${esc(podium[0].p.name)}</span>`;
      if (nmTime) nmTime.textContent = num(podium[0].total) + ' pts \u00b7 ' + esc(podium[0].p.team) + ' \u00b7 \u26bd ' + esc(podium[0].p.hero);
    }
  }

  // self-injected CSS (collision-proof, same pattern as bracket.js)
  function css() {
    if (document.getElementById('champs-css')) return;
    const s = document.createElement('style');
    s.id = 'champs-css';
    s.textContent = [
      '.champs{background:linear-gradient(180deg,#191500 0%,#121212 100%);border:1px solid #4a3f00;border-radius:14px;padding:14px 13px;margin-bottom:1.1rem;}',
      '.champs-head{text-align:center;margin-bottom:12px;}',
      '.champs-title{font-family:"Bebas Neue",sans-serif;letter-spacing:1px;color:#F5D000;font-size:1.35rem;line-height:1.1;}',
      '.champs-world{color:#eaeaea;font-size:0.8rem;margin-top:3px;}',
      '.champs-dim{color:#8f8f8f;}',
      '.champs-podium{display:flex;flex-direction:column;gap:5px;margin-bottom:11px;}',
      '.champ-row{display:flex;align-items:center;gap:9px;background:#161616;border:1px solid #262626;border-radius:9px;padding:7px 10px;}',
      '.champ-row.champ-1{border-color:#F5D000;background:#1d1a00;}',
      '.champ-medal{font-size:1.05rem;flex:0 0 auto;}',
      '.champ-name{font-weight:700;font-size:0.95rem;flex:0 0 auto;}',
      '.champ-sub{color:#8f8f8f;font-size:0.68rem;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.champ-pts{font-family:"Bebas Neue",sans-serif;font-size:1.5rem;color:#F5D000;flex:0 0 auto;}',
      '.champs-awards{display:flex;gap:7px;}',
      '.champs-award{flex:1;background:#161616;border:1px solid #262626;border-radius:9px;padding:8px 9px;text-align:center;min-width:0;}',
      '.ca-label{color:#8f8f8f;font-size:0.6rem;letter-spacing:0.6px;}',
      '.ca-main{color:#F5D000;font-weight:700;font-size:0.86rem;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.ca-sub{color:#8f8f8f;font-size:0.63rem;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // Wait for app.js to finish loading + scoring, then render. Retries briefly
  // because we don't control app.js's fetch timing.
  function boot() {
    css();
    let tries = 0;
    const iv = setInterval(() => {
      tries++;
      try { render(); } catch (e) { /* never break the page over a banner */ }
      if (tries > 40) clearInterval(iv);            // ~20s then stop
    }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.Champions = { render };
})();
