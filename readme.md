# Julius Collins Portfolio

Static HTML, CSS, and vanilla JavaScript portfolio hosted on GitHub Pages.
No build step or runtime dependencies.

## Local preview

```sh
uv run python -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000.

## Validation

Run the dependency-free JavaScript tests with Node.js 18 or later:

```sh
node --test tests/main.test.cjs
node --check scripts/main.js
```

Tests cover the QA demonstration, contact-draft encoding and text preservation,
workflow comparison, system theme changes, blocked storage, and local links.
Also check desktop/mobile layouts, keyboard navigation, both themes, and reduced
motion in a browser after visual changes.

## Interactive examples

- **QA lab:** intentionally accepts blank task titles in its original version.
  Run tests, apply validation, and rerun. Reset restores the original example.
  Demo tasks are held in page memory only.
- **Workflow comparison:** simplified manual and automated restoration steps.
  The displayed time reduction comes from the existing internal-tool project.
- **Contact:** creates a mailto draft in the visitor's email app. It does not
  deliver mail or clear the entered message.

Core portfolio content remains readable without JavaScript. Demo and draft
controls remain disabled when JavaScript is unavailable; a direct email link
remains available.
