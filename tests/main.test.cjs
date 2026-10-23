const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "scripts/main.js"), "utf8");

function load(overrides = {}) {
  const context = vm.createContext({
    document: { addEventListener() {} },
    window: {},
    ...overrides,
  });
  vm.runInContext(source, context);
  return context;
}

class Element {
  constructor(value = "") {
    this.value = value;
    this.textContent = "";
    this.disabled = true;
    this.children = [];
    this.listeners = {};
    this.attributes = {};
  }
  addEventListener(name, callback) {
    this.listeners[name] = callback;
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  append(child) {
    this.children.push(child);
  }
  replaceChildren() {
    this.children = [];
  }
  fire(name) {
    this.listeners[name]({ preventDefault() {} });
  }
}

test("contact draft encodes special characters and rejects invalid input", () => {
  const context = load();
  const url = new URL(
    context.buildContactDraft(
      " Jules & Co ",
      "jules@example.com",
      "Hello?\nRésumé & #1",
    ),
  );
  assert.equal(url.protocol, "mailto:");
  assert.equal(url.pathname, "collinsjulius@gmail.com");
  assert.equal(
    url.searchParams.get("subject"),
    "Portfolio Contact from Jules & Co",
  );
  assert.match(url.searchParams.get("body"), /Hello\?\nRésumé & #1/);
  assert.equal(
    context.buildContactDraft("  ", "jules@example.com", "Hi"),
    null,
  );
  assert.equal(context.buildContactDraft("Jules", "not-an-email", "Hi"), null);
  assert.equal(
    context.buildContactDraft("Jules", "jules@example.com", "  "),
    null,
  );
});

test("email handoff preserves entered fields and does not claim delivery", () => {
  const fields = {
    "#contact-name": new Element("Jules"),
    "#contact-email": new Element("jules@example.com"),
    "#contact-message": new Element("Keep this message"),
    ".form-status": new Element(),
    'button[type="submit"]': new Element(),
  };
  const form = new Element();
  form.hidden = true;
  form.querySelector = (selector) => fields[selector];
  form.reset = () => assert.fail("Draft fields must not be cleared");
  const context = load({
    document: { addEventListener() {}, getElementById: () => form },
    window: { location: {} },
  });
  context.initContactForm();
  assert.equal(form.hidden, false);
  assert.equal(fields['button[type="submit"]'].disabled, false);
  form.fire("submit");
  assert.match(context.window.location.href, /^mailto:/);
  assert.equal(fields["#contact-message"].value, "Keep this message");
  assert.match(fields[".form-status"].textContent, /Review and send/);
});

test("invalid drafts and failed email handoffs keep the message available", () => {
  for (const name of ["   ", "Jules"]) {
    const fields = {
      "#contact-name": new Element(name),
      "#contact-email": new Element("jules@example.com"),
      "#contact-message": new Element("Keep this message"),
      ".form-status": new Element(),
      'button[type="submit"]': new Element(),
    };
    const form = new Element();
    form.querySelector = (selector) => fields[selector];
    const location = {};
    let handoffs = 0;
    Object.defineProperty(location, "href", {
      set() {
        handoffs += 1;
        throw Error("Email app unavailable");
      },
    });
    const context = load({
      document: { addEventListener() {}, getElementById: () => form },
      window: { location },
    });
    context.initContactForm();
    form.fire("submit");
    assert.equal(handoffs, name.trim() ? 1 : 0);
    assert.equal(fields["#contact-message"].value, "Keep this message");
    assert.equal(fields[".form-status"].className, "form-status error");
    assert.match(
      fields[".form-status"].textContent,
      name.trim() ? /Use the email link/ : /Enter your name/,
    );
  }
});

test("theme follows system until explicitly chosen and tolerates blocked storage", () => {
  const toggle = new Element();
  let systemChange;
  const document = {
    addEventListener() {},
    getElementById: () => toggle,
    documentElement: { dataset: {} },
  };
  const context = load({
    document,
    localStorage: {
      getItem() {
        throw Error("Storage blocked");
      },
      setItem() {
        throw Error("Storage blocked");
      },
    },
    window: {
      matchMedia: () => ({
        matches: false,
        addEventListener(_, callback) {
          systemChange = callback;
        },
      }),
    },
  });
  vm.runInContext("ThemeManager.init()", context);
  assert.equal(document.documentElement.dataset.theme, "light");
  systemChange({ matches: true });
  assert.equal(document.documentElement.dataset.theme, "dark");
  toggle.fire("click");
  assert.equal(document.documentElement.dataset.theme, "light");
  systemChange({ matches: true });
  assert.equal(document.documentElement.dataset.theme, "light");
  assert.equal(toggle.attributes["aria-label"], "Switch to dark theme");
});

test("workflow selection switches panels and preserves accessible native controls", () => {
  const fieldset = new Element();
  const selection = new Element("manual");
  const panels = {
    "workflow-manual": new Element(),
    "workflow-automated": new Element(),
  };
  fieldset.querySelector = () => selection;
  const context = load({
    document: {
      addEventListener() {},
      querySelector: () => fieldset,
      getElementById: (id) => panels[id],
    },
  });
  context.initWorkflow();
  assert.equal(panels["workflow-manual"].hidden, false);
  assert.equal(panels["workflow-automated"].hidden, true);
  selection.value = "automated";
  fieldset.fire("change");
  assert.equal(panels["workflow-manual"].hidden, true);
  assert.equal(panels["workflow-automated"].hidden, false);
});

test("Escape closes a pointer-opened menu when focus stays outside navigation", () => {
  const menu = new Element();
  menu.getAttribute = (name) => menu.attributes[name];
  menu.focus = () => {
    menu.focused = true;
  };
  const nav = new Element();
  const classes = new Set();
  nav.classList = {
    add: (name) => classes.add(name),
    remove: (name) => classes.delete(name),
    toggle: (name, enabled) =>
      enabled ? classes.add(name) : classes.delete(name),
  };
  const links = new Element();
  links.querySelectorAll = () => [];
  const document = new Element();
  document.querySelector = (selector) =>
    selector === ".globalnav" ? nav : menu;
  document.getElementById = () => links;
  document.querySelectorAll = () => [];
  const context = load({
    document,
    window: {
      scrollY: 0,
      addEventListener() {},
      matchMedia: () => ({ addEventListener() {} }),
    },
  });
  context.initNavigation();
  menu.fire("click");
  assert.equal(menu.getAttribute("aria-expanded"), "true");
  document.listeners.keydown({ key: "Escape" });
  assert.equal(menu.getAttribute("aria-expanded"), "false");
  assert.equal(classes.has("menu-open"), false);
  assert.equal(menu.focused, true);
});

test("primary navigation matches the remaining page sections", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const sections = [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(
    (match) => match[1],
  );
  const nav = [...html.matchAll(/<a href="#([^"]+)" class="nav-link"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(sections, ["projects", "skills", "experience", "contact"]);
  assert.deepEqual(nav, sections);
});

test("every local page link and media asset resolves; fragment IDs are unique", () => {
  for (const page of ["index.html", "404.html"]) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const [, target] of html.matchAll(/(?:href|src|poster)="([^"]+)"/g)) {
      if (/^(https?:|mailto:)/.test(target)) continue;
      if (target.startsWith("#")) {
        assert.ok(ids.includes(target.slice(1)), `Missing anchor: ${target}`);
      } else {
        const url = new URL(target, `https://portfolio.test/${page}`);
        const localPath =
          url.pathname === "/" ? "index.html" : url.pathname.slice(1);
        assert.ok(
          fs.existsSync(path.join(root, localPath)),
          `Missing file in ${page}: ${target}`,
        );
        // Root-relative 404 assets must also resolve for missing nested URLs.
        if (page === "404.html") assert.ok(target.startsWith("/"));
      }
    }
  }
});

