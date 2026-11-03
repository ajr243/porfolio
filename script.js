// Mobile navigation is a disclosure; links stay available if JavaScript is disabled.
const menuButton = document.querySelector('.menu-toggle');
const siteNavigation = document.querySelector('#site-navigation');
if (menuButton && siteNavigation) {
  const mobileNavigation = matchMedia('(max-width: 800px)');
  function setMenuOpen(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.querySelector('[data-menu-label]').textContent = open ? 'Close menu' : 'Menu';
    menuButton.querySelector('[data-menu-icon]').textContent = open ? '\u00d7' : '\u2630';
    siteNavigation.hidden = mobileNavigation.matches && !open;
  }
  function syncNavigation() {
    const focusedLink = siteNavigation.contains(document.activeElement);
    const focusedButton = document.activeElement === menuButton;
    menuButton.hidden = !mobileNavigation.matches;
    setMenuOpen(false);
    if (mobileNavigation.matches && focusedLink) menuButton.focus();
    if (!mobileNavigation.matches && focusedButton) siteNavigation.querySelector('a')?.focus();
  }
  menuButton.addEventListener('click', () => {
    setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  siteNavigation.addEventListener('click', event => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (menuButton.getAttribute('aria-expanded') === 'true' && !event.target.closest('.site-header')) {
      const focusedLink = siteNavigation.contains(document.activeElement);
      setMenuOpen(false);
      if (focusedLink) menuButton.focus();
    }
  });
  mobileNavigation.addEventListener('change', syncNavigation);
  syncNavigation();
}
const scenes = [
  ['course-texas', 'Texas fairway'],
  ['course-rockies', 'Rocky Mountain green'],
  ['course-misty', 'Morning at the course'],
  ['course-chile', 'Los Angeles, Chile'],
  ['course-cancun', 'Cancun, Mexico'],
  ['coast', 'Along the coast'],
  ['dolomites', 'The Dolomites'],
  ['mountains', 'Mountain views'],
  ['ocean', 'By the ocean'],
  ['scenery-alpine-lake', 'Alpine lake'],
  ['scenery-mountain-sunset', 'Mountain sunset'],
  ['scenery-forest-valley', 'Forest valley'],
  ['scenery-sunlit-peaks', 'Sunlit peaks'],
  ['scenery-desert-dunes', 'Desert dunes'],
  ['scenery-waterfall', 'Waterfall escape'],
  ['scenery-tropical-water', 'Tropical shores'],
  ['scenery-ocean-waves', 'Ocean waves'],
  ['scenery-island-coast', 'Coastal surf'],
  ['scenery-woodland', 'Into the woods'],
  ['scenery-green-mountains', 'Green mountain escape'],
  ['scenery-quiet-lake', 'Quiet lake'],
  ['scenery-snowy-mountains', 'Under mountain skies'],
  ['scenery-open-road', 'Wide open spaces'],
  ['scenery-sunset-landscape', 'Golden landscape'],
  ['scenery-forest-light', 'Forest light'],
  ['scenery-mountain-lake', 'Nature getaway'],
  ['scenery-seaside-cliffs', 'Seaside horizon'],
  ['scenery-misty-forest', 'Misty forest'],
  ['scenery-valley-trail', 'Valley trail']
];
const backdrop = document.querySelector('.scene-backdrop');
const firstPhoto = backdrop?.querySelector('[data-scene-photo]');
const photos = backdrop ? scenes.map((scene, index) => {
  const photo = index === 0 && firstPhoto ? firstPhoto : document.createElement('div');
  photo.className = `scene-photo${index === 0 ? ' is-active' : ''}`;
  photo.setAttribute('data-scene-photo', '');
  return photo;
}) : [];
if (backdrop) backdrop.replaceChildren(...photos);
const loadedPhotos = new Map();
function loadPhoto(index) {
  if (loadedPhotos.has(index)) return loadedPhotos.get(index);
  const ready = new Promise((resolve, reject) => {
    const photo = photos[index];
    const image = photo.querySelector('img') || new Image();
    image.alt = '';
    image.decoding = 'async';
    const finish = () => image.decode().then(() => resolve(image), reject);
    image.onload = finish;
    image.onerror = () => reject(new Error(`Unable to load scenery ${index + 1}`));
    if (!image.getAttribute('src')) image.src = `./assets/${scenes[index][0]}.jpg`;
    if (!image.parentNode) photo.append(image);
    if (image.complete) {
      if (image.naturalWidth) finish();
      else reject(new Error(`Unable to load scenery ${index + 1}`));
    }
  });
  loadedPhotos.set(index, ready);
  return ready;
}
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const toggle = document.querySelector('[data-action="toggle"]');
const root = document.documentElement;
let active = 0, paused = motion.matches, timer, frame = 0;
let requested = 0, sceneRequest = 0;
let pointer = {x: .5, y: .5};
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
async function showScene(index) {
  if (!photos.length) return;
  const request = ++sceneRequest;
  const direction = index < requested ? -1 : 1;
  requested = ((index % photos.length) + photos.length) % photos.length;
  for (let attempts = 0; attempts < photos.length; attempts++) {
    const target = requested;
    try {
      await loadPhoto(target);
      if (request !== sceneRequest) return;
      active = target;
      photos.forEach((photo, i) => photo.classList.toggle('is-active', i === active));
      const label = document.querySelector('[data-place]'), count = document.querySelector('[data-count]');
      if (label) label.textContent = scenes[active][1];
      if (count) count.textContent = `${String(active + 1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`;
      // Prepare the next slide while keeping the current photo visible.
      loadPhoto((active + 1) % photos.length).catch(() => {});
      return;
    } catch {
      if (request !== sceneRequest) return;
      requested = (target + direction + photos.length) % photos.length;
    }
  }
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
document.querySelector('[data-action="previous"]')?.addEventListener('click', () => {showScene(requested - 1); schedule();});
document.querySelector('[data-action="next"]')?.addEventListener('click', () => {showScene(requested + 1); schedule();});
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
  themeToggle?.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
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
