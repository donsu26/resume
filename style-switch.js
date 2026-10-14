/* Fallback glitch for browsers without cross-document view transitions (e.g. Firefox). */
(function () {
  var native = 'onpagereveal' in window;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  if (native || reduce) return;

  try {
    if (sessionStorage.getItem('ss-glitch') === '1') {
      sessionStorage.removeItem('ss-glitch');
      root.classList.add('ss-entering');
      setTimeout(function () { root.classList.remove('ss-entering'); }, 750);
    }
  } catch (e) {}

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.styleswitch a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    try { sessionStorage.setItem('ss-glitch', '1'); } catch (err) {}
    root.classList.add('ss-leaving');
    setTimeout(function () { location.href = a.href; }, 360);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('ss-leaving'); });
})();
