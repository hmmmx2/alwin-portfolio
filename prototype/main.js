/* ════════════════════════════════════════════════════════════════════
   Alwin — Portfolio · interactions
   No dependencies. Everything degrades gracefully without JS.
   ════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.remove('no-js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ── Scroll progress + sticky nav ─────────────────────────────── */
  const nav     = $('#nav');
  const bar     = $('#scrollBar');
  let   ticking = false;

  function onScroll() {
    const y   = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (bar) bar.style.width = `${max > 0 ? Math.min(100, (y / max) * 100) : 0}%`;
    if (nav) nav.classList.toggle('is-stuck', y > 24);

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });

  onScroll();

  /* ── Mobile navigation ────────────────────────────────────────── */
  const toggle   = $('#navToggle');
  const navLinks = $('#navLinks');

  function closeNav() {
    if (!toggle || !navLinks) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    navLinks.classList.remove('is-open');
  }

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
      navLinks.classList.toggle('is-open', !open);
    });

    navLinks.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) closeNav();
    });
  }

  /* ── Active section tracking + sliding nav indicator ──────────── */
  const links     = $$('.nav-link');
  const indicator = $('.nav-indicator');
  const sections  = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  // Horizontal only. The indicator is anchored vertically in CSS via
  // top/bottom, so nothing here can fight a CSS `translate` for the Y axis.
  function moveIndicator(target) {
    if (!indicator || !target || window.innerWidth <= 860) return;
    indicator.style.width = `${target.offsetWidth}px`;
    indicator.style.transform = `translateX(${target.offsetLeft}px)`;
    indicator.classList.add('is-on');
  }

  function activeLink() {
    return links.find((a) => a.classList.contains('is-active'));
  }

  function setActive(id) {
    links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    moveIndicator(activeLink());
  }

  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.6, 1] }
    );
    sections.forEach((s) => spy.observe(s));
  }

  links.forEach((a) => {
    a.addEventListener('mouseenter', () => moveIndicator(a));
  });
  if (navLinks) {
    navLinks.addEventListener('mouseleave', () => {
      const current = activeLink();
      if (current) moveIndicator(current);
      else if (indicator) indicator.classList.remove('is-on');
    });
  }
  window.addEventListener('resize', () => moveIndicator(activeLink()), { passive: true });

  /* ── Scroll reveal ────────────────────────────────────────────── */
  const revealables = $$('[data-reveal]');
  revealables.forEach((el) => {
    const d = el.dataset.revealDelay;
    if (d) el.style.setProperty('--d', d);
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach((el) => el.classList.add('is-visible'));
  } else {
    const reveal = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );
    revealables.forEach((el) => reveal.observe(el));
  }

  /* ── Cursor spotlight on glass surfaces ───────────────────────── */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    $$('[data-spotlight]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ── Copy email ───────────────────────────────────────────────── */
  const copyBtn   = $('#copyMail');
  const copyLabel = $('#copyMailLabel');

  if (copyBtn && copyLabel) {
    const address = copyBtn.dataset.mail || copyLabel.textContent.trim();
    let resetId;

    copyBtn.addEventListener('click', async () => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(address);
        ok = true;
      } catch {
        ok = false;
      }

      copyLabel.textContent = ok ? 'Copied to clipboard' : address;
      copyBtn.classList.toggle('is-copied', ok);

      if (!ok) {
        window.location.href = `mailto:${address}`;
        return;
      }

      clearTimeout(resetId);
      resetId = setTimeout(() => {
        copyLabel.textContent = address;
        copyBtn.classList.remove('is-copied');
      }, 1800);
    });
  }

  /* ── Contact form ─────────────────────────────────────────────────
     Static hosting: compose the message in the visitor's own mail
     client. They review and send it — nothing leaves the page on its
     own. Swap in a form backend by giving the <form> an action/method
     and deleting this handler.
     ─────────────────────────────────────────────────────────────── */
  const form = $('#contactForm');
  const note = $('#formNote');

  if (form) {
    const RECIPIENT = copyBtn?.dataset.mail || 'alwin@example.com';
    const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const setError = (input, message) => {
      const field = input.closest('.field');
      const slot  = form.querySelector(`[data-error-for="${input.id}"]`);
      field.classList.toggle('has-error', Boolean(message));
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (slot) slot.textContent = message || '';
      return !message;
    };

    const validate = () => {
      const name    = form.elements.name;
      const email   = form.elements.email;
      const message = form.elements.message;

      const results = [
        setError(name,    name.value.trim() ? '' : 'Please add your name.'),
        setError(email,   EMAIL_RE.test(email.value.trim()) ? '' : 'Please enter a valid email address.'),
        setError(message, message.value.trim().length >= 10 ? '' : 'A little more detail, please (10+ characters).'),
      ];

      return results.every(Boolean);
    };

    ['name', 'email', 'message'].forEach((id) => {
      const input = form.elements[id];
      input.addEventListener('input', () => {
        if (input.closest('.field').classList.contains('has-error')) validate();
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validate()) {
        if (note) note.textContent = 'Please fix the highlighted fields.';
        form.querySelector('.has-error input, .has-error textarea')?.focus();
        return;
      }

      const name    = form.elements.name.value.trim();
      const email   = form.elements.email.value.trim();
      const message = form.elements.message.value.trim();

      const subject = `Portfolio enquiry — ${name}`;
      const body    = `${message}\n\n—\n${name}\n${email}`;

      window.location.href =
        `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      if (note) note.textContent = 'Opening your mail app with the message ready to send.';
    });
  }

  /* ── Footer year ──────────────────────────────────────────────── */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
