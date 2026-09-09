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

test("demo reproduces blank-title bug and validates fixed input", () => {
  const context = load();
  for (const input of ["", " ", "\t\n"]) {
    assert.equal(context.submitSampleTask(input, false).accepted, true);
    assert.equal(context.submitSampleTask(input, true).accepted, false);
  }
  const valid = context.submitSampleTask("  Ship release  ", true);
  assert.equal(valid.accepted, true);
  assert.equal(valid.title, "Ship release");
});

test("regression checks distinguish original and fixed behavior", () => {
  const context = load();
  assert.equal(
    context.runSampleChecks(false).filter((check) => check.passed).length,
    1,
  );
  assert.equal(
    context.runSampleChecks(true).filter((check) => check.passed).length,
    3,
  );
});

test("QA lab can reproduce, diagnose, fix, verify, and reset", () => {
  const ids = [
    "sample-form",
    "sample-title",
    "sample-feedback",
    "sample-tasks",
    "run-tests",
    "apply-fix",
    "reset-lab",
    "test-summary",
    "test-results",
    "test-diagnosis",
    "lab-version",
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, new Element()]));
  const submit = new Element();
  elements["sample-form"].querySelector = () => submit;
  elements["sample-form"].reset = () => {
    elements["sample-title"].value = "Release smoke test";
  };
  const context = load({
    document: {
      addEventListener() {},
      getElementById: (id) => elements[id],
      createElement: () => new Element(),
    },
  });
  context.initQALab();
  elements["sample-form"].fire("submit");
  assert.match(elements["sample-feedback"].textContent, /Bug reproduced/);
  elements["run-tests"].fire("click");
  assert.match(elements["test-summary"].textContent, /1 of 3/);
  assert.equal(elements["apply-fix"].disabled, false);
  elements["apply-fix"].fire("click");
  assert.equal(
    elements["test-results"].children.length,
    0,
    "old failures must clear when version changes",
  );
  elements["sample-form"].fire("submit");
  assert.equal(elements["sample-feedback"].textContent, "Enter a task title.");
  elements["run-tests"].fire("click");
  assert.match(elements["test-summary"].textContent, /3 of 3/);
  elements["reset-lab"].fire("click");
  assert.equal(elements["lab-version"].textContent, "Original version");
  elements["run-tests"].fire("click");
  assert.match(elements["test-summary"].textContent, /1 of 3/);
});

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

test("every local page link and image resolves; all fragment IDs are unique", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, target] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
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
