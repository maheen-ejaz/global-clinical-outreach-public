/* Progressive motion: every section is readable before, during and without JS. */
(() => {
  const root = document.querySelector('.gc-clinical-partnerships');
  if (!root || typeof window.IntersectionObserver !== 'function' ||
      typeof Element.prototype.animate !== 'function' || typeof window.matchMedia !== 'function') return;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (typeof preference.addEventListener !== 'function') return;
  const seen = new WeakSet();
  const active = new Set();
  const style = getComputedStyle(root);
  const distance = style.getPropertyValue('--space-1').trim() || '4px';
  const duration = parseFloat(style.getPropertyValue('--gc-motion-section')) || 420;
  const easing = style.getPropertyValue('--gc-ease-out').trim() || 'cubic-bezier(0.4, 0, 0.2, 1)';
  let observer;

  const stop = () => {
    observer?.disconnect();
    observer = null;
    active.forEach(animation => animation.cancel());
    active.clear();
  };

  const start = () => {
    stop();
    if (preference.matches || document.hidden) return;
    const sections = [...root.querySelectorAll('main > .gc-card')].filter(section => !seen.has(section));
    if (!sections.length) return;
    let remaining = sections.length;
    const watcher = new IntersectionObserver(entries => {
      if (observer !== watcher || preference.matches || document.hidden) return;
      entries.forEach(entry => {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        watcher.unobserve(entry.target);
        remaining -= 1;
        // Keep keyboard targets stable while a reader is interacting with them.
        if (!entry.target.contains(document.activeElement)) {
          const animation = entry.target.animate(
            [{ transform: `translateY(${distance})` }, { transform: 'translateY(0)' }],
            { id: 'gc-partnership-section', duration, easing, iterations: 1, fill: 'none' }
          );
          active.add(animation);
          const done = () => active.delete(animation);
          animation.finished.then(done, done);
        }
        if (!remaining) watcher.disconnect();
      });
    }, { threshold: 0.08 });
    observer = watcher;
    sections.forEach(section => watcher.observe(section));
  };

  preference.addEventListener('change', start);
  document.addEventListener('visibilitychange', start);
  root.addEventListener('focusin', event => {
    const section = event.target.closest?.('main > .gc-card');
    active.forEach(animation => {
      if (animation.effect?.target === section) {
        animation.cancel();
        active.delete(animation);
      }
    });
  });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', event => { if (event.persisted) start(); });
  start();
})();
