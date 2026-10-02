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

Core portfolio content remains readable without JavaScript. The workflow switch
and contact draft form stay inactive when JavaScript is unavailable; a direct
email link remains available.
