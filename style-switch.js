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

  function playFallback() {
    if (reduce) return;
    root.classList.add('ss-entering');
    setTimeout(function () { root.classList.remove('ss-entering'); }, 750);
  }

  if (native) {
    window.addEventListener('pagereveal', function (e) {
      var had = apply();
      if (!had) return;
      // came here through the switcher: if the browser skipped its own transition
      // (slow stylesheets, timeouts, ...) play the scripted glitch instead
      if (!e.viewTransition) { playFallback(); return; }
      e.viewTransition.ready.catch(playFallback);
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

  var canHover = window.matchMedia && matchMedia('(hover: hover)').matches;

  // shrink the switcher after a moment; hovering (or a first tap on touch screens) restores it
  var nav = null, miniTimer = null;
  function shrinkLater(ms) {
    clearTimeout(miniTimer);
    miniTimer = setTimeout(function () { if (nav) nav.classList.add('ss-mini'); }, ms);
  }
  function grow() { if (nav) nav.classList.remove('ss-mini'); }
  document.addEventListener('DOMContentLoaded', function () {
    nav = document.querySelector('.styleswitch');
    if (!nav) return;
    setupSwipe(nav);
    if (!canHover || innerWidth <= 640) return;  // phones / touch: keep it static
    shrinkLater(3500);
    nav.addEventListener('mouseenter', function () { clearTimeout(miniTimer); });
    nav.addEventListener('mouseleave', function () { grow(); shrinkLater(2000); });
    nav.addEventListener('focusin', function () { clearTimeout(miniTimer); grow(); });
    nav.addEventListener('focusout', function () { shrinkLater(2000); });
  });

  // swipe left / right on the switcher to move to the next / previous style
  var swiped = false;
  function go(a) {
    save(a.querySelector('.win') || a);
    if (native || reduce) { location.href = a.href; return; }
    root.classList.add('ss-leaving');
    setTimeout(function () { location.href = a.href; }, 360);
  }
  function setupSwipe(nav) {
    var sx = 0, sy = 0, tracking = false;
    nav.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      tracking = true; swiped = false; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    nav.addEventListener('touchend', function (e) {
      if (!tracking) return; tracking = false;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      var items = [].slice.call(nav.querySelectorAll('.sw'));
      var cur = items.findIndex(function (x) { return x.hasAttribute('aria-current'); });
      if (cur < 0) return;
      var next = items[(cur + (dx < 0 ? 1 : -1) + items.length) % items.length];
      if (!next || !next.getAttribute('href')) return;
      swiped = true; setTimeout(function () { swiped = false; }, 600);
      go(next);
    }, { passive: true });
  }

  document.addEventListener('click', function (e) {
    var inNav = e.target.closest && e.target.closest('.styleswitch');
    if (inNav && swiped) { e.preventDefault(); return; }
    if (inNav && !canHover && inNav.classList.contains('ss-mini')) {
      e.preventDefault(); grow(); shrinkLater(4000); return;
    }
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
