// ============================================================
// LEMON TYRES WC 2026 — KNOCKOUT BRACKET (live, feed-driven)
// Unique class prefix (lkb-) so NOTHING in style.css can collide.
// Renders only rounds that have real teams; placeholders show as TBD.
// ============================================================
(function () {
  const API_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

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

  function isPlaceholder(name) {
    if (!name) return true;
    if (/^[WL]\d+$/i.test(name)) return true;
    if (/^(winner|loser|runner)/i.test(name)) return true;
    if (/^[123][A-L]\b/.test(name)) return true;
    if (name.includes('/')) return true;
    return false;
  }

  function ownersFor(team) {
    if (typeof PLAYERS === 'undefined' || isPlaceholder(team)) return [];
    return PLAYERS.filter(p => _teamsMatch(p.teamCode, team)).map(p => p.name);
  }

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
    let txt = `${s.ft[0]}\u2013${s.ft[1]}`;
    if (s.p) txt += ` <span class="lkb-xtra">(pens ${s.p[0]}\u2013${s.p[1]})</span>`;
    else if (s.et) txt += ` <span class="lkb-xtra">AET</span>`;
    return { text: txt, pending: false };
  }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function sideHtml(team, isWinner, isLoser, isDerby, owners) {
    const ph = isPlaceholder(team);
    const lemon = owners.length > 0;
    const cls = ['lkb-side'];
    if (lemon) cls.push('lkb-lemon');
    if (isWinner) cls.push('lkb-win');
    if (isLoser) cls.push(isDerby ? 'lkb-elim-derby' : 'lkb-elim');
    const label = ph ? 'TBD' : team;
    const ownerTag = lemon ? `<span class="lkb-owner">${esc(owners.join('/'))}</span>` : '';
    const stamp = (isLoser && isDerby) ? `<span class="lkb-squeeze">SQUEEZED 🍋</span>` : '';
    return `<div class="${cls.join(' ')}"><span class="lkb-team${ph ? ' lkb-tbd' : ''}">${esc(label)}</span>${ownerTag}${stamp}</div>`;
  }

  function tieHtml(m) {
    const oA = ownersFor(m.team1), oB = ownersFor(m.team2);
    const derby = oA.length > 0 && oB.length > 0;
    const w = winnerIndex(m.score);
    const decided = w !== null;
    const sl = scoreLine(m);
    const sideA = sideHtml(m.team1, decided && w === 0, decided && w === 1, derby, oA);
    const sideB = sideHtml(m.team2, decided && w === 1, decided && w === 0, derby, oB);
    return `<div class="lkb-tie${derby ? ' lkb-derby' : ''}">${sideA}${sideB}<div class="lkb-meta ${sl.pending ? 'lkb-pending' : ''}">${sl.text}</div></div>`;
  }

  function render(panel, matches) {
    const ko = matches.filter(m => !m.group && ROUND_ORDER.includes(m.round));
    const byRound = {};
    ko.forEach(m => { (byRound[m.round] = byRound[m.round] || []).push(m); });

    const liveRounds = ROUND_ORDER.filter(r => {
      const arr = byRound[r];
      return arr && arr.some(m => !isPlaceholder(m.team1) || !isPlaceholder(m.team2));
    });

    const cols = liveRounds.map(r => {
      const ties = byRound[r].map(tieHtml).join('');
      return `<div class="lkb-col"><div class="lkb-round">${ROUND_SHORT[r] || r}</div>${ties}</div>`;
    }).join('');

    panel.innerHTML =
      '<div class="lkb-wrap">' +
        '<div class="lkb-head">' +
          '<h2 class="lkb-title">🍋 KNOCKOUT BRACKET</h2>' +
          '<p class="lkb-sub">' + (liveRounds.length > 1 ? 'Scroll sideways for later rounds · ' : '') + '🍋 = a Lemon team</p>' +
        '</div>' +
        '<div class="lkb-scroll">' + (cols || '<p class="lkb-empty">Knockouts haven\'t started yet.</p>') + '</div>' +
      '</div>';
  }

  function injectCSS() {
    if (document.getElementById('lkb-style')) return;
    const css = [
    "#tab-bracket .lkb-wrap{padding:4px 0 16px;}",
    "#tab-bracket .lkb-head{padding:0 4px 6px;}",
    "#tab-bracket .lkb-title{font-family:'Bebas Neue',sans-serif;letter-spacing:1px;color:#F5D000;font-size:1.5rem;margin:0;line-height:1;}",
    "#tab-bracket .lkb-sub{color:#8f8f8f;font-size:0.7rem;margin:4px 0 0;}",
    "#tab-bracket .lkb-scroll{display:flex;flex-direction:row;gap:14px;overflow-x:auto;padding:6px 4px 10px;-webkit-overflow-scrolling:touch;align-items:flex-start;}",
    "#tab-bracket .lkb-col{flex:0 0 auto;width:190px;display:flex;flex-direction:column;gap:10px;}",
    "#tab-bracket .lkb-round{font-family:'Bebas Neue',sans-serif;letter-spacing:1px;color:#F5D000;font-size:1rem;text-align:center;padding:2px 0;border-bottom:1px solid #2a2a2a;}",
    "#tab-bracket .lkb-tie{display:flex;flex-direction:column;background:#161616;border:1px solid #262626;border-radius:8px;padding:7px 9px;}",
    "#tab-bracket .lkb-tie.lkb-derby{border-color:#1DE54A;}",
    "#tab-bracket .lkb-side{display:flex;flex-direction:row;align-items:center;gap:6px;font-size:0.86rem;padding:2px 0;width:100%;min-width:0;}",
    "#tab-bracket .lkb-side + .lkb-side{border-top:1px solid #202020;}",
    "#tab-bracket .lkb-team{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    "#tab-bracket .lkb-tbd{color:#666;font-style:italic;}",
    "#tab-bracket .lkb-lemon .lkb-team{color:#F5D000;font-weight:700;}",
    "#tab-bracket .lkb-owner{color:#8f8f8f;font-size:0.62rem;flex:0 0 auto;margin-left:auto;}",
    "#tab-bracket .lkb-win .lkb-team{font-weight:800;}",
    "#tab-bracket .lkb-elim{opacity:0.4;}",
    "#tab-bracket .lkb-elim .lkb-team{position:relative;}",
    "#tab-bracket .lkb-elim .lkb-team::after{content:'';position:absolute;left:-3%;right:-3%;top:52%;height:2px;background:#FF2D2D;transform:rotate(-7deg);box-shadow:0 0 5px #FF2D2D;}",
    "#tab-bracket .lkb-elim-derby .lkb-team{position:relative;}",
    "#tab-bracket .lkb-elim-derby .lkb-team::after{content:'';position:absolute;left:-3%;right:-3%;top:52%;height:2px;background:#FF2D2D;transform:rotate(-7deg);box-shadow:0 0 5px #FF2D2D;}",
    "#tab-bracket .lkb-squeeze{flex:0 0 auto;margin-left:8px;color:#FF2D2D;border:1.5px solid #FF2D2D;font-family:'Bebas Neue',sans-serif;font-size:0.62rem;letter-spacing:0.5px;line-height:1.35;padding:0 5px;border-radius:3px;white-space:nowrap;}",
    "#tab-bracket .lkb-meta{margin-top:5px;text-align:center;font-size:0.74rem;color:#ddd;font-weight:700;}",
    "#tab-bracket .lkb-meta.lkb-pending{color:#8f8f8f;font-weight:400;}",
    "#tab-bracket .lkb-xtra{color:#8f8f8f;font-weight:400;font-size:0.64rem;}",
    "#tab-bracket .lkb-empty{color:#8f8f8f;padding:20px;text-align:center;}"
    ].join('\n');
    const tag = document.createElement('style');
    tag.id = 'lkb-style';
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  async function init() {
    const tabBtn = document.getElementById('tab-btn-bracket');
    const panel = document.getElementById('tab-bracket');
    if (!panel) return;
    if (tabBtn) tabBtn.style.display = '';
    injectCSS();
    panel.innerHTML = '<p class="lkb-empty">Loading bracket…</p>';
    try {
      const res = await fetch(API_URL + '?t=' + Date.now());
      if (!res.ok) throw new Error('feed');
      const data = await res.json();
      render(panel, data.matches || []);
    } catch (e) {
      panel.innerHTML = '<p class="lkb-empty">⚠️ Could not load the bracket. Try refreshing.</p>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.LemonBracket = { refresh: init };
})();
