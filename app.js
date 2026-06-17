// ============================================================
// LEMON TYRES WC 2026 — APP LOGIC
// ============================================================

const API_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
// First match: Mexico vs South Africa = 3:00 AM MYT on Fri 12 Jun 2026
// = 2026-06-11T19:00:00Z (UTC) = 2026-06-12T03:00:00+08:00 (MYT)
const KICKOFF_UTC = new Date('2026-06-11T19:00:00Z');

let allMatches = [];
let teamPoints = {};

// ---- TABS (3 tabs) ----
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ---- NEXT RELATED MATCH ----
// Finds the next upcoming match involving a participant's team and shows
// the matchup + which players are on each side. Falls back to a generic
// "next World Cup match" if no participant game is coming up.
function updateNextMatch() {
  const body = document.getElementById('nm-body');
  const timeEl = document.getElementById('nm-time');
  if (!body) return;
  if (!allMatches.length) { body.textContent = 'Loading…'; return; }

  const now = Date.now();

  // Is any participant match live right now? (kickoff within last ~2h, no final score)
  const upcoming = [];
  let liveOne = null;
  allMatches.forEach(m => {
    const ko = matchKickoffMs(m.date, m.time);
    if (ko === null) return;
    const involved = PLAYERS.filter(p => teamsMatch(p.teamCode, m.team1) || teamsMatch(p.teamCode, m.team2));
    if (involved.length === 0) return;
    const finished = m.score && m.score.ft;
    if (!finished && now >= ko && now <= ko + 125*60*1000) {
      if (!liveOne) liveOne = { m, ko, involved };
    } else if (ko > now) {
      upcoming.push({ m, ko, involved });
    }
  });

  let pick = liveOne;
  let isLive = !!liveOne;
  if (!pick) {
    upcoming.sort((a,b) => a.ko - b.ko);
    pick = upcoming[0];
  }

  const label = document.querySelector('.nm-label');

  if (!pick) {
    if (label) label.textContent = 'Next Up';
    body.innerHTML = 'No more games with your teams 🍋';
    timeEl.textContent = '';
    return;
  }

  const { m, ko, involved } = pick;
  const homeNames = PLAYERS.filter(p => teamsMatch(p.teamCode, m.team1)).map(p => p.name);
  const awayNames = PLAYERS.filter(p => teamsMatch(p.teamCode, m.team2)).map(p => p.name);
  const homeTag = homeNames.length ? homeNames.join(' & ') : '—';
  const awayTag = awayNames.length ? awayNames.join(' & ') : '—';

  if (label) label.innerHTML = isLive ? '<span class="live-pulse"></span>On Now' : 'Next Up';

  body.innerHTML =
    `<span class="nm-match">${flagFor(m.team1)} ${m.team1} <span class="nm-vs">vs</span> ${m.team2} ${flagFor(m.team2)}</span>` +
    `<span class="nm-players">${homeTag} <span class="nm-vs">vs</span> ${awayTag}</span>`;

  if (isLive) {
    timeEl.textContent = 'Playing now';
  } else {
    timeEl.textContent = formatNextKickoff(ko);
  }
}

// Format an upcoming kickoff in MYT, e.g. "Sat 14 Jun · 3:00 AM MYT"
function formatNextKickoff(ko) {
  const d = new Date(ko);
  const opts = { timeZone:'Asia/Kuala_Lumpur', weekday:'short', day:'numeric', month:'short' };
  const day = d.toLocaleDateString('en-MY', opts);
  const time = d.toLocaleTimeString('en-MY', { timeZone:'Asia/Kuala_Lumpur', hour:'numeric', minute:'2-digit' });
  return `${day} · ${time} MYT`;
}

