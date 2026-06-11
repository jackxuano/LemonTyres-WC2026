// ============================================================
// LEMON TYRES WC 2026 — PLAYER DATA
// Rankings: FIFA April 1 2026 (official pre-tournament)
// Update heroGoals after each match a hero scores
// ============================================================

const PLAYERS = [
  {
    name: 'Teck',
    team: 'Portugal', teamCode: 'Portugal', flag: '🇵🇹', rank: 5, cls: 'A',
    hero: 'Lautaro Martinez', heroNation: 'Argentina', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/lautaro.jpg',
    heroInitials: 'LM',
  },
  {
    name: 'Raja Eng',
    team: 'Iran', teamCode: 'Iran', flag: '🇮🇷', rank: 21, cls: 'B',
    hero: 'Vinícius Júnior', heroNation: 'Brazil', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/vinicius.jpg',
    heroInitials: 'VJ',
  },
  {
    name: 'BJ',
    team: 'Japan', teamCode: 'Japan', flag: '🇯🇵', rank: 18, cls: 'B',
    hero: 'Marcus Rashford', heroNation: 'England', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/rashford.jpg',
    heroInitials: 'MR',
  },
  {
    name: 'Siang',
    team: 'Sweden', teamCode: 'Sweden', flag: '🇸🇪', rank: 38, cls: 'C',
    hero: 'Bruno Fernandes', heroNation: 'Portugal', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/bruno.jpg',
    heroInitials: 'BF',
  },
  {
    name: 'Zhecko',
    team: 'Bosnia', teamCode: 'Bosnia & Herzegovina', flag: '🇧🇦', rank: 65, cls: 'D',
    hero: 'Darwin Núñez', heroNation: 'Uruguay', heroTop10: false, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/darwin.jpg',
    heroInitials: 'DN',
  },
  {
    name: 'Jacko',
    team: 'Argentina', teamCode: 'Argentina', flag: '🇦🇷', rank: 3, cls: 'A',
    hero: 'Erling Haaland', heroNation: 'Norway', heroTop10: false, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/haaland.jpg',
    heroInitials: 'EH',
  },
  {
    name: 'XIN',
    team: 'Japan', teamCode: 'Japan', flag: '🇯🇵', rank: 18, cls: 'B',
    hero: 'Alexander Sørloth', heroNation: 'Norway', heroTop10: false, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/sorloth.jpg',
    heroInitials: 'AS',
  },
  {
    name: 'YQ',
    team: 'Netherlands', teamCode: 'Netherlands', flag: '🇳🇱', rank: 8, cls: 'A',
    hero: 'Kylian Mbappé', heroNation: 'France', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/mbappe.jpg',
    heroInitials: 'KM',
  },
  {
    // Croatia updated to #11 per April 1 2026 FIFA rankings — now Class B (5pts/win, better for EZ!)
    name: 'EZ',
    team: 'Croatia', teamCode: 'Croatia', flag: '🇭🇷', rank: 11, cls: 'B',
    hero: 'Lamine Yamal', heroNation: 'Spain', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/yamal.jpg',
    heroInitials: 'LY',
  },
  {
    name: 'YR',
    team: 'Spain', teamCode: 'Spain', flag: '🇪🇸', rank: 2, cls: 'A',
    hero: 'Cristiano Ronaldo', heroNation: 'Portugal', heroTop10: true, isCR7: true,
    heroGoals: 0,
    heroImg: 'img/ronaldo.jpg',
    heroInitials: 'CR',
  },
  {
    name: 'Changbeer',
    team: 'Brazil', teamCode: 'Brazil', flag: '🇧🇷', rank: 6, cls: 'A',
    hero: 'Cristiano Ronaldo', heroNation: 'Portugal', heroTop10: true, isCR7: true,
    heroGoals: 0,
    heroImg: 'img/ronaldo.jpg',
    heroInitials: 'CR',
  },
  {
    name: 'Tatt',
    team: 'England', teamCode: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', rank: 4, cls: 'A',
    hero: 'Kylian Mbappé', heroNation: 'France', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/mbappe.jpg',
    heroInitials: 'KM',
  },
  {
    name: 'SC',
    team: 'Portugal', teamCode: 'Portugal', flag: '🇵🇹', rank: 5, cls: 'A',
    hero: 'Lamine Yamal', heroNation: 'Spain', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/yamal.jpg',
    heroInitials: 'LY',
  },
  {
    name: 'Ashraf',
    team: 'Spain', teamCode: 'Spain', flag: '🇪🇸', rank: 2, cls: 'A',
    hero: 'Kylian Mbappé', heroNation: 'France', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/mbappe.jpg',
    heroInitials: 'KM',
  },
  {
    name: 'Art',
    team: 'Portugal', teamCode: 'Portugal', flag: '🇵🇹', rank: 5, cls: 'A',
    hero: 'Kylian Mbappé', heroNation: 'France', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/mbappe.jpg',
    heroInitials: 'KM',
  },
  {
    // NOTE: Italy did NOT qualify for WC2026 and Agüero is retired — pick is invalid, needs repick.
    name: 'Joker',
    team: 'Italy (invalid)', teamCode: 'Italy', flag: '🇮🇹', rank: 0, cls: 'A',
    hero: 'Agüero (retired)', heroNation: 'Argentina', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/aguero.jpg',
    heroInitials: 'SA',
  },
  {
    name: 'Zhunny',
    team: 'Türkiye', teamCode: 'Turkey', flag: '🇹🇷', rank: 22, cls: 'C',
    hero: 'Luis Díaz', heroNation: 'Colombia', heroTop10: false, isCR7: false,
    heroGoals: 0,
    heroImg: 'img/luisdiaz.jpg',
    heroInitials: 'LD',
  },
];

// ============================================================
// SCORING CONFIG
// ============================================================
const SCORING = {
  A: { win: 3,  draw: 1,   loss: 0 },
  B: { win: 5,  draw: 1.5, loss: 0 },
  C: { win: 8,  draw: 3,   loss: 0 },
  D: { win: 15, draw: 5,   loss: 0 },
};

function calcHeroPoints(player) {
  if (player.heroGoals === 0) return 0;
  let ptsPerGoal = player.isCR7 ? 1.5 : 1;
  if (!player.heroTop10) ptsPerGoal += 1; // non-top-10 nation bonus
  return player.heroGoals * ptsPerGoal;
}

// UTC offset mapping for each venue city → MYT (UTC+8)
// All API times are local venue time with UTC offset noted
// MYT = UTC+8, so we add hours to get from venue local to MYT
// Mexico City = UTC-6, so +14 to get MYT
// US Eastern = UTC-4/5, so +12/13 to get MYT
// Vancouver/Toronto = UTC-7/4
// The API time format: "13:00 UTC-6"
function convertToMYT(timeStr, dateStr) {
  if (!timeStr) return 'TBC';
  try {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*UTC([+-]\d+)/);
    if (!match) return timeStr.replace(/UTC[+-]\d+/,'').trim();
    const h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const offset = parseInt(match[3]); // e.g. -6
    // Convert to UTC then to MYT (UTC+8)
    const utcH = h - offset;
    const mytH = utcH + 8;
    // Handle day overflow — just show time
    const finalH = ((mytH % 24) + 24) % 24;
    const ampm = finalH >= 12 ? 'PM' : 'AM';
    const h12 = finalH === 0 ? 12 : finalH > 12 ? finalH - 12 : finalH;
    return `${h12}:${String(m).padStart(2,'0')} ${ampm} MYT`;
  } catch { return timeStr; }
}
