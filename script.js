// =========================================================
// Menu mobile (hamburger)
// =========================================================
// File nay chay voi thuoc tinh `defer` trong <head>, nen HTML da dung xong
// truoc khi dong code dau tien chay -> querySelector luon tim thay phan tu.

const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

// Nguon su that duy nhat cho trang thai dong/mo la thuoc tinh aria-expanded
// tren cai nut. Khong tao them bien `isOpen` rieng - hai noi luu cung mot
// thong tin thi som muon cung lech nhau.
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

// Bam vao mot muc menu -> dong menu lai, neu khong no che mat noi dung
// vua duoc cuon toi.
siteNav.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    setMenu(false);
  }
});

// Phim Escape dong menu va tra focus ve nut - quy uoc chuan cua moi
// thanh phan dang "bung ra" tren web.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && isMenuOpen()) {
    setMenu(false);
    navToggle.focus();
  }
});

// Xoay ngang dien thoai hoac keo rong cua so qua 720px: CSS an cai nut di,
// nhung class .is-open van con lai. Dong menu de trang thai khop voi giao dien.
const desktopQuery = window.matchMedia('(min-width: 721px)');

desktopQuery.addEventListener('change', (event) => {
  if (event.matches) {
    setMenu(false);
  }
});

// =========================================================
// Danh dau muc menu cua section dang xem (scroll spy)
// =========================================================
// Cach ngay tho la nghe su kien 'scroll' roi tinh vi tri tung section -
// ham do chay hang tram lan moi giay va lam giat trang. IntersectionObserver
// la API cua trinh duyet lam dung viec nay, chay ngoai luong chinh.

const navLinks = document.querySelectorAll('.site-nav a[href^="#"]');
const sections = document.querySelectorAll('main section[id]');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const id = entry.target.id;
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
      });
    });
  },
  {
    // Thu hep "vung quan sat" ve mot dai mong o giua man hinh, nen tai moi
    // thoi diem chi co mot section duoc tinh la dang xem.
    rootMargin: '-45% 0px -45% 0px',
  }
);

sections.forEach((section) => observer.observe(section));
