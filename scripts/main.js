// Keep scroll work bounded without dropping the final update.
function throttle(func, limit) {
  let timer;
  return function (...args) {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      func.apply(this, args);
    }, limit);
  };
}

const ThemeManager = {
  storageKey: "theme-preference",
  preference: null,

  init() {
    this.toggle = document.getElementById("theme-toggle");
    if (!this.toggle) return;
    this.media = window.matchMedia("(prefers-color-scheme: dark)");
    try {
      const saved = localStorage.getItem(this.storageKey);
      this.preference = ["dark", "light"].includes(saved) ? saved : null;
    } catch {
      this.preference = null;
    }
    this.setTheme(this.preference || (this.media.matches ? "dark" : "light"));
    this.toggle.addEventListener("click", () => {
      const next =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      this.preference = next;
      try {
        localStorage.setItem(this.storageKey, next);
      } catch {
        /* Session-only preference. */
      }
      this.setTheme(next);
    });
    this.media.addEventListener("change", (event) => {
      if (!this.preference) this.setTheme(event.matches ? "dark" : "light");
    });
  },

  setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    this.toggle.setAttribute(
      "aria-label",
      `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
    );
  },
};

function initNavigation() {
  const nav = document.querySelector(".globalnav");
  const menu = document.querySelector(".menu-toggle");
  const links = document.getElementById("nav-links");
  if (!nav || !menu || !links) return;
  menu.hidden = false;
  nav.classList.add("nav-ready");
  function closeMenu() {
    menu.setAttribute("aria-expanded", "false");
    nav.classList.remove("menu-open");
  }
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("menu-open", open);
  });
  nav.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menu.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target)) closeMenu();
  });
  window.matchMedia("(min-width: 761px)").addEventListener("change", closeMenu);
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const id = anchor.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      closeMenu();
      history.pushState(null, "", `#${id}`);
      if (!target.hasAttribute("tabindex"))
        target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    });
  });
  const sections = [...document.querySelectorAll("header[id], section[id]")];
  const navLinks = [...links.querySelectorAll(".nav-link")];
  function updateNav() {
    nav.classList.toggle("scrolled", window.scrollY > 8);
    const current = sections
      .filter((section) => section.getBoundingClientRect().top <= 180)
      .pop();
    navLinks.forEach((link) => {
      const active = !!current && link.dataset.section === current.id;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  window.addEventListener("scroll", throttle(updateNav, 100), {
    passive: true,
  });
  updateNav();
}

function initFadeAnimations() {
  if (
    !("IntersectionObserver" in window) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0 },
  );
  // Content stays visible until the observer is successfully created.
  document.querySelectorAll(".fade-in").forEach((element) => {
    element.classList.add("reveal-ready");
    observer.observe(element);
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildContactDraft(name, email, message) {
  if (!name.trim() || !message.trim() || !isValidEmail(email.trim()))
    return null;
  const subject = encodeURIComponent(`Portfolio Contact from ${name.trim()}`);
  const body = encodeURIComponent(
    `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`,
  );
  return `mailto:collinsjulius@gmail.com?subject=${subject}&body=${body}`;
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector(".form-status");
  button.disabled = false;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const draft = buildContactDraft(
      form.querySelector("#contact-name").value,
      form.querySelector("#contact-email").value,
      form.querySelector("#contact-message").value,
    );
    status.className = `form-status ${draft ? "success" : "error"}`;
    status.textContent = draft
      ? "Email draft requested. Review and send it in your email app. If nothing opens, use the email link or copy your message below."
      : "Enter your name, a valid email address, and a message.";
    if (draft) {
      try {
        window.location.href = draft;
      } catch {
        status.className = "form-status error";
        status.textContent =
          "Could not open your email app. Use the email link or copy your message below.";
      }
    }
  });
}

function initWorkflow() {
  const fieldset = document.querySelector(".workflow-switch");
  if (!fieldset) return;
  const manual = document.getElementById("workflow-manual");
  const automated = document.getElementById("workflow-automated");
  function update() {
    const mode = fieldset.querySelector("input:checked").value;
    manual.hidden = mode !== "manual";
    automated.hidden = mode !== "automated";
  }
  fieldset.hidden = false;
  fieldset.addEventListener("change", update);
  update();
}

document.addEventListener("DOMContentLoaded", () => {
  ThemeManager.init();
  initNavigation();
  initContactForm();
  initWorkflow();
  initFadeAnimations();
});