// ---- REGISTRATION STATUS (flips at 0000 MYT, 12 Jun 2026) ----
// Registration closes at midnight MYT on 12 Jun = 2026-06-11T16:00:00Z
const REG_CLOSE_UTC = new Date('2026-06-11T16:00:00Z');
const PLAYER_TOTAL = (typeof PLAYERS !== 'undefined') ? PLAYERS.length : 17;
function updateRegStatus() {
  const statusEl = document.getElementById('reg-status');
  const countEl = document.getElementById('reg-count');
  if (!statusEl || !countEl) return;
  if (Date.now() < REG_CLOSE_UTC) {
    statusEl.textContent = 'Registration closes tonight · 0000 MYT, 12 Jun 2026';
    countEl.textContent = PLAYER_TOTAL + ' lemons locked in 🍋';
  } else {
    statusEl.textContent = 'Registration closed · squad locked';
    countEl.textContent = PLAYER_TOTAL + ' lemons on WC2026 🍋';
  }
}
updateRegStatus();
setInterval(updateRegStatus, 30 * 1000);

// ---- LOAD DATA ----
async function loadData() {
  document.getElementById('standings-loading').style.display = 'block';
  document.getElementById('standings-table').style.display = 'none';
  document.getElementById('fixtures-loading').style.display = 'block';
  try {
    const res = await fetch(API_URL + '?t=' + Date.now()); // cache bust
    if (!res.ok) throw new Error('API unavailable');
    const data = await res.json();
    allMatches = data.matches || [];
    processMatches();
    renderStandings();
    renderFixtures();
    renderLiveBanner();
    updateNextMatch();
    document.getElementById('last-updated').textContent =
      'Updated ' + new Date().toLocaleTimeString('en-MY', { timeZone:'Asia/Kuala_Lumpur', hour:'2-digit', minute:'2-digit' }) + ' MYT';
  } catch (e) {
    document.getElementById('standings-loading').textContent = '⚠️ Could not load live data. Try refreshing.';
    document.getElementById('fixtures-loading').textContent = '⚠️ Could not load fixtures.';
  }
}

// ---- PROCESS MATCH RESULTS ----
function processMatches() {
  teamPoints = {};
  PLAYERS.forEach(p => {
    if (!teamPoints[p.teamCode]) teamPoints[p.teamCode] = { wins:0, draws:0, losses:0, pts:0 };
  });
  allMatches.forEach(m => {
    if (!m.score || !m.score.ft) return;
    const [g1, g2] = m.score.ft;
    [m.team1, m.team2].forEach((teamName, idx) => {
      const player = PLAYERS.find(p => teamsMatch(p.teamCode, teamName));
      if (!player) return;
      if (!teamPoints[player.teamCode]) teamPoints[player.teamCode] = { wins:0, draws:0, losses:0, pts:0 };
      const s = SCORING[player.cls];
      const myGoals = idx === 0 ? g1 : g2;
      const oppGoals = idx === 0 ? g2 : g1;
      if (myGoals > oppGoals)      { teamPoints[player.teamCode].wins++;   teamPoints[player.teamCode].pts += s.win; }
      else if (myGoals === oppGoals){ teamPoints[player.teamCode].draws++;  teamPoints[player.teamCode].pts += s.draw; }
      else                          { teamPoints[player.teamCode].losses++; }
    });
  });

  processHeroGoals();
}

// ---- AUTO HERO GOAL COUNTING ----
// Reads goalscorer data from the API and tallies each hero's goals automatically.
// Rules honoured: 90min + ET goals count (they're in goals arrays with real minutes);
// penalty-shootout goals are NOT counted (stored separately in score.p, never in goals
// arrays); own goals are excluded.
function processHeroGoals() {
  // Build a tally per hero name (surname-matched)
  const heroTally = {}; // heroKey -> goal count

  // Map each unique hero to a normalized surname key
  const heroKeys = {};
  PLAYERS.forEach(p => {
    const key = heroNameKey(p.hero);
    heroKeys[p.hero] = key;
    if (!(key in heroTally)) heroTally[key] = 0;
  });

  allMatches.forEach(m => {
    if (!m.score || !m.score.ft) return; // only finished matches
    const goals = [...(m.goals1 || []), ...(m.goals2 || [])];
    goals.forEach(goal => {
      if (!goal || !goal.name) return;
      if (goal.owngoal || goal.og) return; // own goals don't count for the hero
      const scorerKey = heroNameKey(goal.name);
      // Match scorer to any hero with the same surname key
      for (const key of Object.values(heroKeys)) {
        if (key && scorerKey && key === scorerKey) {
          heroTally[key]++;
          break;
        }
      }
    });
  });

  // Write tallies back onto each player's heroGoals (auto override)
  PLAYERS.forEach(p => {
    const key = heroKeys[p.hero];
    if (key in heroTally) p.heroGoals = heroTally[key];
  });
}

