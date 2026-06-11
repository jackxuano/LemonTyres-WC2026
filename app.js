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

// ---- COUNTDOWN ----
function updateCountdown() {
  const diff = KICKOFF_UTC - Date.now();
  const label = document.getElementById('cd-label');
  if (diff <= 0) {
    ['cd-d','cd-h','cd-m','cd-s'].forEach(id => document.getElementById(id).textContent = '00');
    label.innerHTML = '<span class="live-pulse"></span>Tournament is LIVE!';
    return;
  }
  document.getElementById('cd-d').textContent = String(Math.floor(diff / 86400000)).padStart(2,'0');
  document.getElementById('cd-h').textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2,'0');
  document.getElementById('cd-m').textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
  document.getElementById('cd-s').textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

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
}

function teamsMatch(a, b) {
  const n = s => s.toLowerCase().replace(/[^a-z]/g,'');
  return n(b).includes(n(a)) || n(a).includes(n(b));
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
      <td><span class="player-name">${p.name}</span></td>
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
  const heroes = Object.values(heroMap).sort((a,b) => b.heroGoals - a.heroGoals);

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
    podium.innerHTML = '<p class="podium-empty">No goals yet — podium unlocks at first hero goal ⚽</p>';
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
        <span class="podium-goals">${h.heroGoals} ⚽</span>
        <span class="podium-pts">${fmt(pts)} pts</span>
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

// ---- RENDER FIXTURES — day by day in MYT ----
function renderFixtures() {
  document.getElementById('fixtures-loading').style.display = 'none';
  const container = document.getElementById('fixtures-content');
  container.innerHTML = '';

  const relevant = allMatches.filter(m =>
    PLAYERS.some(p => teamsMatch(p.teamCode, m.team1) || teamsMatch(p.teamCode, m.team2))
  );
  if (!relevant.length) {
    container.innerHTML = '<p class="loading-msg">No fixture data available yet.</p>';
    return;
  }

  // Group by MYT date (some UTC-6 matches cross midnight in MYT)
  const byDate = {};
  relevant.forEach(m => {
    const mytDate = getMYTDate(m.date, m.time);
    if (!byDate[mytDate]) byDate[mytDate] = [];
    byDate[mytDate].push(m);
  });

  const todayMYT = new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Kuala_Lumpur' }); // YYYY-MM-DD

  Object.keys(byDate).sort().forEach(date => {
    const matches = byDate[date];
    const isToday = date === todayMYT;
    const isPast = date < todayMYT;

    const group = document.createElement('div');
    group.className = 'fixture-group';

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
      // Split owners by which side their team is on
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
        <span class="fx-team home">${m.team1}</span>
        ${scoreHtml}
        <span class="fx-team away">${m.team2}</span>
        <div class="fx-player-tags home">${homeTags}</div>
        <div class="fx-player-tags away">${awayTags}</div>
      `;
      list.appendChild(row);
    });

    group.appendChild(list);
    container.appendChild(group);
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
// Auto-refresh full data every 5 minutes so scores update without manual refresh
setInterval(loadData, 5 * 60 * 1000);
