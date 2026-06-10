# 🏆 Lemon Tyres WC 2026 — Fantasy Game

CR7 Edition · 11 Players · Est. 2020

## Files

```
index.html    — main page
style.css     — all styling
data.js       — player picks + hero goals (UPDATE THIS during tournament)
app.js        — scoring logic + API fetch
logo.jpeg     — Lemon Tyres FC logo
```

## Updating scores during the tournament

Open `data.js` and update `heroGoals` for each player's hero after they score:

```js
{
  name: 'Jacko',
  hero: 'Erling Haaland',
  heroGoals: 2,   // ← update this after each goal
  ...
}
```

Team points (wins/draws) are pulled automatically from the free API.

## Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `lemon-tyres-wc2026`)
2. Upload all files to the repo root
3. Go to Settings → Pages → Source → Deploy from branch → main → / (root)
4. Your site will be live at `https://yourusername.github.io/lemon-tyres-wc2026`

## Deploy to Vercel (recommended — faster, no CORS issues)

1. Push files to GitHub repo
2. Go to vercel.com → Sign in with GitHub
3. Click "Add New Project" → Import your repo → Deploy
4. Done — live URL in seconds

## Data source

Team fixtures and results: https://github.com/openfootball/worldcup.json
Free, no API key, updates during tournament.

## Scoring rules

| Class | Team rank | Win | Draw | Loss |
|-------|-----------|-----|------|------|
| A | Top 10 | 3 | 1 | 0 |
| B | 11–20 | 5 | 1.5 | 0 |
| C | 21–43 | 8 | 3 | 0 |
| D | 44+ | 15 | 5 | 0 |

Hero goals: 1pt each. Non-top-10 nation: +1 bonus. CR7: 1.5pt each.
ET/Pen win = Draw. Tiebreak: hero goals → co-winner.
