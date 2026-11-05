# Julius Collins Portfolio

Static HTML, CSS, and vanilla JavaScript portfolio hosted on GitHub Pages.
No build step or runtime dependencies.

## Local preview

```sh
uv run python -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000.

## Validation

### Unit tests

Run the dependency-free JavaScript tests with Node.js 18 or later:

```sh
node --test tests/main.test.cjs
node --check scripts/main.js
```

They cover page navigation, contact-draft encoding and text preservation,
workflow comparison, system theme changes, blocked storage, and local links.

### Browser tests

The browser tests in `tests/e2e/` serve the site locally and drive Chromium with
pytest-playwright. Python packages are for testing only; the site itself still
has no dependencies.

```sh
uv sync
uv run playwright install chromium
uv run pytest
```

They check that the page loads without console errors or failed requests, the
resume downloads, the skip link moves focus, the theme follows the system and
remembers a choice, desktop and phone navigation work, the contact form builds
an encoded draft, the workflow switch toggles panels, and the content still
works without JavaScript. axe-core scans the page in both themes at desktop and
phone sizes. A failing test saves a trace and screenshot under `test-results/`;
open a trace with `uv run playwright show-trace <path-to-trace.zip>`.

Still look at layouts in a browser after visual changes.

## CI and deployment

`.github/workflows/site.yml` runs both suites on every push and pull request.
Pushes to `main` deploy to GitHub Pages only after the tests pass, and publish
only the site files (`index.html`, `404.html`, `robots.txt`, `sitemap.xml`,
`assets/`, `scripts/`, and `styles/`). This requires **GitHub Actions** as the
Pages source in Settings → Pages → Build and deployment.

## Interactive examples

- **iOS automation recording:** click-to-play footage of a passing local Appium
  integration test on an iPhone 18 Pro simulator running iOS 27.0. It searches
  Maps for Golden Gate Bridge, gets directions from simulated Apple Park,
  checks the destination and positive route distance and travel time, then
  starts and ends navigation. The video finishes with the actual test result.
  Recorded October 2, 2026 from source commit `aaf6879`; the native test result
  was `1 passed in 66.38s`, including setup, assertions, and cleanup. The clip
  shortens waits and adds captions while retaining the actions from that run.
  Native playback controls are retained, with no autoplay and `preload="none"`.
  The source project also covers Settings, Calendar,
  and Messages. The earlier full-suite report remains linked below the recording.
- **Workflow comparison:** simplified manual and automated restoration steps.
  The displayed time reduction comes from the existing internal-tool project.
- **Contact:** creates a mailto draft in the visitor's email app. It does not
  deliver mail or clear the entered message.

The eBay and Valorant card images are dated snapshots from local project runs.
The eBay image uses a real listing average and a clearly marked illustrative
target; no price alert was sent. Each card links to a larger version of its
capture.

Core portfolio content remains readable without JavaScript. Both workflow
panels remain visible; the switch and contact draft form appear only after
initialization. A direct email link remains available.

## Content and layout

Use project names and concrete facts as headings and body copy. Avoid taglines,
repeated summaries, numbered eyebrows, and instructions that repeat a control's
label. Keep visible form labels, accessible link names, and qualifications that
explain recorded demos or reported results.

Use the shared design tokens and components in `styles/main.css`, including the
404 page. Keep mobile header spacing stable during initialization and readable
without JavaScript. The site needs no build tooling or runtime dependencies.