test("contact retains visible labels and a usable no-JavaScript fallback", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const form = html.match(/<form\b[^>]*>[\s\S]*?<\/form>/)?.[0];
  assert.ok(form);
  assert.match(form, /^<form\b[^>]*\bhidden\b/);
  assert.doesNotMatch(form, /\bplaceholder=/);
  for (const id of ["contact-name", "contact-email", "contact-message"]) {
    assert.match(form, new RegExp(`<label for="${id}">[^<]+</label>`));
    assert.match(
      form,
      new RegExp(`<(?:input|textarea)\\b[^>]*id="${id}"[^>]*required`),
    );
  }
  assert.match(form, /Open email draft/);
  assert.match(html, /href="mailto:collinsjulius@gmail.com" class="contact-method"/);
  for (const mode of ["manual", "automated"]) {
    assert.match(html, new RegExp(`<div id="workflow-${mode}">`));
  }
});

test("external project links have distinct accessible names and safe targets", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const projects = [
    "iOS UI Automation Framework",
    "eBay Price Tracker",
    "Valorant Match Tracker",
    "Demandware Scraper",
  ];
  for (const name of projects) {
    assert.ok(html.includes(`<span class="sr-only">— ${name}</span>`));
  }
  for (const [anchor] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    assert.match(anchor, /rel="noopener noreferrer"/);
  }
});

test("Maps test recording has user controls and compact valid media", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const video = html.match(/<video\b[^>]*>[\s\S]*?<\/video>/)?.[0];
  assert.ok(video, "Missing iOS project video");
  assert.match(video, /\bcontrols\b/);
  assert.match(video, /\bplaysinline\b/);
  assert.match(video, /\bpreload="none"/);
  assert.doesNotMatch(video, /\bautoplay\b/);

  const videoPath = "./assets/videos/uiautomation-maps-demo.mp4";
  const posterPath = "./assets/images/projects/uiautomation-maps-poster.webp";
  assert.ok(video.includes(`src="${videoPath}"`));
  assert.ok(video.includes(`href="${videoPath}"`));
  assert.ok(video.includes(`poster="${posterPath}"`));
  assert.ok(html.includes(`src="${posterPath}"`));

  const recording = fs.readFileSync(path.resolve(root, videoPath));
  assert.ok(recording.length < 5_000_000, "Video exceeds 5 MB");
  assert.equal(recording.toString("ascii", 4, 8), "ftyp");

  const poster = fs.readFileSync(path.resolve(root, posterPath));
  assert.ok(poster.length < 150_000, "Video poster exceeds 150 KB");
  assert.equal(poster.toString("ascii", 0, 4), "RIFF");
  assert.equal(poster.toString("ascii", 8, 12), "WEBP");
});

test("tracker previews are valid, compact images", () => {
  for (const project of ["ebay-tracker", "valorant-match-tracker"]) {
    const preview = fs.readFileSync(
      path.join(root, `assets/images/projects/${project}-output-preview.webp`),
    );
    assert.ok(preview.length < 150_000, `${project} preview is too large`);
    assert.equal(preview.toString("ascii", 0, 4), "RIFF");
    assert.equal(preview.toString("ascii", 8, 12), "WEBP");

    const full = fs.readFileSync(
      path.join(root, `assets/images/projects/${project}-output.png`),
    );
    assert.ok(full.length < 1_500_000, `${project} full image is too large`);
    assert.equal(full.toString("hex", 0, 8), "89504e470d0a1a0a");
  }
});
