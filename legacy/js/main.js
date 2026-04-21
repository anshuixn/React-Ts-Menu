// ============================================
// AURA & SPICE — main.js
// Homepage Scroll Engine + Parallax + Particles
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initScrollReveals();
  initParallax();
  initParticles();
  initCountUpStats();
  initGalleryScroll();
});

// ---- Header Shrink on Scroll ----
function initHeader() {
  const header = document.getElementById('header');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 80);
        ticking = false;
      });
      ticking = true;
    }
  });
}

// ---- Mobile Navigation Toggle ----
function initMobileNav() {
  const hamburger = document.getElementById('hamburger-btn');
  const navLinks = document.getElementById('nav-links');
  const overlay = document.getElementById('mobile-nav-overlay');

  if (!hamburger || !navLinks) return;

  function toggleMenu() {
    const isOpen = navLinks.classList.contains('mobile-open');
    navLinks.classList.toggle('mobile-open');
    hamburger.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
    // Prevent body scroll when menu is open
    document.body.style.overflow = isOpen ? '' : 'hidden';
  }

  function closeMenu() {
    navLinks.classList.remove('mobile-open');
    hamburger.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', toggleMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);

  // Close menu when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

// ---- Scroll Reveal (Intersection Observer) ----
function initScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        requestAnimationFrame(() => {
          entry.target.classList.add('active');
        });
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

// ---- Parallax on Scroll (Optimized for Mobile/Desktop) ----
function initParallax() {
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length === 0) return;

  const isMobile = ('ontouchstart' in window) || (window.innerWidth <= 768);

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        parallaxEls.forEach(el => {
          // Drastically reduce parallax speed on mobile for a smooth, premium feel without jitter
          const speed = (parseFloat(el.dataset.parallax) || 0.1) * (isMobile ? 0.3 : 1);
          const rect = el.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const offset = (window.innerHeight / 2 - center) * speed;
          el.style.transform = `translateY(${offset}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ---- Floating Food Emoji Particles (reduced on mobile) ----
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const foodEmojis = ['🍕', '🥟', '🍝', '🥩', '🌶️', '🍜', '🧀', '🫕', '🍖', '🥘', '🍣', '🍛', '🥗', '🍤', '🍲'];
  // Reduce particle count on mobile for performance
  const isMobile = window.innerWidth <= 768;
  const count = isMobile ? 8 : 20;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('span');
    particle.className = 'particle';
    particle.textContent = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
    particle.style.left = Math.random() * 100 + '%';
    particle.style.fontSize = (Math.random() * (isMobile ? 14 : 18) + (isMobile ? 10 : 14)) + 'px';
    particle.style.animationDuration = (Math.random() * 18 + 12) + 's';
    particle.style.animationDelay = (Math.random() * 12) + 's';
    particle.style.opacity = Math.random() * 0.3 + 0.15;
    container.appendChild(particle);
  }
}

// ---- Number Count-Up Animation ----
function initCountUpStats() {
  const stats = document.querySelectorAll('[data-count]');
  if (stats.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        animateCount(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(s => observer.observe(s));
}

function animateCount(el, target) {
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    
    el.textContent = current >= 1000 
      ? (current / 1000).toFixed(current >= target ? 0 : 1) + 'K+'
      : current + '+';

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target >= 1000 ? (target / 1000) + 'K+' : target + '+';
    }
  }

  requestAnimationFrame(update);
}

// ---- Horizontal Gallery Scroll (mouse drag + touch swipe) ----
function initGalleryScroll() {
  const track = document.getElementById('gallery-track');
  if (!track) return;

  // Mouse drag support
  let isDown = false;
  let startX, scrollLeft;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    track.style.cursor = 'grabbing';
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  track.addEventListener('mouseleave', () => { isDown = false; track.style.cursor = 'grab'; });
  track.addEventListener('mouseup', () => { isDown = false; track.style.cursor = 'grab'; });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 2;
    track.scrollLeft = scrollLeft - walk;
  });

  // Touch swipe support for mobile
  let touchStartX = 0;
  let touchScrollLeft = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].pageX;
    touchScrollLeft = track.scrollLeft;
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    const touchX = e.touches[0].pageX;
    const walk = (touchStartX - touchX) * 1.5;
    track.scrollLeft = touchScrollLeft + walk;
  }, { passive: true });

  // Make gallery track scrollable with hidden scrollbar
  track.style.overflowX = 'auto';
  track.style.cursor = 'grab';
  track.style.scrollbarWidth = 'none';       // Firefox
  track.style.msOverflowStyle = 'none';      // IE
  track.style.WebkitOverflowScrolling = 'touch'; // Smooth iOS scroll
}
