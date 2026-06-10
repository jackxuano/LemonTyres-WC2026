// ============================================================
// LEMON TYRES WC 2026 — PLAYER DATA
// Update heroGoals manually after each match
// ============================================================

const PLAYERS = [
  {
    name: 'Teck',
    team: 'Portugal', teamCode: 'Portugal', flag: '🇵🇹', rank: 5, cls: 'A',
    hero: 'Lautaro Martinez', heroNation: 'Argentina', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Lautaro_Mart%C3%ADnez_2022_%28cropped%29.jpg/240px-Lautaro_Mart%C3%ADnez_2022_%28cropped%29.jpg',
    heroInitials: 'LM',
  },
  {
    name: 'Raja Eng',
    team: 'Iran', teamCode: 'Iran', flag: '🇮🇷', rank: 21, cls: 'B',
    hero: 'Vinícius Júnior', heroNation: 'Brazil', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Vinicius_Junior_2022_WC.jpg/240px-Vinicius_Junior_2022_WC.jpg',
    heroInitials: 'VJ',
  },
  {
    name: 'BJ',
    team: 'Japan', teamCode: 'Japan', flag: '🇯🇵', rank: 18, cls: 'B',
    hero: 'Marcus Rashford', heroNation: 'England', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Marcus_Rashford_2018.jpg/240px-Marcus_Rashford_2018.jpg',
    heroInitials: 'MR',
  },
  {
    name: 'Siang',
    team: 'Sweden', teamCode: 'Sweden', flag: '🇸🇪', rank: 38, cls: 'C',
    hero: 'Bruno Fernandes', heroNation: 'Portugal', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Bruno_Fernandes_-_2020_%28cropped%29.jpg/240px-Bruno_Fernandes_-_2020_%28cropped%29.jpg',
    heroInitials: 'BF',
  },
  {
    name: 'Zhecko',
    team: 'Bosnia', teamCode: 'Bosnia & Herzegovina', flag: '🇧🇦', rank: 65, cls: 'D',
    hero: 'Darwin Núñez', heroNation: 'Uruguay', heroTop10: false, isCR7: false,
    heroGoals: 0,
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Darwin_N%C3%BA%C3%B1ez_2022.jpg/240px-Darwin_N%C3%BA%C3%B1ez_2022.jpg',
    heroInitials: 'DN',
  },
  {
    name: 'Jacko',
    team: 'Argentina', teamCode: 'Argentina', flag: '🇦🇷', rank: 3, cls: 'A',
    hero: 'Erling Haaland', heroNation: 'Norway', heroTop10: false, isCR7: false,
    heroGoals: 0,
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Erling_Haaland_2023_%28cropped%29.jpg/240px-Erling_Haaland_2023_%28cropped%29.jpg',
    heroInitials: 'EH',
  },
  {
    name: 'XIN',
    team: 'Japan', teamCode: 'Japan', flag: '🇯🇵', rank: 18, cls: 'B',
    hero: 'Alexander Sørloth', heroNation: 'Norway', heroTop10: false, isCR7: false,
    heroGoals: 0,
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Alexander_S%C3%B8rloth_2023_%28cropped%29.jpg/240px-Alexander_S%C3%B8rloth_2023_%28cropped%29.jpg',
    heroInitials: 'AS',
  },
  {
    name: 'YQ',
    team: 'Netherlands', teamCode: 'Netherlands', flag: '🇳🇱', rank: 7, cls: 'A',
    hero: 'Kylian Mbappé', heroNation: 'France', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_FC_by_Sandro_Halank%E2%80%93149_%28cropped%29.jpg/240px-2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_FC_by_Sandro_Halank%E2%80%93149_%28cropped%29.jpg',
    heroInitials: 'KM',
  },
  {
    name: 'EZ',
    team: 'Croatia', teamCode: 'Croatia', flag: '🇭🇷', rank: 10, cls: 'A',
    hero: 'Lamine Yamal', heroNation: 'Spain', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Lamine_Yamal_2024_%28cropped%29.jpg/240px-Lamine_Yamal_2024_%28cropped%29.jpg',
    heroInitials: 'LY',
  },
  {
    name: 'YR',
    team: 'Spain', teamCode: 'Spain', flag: '🇪🇸', rank: 2, cls: 'A',
    hero: 'Cristiano Ronaldo', heroNation: 'Portugal', heroTop10: true, isCR7: true,
    heroGoals: 0,
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Cristiano_Ronaldo_WC2022_-_01.jpg/240px-Cristiano_Ronaldo_WC2022_-_01.jpg',
    heroInitials: 'CR',
  },
  {
    name: 'Changbeer',
    team: 'Brazil', teamCode: 'Brazil', flag: '🇧🇷', rank: 6, cls: 'A',
    hero: 'Cristiano Ronaldo', heroNation: 'Portugal', heroTop10: true, isCR7: true,
    heroGoals: 0,
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Cristiano_Ronaldo_WC2022_-_01.jpg/240px-Cristiano_Ronaldo_WC2022_-_01.jpg',
    heroInitials: 'CR',
  },
  {
    name: 'Tatt',
    team: 'England', teamCode: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', rank: 4, cls: 'A',
    hero: 'Kylian Mbappé', heroNation: 'France', heroTop10: true, isCR7: false,
    heroGoals: 0,
    heroImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_FC_by_Sandro_Halank%E2%80%93149_%28cropped%29.jpg/240px-2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_FC_by_Sandro_Halank%E2%80%93149_%28cropped%29.jpg',
    heroInitials: 'KM',
  },
];

// ============================================================
// SCORING CONFIG
// ============================================================
const SCORING = {
  A: { win: 3, draw: 1, loss: 0 },
  B: { win: 5, draw: 1.5, loss: 0 },
  C: { win: 8, draw: 3, loss: 0 },
  D: { win: 15, draw: 5, loss: 0 },
};

function calcHeroPoints(player) {
  if (player.heroGoals === 0) return 0;
  let ptsPerGoal = player.isCR7 ? 1.5 : 1;
  if (!player.heroTop10) ptsPerGoal += 1;
  return player.heroGoals * ptsPerGoal;
}
