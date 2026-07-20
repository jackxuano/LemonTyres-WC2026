// ============================================================
// RESULT OVERRIDES — temporary bridge for results the openfootball
// feed hasn't published yet.
//
// HOW IT WORKS: intercepts the worldcup.json fetch and fills in ONLY
// the matches listed below, and ONLY if the feed has no full-time score
// for them. The moment the feed publishes the real result, every rule
// below becomes a no-op automatically — nothing to undo, nothing to
// re-push. Safe to leave in place forever.
//
// MUST load AFTER data.js and BEFORE app.js / bracket.js.
// ============================================================
(function () {

  // num -> result. ft = 90 minutes (this is what Lemon scoring uses).
  // et/p are recorded for display only; they never affect points.
  var OVERRIDES = {
    // Final · Spain 1-0 Argentina (a.e.t.) · Ferran Torres 106'
    // 0-0 at 90 minutes, so under Lemon KO rules this is a DRAW for both.
    104: {
      ft: [0, 0],
      et: [1, 0],
      goals1: [{ name: 'Ferran Torres', minute: 106 }]
    }
  };

  var applied = [];

  function patch(data) {
    if (!data || !data.matches) return data;
    data.matches.forEach(function (m) {
      var o = OVERRIDES[m.num];
      if (!o) return;                              // not an overridden match
      if (m.score && m.score.ft) return;           // feed has published it — leave it alone
      var s = { ft: o.ft.slice() };
      if (o.ht) s.ht = o.ht.slice();
      if (o.et) s.et = o.et.slice();
      if (o.p) s.p = o.p.slice();
      m.score = s;
      if (o.goals1) m.goals1 = o.goals1.slice();
      if (o.goals2) m.goals2 = o.goals2.slice();
      applied.push(m.num);
    });
    if (applied.length) {
      console.info('[overrides] filled in match(es):', applied.join(', '),
                   '— will self-disable once the feed publishes them.');
    }
    return data;
  }

  var origFetch = window.fetch;
  if (typeof origFetch !== 'function') return;     // nothing to patch

  window.fetch = function (input, init) {
    var url = '';
    try { url = (typeof input === 'string') ? input : (input && input.url) || ''; } catch (e) { url = ''; }
    var p = origFetch.apply(this, arguments);
    if (!/worldcup\.json/i.test(url)) return p;    // every other request untouched

    return p.then(function (res) {
      if (!res || !res.ok) return res;
      return res.clone().json().then(function (data) {
        var out = JSON.stringify(patch(data));
        return new Response(out, {
          status: res.status,
          statusText: res.statusText,
          headers: { 'Content-Type': 'application/json' }
        });
      }).catch(function () { return res; });       // any parse issue -> original response
    });
  };

  window.ResultOverrides = { map: OVERRIDES, applied: applied };
})();
