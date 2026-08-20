// =========================================================
// Progressive enhancement flag
// =========================================================
// Mark the document as JavaScript-enabled. The scroll-reveal rules in
// styles.css hide their elements only inside `.js`, so if this file fails to
// load or throws an error, nothing is ever hidden and the page stays readable.
// Runs first, before anything below has a chance to throw.
document.documentElement.classList.add('js');

// =========================================================
// Mobile navigation (hamburger menu)
// =========================================================
// This file is loaded with `defer`, so the HTML is fully parsed before the
// first line runs and every querySelector below is guaranteed to find its
// element.
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

// The single source of truth for open/closed is the button's aria-expanded
// attribute. There is deliberately no separate `isOpen` variable: two places
// holding the same fact eventually disagree.
function setMenu(open) {
  // setAttribute only accepts strings, hence String().
  navToggle.setAttribute('aria-expanded', String(open));
  // The button has no text, so screen reader users rely on this label. It
  // describes what the next click will do, not the current state.
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  // The second argument decides add vs remove, which keeps the class and
  // aria-expanded in sync because both are set from the same value.
  siteNav.classList.toggle('is-open', open);
}

function isMenuOpen() {
  // getAttribute always returns a string, so compare with 'true', not true.
  // The string 'false' is truthy, so a bare if() on it would always pass.
  return navToggle.getAttribute('aria-expanded') === 'true';
}

navToggle.addEventListener('click', () => {
  setMenu(!isMenuOpen());
});

// Event delegation: one listener on the <nav> rather than one per link.
// Clicks bubble up from the <a>, so extra menu items need no extra code.
siteNav.addEventListener('click', (event) => {
  // event.target is the deepest element clicked, which may be a child of the
  // link. closest() walks up to the <a>, or returns null if there is none.
  if (event.target.closest('a')) {
    // Without this the open menu would cover the section just scrolled to.
    setMenu(false);
  }
});

// Escape closes any popped-out UI - a convention keyboard users expect.
// The listener sits on `document` because focus may be anywhere at the time.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && isMenuOpen()) {
    setMenu(false);
    // Hand focus back to the button. Otherwise focus is lost along with the
    // menu that held it, and the user is dumped back at the top of the page.
    navToggle.focus();
  }
});

// Rotating a phone or widening the window past the breakpoint hides the
// toggle via CSS, but the `is-open` class would survive and pop the menu open
// again on the way back down.
// 721px, not 720px: the CSS breakpoint is max-width 720px, so 720 itself is
// still the mobile side and both rules would apply at once.
const desktopQuery = window.matchMedia('(min-width: 721px)');

desktopQuery.addEventListener('change', (event) => {
  if (event.matches) {
    setMenu(false);
  }
});

// =========================================================
// Scroll spy: highlight the nav link of the section in view
// =========================================================
// Listening for the 'scroll' event would fire hundreds of times a second, and
// measuring element positions forces the browser to recalculate layout every
// time. IntersectionObserver is the API built for this and does the tracking
// off the main thread.
const navLinks = document.querySelectorAll('.site-nav a[href^="#"]');
const sections = document.querySelectorAll('main section[id]');

const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      // The callback only receives entries whose state just changed, so skip
      // the ones leaving the viewport. Acting on those too would let two
      // sections fight over the highlight and make the menu flicker.
      if (!entry.isIntersecting) return;

      const id = entry.target.id;
      navLinks.forEach((link) => {
        // A single toggle both marks the current link and clears the others.
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
      });
    });
  },
  {
    // Shrink the observed area to a thin band across the middle of the screen,
    // so only one section counts as "in view" at any moment.
    rootMargin: '-45% 0px -45% 0px',
  }
);

sections.forEach((section) => spyObserver.observe(section));

