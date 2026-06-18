// ============================================================
// KNOCKOUT BRACKET — PREVIEW ONLY (gated behind ?preview=laksa)
// Two view styles to compare: A = round columns, B = scrollable tree.
// Uses SAMPLE teams so layout can be judged before real teams exist.
// At launch: swap SAMPLE_BRACKET for live feed data + remove the gate.
// ============================================================

(function () {
  const PREVIEW = new URLSearchParams(location.search).get('preview') === 'laksa';
  if (!PREVIEW) return; // invisible to everyone without the secret flag

  // Participant teams (highlighted in the bracket)
  const MINE = ['Portugal','Argentina','Brazil','Spain','England','Netherlands',
    'Croatia','Japan','Iran','Sweden','Bosnia & Herzegovina','Morocco','Türkiye'];
  const isMine = t => MINE.some(m => m.toLowerCase().slice(0,5) === (t||'').toLowerCase().slice(0,5));

  const FLAG = {
    Argentina:'🇦🇷',Brazil:'🇧🇷',Spain:'🇪🇸',Portugal:'🇵🇹',England:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',France:'🇫🇷',
    Netherlands:'🇳🇱',Croatia:'🇭🇷',Germany:'🇩🇪',Japan:'🇯🇵',Iran:'🇮🇷',Sweden:'🇸🇪',Morocco:'🇲🇦',
    'Türkiye':'🇹🇷',Belgium:'🇧🇪',Uruguay:'🇺🇾',Colombia:'🇨🇴',Mexico:'🇲🇽',USA:'🇺🇸',Senegal:'🇸🇳',
    Switzerland:'🇨🇭',Denmark:'🇩🇰',Ecuador:'🇪🇨',Nigeria:'🇳🇬','South Korea':'🇰🇷',Australia:'🇦🇺',
    Norway:'🇳🇴',Egypt:'🇪🇬',Canada:'🇨🇦',Qatar:'🇶🇦',Ghana:'🇬🇭','Bosnia & Herzegovina':'🇧🇦',
  };
  const flag = t => FLAG[t] || '⚽';

  // SAMPLE 32-team bracket. Each match: [teamA, teamB, scoreA, scoreB] (scores
  // null = not played). Winners are pre-filled so the tree looks alive.
  const R32 = [
    ['Argentina','Australia',2,0],['Switzerland','Mexico',1,2],
    ['Spain','Morocco',0,1],['Portugal','Uruguay',3,1],
    ['Brazil','Senegal',2,1],['Netherlands','Ecuador',2,0],
    ['England','Japan',1,0],['France','Nigeria',3,2],
    ['Germany','Croatia',1,2],['Belgium','Norway',0,1],
    ['Colombia','Iran',2,1],['Denmark','Sweden',1,2],
    ['USA','Ghana',2,1],['Qatar','Türkiye',0,1],
    ['Egypt','South Korea',1,2],['Canada','Bosnia & Herzegovina',1,3],
  ];
  // Derive subsequent rounds from winners
  function winner(m){ return m[2]>m[3] ? m[0] : m[1]; }
  function buildNextRound(prev){
    const out=[];
    for(let i=0;i<prev.length;i+=2){
      out.push([winner(prev[i]), winner(prev[i+1]), null, null]);
    }
    return out;
  }
  // Pre-fill scores for a plausible filled bracket (preview realism)
  function fill(round, results){ results.forEach((r,i)=>{ round[i][2]=r[0]; round[i][3]=r[1]; }); return round; }

  let R16 = buildNextRound(R32);
  R16 = fill(R16, [[2,1],[1,0],[2,0],[1,2],[3,1],[1,1],[0,2],[2,1]]);
  // tiebreak: if equal, first team advances (sample only)
  function winner2(m){ return m[2]>=m[3] ? m[0] : m[1]; }
  function buildNext2(prev){const out=[];for(let i=0;i<prev.length;i+=2)out.push([winner2(prev[i]),winner2(prev[i+1]),null,null]);return out;}

  let QF = buildNext2(R16); QF = fill(QF, [[2,1],[1,0],[2,2],[1,3]]);
  let SF = buildNext2(QF); SF = fill(SF, [[1,0],[2,1]]);
  let FIN = buildNext2(SF); FIN = fill(FIN, [[2,1]]);

  const ROUNDS = [
    { name:'Round of 32', short:'R32', matches:R32 },
    { name:'Round of 16', short:'R16', matches:R16 },
    { name:'Quarter-finals', short:'QF', matches:QF },
    { name:'Semi-finals', short:'SF', matches:SF },
    { name:'Final', short:'Final', matches:FIN },
  ];

  // ---- Reveal the preview tab ----
  document.addEventListener('DOMContentLoaded', initPreview);
  if (document.readyState !== 'loading') initPreview();

  let booted = false;
  function initPreview(){
    if (booted) return; booted = true;
    const tabBtn = document.getElementById('tab-btn-bracket');
    const panel = document.getElementById('tab-bracket');
    if (!tabBtn || !panel) return;
    tabBtn.style.display = '';
    renderBracketPanel(panel);
  }

  function renderBracketPanel(panel){
    panel.innerHTML = `
      <div class="bk-previewbar">PREVIEW · sample teams · only you can see this</div>
      <h2 class="section-title">Knockout Tree</h2>
      <div id="bk-body"></div>
    `;
    const body = panel.querySelector('#bk-body');
    renderTree(body);
  }

  // small match-card HTML (shared)
  function matchCard(m){
    const [a,b,sa,sb]=m;
    const played = sa!==null;
    const aWin = played && sa>sb, bWin = played && sb>sa;
    return `
      <div class="bk-card">
        <div class="bk-row ${isMine(a)?'mine':''} ${aWin?'win':''}">
          <span class="bk-flag">${flag(a)}</span>
          <span class="bk-team">${a}</span>
          <span class="bk-score">${played?sa:''}</span>
        </div>
        <div class="bk-row ${isMine(b)?'mine':''} ${bWin?'win':''}">
          <span class="bk-flag">${flag(b)}</span>
          <span class="bk-team">${b}</span>
          <span class="bk-score">${played?sb:''}</span>
        </div>
      </div>`;
  }

  // ---- Bracket tree: horizontal scrollable, connecting lines + zoom ----
  let zoom = 0.62;
  function renderTree(body){
    const CARD_W=128, CARD_H=52, COL_GAP=46, V_GAP=14;
    const n32 = R32.length;
    const slotH = CARD_H + V_GAP;            // vertical pitch of an R32 card
    const totalH = n32*slotH;                 // full bracket height (R32 defines it)
    const colW = CARD_W + COL_GAP;

    // y-centre of each match in each round
    const centers = [];
    centers[0] = R32.map((_,i)=> i*slotH + slotH/2);
    for (let r=1; r<ROUNDS.length; r++){
      centers[r] = [];
      for (let i=0;i<ROUNDS[r].matches.length;i++){
        const c1=centers[r-1][i*2], c2=centers[r-1][i*2+1];
        centers[r].push((c1+c2)/2);
      }
    }
    const totalW = ROUNDS.length*colW;

    // build cards (absolute positioned) + SVG connectors
    let cards='';
    ROUNDS.forEach((round,r)=>{
      const x = r*colW;
      round.matches.forEach((m,i)=>{
        const cy = centers[r][i];
        cards += `<div class="bk-tcard" style="left:${x}px;top:${cy-CARD_H/2}px;width:${CARD_W}px">${matchCard(m)}</div>`;
      });
    });
    // connectors: from each match right edge to its child left edge
    let lines='';
    for (let r=0;r<ROUNDS.length-1;r++){
      const x1 = r*colW + CARD_W;
      const x2 = (r+1)*colW;
      const xm = (x1+x2)/2;
      ROUNDS[r].matches.forEach((m,i)=>{
        const y1 = centers[r][i];
        const childIdx = Math.floor(i/2);
        const y2 = centers[r+1][childIdx];
        lines += `<path d="M${x1} ${y1} H${xm} V${y2} H${x2}" fill="none" stroke="#5f5e5a" stroke-width="1"/>`;
      });
    }
    // round headers
    let heads='';
    ROUNDS.forEach((round,r)=>{
      heads += `<div class="bk-thead" style="left:${r*colW}px;width:${CARD_W}px">${round.short}</div>`;
    });

    body.innerHTML = `
      <div class="bk-zoombar">
        <button class="bk-zbtn" data-z="out">−</button>
        <button class="bk-zbtn" data-z="fit">Fit</button>
        <button class="bk-zbtn" data-z="in">＋</button>
        <span class="bk-zhint">swipe to pan · pinch or buttons to zoom</span>
      </div>
      <div class="bk-scroll" id="bk-scroll">
        <div class="bk-stage" id="bk-stage" style="width:${totalW}px;height:${totalH+30}px;transform:scale(${zoom});">
          <div class="bk-heads">${heads}</div>
          <svg class="bk-lines" width="${totalW}" height="${totalH+30}" style="top:30px">${lines}</svg>
          <div class="bk-cards" style="top:30px">${cards}</div>
        </div>
      </div>`;

    const scroll = body.querySelector('#bk-scroll');
    const stage = body.querySelector('#bk-stage');
    function applyZoom(){
      stage.style.transform = `scale(${zoom})`;
      stage.style.width = (totalW*zoom)+'px';
      stage.style.height = ((totalH+30)*zoom)+'px';
    }
    applyZoom();
    body.querySelectorAll('.bk-zbtn').forEach(b=>{
      b.addEventListener('click', ()=>{
        const z=b.dataset.z;
        if(z==='in') zoom=Math.min(1.1, zoom+0.15);
        else if(z==='out') zoom=Math.max(0.3, zoom-0.15);
        else { // fit width
          const avail = scroll.clientWidth - 8;
          zoom = Math.max(0.3, Math.min(1.1, avail/totalW));
        }
        applyZoom();
      });
    });
    // pinch-to-zoom (two-finger)
    let pinchDist=0, pinchStart=zoom;
    scroll.addEventListener('touchstart', e=>{
      if(e.touches.length===2){ pinchDist=dist(e.touches); pinchStart=zoom; }
    },{passive:true});
    scroll.addEventListener('touchmove', e=>{
      if(e.touches.length===2 && pinchDist){
        const r=dist(e.touches)/pinchDist;
        zoom=Math.max(0.3, Math.min(1.2, pinchStart*r));
        applyZoom();
      }
    },{passive:true});
    scroll.addEventListener('touchend', ()=>{ pinchDist=0; });
    function dist(t){const dx=t[0].clientX-t[1].clientX, dy=t[0].clientY-t[1].clientY; return Math.hypot(dx,dy);}
  }
})();
