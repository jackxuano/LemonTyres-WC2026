// ============================================================
// LEMON TYRES WC 2026 — APP LOGIC
// ============================================================

const API_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
const KICKOFF_MYT = new Date('2026-06-12T00:00:00+08:00'); // 12 Jun 08:00 MYT

let allMatches = [];
let teamPoints = {}; // teamCode → { wins, draws, losses, pts }

// ---- TABS ----
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
  const now = Date.now();
  const diff = KICKOFF_MYT - now;
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

// ---- LOAD DATA FROM API ----
async function loadData() {
  document.getElementById('standings-loading').style.display = 'block';
  document.getElementById('standings-table').style.display = 'none';
  document.getElementById('fixtures-loading').style.display = 'block';

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('API unavailable');
    const data = await res.json();
    allMatches = data.matches || [];
    processMatches();
    renderStandings();
    renderFixtures();
    document.getElementById('last-updated').textContent = 'Last updated: ' + new Date().toLocaleTimeString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit' }) + ' MYT';
  } catch (e) {
    document.getElementById('standings-loading').textContent = '⚠️ Could not load live data. Check connection.';
    document.getElementById('fixtures-loading').textContent = '⚠️ Could not load fixtures. Check connection.';
  }
}

// ---- PROCESS MATCH RESULTS ----
function processMatches() {
  teamPoints = {};

  // Init all player teams
  PLAYERS.forEach(p => {
    if (!teamPoints[p.teamCode]) {
      teamPoints[p.teamCode] = { wins: 0, draws: 0, losses: 0, pts: 0 };
    }
  });

  allMatches.forEach(match => {
    if (!match.score) return; // not played yet
    const ft = match.score.ft;
    if (!ft) return;

    const team1 = match.team1;
    const team2 = match.team2;
    const g1 = ft[0], g2 = ft[1];

    // Check if either team belongs to a player
    const player1 = PLAYERS.find(p => teamsMatch(p.teamCode, team1));
    const player2 = PLAYERS.find(p => teamsMatch(p.teamCode, team2));

    if (player1) {
      if (!teamPoints[player1.teamCode]) teamPoints[player1.teamCode] = { wins:0, draws:0, losses:0, pts:0 };
      const cls = player1.cls;
      if (g1 > g2) { teamPoints[player1.teamCode].wins++; teamPoints[player1.teamCode].pts += SCORING[cls].win; }
      else if (g1 === g2) { teamPoints[player1.teamCode].draws++; teamPoints[player1.teamCode].pts += SCORING[cls].draw; }
      else { teamPoints[player1.teamCode].losses++; }
    }
    if (player2) {
      if (!teamPoints[player2.teamCode]) teamPoints[player2.teamCode] = { wins:0, draws:0, losses:0, pts:0 };
      const cls = player2.cls;
      if (g2 > g1) { teamPoints[player2.teamCode].wins++; teamPoints[player2.teamCode].pts += SCORING[cls].win; }
      else if (g1 === g2) { teamPoints[player2.teamCode].draws++; teamPoints[player2.teamCode].pts += SCORING[cls].draw; }
      else { teamPoints[player2.teamCode].losses++; }
    }
  });
}

function teamsMatch(playerTeam, apiTeam) {
  const normalize = s => s.toLowerCase().replace(/[^a-z]/g,'');
  return normalize(apiTeam).includes(normalize(playerTeam)) || normalize(playerTeam).includes(normalize(apiTeam));
}

