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
  assert.deepEqual(sections, ["projects", "experience", "testing", "contact"]);
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

test("contact offers direct links and no form", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.doesNotMatch(html, /<form\b/);
  assert.match(html, /href="mailto:collinsjulius@hotmail.com" class="contact-method"/);
  assert.match(html, /href="https:\/\/linkedin.com\/in\/jujucollins"/);
  assert.match(html, /href="https:\/\/github.com\/dev-jujucollins"/);
});

test("external project links have distinct accessible names and safe targets", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const projects = [
    "iOS UI Automation Framework",
    "eBay Price Tracker",
    "Valorant Match Tracker",
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

  const recording = fs.readFileSync(path.resolve(root, videoPath));
  assert.ok(recording.length < 5_000_000, "Video exceeds 5 MB");
  assert.equal(recording.toString("ascii", 4, 8), "ftyp");

  const poster = fs.readFileSync(path.resolve(root, posterPath));
  assert.ok(poster.length < 150_000, "Video poster exceeds 150 KB");
  assert.equal(poster.toString("ascii", 0, 4), "RIFF");
  assert.equal(poster.toString("ascii", 8, 12), "WEBP");
});

test("tracker test-summary images are valid and compact", () => {
  for (const project of ["ebay-tests", "valorant-tests"]) {
    const preview = fs.readFileSync(
      path.join(root, `assets/images/projects/${project}.webp`),
    );
    assert.ok(preview.length < 150_000, `${project} preview is too large`);
    assert.equal(preview.toString("ascii", 0, 4), "RIFF");
    assert.equal(preview.toString("ascii", 8, 12), "WEBP");

    const full = fs.readFileSync(
      path.join(root, `assets/images/projects/${project}-full.png`),
    );
    assert.ok(full.length < 1_500_000, `${project} full image is too large`);
    assert.equal(full.toString("hex", 0, 8), "89504e470d0a1a0a");
  }
});

// Width and height from a PNG IHDR chunk or a JPEG start-of-frame marker.
function imageSize(buffer) {
  if (buffer.toString("hex", 0, 8) === "89504e470d0a1a0a") {
    return { type: "png", width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  assert.equal(buffer.toString("hex", 0, 2), "ffd8", "Not a PNG or JPEG");
  for (let offset = 2; offset < buffer.length; ) {
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        type: "jpeg",
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  throw new Error("JPEG has no start-of-frame marker");
}

function metaContent(html, attribute, key) {
  const tag = html.match(
    new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="([^"]+)"`),
  );
  assert.ok(tag, `Missing <meta ${attribute}="${key}">`);
  return tag[1];
}

test("link previews use a local 1200x630 image with matching tags", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8").replace(/\s+/g, " ");
  const site = "https://dev-jujucollins.github.io/";
  const ogImage = metaContent(html, "property", "og:image");
  assert.equal(metaContent(html, "name", "twitter:image"), ogImage);
  assert.equal(metaContent(html, "name", "twitter:card"), "summary_large_image");
  assert.ok(metaContent(html, "property", "og:image:alt").length > 20);
  assert.equal(metaContent(html, "property", "og:url"), site);
  assert.match(html, new RegExp(`<link rel="canonical" href="${site}" />`));
  // X reads twitter:* tags from name=, not property=.
  assert.doesNotMatch(html, /property="twitter:/);

  assert.ok(ogImage.startsWith(site), "og:image must be an absolute URL");
  const image = fs.readFileSync(path.join(root, ogImage.slice(site.length)));
  const size = imageSize(image);
  assert.deepEqual([size.width, size.height], [1200, 630]);
  assert.equal(metaContent(html, "property", "og:image:width"), "1200");
  assert.equal(metaContent(html, "property", "og:image:height"), "630");
  assert.equal(metaContent(html, "property", "og:image:type"), `image/${size.type}`);
  assert.ok(image.length < 300_000, "Link preview image exceeds 300 KB");
});

test("touch icon and profile photo are the expected sizes", () => {
  const icon = imageSize(fs.readFileSync(path.join(root, "assets/apple-touch-icon.png")));
  assert.deepEqual([icon.type, icon.width, icon.height], ["png", 180, 180]);

  const photo = imageSize(fs.readFileSync(path.join(root, "assets/images/profile.jpg")));
  // Square, and at least 2x the 120px display size for sharp Retina rendering.
  assert.equal(photo.width, photo.height);
  assert.ok(photo.width >= 240);
});

test("every file in assets/ is used by a page", () => {
  // Fonts are referenced from the stylesheet; license files ship beside them.
  const pages = ["index.html", "404.html", "styles/main.css"]
    .map((page) => fs.readFileSync(path.join(root, page), "utf8"))
    .join("\n");
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    });
  const unused = walk(path.join(root, "assets"))
    .filter((file) => ![".DS_Store", "OFL.txt"].includes(path.basename(file)))
    .map((file) => path.relative(root, file).split(path.sep).join("/"))
    .filter((file) => !pages.includes(file));
  assert.deepEqual(unused, [], "Remove unused assets or link them from a page");
});

test("self-hosted font is preloaded, licensed, and a compact WOFF2", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8").replace(/\s+/g, " ");
  const css = fs.readFileSync(path.join(root, "styles/main.css"), "utf8");
  const font = "assets/fonts/allo-latin.woff2";
  assert.match(css, /url\("\.\.\/assets\/fonts\/allo-latin\.woff2"\)/);
  assert.match(css, /font-display: swap;/);
  assert.match(
    html,
    /<link rel="preload" href="\.\/assets\/fonts\/allo-latin\.woff2" as="font" type="font\/woff2" crossorigin \/>/,
  );
  const data = fs.readFileSync(path.join(root, font));
  assert.equal(data.toString("ascii", 0, 4), "wOF2");
  assert.ok(data.length < 260_000, "Font subset exceeds 260 KB");
  assert.match(fs.readFileSync(path.join(root, "assets/fonts/OFL.txt"), "utf8"), /SIL Open Font License/);
});

test("headline letters round off near the pointer and only gain weight with a precise pointer", () => {
  const { letterAxes } = load();
  assert.deepEqual({ ...letterAxes(0, 140, true) }, { wght: 800, rond: 100 });
  assert.deepEqual({ ...letterAxes(0, 140, false) }, { wght: 650, rond: 100 });
  assert.deepEqual({ ...letterAxes(140, 140, true) }, { wght: 650, rond: 50 });
  assert.deepEqual({ ...letterAxes(500, 140, true) }, { wght: 650, rond: 50 });
  const near = letterAxes(35, 140, true);
  const far = letterAxes(105, 140, true);
  assert.ok(near.rond > far.rond && near.wght > far.wght, "Effect should fade with distance");
});
