"""Shared fixtures: serve the site from this repo and watch the browser for errors."""

import functools
import http.server
import threading
from collections.abc import Iterator
from pathlib import Path

import pytest
from playwright.sync_api import Page, Playwright

SITE_ROOT = Path(__file__).resolve().parents[2]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """Static file handler that keeps request logs out of pytest output."""

    def log_message(self, format: str, *args: object) -> None:
        pass


@pytest.fixture(scope="session")
def base_url() -> Iterator[str]:
    """Serve the repo root on a free local port, like GitHub Pages serves it."""
    handler = functools.partial(QuietHandler, directory=str(SITE_ROOT))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_port}"
    server.shutdown()
    server.server_close()


@pytest.fixture
def browser_problems(page: Page) -> list[str]:
    """Collect console errors, uncaught exceptions, and failed requests."""
    problems: list[str] = []
    page.on(
        "console",
        lambda msg: problems.append(f"console: {msg.text}") if msg.type == "error" else None,
    )
    page.on("pageerror", lambda exc: problems.append(f"uncaught: {exc}"))
    page.on(
        "response",
        lambda res: problems.append(f"HTTP {res.status}: {res.url}") if res.status >= 400 else None,
    )
    page.on("requestfailed", lambda req: problems.append(f"failed: {req.url}"))
    return problems


@pytest.fixture
def phone_page(new_context, playwright: Playwright) -> Page:
    """A page in an iPhone-sized context (Chromium with mobile viewport and touch)."""
    device = dict(playwright.devices["iPhone 15"])
    device.pop("default_browser_type", None)
    return new_context(**device).new_page()
