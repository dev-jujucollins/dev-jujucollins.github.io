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
    this.updateToggleIcon(theme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  },

  updateToggleIcon(theme) {
    if (!this.toggle) return;
    const sunIcon = this.toggle.querySelector('.sun-icon');
    const moonIcon = this.toggle.querySelector('.moon-icon');
    if (sunIcon && moonIcon) {
      sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
      moonIcon.style.display = theme === 'light' ? 'block' : 'none';
    }
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

// Update active navigation dot
function initNavIndicator() {
  const sections = document.querySelectorAll('section[id]');
  const navDots = document.querySelectorAll('.nav-dot');

  const updateActiveDot = throttle(() => {
    let current = '';
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      if (scrollY >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });

    navDots.forEach((dot) => {
      dot.classList.remove('active');
      if (dot.getAttribute('href').slice(1) === current) {
        dot.classList.add('active');
      }
    });
  }, 100);

  window.addEventListener('scroll', updateActiveDot);
}

// Animate skill bars on scroll
function initSkillBars() {
  const skillBars = document.querySelectorAll('.skill-fill');

  const animateSkillBars = () => {
    skillBars.forEach((bar) => {
      const rect = bar.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const width = bar.getAttribute('data-width');
        bar.style.width = width + '%';
      }
    });
  };

  window.addEventListener('scroll', throttle(animateSkillBars, 100));
  window.addEventListener('load', animateSkillBars);
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

// Cursor glow effect with throttling
function initCursorGlow() {
  const cursorGlow = document.querySelector('.cursor-glow');
  if (!cursorGlow) return;

  // Hide cursor glow for keyboard users
  let isUsingMouse = false;

  const updateCursorPosition = throttle((e) => {
    if (!isUsingMouse) return;
    requestAnimationFrame(() => {
      const x = e.clientX;
      const y = e.clientY;
      cursorGlow.style.transform = `translate(${x - 150}px, ${y - 150}px)`;
    });
  }, 16); // ~60fps

  document.addEventListener('mousemove', (e) => {
    isUsingMouse = true;
    cursorGlow.style.opacity = '1';
    updateCursorPosition(e);
  });

  // Hide cursor glow when using keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      isUsingMouse = false;
      cursorGlow.style.opacity = '0';
    }
  });
}

// Typing animation
function initTypingAnimation() {
  const typingElement = document.querySelector('.typing-animation');
  if (!typingElement) return;

  const text = typingElement.textContent;
  typingElement.textContent = '';
  let i = 0;

  const typeWriter = () => {
    if (i < text.length) {
      typingElement.textContent += text.charAt(i);
      i++;
      setTimeout(typeWriter, 100);
    }
  };

  setTimeout(typeWriter, 1000);
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

    // Simulate form submission (replace with actual endpoint)
    // For a static site, you can use services like Formspree, Netlify Forms, or EmailJS
    try {
      // Create mailto link as fallback for static site
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
  initNavIndicator();
  initSkillBars();
  initFadeAnimations();
  initCursorGlow();
  initTypingAnimation();
  initContactForm();
  initSkipLink();
  initProjectFilters();
});
