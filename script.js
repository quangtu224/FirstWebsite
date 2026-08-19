const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

function setMenu(open) {
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  siteNav.classList.toggle('is-open', open);
}

function isMenuOpen() {
  return navToggle.getAttribute('aria-expanded') === 'true';
}

navToggle.addEventListener('click', () => {
  setMenu(!isMenuOpen());
});