// ---- RENDER STANDINGS ----
function renderStandings() {
  const rows = PLAYERS.map(p => {
    const tp = teamPoints[p.teamCode] || { pts: 0 };
    const teamPts = tp.pts;
    const heroPts = calcHeroPoints(p);
    const total = teamPts + heroPts;
    return { ...p, teamPts, heroPts, total };
  });

  // Sort: total desc, then hero pts desc
  rows.sort((a, b) => b.total - a.total || b.heroPts - a.heroPts);

  const tbody = document.getElementById('standings-body');
  tbody.innerHTML = '';
  rows.forEach((p, i) => {
    const rank = i + 1;
    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="rank-num ${rankClass}">${rank}</span></td>
      <td><span class="player-name">${p.name}</span></td>
      <td><span class="flag-emoji">${p.flag}</span>${p.team}</td>
      <td class="pts-num hide-sm"><span class="cls-pill ${p.cls}">${p.cls}</span></td>
      <td class="pts-num">${formatPts(p.teamPts)}</td>
      <td class="pts-num">${formatPts(p.heroPts)}</td>
      <td class="total-pts">${formatPts(p.total)}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('standings-loading').style.display = 'none';
  document.getElementById('standings-table').style.display = 'block';

  renderHeroGrid(rows);
}

function formatPts(n) {
  return Number.isInteger(n) ? n : n.toFixed(1);
}

// ---- HERO GOALSCORER GRID ----
function renderHeroGrid(rows) {
  const grid = document.getElementById('hero-grid');
  grid.innerHTML = '';

  // Group by hero name (CR7 shared)
  const heroMap = {};
  PLAYERS.forEach(p => {
    const key = p.hero;
    if (!heroMap[key]) heroMap[key] = { ...p, owners: [p.name] };
    else heroMap[key].owners.push(p.name);
  });

  const heroes = Object.values(heroMap).sort((a, b) => b.heroGoals - a.heroGoals);

  heroes.forEach(h => {
    const pts = calcHeroPoints(h);
    const bonusNote = h.isCR7 ? '× 1.5' : !h.heroTop10 ? '× 2' : '× 1';
    const card = document.createElement('div');
    card.className = 'hero-card';
    card.innerHTML = `
      <div class="hero-card-name">${h.hero}</div>
      <div class="hero-card-owner">${h.owners.join(' + ')}</div>
      <div class="hero-goals">${h.heroGoals}</div>
      <div class="hero-pts-label">goals &nbsp;${bonusNote}</div>
      <div class="hero-pts-val">${formatPts(pts)} pts</div>
    `;
    grid.appendChild(card);
  });
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
        <span id="ini-${i}">${p.heroInitials}</span>
        <img src="${p.heroImg}" alt="${p.hero}" style="display:none" id="img-${i}" />
      </div>
      <div class="card-player-name">${p.name}</div>
      <div class="card-team">${p.team}</div>
      <hr class="card-divider" />
      <div class="card-hero-label">Hero</div>
      <div class="card-hero-name">${p.hero}</div>
      <span class="card-cls ${p.cls}">Class ${p.cls} · #${p.rank}</span>
    `;
    grid.appendChild(card);

    // Load hero image
    const img = document.getElementById(`img-${i}`);
    const ini = document.getElementById(`ini-${i}`);
    img.onload = () => { ini.style.display='none'; img.style.display='block'; };
    img.onerror = () => { img.style.display='none'; ini.style.display=''; };
    img.src = p.heroImg;
  });
}

// ---- RENDER FIXTURES — day by day ----
function renderFixtures() {
  document.getElementById('fixtures-loading').style.display = 'none';
  const container = document.getElementById('fixtures-content');
  container.innerHTML = '';

  // Find only matches involving at least one participant's team
  const relevantMatches = allMatches.filter(m =>
    PLAYERS.some(p => teamsMatch(p.teamCode, m.team1) || teamsMatch(p.teamCode, m.team2))
  );

  if (relevantMatches.length === 0) {
    container.innerHTML = '<p class="loading-msg">No fixture data available yet.</p>';
    return;
  }

  // Group by date
  const byDate = {};
  relevantMatches.forEach(m => {
    const key = m.date || 'TBD';
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(m);
  });

  // Sort dates
  const sortedDates = Object.keys(byDate).sort();
  const today = new Date().toISOString().slice(0, 10);

  sortedDates.forEach(date => {
    const matches = byDate[date];
    const dayLabel = formatDayLabel(date);
    const isToday = date === today;
    const isPast = date < today;

    const group = document.createElement('div');
    group.className = 'fixture-group';

    group.innerHTML = `
      <div class="fixture-day-header ${isToday ? 'today' : isPast ? 'past' : ''}">
        <span class="fx-day-label">${dayLabel}</span>
        ${isToday ? '<span class="fx-today-badge">TODAY</span>' : ''}
      </div>
    `;

    const list = document.createElement('div');
    list.className = 'fixture-list';

    matches.forEach(m => {
      // Find which participants have a team in this match
      const involvedPlayers = PLAYERS.filter(p =>
        teamsMatch(p.teamCode, m.team1) || teamsMatch(p.teamCode, m.team2)
      );
      const playerTags = involvedPlayers.map(p => {
        const isHome = teamsMatch(p.teamCode, m.team1);
        return `<span class="fx-player-tag">${p.flag} ${p.name}</span>`;
      }).join('');

      const played = m.score && m.score.ft;
      let scoreHtml;
      if (played) {
        const [g1, g2] = m.score.ft;
        // Work out results for all involved players
        const resultIcons = involvedPlayers.map(p => {
          const isHome = teamsMatch(p.teamCode, m.team1);
          const teamScore = isHome ? g1 : g2;
          const oppScore = isHome ? g2 : g1;
          return teamScore > oppScore ? '✅' : teamScore === oppScore ? '🟡' : '❌';
        });
        const icon = resultIcons[0] || '';
        scoreHtml = `<span class="fx-score">${icon} ${g1}–${g2}</span>`;
      } else {
        const timeStr = formatKickoff(m.time);
        scoreHtml = `<span class="fx-score pending">${timeStr}</span>`;
      }

      const row = document.createElement('div');
      row.className = 'fixture-row';
      row.innerHTML = `
        <span class="fx-team home">${m.team1}</span>
        ${scoreHtml}
        <span class="fx-team away">${m.team2}</span>
        <div class="fx-player-tags">${playerTags}</div>
      `;
      list.appendChild(row);
    });

    group.appendChild(list);
    container.appendChild(group);
  });
}

function formatDayLabel(dateStr) {
  try {
    // Parse as local date to avoid timezone shifts
    const [y, mo, d] = dateStr.split('-').map(Number);
    const date = new Date(y, mo - 1, d);
    return date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return dateStr; }
}

function formatKickoff(timeStr) {
  if (!timeStr) return 'TBC';
  // timeStr from API like "13:00 UTC-6" — just show time portion
  return timeStr.replace(/\s+UTC.*$/, '').trim() || 'TBC';
}

function formatMatchDate(dateStr) {
  return formatDayLabel(dateStr);
}

// ---- INIT ----
renderPlayers();
loadData();
