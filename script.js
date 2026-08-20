/* =========================================================
   Quang Tu Dinh - CV website
   Plain JavaScript. No framework, no build step.

   Everything here is an enhancement: the page reads fine and the
   contact form still submits with this file removed. Each feature
   therefore checks for its own elements and bows out quietly rather
   than throwing and taking the features below it down with it.
   ========================================================= */

// Mirrors the mobile-menu breakpoint in styles.css (max-width: 720px),
// so the desktop side starts one pixel later. Change both together.
const DESKTOP_QUERY = '(min-width: 721px)';

/* ---------------------------------------------------------
   Progressive enhancement flag
   --------------------------------------------------------- */
function markJsEnabled() {
  // The scroll-reveal rules hide their elements only inside `.js`. Setting
  // the class from here means a blocked or broken script leaves the page
  // fully visible instead of blank.
  document.documentElement.classList.add('js');
}

/* ---------------------------------------------------------
   Mobile navigation
   --------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  // Single source of truth for open/closed: the button's aria-expanded.
  // A separate boolean would be a second copy of the same fact, and the
  // two would drift apart. getAttribute returns a string, so compare
  // against 'true' - the string 'false' is itself truthy.
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    // The button has no text, so this label is all a screen reader gets.
    // It names the next action, not the current state.
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
  }

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  // One listener on the <nav> instead of one per link: clicks bubble up,
  // so extra menu items need no extra wiring.
  nav.addEventListener('click', (event) => {
    // closest() walks up from the deepest element clicked to the <a>.
    // Closing matters: the open menu covers the section just scrolled to.
    if (event.target.closest('a')) setOpen(false);
  });

  // Escape closes any popped-out UI. It listens on the document because
  // focus could be anywhere when the key is pressed.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      // Without this, focus dies along with the menu that held it and the
      // keyboard user is dumped back at the top of the page.
      toggle.focus();
    }
  });

  // Widening past the breakpoint hides the toggle in CSS, but `is-open`
  // would survive and pop the menu open again on the way back down.
  window.matchMedia(DESKTOP_QUERY).addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}

/* ---------------------------------------------------------
   Scroll spy: highlight the nav link of the section in view
   --------------------------------------------------------- */
function initScrollSpy() {
  const links = document.querySelectorAll('.site-nav a[href^="#"]');
  const sections = document.querySelectorAll('main section[id]');
  if (!links.length || !sections.length) return;

  // A 'scroll' listener would fire hundreds of times a second and each
  // position measurement forces a layout recalculation. IntersectionObserver
  // is built for this and does the tracking off the main thread.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Only entries whose state just changed arrive here. Acting on the
        // ones leaving the viewport too would let two sections fight over
        // the highlight and make the menu flicker.
        if (!entry.isIntersecting) return;

        const target = '#' + entry.target.id;
        // One toggle both marks the current link and clears the rest.
        links.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === target);
        });
      });
    },
    // Shrink the observed area to a thin band across the middle of the
    // screen, so only one section counts as "in view" at any moment.
    { rootMargin: '-45% 0px -45% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ---------------------------------------------------------
   Scroll reveal: fade blocks in as they enter the viewport
   --------------------------------------------------------- */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  // Same API as the scroll spy, used differently: this one fires once per
  // element. Re-hiding blocks on the way back up would make the page
  // flicker while the reader scrolls around.
  const observer = new IntersectionObserver(
    (entries, self) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // CSS owns the animation; this only flips the target state.
        entry.target.classList.add('is-visible');
        // Done with this element - stop watching it.
        self.unobserve(entry.target);
      });
    },
    // Start once 15% of the block has entered, so it is already moving by
    // the time the reader looks at it.
    { threshold: 0.15 }
  );

  items.forEach((item) => observer.observe(item));
}

/* ---------------------------------------------------------
   Contact form
   --------------------------------------------------------- */
function initContactForm() {
  const form = document.querySelector('.contact-form');
  const status = document.querySelector('.form-status');
  const button = document.querySelector('.btn-submit');
  if (!form || !status || !button) return;

  // Every field carries aria-describedby pointing at its own error
  // paragraph, so the markup already says where a message belongs.
  const fields = form.querySelectorAll('[aria-describedby]');

  // Switch off the browser's own validation only now that a replacement is
  // running. Putting novalidate in the HTML would leave people without
  // JavaScript no validation at all.
  form.setAttribute('novalidate', '');

  function setFieldError(input, message) {
    document.getElementById(input.getAttribute('aria-describedby')).textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function setStatus(message, kind) {
    status.textContent = message;
    status.classList.toggle('is-error', kind === 'error');
    status.classList.toggle('is-success', kind === 'success');
  }

  function setBusy(busy) {
    button.disabled = busy;
    button.textContent = busy ? 'Sending...' : 'Submit';
  }

  // Returns a sentence the reader can act on, or '' when the field is fine.
  function messageFor(input) {
    // The wording comes from the <label>, so adding a field later needs no
    // change here. Every input exposes the labels pointing at it.
    const label = input.labels[0];
    const name = label ? label.textContent.replace('*', '').trim().toLowerCase() : 'value';

    // valueMissing first: an empty box also fails the format check, and
    // "Enter your email address" beats "that is not an email address".
    if (input.validity.valueMissing) {
      return input.type === 'email' ? 'Enter your email address.' : 'Enter a ' + name + '.';
    }
    if (input.validity.typeMismatch) {
      return 'Enter a valid email address.';
    }
    return '';
  }

  // Shows or clears every message, and returns the first invalid input.
  function firstInvalidField() {
    let firstInvalid = null;

    fields.forEach((field) => {
      const message = messageFor(field);
      setFieldError(field, message);

      // Deliberately no early exit: the rest of the loop is what clears
      // stale messages from fields the reader has since fixed.
      if (message && !firstInvalid) firstInvalid = field;
    });

    return firstInvalid;
  }

  function clearAllErrors() {
    fields.forEach((field) => setFieldError(field, ''));
  }

  form.addEventListener('input', (event) => {
    const field = event.target;
    if (!field.hasAttribute('aria-describedby')) return;

    // Only ever clear here, never add. Recomputing the message on each
    // keystroke would flash "Enter a valid email address" after the first
    // letter, long before there is anything to complain about.
    if (field.getAttribute('aria-invalid') === 'true' && field.checkValidity()) {
      setFieldError(field, '');
    }
  });

  form.addEventListener('submit', async (event) => {
    // Stop the page-reloading submit; from here the script owns it.
    event.preventDefault();
    setStatus('');

    const invalid = firstInvalidField();
    if (invalid) {
      // Keyboard and screen reader users cannot see red text in the middle
      // of the page; moving focus is how they find out what went wrong.
      invalid.focus();
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      // fetch only rejects when the network is unreachable: a 404 or a 500
      // still resolves, so the status has to be checked explicitly.
      if (response.ok) {
        form.reset();
        // reset() restores the values, not the messages - those are text
        // this script wrote into the DOM.
        clearAllErrors();
        setStatus('Thanks for your message. I will get back to you soon.', 'success');
      } else {
        setStatus('Sorry, the message could not be sent. Please email quangtu224@gmail.com instead.', 'error');
      }
    } catch {
      setStatus('No connection. Please check your network, or email quangtu224@gmail.com instead.', 'error');
    } finally {
      // In finally, so a dropped connection never leaves the button stuck.
      setBusy(false);
    }
  });
}

/* ---------------------------------------------------------
   Start
   --------------------------------------------------------- */
markJsEnabled();
initMobileNav();
initScrollSpy();
initScrollReveal();
initContactForm();
