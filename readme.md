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

Tests cover page navigation, contact-draft encoding and text preservation,
workflow comparison, system theme changes, blocked storage, and local links.
Also check desktop/mobile layouts, keyboard navigation, both themes, and reduced
motion in a browser after visual changes.

## Interactive examples

- **iOS automation recording:** click-to-play footage of a passing Appium test
  opening a Calendar event draft, entering a title, and canceling without
  saving. The source project also covers Settings, Messages, and Maps. The
  earlier full-suite report remains linked below the recording.
- **Workflow comparison:** simplified manual and automated restoration steps.
  The displayed time reduction comes from the existing internal-tool project.
- **Contact:** creates a mailto draft in the visitor's email app. It does not
  deliver mail or clear the entered message.

The eBay and Valorant card images are dated snapshots from local project runs.
The eBay image uses a real listing average and a clearly marked illustrative
target; no price alert was sent. Each card links to a larger version of its
capture.

Core portfolio content remains readable without JavaScript. The workflow switch
and contact draft form stay inactive when JavaScript is unavailable; a direct
email link remains available.
