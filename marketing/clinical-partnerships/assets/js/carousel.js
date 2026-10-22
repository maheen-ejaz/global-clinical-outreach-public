/* Static examples remain natively scrollable without this optional enhancement. */
(() => {
  const root = document.querySelector('.gc-clinical-partnerships .gc-listing-preview');
  const track = root?.querySelector('.gc-carousel-track');
  const controls = root?.querySelector('[data-carousel-controls]');
  const previous = root?.querySelector('[data-carousel-prev]');
  const next = root?.querySelector('[data-carousel-next]');
  const status = root?.querySelector('[data-carousel-status]');
  if (!track || !controls || !previous || !next || !status) return;
  const cards = [...track.querySelectorAll('.gc-demo-card')];
  if (!cards.length) return;
  if (typeof window.matchMedia !== 'function' || typeof track.scrollTo !== 'function') return;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (typeof preference.addEventListener !== 'function') return;
  let destination = null;
  let frame;
  const maximum = () => Math.max(0, track.scrollWidth - track.clientWidth);
  const update = () => {
    frame = null;
    const left = Math.max(0, track.scrollLeft);
    previous.setAttribute('aria-disabled', String(left <= 1));
    next.setAttribute('aria-disabled', String(left >= maximum() - 1));
    if (destination !== null && Math.abs(left - destination) <= 1) destination = null;
    const edge = track.getBoundingClientRect();
    const visible = cards.flatMap((card, i) => {
      const bounds = card.getBoundingClientRect();
      const shown = Math.max(0, Math.min(edge.right, bounds.right) - Math.max(edge.left, bounds.left));
      return shown >= bounds.width * 0.55 ? [i + 1] : [];
    });
    if (visible.length) {
      const first = visible[0], last = visible.at(-1);
      const label = first === last ? `Showing ${first} of ${cards.length} examples` : `Showing ${first}–${last} of ${cards.length} examples`;
      if (status.textContent !== label) status.textContent = label;
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const move = amount => {
    const base = destination ?? track.scrollLeft;
    destination = Math.max(0, Math.min(maximum(), base + amount));
    track.scrollTo({ left: destination, behavior: preference.matches ? 'instant' : 'smooth' });
    schedule();
  };
  const step = () => cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 16);
  previous.addEventListener('click', () => { if (previous.getAttribute('aria-disabled') !== 'true') move(-step()); });
  next.addEventListener('click', () => { if (next.getAttribute('aria-disabled') !== 'true') move(step()); });
  track.addEventListener('keydown', event => {
    if (event.target !== track || event.altKey || event.ctrlKey || event.metaKey) return;
    const actions = { ArrowLeft: () => move(-step()), ArrowRight: () => move(step()), Home: () => move(-maximum()), End: () => move(maximum()) };
    if (!actions[event.key]) return;
    event.preventDefault();
    actions[event.key]();
  });
  track.addEventListener('scroll', schedule, { passive: true });
  // Offscreen layout can settle after deferred scripts, especially in WebKit.
  window.addEventListener('scroll', schedule, { passive: true });
  root.addEventListener('focusin', update);
  const manual = () => { destination = null; };
  track.addEventListener('pointerdown', manual, { passive: true });
  track.addEventListener('wheel', manual, { passive: true });
  window.addEventListener('resize', () => { destination = null; schedule(); });
  preference.addEventListener('change', () => {
    if (preference.matches) track.scrollTo({ left: track.scrollLeft, behavior: 'instant' });
    destination = null;
    schedule();
  });
  controls.hidden = false;
  update();
  schedule();
})();
