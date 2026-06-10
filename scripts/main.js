// Utility: Throttle function for performance
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Theme Management
const ThemeManager = {
  storageKey: 'theme-preference',

  init() {
    this.toggle = document.getElementById('theme-toggle');
    if (!this.toggle) return;

    // Get saved preference or detect system preference
    const savedTheme = localStorage.getItem(this.storageKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    this.setTheme(theme);
    this.toggle.addEventListener('click', () => this.toggleTheme());

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.storageKey)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.storageKey, theme);

    // Safari fix: Force repaint to ensure CSS variables update properly
    // Safari sometimes doesn't recalculate inherited CSS custom properties
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  },
};

// Smooth scrolling for navigation
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// Global nav: highlight active section link, show hairline border on scroll
function initGlobalNav() {
  const nav = document.querySelector('.globalnav');
  const sections = Array.from(document.querySelectorAll('header[id], section[id]'));
  const navLinks = document.querySelectorAll('.nav-link');

  const onScroll = throttle(() => {
    if (nav) {
      nav.classList.toggle('scrolled', window.scrollY > 8);
    }

    let current = '';
    sections
      .slice()
      .sort((a, b) => a.offsetTop - b.offsetTop)
      .forEach((section) => {
        if (window.scrollY >= section.offsetTop - 200) {
          current = section.getAttribute('id');
        }
      });

    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href').slice(1) === current);
    });
  }, 100);

  window.addEventListener('scroll', onScroll);
  onScroll();
}

// Fade in animation on scroll
function initFadeAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach((el) => {
    observer.observe(el);
  });
}

// Contact form handling
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    const formStatus = form.querySelector('.form-status');

    // Basic validation
    const name = form.querySelector('#contact-name').value.trim();
    const email = form.querySelector('#contact-email').value.trim();
    const message = form.querySelector('#contact-message').value.trim();

    if (!name || !email || !message) {
      showFormStatus(formStatus, 'Please fill in all fields.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showFormStatus(formStatus, 'Please enter a valid email address.', 'error');
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    // Static site: hand off to the visitor's email client via mailto
    try {
      const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
      window.location.href = `mailto:collinsjulius@hotmail.com?subject=${subject}&body=${body}`;

      showFormStatus(formStatus, 'Opening email client...', 'success');
      form.reset();
    } catch (error) {
      showFormStatus(formStatus, 'Something went wrong. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

function showFormStatus(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.className = `form-status ${type}`;
  element.style.display = 'block';

  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Skip link for accessibility
function initSkipLink() {
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const main = document.querySelector('main');
      if (main) {
        main.focus();
        main.scrollIntoView();
      }
    });
  }
}

// Project filtering
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (!filterBtns.length || !projectCards.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Update active button
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach((card) => {
        const tags = card.getAttribute('data-tags') || '';

        if (filter === 'all' || tags.includes(filter)) {
          card.classList.remove('hidden', 'fade-out');
        } else {
          card.classList.add('fade-out');
          setTimeout(() => {
            card.classList.add('hidden');
          }, 300);
        }
      });
    });
  });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  initSmoothScrolling();
  initGlobalNav();
  initFadeAnimations();
  initContactForm();
  initSkipLink();
  initProjectFilters();
});
