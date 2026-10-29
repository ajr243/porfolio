const photos = [...document.querySelectorAll('[data-scene-photo]')];
const scenes = ['Texas fairway', 'Rocky Mountain green', 'Morning at the course', 'Los Angeles, Chile', 'Cancun, Mexico'];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const toggle = document.querySelector('[data-action="toggle"]');
const root = document.documentElement;
let active = 0, paused = motion.matches, timer, frame = 0;
let pointer = {x: .5, y: .5};
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
function showScene(index) {
  if (!photos.length) return;
  active = (index + photos.length) % photos.length;
  photos.forEach((photo, i) => photo.classList.toggle('is-active', i === active));
  const label = document.querySelector('[data-place]'), count = document.querySelector('[data-count]');
  if (label) label.textContent = scenes[active % scenes.length];
  if (count) count.textContent = `${String(active + 1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`;
}
function schedule() {
  clearInterval(timer);
  if (!paused && !document.hidden && photos.length > 1) timer = setInterval(() => showScene(active + 1), 9000);
  if (toggle) {
    toggle.textContent = paused ? '\u25b6' : '\u275a\u275a';
    toggle.title = paused ? 'Play slideshow' : 'Pause slideshow';
    toggle.setAttribute('aria-label', toggle.title);
  }
}
document.querySelector('[data-action="previous"]')?.addEventListener('click', () => {showScene(active - 1); schedule();});
document.querySelector('[data-action="next"]')?.addEventListener('click', () => {showScene(active + 1); schedule();});
toggle?.addEventListener('click', () => {paused = !paused; schedule();});
document.addEventListener('visibilitychange', schedule);
function resetMotion() {
  cancelAnimationFrame(frame); frame = 0;
  root.style.setProperty('--scene-x','0px'); root.style.setProperty('--scene-y','0px'); root.style.setProperty('--scene-zoom','1.08');
}
motion.addEventListener('change', () => {paused = motion.matches; resetMotion(); schedule();});
document.addEventListener('pointermove', event => {
  if (motion.matches || event.pointerType !== 'mouse') return;
  pointer = {x: event.clientX / innerWidth, y: event.clientY / innerHeight};
  if (frame) return;
  frame = requestAnimationFrame(() => {
    root.style.setProperty('--scene-x',`${(.5 - pointer.x) * 34}px`);
    root.style.setProperty('--scene-y',`${(.5 - pointer.y) * 34}px`);
    root.style.setProperty('--scene-zoom',`${1.08 + Math.hypot(pointer.x - .5, pointer.y - .5) * .1}`);
    frame = 0;
  });
}, {passive: true});
root.addEventListener('pointerleave', resetMotion);
const themeToggle = document.querySelector('.theme-toggle');
function setTheme(dark) {
  document.body.dataset.theme = dark ? 'dark' : 'light';
  themeToggle?.setAttribute('aria-pressed', String(dark));
  const label = themeToggle?.querySelector('[data-theme-label]'), icon = themeToggle?.querySelector('.theme-toggle-icon');
  if (label) label.textContent = `Switch to ${dark ? 'light' : 'dark'} mode`;
  if (icon) icon.textContent = dark ? '\u2600' : '\u263e';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark ? '#101713' : '#e8eee1');
}
try {setTheme(localStorage.getItem('portfolio-theme') === 'dark');} catch {setTheme(false);}
themeToggle?.addEventListener('click', () => {
  const dark = document.body.dataset.theme !== 'dark'; setTheme(dark);
  try {localStorage.setItem('portfolio-theme',dark ? 'dark' : 'light');} catch {}
});
document.querySelector('[data-copy-email]')?.addEventListener('click', async event => {
  const status = document.querySelector('.copy-status');
  try {await navigator.clipboard.writeText(event.currentTarget.dataset.copyEmail); if (status) status.textContent = 'Email copied to clipboard.';}
  catch {if (status) status.textContent = 'Use the email link above to get in touch.';}
});
showScene(0); schedule();