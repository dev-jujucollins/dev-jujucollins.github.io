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

They cover page navigation, contact links, system theme changes, blocked
storage, local links,
link-preview tags and image sizes, and unused files in `assets/`.

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
remembers a choice, desktop and phone navigation work, the headline and buttons
react to the pointer (and stay still with reduced motion), and the content still
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
  The source project covers nine system apps and has a native Swift XCUITest
  port of the device tests. The earlier full-suite report remains linked below the recording.
- **This site is tested:** the number of automated checks shown on the page is
  verified by `test_tested_panel_shows_the_real_number_of_checks`, which fails
  with the correct number whenever tests are added or removed. Update
  `data-test-count` in `index.html` to match.

The eBay and Valorant card images summarize each repo's test suite: test
functions counted per area from the source, the CI matrix and checks from its
workflow files, and the latest CI result on `main` (Nov 17, 2026). The card text
uses the same counts. Regenerate both when the suites change. Each card links to
the full-size image, the repo's `tests/` folder, and the repo.

Core portfolio content remains readable without JavaScript.

## Content and layout

Use project names and concrete facts as headings and body copy. Avoid taglines,
repeated summaries, numbered eyebrows, and instructions that repeat a control's
label. Keep accessible link names and qualifications that
explain recorded demos or reported results.

Use the shared design tokens and components in `styles/main.css`, including the
404 page. Keep mobile header spacing stable during initialization and readable
without JavaScript. The site needs no build tooling or runtime dependencies.
Text is set in [Allo](https://allo.joshpuckett.me) by Josh Puckett, self-hosted
under the SIL Open Font License (`assets/fonts/OFL.txt`).
