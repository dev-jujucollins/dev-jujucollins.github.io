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
  form.querySelector = (selector) => fields[selector];
  form.reset = () => assert.fail("Draft fields must not be cleared");
  const context = load({
    document: { addEventListener() {}, getElementById: () => form },
    window: { location: {} },
  });
  context.initContactForm();
  form.fire("submit");
  assert.match(context.window.location.href, /^mailto:/);
  assert.equal(fields["#contact-message"].value, "Keep this message");
  assert.match(fields[".form-status"].textContent, /Review and send/);
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
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, target] of html.matchAll(/(?:href|src|poster)="([^"]+)"/g)) {
    if (/^(https?:|mailto:)/.test(target)) continue;
    if (target.startsWith("#"))
      assert.ok(ids.includes(target.slice(1)), `Missing anchor: ${target}`);
    else
      assert.ok(
        fs.existsSync(path.resolve(root, target.split("?")[0])),
        `Missing file: ${target}`,
      );
  }
});

test("iOS test recording has user controls and a compact playable file", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const video = html.match(/<video\b[^>]*>/)?.[0];
  assert.ok(video, "Missing iOS project video");
  assert.match(video, /\bcontrols\b/);
  assert.match(video, /\bpreload="none"/);
  assert.doesNotMatch(video, /\bautoplay\b/);

  const file = path.join(root, "assets/videos/uiautomation-calendar-demo.mp4");
  assert.ok(fs.statSync(file).size < 3_000_000, "Video exceeds 3 MB");
  assert.equal(fs.readFileSync(file).toString("ascii", 4, 8), "ftyp");
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
