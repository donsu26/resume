/* Style switcher behaviour (loaded in <head>, not deferred, so the pagereveal
   listener is in place before the first render of the new page). */
(function () {
  var root = document.documentElement;
  var native = 'onpagereveal' in window;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY = 'ss-portal';

  function save(win) {
    var r = win.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
    var s = r.width / vw;                       // uniform scale: page width -> window width
    var shownH = r.height / s;                  // how much page height fits in the window
    var cb = Math.max(0, (1 - shownH / vh) * 100);
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ x: r.left, y: r.top, s: s, cb: cb, t: Date.now() }));
    } catch (e) {}
  }
  function apply() {
    var d = null;
    try { d = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (e) {}
    if (!d || Date.now() - d.t > 8000) return false;
    root.style.setProperty('--ss-x', d.x + 'px');
    root.style.setProperty('--ss-y', d.y + 'px');
    root.style.setProperty('--ss-s', String(d.s));
    root.style.setProperty('--ss-cb', d.cb + '%');
    return true;
  }

  if (native) {
    window.addEventListener('pagereveal', function (e) {
      var had = apply();
      if (!had && e.viewTransition) {
        // back/forward or other links: no window to grow from, start small in the centre
        root.style.removeProperty('--ss-x');
      }
    });
  } else if (!reduce) {
    try {
      if (sessionStorage.getItem(KEY)) {
        sessionStorage.removeItem(KEY);
        root.classList.add('ss-entering');
        setTimeout(function () { root.classList.remove('ss-entering'); }, 750);
      }
    } catch (e) {}
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.styleswitch a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var win = a.querySelector('.win') || a;
    save(win);
    if (native || reduce) return;              // the browser animates the native transition
    e.preventDefault();
    root.classList.add('ss-leaving');
    setTimeout(function () { location.href = a.href; }, 360);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('ss-leaving'); });

  // every so often one of the windows flickers, like a bad signal
  if (!reduce) {
    document.addEventListener('DOMContentLoaded', function () {
      var wins = [].slice.call(document.querySelectorAll('.styleswitch .sw[href] .win'));
      if (!wins.length) return;
      (function tick() {
        setTimeout(function () {
          if (!document.hidden) {
            var w = wins[Math.floor(Math.random() * wins.length)];
            w.classList.add('zap');
            setTimeout(function () { w.classList.remove('zap'); }, 560);
          }
          tick();
        }, 3500 + Math.random() * 4500);
      })();
    });
  }
})();
