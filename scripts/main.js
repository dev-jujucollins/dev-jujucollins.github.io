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
  document.addEventListener("keydown", (event) => {
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
    // At the very bottom the last section may be too short to reach the
    // top of the screen, so it counts as current there.
    const page = document.documentElement;
    const atBottom =
      !!page && window.innerHeight + window.scrollY >= page.scrollHeight - 2;
    const current = atBottom
      ? sections[sections.length - 1]
      : sections
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

// Weight and roundness for a headline letter at `distance` px from the pointer.
// Letters within `radius` round off (Allo's ROND axis, which keeps widths fixed);
// with a precise pointer they also gain weight, which does change widths.
function letterAxes(distance, radius, allowWeight) {
  const t = Math.max(0, 1 - distance / radius);
  const eased = t * t * (3 - 2 * t);
  return {
    wght: allowWeight ? Math.round(650 + 150 * eased) : 650,
    rond: Math.round(50 + 50 * eased),
  };
}

// Wrap each letter of the hero headline in a span. Screen readers get the
// original sentence from a visually hidden copy; the letters are aria-hidden.
function splitHeadline(headline) {
  const letters = document.createElement("span");
  letters.setAttribute("aria-hidden", "true");
  const chars = [];
  const lines = [];
  let current = "";
  headline.childNodes.forEach((node) => {
    if (node.nodeName === "BR") {
      lines.push(current);
      current = "";
    } else {
      current += node.textContent;
    }
  });
  lines.push(current);
  const clean = lines.map((line) => line.replace(/\s+/g, " ").trim());
  const sentence = clean.join(" ");

  clean.forEach((line, lineIndex) => {
    if (lineIndex > 0) letters.appendChild(document.createElement("br"));
    for (const char of line) {
      if (char === " ") {
        letters.appendChild(document.createTextNode(" "));
        continue;
      }
      const span = document.createElement("span");
      span.className = "headline-char";
      span.textContent = char;
      span.style.setProperty("--i", chars.length);
      letters.appendChild(span);
      chars.push(span);
    }
  });

  const spoken = document.createElement("span");
  spoken.className = "sr-only";
  spoken.textContent = sentence;
  headline.replaceChildren(spoken, letters);
  return chars;
}

const HeadlineType = {
  radius: 180,

  init() {
    const headline = document.querySelector(".hero-headline");
    if (!headline || typeof window.matchMedia !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    this.chars = splitHeadline(headline);
    this.allowWeight = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // One arrival moment: letters settle from light and round into place.
    headline.classList.add("is-settling");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        headline.classList.replace("is-settling", "is-arriving");
        setTimeout(() => headline.classList.remove("is-arriving"), 1400);
      });
    });

    const area = headline.closest(".hero-section") || headline;
    let pointer = null;
    let frame = 0;
    const render = () => {
      frame = 0;
      for (const char of this.chars) {
        let axes = { wght: 650, rond: 50 };
        if (pointer) {
          const box = char.getBoundingClientRect();
          const dx = box.left + box.width / 2 - pointer.x;
          const dy = box.top + box.height / 2 - pointer.y;
          axes = letterAxes(Math.hypot(dx, dy), this.radius, this.allowWeight);
        }
        char.style.setProperty("--wght", axes.wght);
        char.style.setProperty("--rond", axes.rond);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const follow = (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };
    // A tap on touch screens rounds the letters under the finger.
    area.addEventListener("pointerdown", follow);
    area.addEventListener("pointermove", (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    });
    area.addEventListener("pointerleave", () => {
      pointer = null;
      schedule();
    });
    area.addEventListener("pointercancel", () => {
      pointer = null;
      schedule();
    });
  },
};

document.addEventListener("DOMContentLoaded", () => {
  ThemeManager.init();
  HeadlineType.init();
  initNavigation();
  initFadeAnimations();
});
