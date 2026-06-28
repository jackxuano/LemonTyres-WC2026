// ============================================================
// LEMON TYRES WC 2026 — KNOCKOUT BRACKET (live, feed-driven)
// Renders R32 → Final from the openfootball feed.
// - Lemon-owned teams highlighted (yellow + owner tag)
// - Lemon-vs-Lemon ties flagged as derbies
// - Eliminated teams: red strike-through + fade (default)
// - Lemon-on-Lemon KO: loser struck-through but NOT faded, plus a
//   "SQUEEZED 🍋" stamp pinned to the winner's corner (clear of names)
// Depends on: PLAYERS, teamsMatch?, convertToMYT (from data.js/app.js)
// ============================================================
(function () {
  const API_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

  // Reuse global teamsMatch if present; otherwise define a safe local one.
  const _teamsMatch = (typeof teamsMatch === 'function')
    ? teamsMatch
    : function (a, b) {
        const n = s => (s || '').toLowerCase().replace(/[^a-z]/g, '');
        const na = n(a), nb = n(b);
        if (!na || !nb) return false;
        if (na === nb) return true;
        if (na.length >= 4 && nb.includes(na)) return true;
        if (nb.length >= 4 && na.includes(nb)) return true;
        return false;
      };

  const ROUND_ORDER = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];
  const ROUND_SHORT = {
    'Round of 32': 'R32', 'Round of 16': 'R16',
    'Quarter-final': 'QF', 'Semi-final': 'SF', 'Final': 'FINAL'
  };

  function ownersFor(team) {
    if (typeof PLAYERS === 'undefined') return [];
    return PLAYERS.filter(p => _teamsMatch(p.teamCode, team)).map(p => p.name);
  }

  // Who advanced? 90' (ft) decides; if level, ET; if level, penalties.
  function winnerIndex(score) {
    if (!score) return null;
    if (score.ft && score.ft[0] !== score.ft[1]) return score.ft[0] > score.ft[1] ? 0 : 1;
    if (score.et && score.et[0] !== score.et[1]) return score.et[0] > score.et[1] ? 0 : 1;
    if (score.p && score.p[0] !== score.p[1]) return score.p[0] > score.p[1] ? 0 : 1;
    return null;
  }

  function scoreLine(m) {
    const s = m.score;
    if (!s || !s.ft) {
      const t = (typeof convertToMYT === 'function') ? convertToMYT(m.time, m.date) : (m.time || 'TBC');
      return { text: t, pending: true };
    }
    let txt = `${s.ft[0]}–${s.ft[1]}`;
    if (s.p) txt += ` <span class="bk-xtra">(pens ${s.p[0]}–${s.p[1]})</span>`;
    else if (s.et) txt += ` <span class="bk-xtra">AET</span>`;
    return { text: txt, pending: false };
  }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function sideHtml(team, isWinner, isLoser, isDerby, owners) {
    const lemon = owners.length > 0;
    const cls = ['bk-side'];
    if (lemon) cls.push('bk-lemon');
    if (isWinner) cls.push('bk-win');
    if (isLoser) cls.push(isDerby ? 'bk-elim-derby' : 'bk-elim'); // derby loser: strike, no fade
    const ownerTag = lemon ? `<span class="bk-owner">${esc(owners.join('/'))}</span>` : '';
    // SQUEEZED tag sits inline next to the LOSER's owner name (straight, in-frame)
    const stamp = (isLoser && isDerby) ? `<span class="bk-squeeze">SQUEEZED 🍋</span>` : '';
    return `<div class="${cls.join(' ')}">
      <span class="bk-team">${esc(team)}</span>${ownerTag}${stamp}
    </div>`;
  }

  function tieHtml(m) {
    const oA = ownersFor(m.team1), oB = ownersFor(m.team2);
    const derby = oA.length > 0 && oB.length > 0;
    const w = winnerIndex(m.score);
    const decided = w !== null;
    const sl = scoreLine(m);
    const sideA = sideHtml(m.team1, decided && w === 0, decided && w === 1, derby, oA);
    const sideB = sideHtml(m.team2, decided && w === 1, decided && w === 0, derby, oB);
    return `<div class="bk-tie${derby ? ' bk-derby' : ''}">
      ${sideA}
      ${sideB}
      <div class="bk-meta ${sl.pending ? 'bk-pending' : ''}">${sl.text}</div>
    </div>`;
  }

  function render(panel, matches) {
    const ko = matches.filter(m => !m.group && ROUND_ORDER.includes(m.round));
    const byRound = {};
    ko.forEach(m => { (byRound[m.round] = byRound[m.round] || []).push(m); });

    const cols = ROUND_ORDER.filter(r => byRound[r] && byRound[r].length)
      .map(r => {
        const ties = byRound[r].map(tieHtml).join('');
        return `<div class="bk-col">
          <div class="bk-round">${ROUND_SHORT[r] || r}</div>
          ${ties}
        </div>`;
      }).join('');

    panel.innerHTML = `
      <div class="bk-wrap">
        <div class="bk-head">
          <h2 class="bk-title">🍋 KNOCKOUT BRACKET</h2>
          <p class="bk-sub">Scroll sideways for later rounds · 🍋 = a Lemon team</p>
        </div>
        <div class="bk-scroll">${cols || '<p class="bk-empty">Knockouts haven\'t started yet.</p>'}</div>
      </div>`;
  }

  function injectCSS() {
    if (document.getElementById('bk-style')) return;
    const css = `
    #tab-bracket .bk-wrap{padding:4px 0 16px;}
    #tab-bracket .bk-head{padding:0 4px 6px;}
    #tab-bracket .bk-title{font-family:'Bebas Neue',sans-serif;letter-spacing:1px;color:#F5D000;font-size:1.5rem;margin:0;line-height:1;}
    #tab-bracket .bk-sub{color:#8f8f8f;font-size:0.7rem;margin:4px 0 0;}
    #tab-bracket .bk-scroll{display:flex;gap:14px;overflow-x:auto;padding:6px 4px 10px;-webkit-overflow-scrolling:touch;}
    #tab-bracket .bk-col{flex:0 0 auto;min-width:178px;display:flex;flex-direction:column;gap:10px;}
    #tab-bracket .bk-round{font-family:'Bebas Neue',sans-serif;letter-spacing:1px;color:#F5D000;font-size:1rem;text-align:center;padding:2px 0;border-bottom:1px solid #2a2a2a;position:sticky;top:0;}
    #tab-bracket .bk-tie{position:relative;background:#161616;border:1px solid #262626;border-radius:8px;padding:7px 9px;overflow:hidden;}
    #tab-bracket .bk-tie.bk-derby{border-color:#1DE54A;}
    #tab-bracket .bk-side{position:relative;display:flex;align-items:center;gap:6px;font-size:0.86rem;padding:2px 0;white-space:nowrap;overflow:hidden;}
    #tab-bracket .bk-side + .bk-side{border-top:1px solid #202020;}
    #tab-bracket .bk-team{overflow:hidden;text-overflow:ellipsis;}
    #tab-bracket .bk-lemon .bk-team{color:#F5D000;font-weight:700;}
    #tab-bracket .bk-owner{color:#8f8f8f;font-size:0.62rem;flex:0 0 auto;}
    #tab-bracket .bk-win .bk-team{font-weight:800;}
    /* default eliminated: strike + fade */
    #tab-bracket .bk-elim{opacity:0.4;}
    #tab-bracket .bk-elim .bk-team{position:relative;}
    #tab-bracket .bk-elim .bk-team::after{content:'';position:absolute;left:-3%;right:-3%;top:52%;height:2px;background:#FF2D2D;transform:rotate(-7deg);box-shadow:0 0 5px #FF2D2D;}
    /* derby loser: strike but NO fade (name stays readable under stamp) */
    #tab-bracket .bk-elim-derby .bk-team{position:relative;}
    #tab-bracket .bk-elim-derby .bk-team::after{content:'';position:absolute;left:-3%;right:-3%;top:52%;height:2px;background:#FF2D2D;transform:rotate(-7deg);box-shadow:0 0 5px #FF2D2D;}
    /* derby loser: strike (no fade) + inline straight SQUEEZED tag */
    #tab-bracket .bk-squeeze{flex:0 0 auto;margin-left:auto;color:#FF2D2D;border:1.5px solid #FF2D2D;font-family:'Bebas Neue',sans-serif;font-size:0.62rem;letter-spacing:0.5px;line-height:1.3;padding:0 5px;border-radius:3px;white-space:nowrap;}
    #tab-bracket .bk-meta{margin-top:5px;text-align:center;font-size:0.74rem;color:#ddd;font-weight:700;}
    #tab-bracket .bk-meta.bk-pending{color:#8f8f8f;font-weight:400;}
    #tab-bracket .bk-xtra{color:#8f8f8f;font-weight:400;font-size:0.64rem;}
    #tab-bracket .bk-empty{color:#8f8f8f;padding:20px;text-align:center;}
    `;
    const tag = document.createElement('style');
    tag.id = 'bk-style';
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  async function init() {
    const tabBtn = document.getElementById('tab-btn-bracket');
    const panel = document.getElementById('tab-bracket');
    if (!panel) return;
    if (tabBtn) tabBtn.style.display = ''; // unhide the nav button (live for everyone)
    injectCSS();
    panel.innerHTML = '<p class="bk-empty">Loading bracket…</p>';
    try {
      const res = await fetch(API_URL + '?t=' + Date.now());
      if (!res.ok) throw new Error('feed');
      const data = await res.json();
      render(panel, data.matches || []);
    } catch (e) {
      panel.innerHTML = '<p class="bk-empty">⚠️ Could not load the bracket. Try refreshing.</p>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual refresh if other code wants it.
  window.LemonBracket = { refresh: init };
})();