// Normalize a player name to a matchable surname key:
// lowercase, strip accents, take the LAST word (surname), strip non-letters.
function heroNameKey(fullName) {
  if (!fullName) return '';
  const noAccents = fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = noAccents.trim().toLowerCase().split(/\s+/);
  let surname = words[words.length - 1];
  // Special cases where surname-only is ambiguous or differs from common name
  const overrides = {
    'cristiano ronaldo': 'ronaldo',
    'kylian mbappe': 'mbappe',
    'vinicius junior': 'vinicius',
    'lamine yamal': 'yamal',
    'darwin nunez': 'nunez',
    'erling haaland': 'haaland',
    'alexander sorloth': 'sorloth',
    'lautaro martinez': 'martinez',
    'bruno fernandes': 'fernandes',
    'marcus rashford': 'rashford',
    'luis diaz': 'diaz',
  };
  const flatKey = noAccents.trim().toLowerCase();
  if (overrides[flatKey]) return overrides[flatKey];
  return surname.replace(/[^a-z]/g, '');
}

function teamsMatch(a, b) {
  const n = s => s.toLowerCase().replace(/[^a-z]/g,'');
  const na = n(a), nb = n(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Only allow containment when the inner string is substantial (>=4 chars).
  // Prevents knockout placeholders like "W73"→"w" from matching "Sweden".
  if (na.length >= 4 && nb.includes(na)) return true;
  if (nb.length >= 4 && na.includes(nb)) return true;
  return false;
}

// ---- COUNTRY FLAGS (all WC2026 nations) ----
const FLAGS = {
  'algeria':'🇩🇿','argentina':'🇦🇷','australia':'🇦🇺','austria':'🇦🇹','belgium':'🇧🇪',
  'bosnia & herzegovina':'🇧🇦','bosnia':'🇧🇦','brazil':'🇧🇷','canada':'🇨🇦','cape verde':'🇨🇻',
  'colombia':'🇨🇴','croatia':'🇭🇷','curacao':'🇨🇼','curaçao':'🇨🇼','czech republic':'🇨🇿',
  'dr congo':'🇨🇩','ecuador':'🇪🇨','egypt':'🇪🇬','england':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','france':'🇫🇷',
  'germany':'🇩🇪','ghana':'🇬🇭','haiti':'🇭🇹','iran':'🇮🇷','iraq':'🇮🇶','ivory coast':'🇨🇮',
  'japan':'🇯🇵','jordan':'🇯🇴','mexico':'🇲🇽','morocco':'🇲🇦','netherlands':'🇳🇱',
  'new zealand':'🇳🇿','norway':'🇳🇴','panama':'🇵🇦','paraguay':'🇵🇾','portugal':'🇵🇹',
  'qatar':'🇶🇦','saudi arabia':'🇸🇦','scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','senegal':'🇸🇳','south africa':'🇿🇦',
  'south korea':'🇰🇷','spain':'🇪🇸','sweden':'🇸🇪','switzerland':'🇨🇭','tunisia':'🇹🇳',
  'turkey':'🇹🇷','türkiye':'🇹🇷','usa':'🇺🇸','united states':'🇺🇸','uruguay':'🇺🇾','uzbekistan':'🇺🇿',
};
function flagFor(teamName) {
  if (!teamName) return '';
  const key = teamName.trim().toLowerCase();
  if (FLAGS[key]) return FLAGS[key];
  // placeholder slots like "1A", "W73", "3A/B/C/D/F" → neutral marker
  return '⚽';
}

// ---- RANKING HELPER (pure — computes ranks from any match subset) ----
// Used for movement indicators: compare ranking now vs ranking before today.
function rankFor(matches) {
  const tp = {}; // teamCode -> pts
  matches.forEach(m => {
    if (!m.score || !m.score.ft) return;
    const [g1, g2] = m.score.ft;
    [m.team1, m.team2].forEach((tn, idx) => {
      const player = PLAYERS.find(p => teamsMatch(p.teamCode, tn));
      if (!player) return;
      tp[player.teamCode] = tp[player.teamCode] || 0;
      const s = SCORING[player.cls];
      const mine = idx === 0 ? g1 : g2, opp = idx === 0 ? g2 : g1;
      if (mine > opp) tp[player.teamCode] += s.win;
      else if (mine === opp) tp[player.teamCode] += s.draw;
    });
  });
  // hero goals by key
  const hg = {}, heroKeys = {};
  PLAYERS.forEach(p => { const k = heroNameKey(p.hero); heroKeys[p.hero] = k; if (!(k in hg)) hg[k] = 0; });
  matches.forEach(m => {
    if (!m.score || !m.score.ft) return;
    [...(m.goals1 || []), ...(m.goals2 || [])].forEach(g => {
      if (!g || !g.name || g.owngoal || g.og) return;
      const sk = heroNameKey(g.name);
      for (const k of Object.values(heroKeys)) { if (k && sk && k === sk) { hg[k]++; break; } }
    });
  });
  const arr = PLAYERS.map(p => {
    const teamPts = tp[p.teamCode] || 0;
    const goals = hg[heroKeys[p.hero]] || 0;
    let per = p.isCR7 ? 1.5 : 1; if (!p.heroTop10) per += 1;
    const heroPts = goals * per;
    return { name: p.name, total: teamPts + heroPts, heroPts };
  }).sort((a, b) => b.total - a.total || b.heroPts - a.heroPts);
  const rankMap = {};
  arr.forEach((p, i) => rankMap[p.name] = i + 1);
  return rankMap;
}

// ---- RENDER STANDINGS ----
function renderStandings() {
  const rows = PLAYERS.map(p => {
    const tp = teamPoints[p.teamCode] || { pts:0 };
    const teamPts = tp.pts;
    const heroPts = calcHeroPoints(p);
    return { ...p, teamPts, heroPts, total: teamPts + heroPts };
  }).sort((a,b) => b.total - a.total || b.heroPts - a.heroPts);

  const tbody = document.getElementById('standings-body');
  tbody.innerHTML = '';
  rows.forEach((p, i) => {
    const rank = i + 1;
    const rc = rank===1?'rank-1':rank===2?'rank-2':rank===3?'rank-3':'';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="rank-num ${rc}">${rank}</span></td>
      <td><span class="player-name">${p.name}</span><span class="player-hero">⚽ ${p.hero}</span></td>
      <td><span class="flag-emoji">${p.flag}</span>${p.team}</td>
      <td class="hide-sm"><span class="cls-pill ${p.cls}">${p.cls}</span></td>
      <td class="pts-num">${fmt(p.teamPts)}</td>
      <td class="pts-num">${fmt(p.heroPts)}</td>
      <td class="total-pts">${fmt(p.total)}</td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('standings-loading').style.display = 'none';
  document.getElementById('standings-table').style.display = 'block';
  renderHeroGrid();
}

function fmt(n) { return Number.isInteger(n) ? n : n.toFixed(1); }

// ---- HERO GRID ----
function renderHeroGrid() {
  const heroMap = {};
  PLAYERS.forEach(p => {
    if (!heroMap[p.hero]) heroMap[p.hero] = { ...p, owners: [p.name] };
    else heroMap[p.hero].owners.push(p.name);
  });
  // Rank by POINTS (fantasy value), then goals as tiebreak — so a non-top-10
  // hero's bonus correctly ranks him above a top-10 hero with more raw goals.
  const heroes = Object.values(heroMap).sort((a,b) =>
    calcHeroPoints(b) - calcHeroPoints(a) || b.heroGoals - a.heroGoals
  );

  renderHeroPodium(heroes);

  // Full grid below the podium
  const grid = document.getElementById('hero-grid');
  grid.innerHTML = '';
  heroes.forEach(h => {
    const pts = calcHeroPoints(h);
    const mul = h.isCR7 ? '×1.5' : !h.heroTop10 ? '×2' : '×1';
    const card = document.createElement('div');
    card.className = 'hero-card';
    card.innerHTML = `
      <div class="hero-card-name">${h.hero}</div>
      <div class="hero-card-owner">${h.owners.join(' + ')}</div>
      <div class="hero-goals">${h.heroGoals}</div>
      <div class="hero-pts-label">goals · ${mul}</div>
      <div class="hero-pts-val">${fmt(pts)} pts</div>
    `;
    grid.appendChild(card);
  });
}

// ---- HERO PODIUM (top 3 scorers with photos) ----
function renderHeroPodium(heroes) {
  const podium = document.getElementById('hero-podium');
  if (!podium) return;

  // Only show podium once someone has actually scored
  const scorers = heroes.filter(h => h.heroGoals > 0);
  if (scorers.length === 0) {
    podium.innerHTML = '<p class="podium-empty">No hero goals yet — the podium fills up once your strikers find the net ⚽</p>';
    return;
  }

  const top3 = scorers.slice(0, 3);
  // Display order: 2nd, 1st, 3rd (classic podium shape)
  const order = [top3[1], top3[0], top3[2]];
  const placeClass = ['silver', 'gold', 'bronze'];
  const placeNum = ['2', '1', '3'];
  const heights = ['mid', 'tall', 'short'];

  podium.innerHTML = '';
  order.forEach((h, idx) => {
    if (!h) return; // fewer than 3 scorers
    const pts = calcHeroPoints(h);
    const step = document.createElement('div');
    step.className = `podium-step ${heights[idx]}`;
    step.innerHTML = `
      <div class="podium-avatar ${placeClass[idx]}">
        <span class="podium-initials">${h.heroInitials}</span>
      </div>
      <div class="podium-name">${h.hero}</div>
      <div class="podium-owner">${h.owners.join(', ')}</div>
      <div class="podium-block ${placeClass[idx]}">
        <span class="podium-rank">${placeNum[idx]}</span>
        <span class="podium-pts">${fmt(pts)} pts</span>
        <span class="podium-goals">${h.heroGoals} ⚽</span>
      </div>
    `;
    podium.appendChild(step);

    // Load photo into podium avatar
    const av = step.querySelector('.podium-avatar');
    const ini = step.querySelector('.podium-initials');
    const img = new Image();
    img.onload = () => { ini.style.display = 'none'; img.className = 'podium-avatar-img'; av.appendChild(img); };
    img.onerror = () => { ini.style.display = ''; };
    img.src = h.heroImg;
    img.alt = h.hero;
  });
}

// ---- LIVE NOW BANNER ----
// openfootball API has no live flag, so we infer: a match is "ON NOW" if the
// current time is between kickoff and kickoff + 2h05m AND no final score yet.
function renderLiveBanner() {
  const banner = document.getElementById('live-banner');
  if (!banner) return;

  const now = Date.now();
  const MATCH_WINDOW = 125 * 60 * 1000; // 2h05m

  const liveMatches = [];
  allMatches.forEach(m => {
    if (m.score && m.score.ft) return; // already finished
    const ko = matchKickoffMs(m.date, m.time);
    if (ko === null) return;
    if (now >= ko && now <= ko + MATCH_WINDOW) {
      // Which participants have a team in this match?
      const involved = PLAYERS.filter(p =>
        teamsMatch(p.teamCode, m.team1) || teamsMatch(p.teamCode, m.team2)
      );
      if (involved.length > 0) {
        liveMatches.push({ m, involved });
      }
    }
  });

  if (liveMatches.length === 0) {
    banner.style.display = 'none';
    return;
  }

  banner.style.display = 'block';
  banner.innerHTML = liveMatches.map(({ m, involved }) => {
    // Dedupe player names
    const names = [...new Set(involved.map(p => p.name))].join(' & ');
    return `
      <div class="live-row">
        <span class="live-dot"></span>
        <span class="live-tag">ON NOW</span>
        <span class="live-match">${m.team1} vs ${m.team2}</span>
        <span class="live-players">${names} playing</span>
      </div>
    `;
  }).join('');
}

// Get kickoff time in ms (UTC) from API date + "13:00 UTC-6" format
function matchKickoffMs(dateStr, timeStr) {
  try {
    const match = timeStr && timeStr.match(/(\d{1,2}):(\d{2})\s*UTC([+-]\d+)/);
    if (!match) return null;
    const [y, mo, d] = dateStr.split('-').map(Number);
    const h = parseInt(match[1]), mi = parseInt(match[2]), offset = parseInt(match[3]);
    return Date.UTC(y, mo - 1, d, h - offset, mi);
  } catch { return null; }
}

// ---- RENDER PLAYER CARDS ----
function renderPlayers() {
  const grid = document.getElementById('player-grid');
  grid.innerHTML = '';
  PLAYERS.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.innerHTML = `
      <span class="card-rank">${String(i+1).padStart(2,'0')}</span>
      <span class="card-flag">${p.flag}</span>
      <div class="card-avatar" id="av-${i}">
        <span class="card-initials" id="ini-${i}">${p.heroInitials}</span>
      </div>
      <div class="card-player-name">${p.name}</div>
      <div class="card-team">${p.team}</div>
      <hr class="card-divider" />
      <div class="card-hero-label">Hero</div>
      <div class="card-hero-name">${p.hero}</div>
      <span class="card-cls ${p.cls}">Class ${p.cls} · #${p.rank}</span>
    `;
    grid.appendChild(card);

    // Load hero image into the avatar circle
    const av = document.getElementById(`av-${i}`);
    const ini = document.getElementById(`ini-${i}`);
    const img = new Image();
    img.onload = () => {
      ini.style.display = 'none';
      img.className = 'card-avatar-img';
      av.appendChild(img);
    };
    img.onerror = () => { ini.style.display = ''; }; // keep initials
    img.src = p.heroImg;
    img.alt = p.hero;
  });
}

// ---- RENDER FIXTURES — single scrollable timeline, auto-lands on next match ----
let fixturesInitialScrollDone = false;

function renderFixtures() {
  document.getElementById('fixtures-loading').style.display = 'none';
  const container = document.getElementById('fixtures-content');

  if (!allMatches.length) {
    container.innerHTML = '<p class="loading-msg">No fixture data available yet.</p>';
    return;
  }

  // Preserve scroll position across the periodic (5-min) re-renders
  const prevScroll = container.querySelector('.fx-scroll');
  const savedTop = prevScroll ? prevScroll.scrollTop : null;

  container.innerHTML = '';

  // Group by MYT date, chronological (oldest → newest, top → bottom)
  const byDate = {};
  allMatches.forEach(m => {
    const mytDate = getMYTDate(m.date, m.time);
    if (!byDate[mytDate]) byDate[mytDate] = [];
    byDate[mytDate].push(m);
  });
  const todayMYT = new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Kuala_Lumpur' });
  const allDates = Object.keys(byDate).sort();

  // Anchor = first day that's today or later (the "next match" landing point)
  let anchorDate = allDates.find(d => d >= todayMYT) || allDates[allDates.length - 1];

  const scroll = document.createElement('div');
  scroll.className = 'fx-scroll';

  let anchorEl = null;
  let lastPastEl = null;

  allDates.forEach(date => {
    const matches = byDate[date].slice().sort((a, b) => {
      const ka = matchKickoffMs(a.date, a.time);
      const kb = matchKickoffMs(b.date, b.time);
      if (ka === null) return 1;
      if (kb === null) return -1;
      return ka - kb;
    });
    const isToday = date === todayMYT;
    const isPast = date < todayMYT;

    const group = document.createElement('div');
    group.className = 'fixture-group';
    if (date === anchorDate) anchorEl = group;
    if (isPast) lastPastEl = group; // track most recent past day

    const [y, mo, d] = date.split('-').map(Number);
    const label = new Date(y, mo-1, d).toLocaleDateString('en-MY', { weekday:'short', day:'numeric', month:'short' });

    group.innerHTML = `
      <div class="fixture-day-header ${isToday?'today':isPast?'past':''}">
        <span class="fx-day-label">${label}</span>
        ${isToday ? '<span class="fx-today-badge">TODAY</span>' : ''}
      </div>
    `;

    const list = document.createElement('div');
    list.className = 'fixture-list';

    matches.forEach(m => {
      const homeOwners = PLAYERS.filter(p => teamsMatch(p.teamCode, m.team1));
      const awayOwners = PLAYERS.filter(p => teamsMatch(p.teamCode, m.team2));
      const involved = [...homeOwners, ...awayOwners];

      const homeTags = homeOwners.map(p => `<span class="fx-player-tag">${p.flag} ${p.name}</span>`).join('');
      const awayTags = awayOwners.map(p => `<span class="fx-player-tag">${p.flag} ${p.name}</span>`).join('');

      const played = m.score && m.score.ft;
      let scoreHtml;
      if (played) {
        const [g1, g2] = m.score.ft;
        const icon = involved.length ? (() => {
          const p = involved[0];
          const isHome = teamsMatch(p.teamCode, m.team1);
          const mine = isHome ? g1 : g2, opp = isHome ? g2 : g1;
          return mine > opp ? '✅' : mine === opp ? '🟡' : '❌';
        })() : '';
        scoreHtml = `<span class="fx-score">${icon} ${g1}–${g2}</span>`;
      } else {
        const kMYT = convertToMYT(m.time, m.date);
        scoreHtml = `<span class="fx-score pending">${kMYT}</span>`;
      }

      const row = document.createElement('div');
      row.className = 'fixture-row';
      row.innerHTML = `
        <span class="fx-team home"><span class="fx-flag">${flagFor(m.team1)}</span> ${m.team1}</span>
        ${scoreHtml}
        <span class="fx-team away">${m.team2} <span class="fx-flag">${flagFor(m.team2)}</span></span>
        <div class="fx-player-tags home">${homeTags}</div>
        <div class="fx-player-tags away">${awayTags}</div>
      `;
      list.appendChild(row);
    });

    group.appendChild(list);
    scroll.appendChild(group);
  });

  // Functional jump bar — only when there ARE past results to jump between
  function scrollTo(target) {
    if (!target) return;
    const sRect = scroll.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    scroll.scrollTo({ top: scroll.scrollTop + (tRect.top - sRect.top), behavior: 'smooth' });
  }
  if (lastPastEl) {
    const bar = document.createElement('div');
    bar.className = 'fx-jumpbar';
    bar.innerHTML = `
      <span class="fx-jump-pill">
        <button class="fx-jump-btn" data-jump="results">▲ Results</button>
        <span class="fx-jump-sep">·</span>
        <button class="fx-jump-btn" data-jump="next">Today ▼</button>
      </span>
    `;
    container.appendChild(bar);
    bar.querySelector('[data-jump="results"]').addEventListener('click', () => scrollTo(lastPastEl));
    bar.querySelector('[data-jump="next"]').addEventListener('click', () => scrollTo(anchorEl));
  }

  container.appendChild(scroll);

  // Position the scroll: first load → land on the next match; refresh → keep place
  requestAnimationFrame(() => {
    if (!fixturesInitialScrollDone && anchorEl) {
      const cRect = scroll.getBoundingClientRect();
      const aRect = anchorEl.getBoundingClientRect();
      scroll.scrollTop += (aRect.top - cRect.top);
      fixturesInitialScrollDone = true;
    } else if (savedTop !== null) {
      scroll.scrollTop = savedTop;
    }
  });
}

// Get the MYT calendar date for a match (handles midnight crossover)
function getMYTDate(dateStr, timeStr) {
  try {
    const match = timeStr && timeStr.match(/(\d{1,2}):(\d{2})\s*UTC([+-]\d+)/);
    if (!match) return dateStr;
    const [y, mo, d] = dateStr.split('-').map(Number);
    const h = parseInt(match[1]), m = parseInt(match[2]), offset = parseInt(match[3]);
    const utcMs = Date.UTC(y, mo-1, d, h - offset, m);
    const mytMs = utcMs + 8 * 3600000; // MYT = UTC+8
    const mytD = new Date(mytMs);
    return `${mytD.getUTCFullYear()}-${String(mytD.getUTCMonth()+1).padStart(2,'0')}-${String(mytD.getUTCDate()).padStart(2,'0')}`;
  } catch { return dateStr; }
}

// ---- INIT ----
renderPlayers();
loadData();

// Re-check the live banner every minute (matches start/end without a data reload)
setInterval(renderLiveBanner, 60 * 1000);
setInterval(updateNextMatch, 60 * 1000);
// Auto-refresh full data every 5 minutes so scores update without manual refresh
setInterval(loadData, 5 * 60 * 1000);
