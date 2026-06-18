// ============================================================
// ARCADE CONTROLLER — the "Games" tab
// Collects games registered on window.ARCADE and shows them under one
// tab with a sub-menu. Gating: a game appears in production only if
// its `live` flag is true; in preview (?preview=laksa) ALL games show.
// To launch a game to the group: set its live:true in its file + push.
// ============================================================
(function () {
  const PREVIEW = new URLSearchParams(location.search).get('preview') === 'laksa';

  function init() {
    const reg = (window.ARCADE && window.ARCADE.games) || [];
    const visible = reg.filter(g => g.live || PREVIEW);
    const tabBtn = document.getElementById('tab-btn-games');
    const panel = document.getElementById('tab-games');
    if (!tabBtn || !panel) return;

    // No games to show (none live, not in preview) → keep the tab hidden
    if (!visible.length) { tabBtn.style.display = 'none'; return; }
    tabBtn.style.display = '';

    const anyHidden = visible.some(g => !g.live);
    panel.innerHTML = `
      ${PREVIEW && anyHidden ? '<div class="bk-previewbar">PREVIEW · games marked NEW are hidden from the group</div>' : ''}
      ${visible.length > 1 ? `<div class="arc-nav">${visible.map(g =>
        `<button class="arc-btn" data-id="${g.id}">${g.label}${(!g.live && PREVIEW) ? ' <span class="arc-new">NEW</span>' : ''}</button>`).join('')}</div>` : ''}
      <div class="arc-stage" id="arc-stage"></div>`;

    const stage = panel.querySelector('#arc-stage');
    const btns = {};
    panel.querySelectorAll('.arc-btn').forEach(b => { btns[b.dataset.id] = b; });

    // one container per game, built lazily on first view
    visible.forEach(g => {
      const d = document.createElement('div');
      d.className = 'arc-game'; d.style.display = 'none';
      stage.appendChild(d); g._el = d;
    });

    let current = null;
    function select(g) {
      if (current === g) return;
      if (current) {
        current._el.style.display = 'none';
        if (current.hide) current.hide();
        if (current._el._stop) current._el._stop();
        if (btns[current.id]) btns[current.id].classList.remove('active');
      }
      current = g;
      g._el.style.display = '';
      if (!g._built) { g.build(g._el); g._built = true; }
      if (g.show) g.show();
      if (btns[g.id]) btns[g.id].classList.add('active');
    }
    visible.forEach(g => { if (btns[g.id]) btns[g.id].addEventListener('click', () => select(g)); });
    select(visible[0]);
  }

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
})();
