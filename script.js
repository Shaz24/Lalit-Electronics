/**
 * LALIT ELECTRONICS — SHARED SCRIPT
 * Handles: scroll reveal, header state, mobile drawer,
 * marquee, review carousel, hash navigation, footer year
 */

'use strict';

/* ── Utility ────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Footer Year ────────────────────────────────────────── */
function initFooterYear() {
  $$('.footer-year').forEach(el => { el.textContent = new Date().getFullYear(); });
}

/* ── Header Scroll State ────────────────────────────────── */
function initHeader() {
  const header = $('#site-header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── Active Nav Link ────────────────────────────────────── */
function initActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('[data-nav-link]').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === page || a.getAttribute('href') === `./${page}`);
  });
}

/* ── Mobile Drawer ──────────────────────────────────────── */
function initMobileDrawer() {
  const hamburger = $('#hamburger');
  const drawer    = $('#mobile-drawer');
  if (!hamburger || !drawer) return;

  const open  = () => { drawer.classList.add('open'); hamburger.classList.add('open'); hamburger.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; };
  const close = () => { drawer.classList.remove('open'); hamburger.classList.remove('open'); hamburger.setAttribute('aria-expanded','false'); document.body.style.overflow=''; };
  const toggle = () => drawer.classList.contains('open') ? close() : open();

  hamburger.addEventListener('click', toggle);

  // Close on nav link click
  $$('.drawer-nav a', drawer).forEach(a => a.addEventListener('click', close));

  // Close on outside click
  drawer.addEventListener('click', e => { if (e.target === drawer) close(); });

  // Esc key
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ── Scroll Reveal ──────────────────────────────────────── */
function initScrollReveal() {
  if (prefersReducedMotion) {
    $$('.reveal').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach(el => io.observe(el));
}

/* ── Marquee — duplicate items for seamless loop ────────── */
function initMarquee() {
  $$('.marquee-track').forEach(track => {
    if (prefersReducedMotion) return;
    const items = track.innerHTML;
    track.innerHTML = items + items; // duplicate for seamless loop
  });
}

/* ── Review Carousel — duplicate slides ─────────────────── */
function initReviewCarousel() {
  $$('.reviews-track').forEach(track => {
    if (prefersReducedMotion) return;
    const cards = track.innerHTML;
    track.innerHTML = cards + cards; // duplicate
  });
}

/* ── Products Hash Navigation ───────────────────────────── */
function initProductsHash() {
  if (!document.getElementById('products-page')) return;

  const tabs = $$('.cat-tab');
  const sections = $$('.category-section');

  // Tab click → scroll to section
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      const section = document.getElementById(target);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + target);
        setActiveTab(tab);
      }
    });
  });

  // Handle incoming hash
  function handleHash() {
    const hash = location.hash.slice(1);
    if (!hash) return;
    const section = document.getElementById(hash);
    if (section) {
      setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
      const tab = $(`[data-target="${hash}"]`);
      if (tab) setActiveTab(tab);
    }
  }

  function setActiveTab(activeTab) {
    tabs.forEach(t => t.classList.remove('active'));
    activeTab.classList.add('active');
  }

  // IntersectionObserver to update active tab on scroll
  if (!prefersReducedMotion) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const tab = $(`[data-target="${id}"]`);
          if (tab) {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
          }
        }
      });
    }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });
    sections.forEach(s => sectionObserver.observe(s));
  }

  handleHash();
  window.addEventListener('hashchange', handleHash);
}

/* ── Reviews Sort/Filter ────────────────────────────────── */
function initReviewsFilter() {
  const select = $('#reviews-sort');
  if (!select) return;

  const grid = $('#reviews-grid');
  if (!grid) return;

  select.addEventListener('change', () => {
    const cards = $$('.review-card-full', grid);
    const sorted = [...cards];

    if (select.value === 'highest') {
      sorted.sort((a, b) => parseInt(b.dataset.stars) - parseInt(a.dataset.stars));
    } else if (select.value === 'lowest') {
      sorted.sort((a, b) => parseInt(a.dataset.stars) - parseInt(b.dataset.stars));
    } else {
      // Most recent: restore original DOM order via data-index
      sorted.sort((a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index));
    }

    // Re-append in sorted order with fade
    sorted.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(10px)';
      grid.appendChild(card);
      setTimeout(() => {
        card.style.transition = 'opacity .3s ease, transform .3s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 40);
    });
  });
}

/* ── Contact Form ───────────────────────────────────────── */
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    // Using mailto fallback — for Formspree swap action attr and remove preventDefault
    // If action is mailto: or empty, show success message
    const action = form.getAttribute('action') || '';
    if (!action.startsWith('http')) {
      e.preventDefault();
      const success = $('#form-success');
      if (success) {
        success.classList.add('show');
        form.reset();
        setTimeout(() => success.classList.remove('show'), 6000);
      }
    }
  });
}

/* ── Rating Bars Animation ──────────────────────────────── */
function initRatingBars() {
  $$('.bar-fill').forEach(bar => {
    const width = bar.getAttribute('data-width') || '0%';
    bar.style.width = '0%';
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          bar.style.width = width;
          io.unobserve(bar);
        }
      });
    }, { threshold: 0.5 });
    io.observe(bar);
  });
}

/* ── Init All ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initFooterYear();
  initHeader();
  initActiveNav();
  initMobileDrawer();
  initScrollReveal();
  initMarquee();
  initReviewCarousel();
  initProductsHash();
  initReviewsFilter();
  initContactForm();
  initRatingBars();
});
