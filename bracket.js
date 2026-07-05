// ============================================================
// LEMON TYRES WC 2026 — KNOCKOUT BRACKET (SVG tree, live feed)
// Proper non-crossing tree built from feed match numbers + feeders.
// Mobile: large SVG inside a scroll container → pan + pinch-zoom.
// Lemon teams highlighted; derbies green; eliminated = strike+fade
// (derby loser: strike, no fade, + SQUEEZED tag).
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

  const ROUND_COL = { 'Round of 32': 0, 'Round of 16': 1, 'Quarter-final': 2, 'Semi-final': 3, 'Final': 4 };
  const SHORT = { 'Bosnia & Herzegovina': 'Bosnia' };

  const CW = 158, CH = 46, PITCH = 58, TOP = 50, COLW = 202;
  const colX = c => 10 + c * COLW;

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
  function feederNum(t) { const m = /^W(\d+)$/i.exec(t || ''); return m ? parseInt(m[1], 10) : null; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function shortName(t) { return SHORT[t] || t; }
  function metaText(m) {
    const s = m.score;
    if (s && s.ft) {
      let t = s.ft[0] + '\u2013' + s.ft[1];
      if (s.p) t += ' (P ' + s.p[0] + '\u2013' + s.p[1] + ')';
      else if (s.et) t += ' AET';
      return t;
    }
    if (typeof convertToMYT === 'function' && m.time) return convertToMYT(m.time, m.date);
    return '';
  }

  // Fixed WC2026 bracket structure (match num -> the two feeder match nums).
  // Keyed on numbers so it stays correct even after team names resolve.
  const FEEDERS = {
    89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
    93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
    97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
    101: [97, 98], 102: [99, 100],
    104: [101, 102]
  };

  function buildLayout(matches) {
    const ko = matches.filter(m => m.num && ROUND_COL.hasOwnProperty(m.round));
    const byNum = {};
    ko.forEach(m => { byNum[m.num] = m; });
    const root = ko.find(m => m.round === 'Final');
    if (!root) return null;

    const nodes = [];
    const placed = {};
    let leaf = 0;
    function place(m) {
      if (placed[m.num]) return placed[m.num];
      const col = ROUND_COL[m.round];
      const fds = FEEDERS[m.num];
      let cy;
      if (!fds) {                               // leaf (R32)
        cy = TOP + leaf * PITCH + CH / 2; leaf++;
      } else {
        const kids = fds.map(n => byNum[n] ? place(byNum[n]) : null).filter(Boolean);
        cy = kids.length ? kids.reduce((s, k) => s + k.cy, 0) / kids.length : (TOP + leaf * PITCH + CH / 2);
      }
      const node = { m, col, x: colX(col), cy, y: cy - CH / 2, kids: fds || [] };
      placed[m.num] = node;
      nodes.push(node);
      return node;
    }
    place(root);
    const totalH = TOP + leaf * PITCH + 10;
    const totalW = colX(4) + CW + 10;
    return { nodes, byNum, totalH, totalW };
  }

  function nodeSVG(node) {
    const m = node.m, x = node.x, y = node.y;
    const teams = [resolveTeamName(m, 0), resolveTeamName(m, 1)];
    const owners = teams.map(ownersFor);
    const derby = owners[0].length > 0 && owners[1].length > 0;
    const w = winnerIndex(m.score);
    const decided = w !== null;
    const stroke = derby ? '#1DE54A' : '#2a2a2a';
    const sw = derby ? 1.5 : 1;
    let s = '';
    s += `<rect x="${x}" y="${y}" width="${CW}" height="${CH}" rx="7" fill="#161616" stroke="${stroke}" stroke-width="${sw}"/>`;
    s += `<line x1="${x + 8}" y1="${y + CH * 0.46}" x2="${x + CW - 8}" y2="${y + CH * 0.46}" stroke="#202020"/>`;

    teams.forEach((tm, k) => {
      const ph = isPlaceholder(tm);
      const lemon = owners[k].length > 0;
      const isWin = decided && w === k;
      const isLose = decided && w !== k;
      const squeezed = isLose && lemon;          // any Lemon knocked out gets stamped
      const fadeLose = isLose && !lemon;         // non-Lemon losers just fade
      const ty = y + (k === 0 ? 16 : 32);
      const label = ph ? 'TBD' : shortName(tm);
      const fill = ph ? '#555' : (lemon ? '#F5D000' : '#eaeaea');
      const fw = (lemon && !ph) || isWin ? '700' : '400';
      const grpOpen = fadeLose ? `<g opacity="0.4">` : '';
      const grpClose = fadeLose ? `</g>` : '';
      s += grpOpen;
      s += `<text x="${x + 8}" y="${ty}" fill="${fill}" font-size="11" font-weight="${fw}"${ph ? ' font-style="italic"' : ''}>${esc(label)}</text>`;
      // SQUEEZED stamp for an eliminated Lemon, else owner tag
      if (squeezed) {
        s += `<rect x="${x + CW - 56}" y="${ty - 9}" width="50" height="12" rx="2.5" fill="none" stroke="#FF2D2D" stroke-width="1"/>`;
        s += `<text x="${x + CW - 31}" y="${ty}" fill="#FF2D2D" font-family="Bebas Neue,sans-serif" font-size="9" letter-spacing="0.4" text-anchor="middle">SQUEEZED</text>`;
      } else if (lemon && !ph) {
        s += `<text x="${x + CW - 6}" y="${ty}" fill="#8f8f8f" font-size="7.5" text-anchor="end">${esc(owners[k].join('/'))}</text>`;
      }
      // strike-through for any loser
      if (isLose) {
        s += `<line x1="${x + 6}" y1="${ty - 3.5}" x2="${x + 6 + Math.min(label.length * 6.4, CW - 60)}" y2="${ty - 3.5}" stroke="#FF2D2D" stroke-width="2"/>`;
      }
      s += grpClose;
    });
    // meta (score or kickoff)
    const mt = metaText(m);
    if (mt) {
      const dim = (m.score && m.score.ft) ? '#ddd' : '#8f8f8f';
      s += `<text x="${x + CW / 2}" y="${y + CH - 6}" fill="${dim}" font-size="9" text-anchor="middle">${esc(mt)}</text>`;
    }
    return s;
  }

  function connectors(node) {
    if (!node.kids || !node.kids.length) return '';
    let s = '';
    node.kids.forEach(fn => {
      const child = findNode(fn);
      if (!child) return;
      const x1 = child.x + CW, y1 = child.cy;
      const x2 = node.x, y2 = node.cy;
      const ex = (x1 + x2) / 2;
      s += `<path d="M${x1},${y1} H${ex} V${y2} H${x2}" fill="none" stroke="#3a3a3a" stroke-width="1.5"/>`;
    });
    return s;
  }

  let NODES = [];
  let BYNUM = {};
  function findNode(num) { return NODES.find(n => n.m.num === num); }

  // Resolve a card's team name ourselves from the feeder match's result,
  // instead of waiting for the feed to propagate "W##" -> real name.
  function resolveTeamName(m, side) {
    const raw = side === 0 ? m.team1 : m.team2;
    if (!isPlaceholder(raw)) return raw;      // feed already resolved it
    const fds = FEEDERS[m.num];
    if (!fds) return raw;
    const fm = BYNUM[fds[side]];
    if (!fm) return 'TBD';
    const w = winnerIndex(fm.score);
    if (w === null) return 'TBD';             // feeder not decided yet
    return resolveTeamName(fm, w);            // recurse up the tree
  }

  function render(panel, matches) {
    const layout = buildLayout(matches);
    if (!layout) { panel.innerHTML = '<p class="lkb-empty">Knockouts haven\'t started yet.</p>'; return; }
    NODES = layout.nodes;
    BYNUM = layout.byNum;
    const labels = ['R32', 'R16', 'QF', 'SF', 'FINAL'];
    let svg = `<svg width="${layout.totalW}" height="${layout.totalH}" viewBox="0 0 ${layout.totalW} ${layout.totalH}" xmlns="http://www.w3.org/2000/svg" font-family="Inter,system-ui,sans-serif">`;
    labels.forEach((lb, c) => { svg += `<text x="${colX(c) + CW / 2}" y="32" fill="#F5D000" font-family="Bebas Neue,sans-serif" font-size="17" letter-spacing="1" text-anchor="middle">${lb}</text>`; });
    NODES.forEach(n => { svg += connectors(n); });
    NODES.forEach(n => { svg += nodeSVG(n); });
    svg += `</svg>`;
    const jump = '<div class="lkb-jump">' +
      labels.map((lb, c) => '<button class="lkb-jump-btn' + (c === 0 ? ' on' : '') + '" data-col="' + c + '">' + lb + '</button>').join('') +
      '</div>';
    panel.innerHTML =
      '<div class="lkb-wrap">' +
        '<div class="lkb-head">' +
          '<h2 class="lkb-title">🍋 KNOCKOUT BRACKET</h2>' +
          '<p class="lkb-sub">Pinch to zoom · drag to pan · 🍋 = a Lemon team</p>' +
        '</div>' +
        jump +
        '<div class="lkb-pan">' + svg + '</div>' +
      '</div>';
    // round-jump buttons: scroll the pan to that column
    const pan = panel.querySelector('.lkb-pan');
    panel.querySelectorAll('.lkb-jump-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = parseInt(btn.dataset.col, 10);
        pan.scrollTo({ left: Math.max(0, colX(c) - 14), behavior: 'smooth' });
        panel.querySelectorAll('.lkb-jump-btn').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
      });
    });
  }

  function injectCSS() {
    if (document.getElementById('lkb-style')) return;
    const css = [
      "#tab-bracket .lkb-wrap{padding:4px 0 16px;}",
      "#tab-bracket .lkb-head{padding:0 4px 6px;}",
      "#tab-bracket .lkb-title{font-family:'Bebas Neue',sans-serif;letter-spacing:1px;color:#F5D000;font-size:1.5rem;margin:0;line-height:1;}",
      "#tab-bracket .lkb-sub{color:#8f8f8f;font-size:0.7rem;margin:4px 0 0;}",
      "#tab-bracket .lkb-jump{display:flex;gap:5px;padding:0 4px 8px;}",
      "#tab-bracket .lkb-jump-btn{flex:1;background:#161616;border:1px solid #2a2a2a;color:#8f8f8f;font-family:'Bebas Neue',sans-serif;letter-spacing:1px;font-size:0.82rem;padding:6px 0;border-radius:8px;cursor:pointer;-webkit-tap-highlight-color:transparent;}",
      "#tab-bracket .lkb-jump-btn.on{background:#F5D000;color:#111;border-color:#F5D000;}",
      "#tab-bracket .lkb-pan{overflow:auto;-webkit-overflow-scrolling:touch;border:1px solid #1e1e1e;border-radius:10px;touch-action:pan-x pan-y pinch-zoom;}",
      "#tab-bracket .lkb-pan svg{display:block;background:#0A0A0A;}",
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.LemonBracket = { refresh: init };
})();