// =========================================================
// Scroll reveal: fade blocks in as they enter the viewport
// =========================================================
// Same API as the scroll spy, used differently: this one fires once per
// element and then stops watching it. Re-hiding blocks on the way back up
// would make the page flicker while the user scrolls around.
const revealItems = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  // The callback's second argument is the observer itself, which saves
  // reaching back out to the `revealObserver` variable from inside it.
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      // CSS owns the animation; this only flips the target state and lets the
      // transition in styles.css do the work.
      entry.target.classList.add('is-visible');

      // Done with this element, so stop watching it. Cheap on a page this
      // size, but the habit matters when observing hundreds of items.
      observer.unobserve(entry.target);
    });
  },
  {
    // Start the animation once 15% of the block has entered the viewport, so
    // it is already moving by the time the user looks at it.
    threshold: 0.15,
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

// =========================================================
// Contact form
// =========================================================
// The form already works without any of this: it is a plain
// <form action method="POST">, so the browser submits it and validates
// the required fields itself. Everything below is an enhancement -
// inline messages instead of browser tooltips, and sending without a
// page reload.

const contactForm = document.querySelector('.contact-form');
const formStatus = document.querySelector('.form-status');
const submitButton = document.querySelector('.btn-submit');

// Switch off the browser's own validation ONLY now that a replacement is
// running. Putting novalidate in the HTML instead would leave people with
// JavaScript disabled no validation at all.
contactForm.setAttribute('novalidate', '');

// Every input points at its own error paragraph through aria-describedby,
// so the markup already says where a message belongs.
function errorElementFor(input) {
  return document.getElementById(input.getAttribute('aria-describedby'));
}

function setFieldError(input, message) {
  errorElementFor(input).textContent = message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function setStatus(message, kind) {
  formStatus.textContent = message;
  formStatus.classList.toggle('is-error', kind === 'error');
  formStatus.classList.toggle('is-success', kind === 'success');
}

function setBusy(busy) {
  submitButton.disabled = busy;
  submitButton.textContent = busy ? 'Sending...' : 'Submit';
}

// Every field that carries an error paragraph is a field worth checking.
const fields = contactForm.querySelectorAll('[aria-describedby]');

// Turns a failing input into a sentence someone can act on.
// Returns an empty string when the input is fine.
function messageFor(input) {
  // Every input exposes the <label> elements pointing at it, so the wording
  // comes from the markup. Add a field later and this keeps working.
  const label = input.labels[0];
  const name = label ? label.textContent.replace('*', '').trim().toLowerCase() : 'value';

  // Check valueMissing first: an empty box is also a format failure, and
  // "Enter your email address" is more useful than "that is not an email".
  if (input.validity.valueMissing) {
    return input.type === 'email' ? 'Enter your email address.' : 'Enter a ' + name + '.';
  }

  if (input.validity.typeMismatch) {
    return 'Enter a valid email address.';
  }

  return '';
}

// Checks every field, shows or clears each message, and returns the FIRST
// invalid input, or null when the whole form is valid.
function firstInvalidField() {
  let firstInvalid = null;

  fields.forEach((field) => {
    const message = messageFor(field);
    setFieldError(field, message);

    // Deliberately no early exit: the rest of the loop is what clears stale
    // messages from fields the person has since fixed.
    if (message && !firstInvalid) {
      firstInvalid = field;
    }
  });

  return firstInvalid;
}

// Clear a message the moment the person fixes the field. Nagging while
// they are still typing is worse than saying nothing.
contactForm.addEventListener('input', (event) => {
  const field = event.target;
  if (!field.hasAttribute('aria-describedby')) return;

  // Only ever CLEAR here, never add. Recomputing the message on each
  // keystroke would flash "Enter a valid email address" after the first
  // letter, long before there is anything to complain about.
  if (field.getAttribute('aria-invalid') === 'true' && field.checkValidity()) {
    setFieldError(field, '');
  }
});

contactForm.addEventListener('submit', async (event) => {
  // Stop the normal page-reloading submit; from here the script owns it.
  event.preventDefault();
  setStatus('');

  const invalid = firstInvalidField();
  if (invalid) {
    // Keyboard and screen reader users cannot see red text in the middle of
    // the page; moving focus is how they learn what went wrong.
    invalid.focus();
    return;
  }

  setBusy(true);

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body: new FormData(contactForm),
      headers: { Accept: 'application/json' },
    });

    // fetch only rejects when the network is unreachable - a 404 or a 500
    // still resolves, so the status has to be checked explicitly.
    if (response.ok) {
      contactForm.reset();
      // reset() restores the field values, not the messages: those are text
      // this script wrote into the DOM, so clear them by hand.
      fields.forEach((field) => setFieldError(field, ''));
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
