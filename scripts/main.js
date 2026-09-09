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
  return `mailto:collinsjulius@hotmail.com?subject=${subject}&body=${body}`;
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

// The deliberately buggy version accepts blank titles; the fix validates first.
function submitSampleTask(title, fixed) {
  const normalized = title.trim();
  if (fixed && !normalized)
    return { accepted: false, title: "", message: "Enter a task title." };
  return { accepted: true, title: normalized, message: "Task added." };
}

function runSampleChecks(fixed) {
  const cases = [
    {
      name: "Valid title is saved",
      input: "Release smoke test",
      expected: true,
    },
    { name: "Empty title is rejected", input: "", expected: false },
    {
      name: "Whitespace-only title is rejected",
      input: "   ",
      expected: false,
    },
  ];
  return cases.map((test) => ({
    ...test,
    passed: submitSampleTask(test.input, fixed).accepted === test.expected,
  }));
}

function initQALab() {
  const form = document.getElementById("sample-form");
  if (!form) return;
  let fixed = false;
  const input = document.getElementById("sample-title");
  const feedback = document.getElementById("sample-feedback");
  const tasks = document.getElementById("sample-tasks");
  const run = document.getElementById("run-tests");
  const fix = document.getElementById("apply-fix");
  const reset = document.getElementById("reset-lab");
  const summary = document.getElementById("test-summary");
  const results = document.getElementById("test-results");
  const diagnosis = document.getElementById("test-diagnosis");
  const version = document.getElementById("lab-version");
  [form.querySelector("button"), run, reset].forEach((button) => {
    button.disabled = false;
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = submitSampleTask(input.value, fixed);
    feedback.textContent =
      result.accepted && !result.title
        ? "Bug reproduced: a blank task was accepted."
        : result.message;
    if (!result.accepted) return;
    const item = document.createElement("li");
    item.textContent = result.title || "(Blank task — validation missing)";
    tasks.append(item);
    // Keep the interactive preview compact even after repeated exploration.
    if (tasks.children.length > 4) tasks.firstElementChild.remove();
    input.value = "";
  });
  run.addEventListener("click", () => {
    const checks = runSampleChecks(fixed);
    results.replaceChildren();
    checks.forEach((check) => {
      const item = document.createElement("li");
      item.className = check.passed ? "test-pass" : "test-fail";
      item.textContent = `${check.passed ? "PASS" : "FAIL"} — ${check.name}`;
      results.append(item);
    });
    const passed = checks.filter((check) => check.passed).length;
    summary.textContent = `${passed} of ${checks.length} checks passed. ${fixed ? "Blank titles are now rejected." : "The original form accepts empty and whitespace-only titles."}`;
    diagnosis.textContent = fixed
      ? "Fix verified: trim whitespace, reject an empty title, then save. These checks cover title validation only."
      : "Diagnosis: saving happens without checking the title. Trim whitespace, then reject an empty value before saving.";
    fix.disabled = fixed;
    run.textContent = "Run sample tests again";
  });
  fix.addEventListener("click", () => {
    fixed = true;
    version.textContent = "Validation fixed";
    fix.disabled = true;
    summary.textContent = "Fix applied. Run the tests again to verify it.";
    results.replaceChildren();
    diagnosis.textContent =
      "The sample form now trims the title and rejects empty input before saving.";
  });
  reset.addEventListener("click", () => {
    fixed = false;
    form.reset();
    version.textContent = "Original version";
    fix.disabled = true;
    run.textContent = "Run sample tests";
    tasks.replaceChildren();
    const item = document.createElement("li");
    item.textContent = "Check the release notes";
    tasks.append(item);
    results.replaceChildren();
    runSampleChecks(false).forEach((check) => {
      const row = document.createElement("li");
      row.textContent = check.name;
      results.append(row);
    });
    summary.textContent = "Ready to check the original version.";
    feedback.textContent = "Try a title, or leave it blank to explore the bug.";
    diagnosis.textContent =
      "Expected fix: trim the input, then reject an empty title before saving.";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  ThemeManager.init();
  initNavigation();
  initContactForm();
  initWorkflow();
  initQALab();
  initFadeAnimations();
});
