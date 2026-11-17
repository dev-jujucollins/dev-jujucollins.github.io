"""Page-level checks: loading, assets, layout, downloads, and the no-JavaScript fallback."""

import re
from pathlib import Path

import pytest
from playwright.sync_api import Page, expect

from helpers import reveal_lazy_images


def test_home_page_loads_without_browser_errors(page: Page, browser_problems: list[str]):
    page.goto("/")
    expect(page).to_have_title("Julius Collins - QA Engineer · Python Automation")
    expect(page.get_by_role("heading", level=1)).to_contain_text("QA Engineer.")

    reveal_lazy_images(page)
    page.locator("footer").scroll_into_view_if_needed()

    assert browser_problems == []


def test_every_image_loads(page: Page):
    page.goto("/")
    reveal_lazy_images(page)

    broken = page.evaluate(
        "[...document.images].filter(img => !img.naturalWidth).map(img => img.src)"
    )
    assert broken == []


def test_phone_layout_has_no_horizontal_scroll(phone_page: Page):
    phone_page.goto("/")
    reveal_lazy_images(phone_page)

    widths = phone_page.evaluate(
        "({page: document.documentElement.scrollWidth, viewport: window.innerWidth})"
    )
    assert widths["page"] <= widths["viewport"]


def test_resume_button_downloads_the_pdf(page: Page):
    page.goto("/")

    with page.expect_download() as download_info:
        page.get_by_role("link", name="Download Resume PDF").click()

    download = download_info.value
    assert download.suggested_filename.endswith(".pdf")
    assert download.failure() is None


def test_skip_link_moves_focus_to_main_content(page: Page):
    page.goto("/")

    page.keyboard.press("Tab")
    skip_link = page.get_by_role("link", name="Skip to main content")
    expect(skip_link).to_be_focused()
    expect(skip_link).to_be_in_viewport()

    page.keyboard.press("Enter")
    expect(page.locator("main")).to_be_focused()


def test_not_found_page_links_home(page: Page, browser_problems: list[str]):
    page.goto("/404.html")
    expect(page.get_by_role("heading", name="Page not found")).to_be_visible()

    page.get_by_role("link", name="Home").click()
    expect(page.get_by_role("heading", level=1)).to_contain_text("QA Engineer.")
    assert browser_problems == []


@pytest.mark.browser_context_args(java_script_enabled=False)
def test_content_stays_usable_without_javascript(page: Page):
    page.goto("/")

    expect(page.get_by_role("heading", level=1)).to_have_text("QA Engineer.Python Automation.")
    expect(page.get_by_role("heading", name="iOS UI Automation Framework")).to_be_visible()
    expect(page.locator("#testing-title")).to_be_visible()
    expect(page.get_by_role("button", name="Menu")).to_be_hidden()
    expect(page.get_by_role("link", name="collinsjulius@hotmail.com")).to_be_visible()

def test_allo_font_loads_and_renders_the_page(page: Page):
    page.goto("/")
    loaded = page.evaluate(
        """async () => {
            await document.fonts.ready;
            return [...document.fonts].some(
                (face) => face.family.replaceAll('"', "") === "Allo" && face.status === "loaded"
            );
        }"""
    )

    assert loaded, "Allo did not load"
    family = page.get_by_role("heading", level=1).evaluate("el => getComputedStyle(el).fontFamily")
    assert family.startswith('"Allo"') or family.startswith("Allo")


def count_node_tests() -> int:
    source = (Path(__file__).resolve().parents[1] / "main.test.cjs").read_text()
    return len(re.findall(r"(?m)^test\(", source))


def test_tested_panel_shows_the_real_number_of_checks(page: Page, request: pytest.FixtureRequest):
    """The page says how many checks run; this keeps that number honest."""
    session = request.session
    if len(session.items) != session.testscollected or request.config.option.keyword:
        pytest.skip("Only meaningful when the whole browser suite runs")
    expected = len(session.items) + count_node_tests()

    page.goto("/")
    shown = [int(text) for text in page.locator("[data-test-count]").all_inner_texts()]

    assert shown and all(n == expected for n in shown), (
        f"Update every data-test-count in index.html to {expected}"
    )
