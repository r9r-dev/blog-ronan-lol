// Scroll-driven motion: navbar scrim once you've started reading,
// reading progress bar that tracks the body of an article, and a
// soft "reflow" pulse when the viewport crosses a layout breakpoint
// so the TOC / sidenote reposition doesn't feel like a snap.
// Re-binds on every astro:page-load so soft navigations stay live.

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');
const MQ_1024 = window.matchMedia('(min-width: 1024px)');
const MQ_1340 = window.matchMedia('(min-width: 1340px)');

let bound = false;
let reflowTimer: number | undefined;

function reflow() {
  if (REDUCED_MOTION.matches) return;
  const body = document.body;
  body.classList.remove('is-reflowing');
  // force reflow so re-adding the class restarts the animation
  void body.offsetWidth;
  body.classList.add('is-reflowing');
  if (reflowTimer) window.clearTimeout(reflowTimer);
  reflowTimer = window.setTimeout(() => body.classList.remove('is-reflowing'), 480);
}

function setup() {
  const navbar = document.querySelector<HTMLElement>('.navbar');
  const progress = document.querySelector<HTMLElement>('.reading-progress');
  const target = document.querySelector<HTMLElement>('.post-content');

  if (progress) progress.classList.toggle('is-active', Boolean(target));

  let pending = false;
  const tick = () => {
    pending = false;
    const y = window.scrollY;
    if (navbar) navbar.classList.toggle('is-scrolled', y > 8);

    if (progress && target) {
      const rect = target.getBoundingClientRect();
      const start = y + rect.top;
      const end = start + rect.height - window.innerHeight;
      const span = end - start;
      const ratio = span > 0 ? Math.min(1, Math.max(0, (y - start) / span)) : 0;
      progress.style.transform = `scaleX(${ratio})`;
    }
  };

  const onScroll = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(tick);
  };

  tick();

  if (!bound) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    REDUCED_MOTION.addEventListener?.('change', onScroll);
    MQ_1024.addEventListener?.('change', reflow);
    MQ_1340.addEventListener?.('change', reflow);
    bound = true;
  }
}

document.addEventListener('astro:page-load', setup);
if (document.readyState !== 'loading') setup();
