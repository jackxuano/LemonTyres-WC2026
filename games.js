// ============================================================
// ARCADE CONTROLLER — the "Games" tab
// Hosts all games under one tab with a sub-menu.
//  - Lemon-Timbang is a STATIC game: its existing markup (#timbang-content,
//    driven by game.js) is relocated into the Games tab. Live for all.
//  - Shoot-out / Sprint / Glove Up are DYNAMIC games registered on
//    window.ARCADE; built on first view; live flag gates them.
// Gating: a game shows in production only if live:true; in preview
// (?preview=laksa) ALL games show. To launch: set live:true + push.
// ============================================================
(function () {
  const PREVIEW = new URLSearchParams(location.search).get('preview') === 'laksa';

  function init() {
    const tabBtn = document.getElementById('tab-btn-games');
    const panel = document.getElementById('tab-games');
    if (!tabBtn || !panel) return;

    const staticGames = [{ id: 'timbang', label: 'Lemon-Timbang', live: true, staticEl: 'timbang-content' }];
    const dynamic = (window.ARCADE && window.ARCADE.games) || [];
    const all = staticGames.concat(dynamic);
    const visible = all.filter(g => g.live || PREVIEW);

    if (!visible.length) { tabBtn.style.display = 'none'; return; }
    tabBtn.style.display = '';

    const anyHidden = visible.some(g => !g.live);
    panel.innerHTML =
      (PREVIEW && anyHidden ? '<div class="bk-previewbar">PREVIEW \u00b7 includes unreleased games hidden from the group</div>' : '') +
      (visible.length > 1 ? '<div class="arc-nav">' + visible.map(function (g) {
        return '<button class="arc-btn" data-id="' + g.id + '">' + g.label +
          (g.isNew ? '<span class="arc-new">NEW</span>' : '') + '</button>';
      }).join('') + '</div>' : '') +
      '<div class="arc-stage" id="arc-stage"></div>';

    const stage = panel.querySelector('#arc-stage');
    const btns = {};
    panel.querySelectorAll('.arc-btn').forEach(function (b) { btns[b.dataset.id] = b; });

    visible.forEach(function (g) {
      if (g.staticEl) {
        const el = document.getElementById(g.staticEl);
        if (el) { stage.appendChild(el); el.style.display = 'none'; g._el = el; g._built = true; }
      } else {
        const d = document.createElement('div');
        d.className = 'arc-game'; d.style.display = 'none';
        stage.appendChild(d); g._el = d;
      }
    });

    let current = null;
    function select(g) {
      if (current === g || !g._el) return;
      if (current && current._el) {
        current._el.style.display = 'none';
        if (current.hide) current.hide();
        if (current._el._stop) current._el._stop();
        if (btns[current.id]) btns[current.id].classList.remove('active');
      }
      current = g;
      g._el.style.display = '';
      if (!g._built && g.build) { g.build(g._el); g._built = true; }
      if (g.show) g.show();
      if (btns[g.id]) btns[g.id].classList.add('active');
    }
    visible.forEach(function (g) { if (btns[g.id]) btns[g.id].addEventListener('click', function () { select(g); }); });
    select(visible[0]);
  }

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
})();
