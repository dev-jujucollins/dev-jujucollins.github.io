"""Theme toggle: follows the system setting until the visitor picks one, then remembers it."""

import pytest
from playwright.sync_api import Page, expect


@pytest.mark.parametrize("scheme", ["light", "dark"])
def test_theme_follows_system_setting(page: Page, scheme: str):
    page.emulate_media(color_scheme=scheme)
    page.goto("/")

    expect(page.locator("html")).to_have_attribute("data-theme", scheme)


def test_toggle_switches_theme_and_updates_its_label(page: Page):
    page.emulate_media(color_scheme="light")
    page.goto("/")

    page.get_by_role("button", name="Switch to dark theme").click()

    expect(page.locator("html")).to_have_attribute("data-theme", "dark")
    expect(page.get_by_role("button", name="Switch to light theme")).to_be_visible()


def test_chosen_theme_survives_reload_and_system_changes(page: Page):
    page.emulate_media(color_scheme="dark")
    page.goto("/")
    page.get_by_role("button", name="Switch to light theme").click()

    page.reload()
    expect(page.locator("html")).to_have_attribute("data-theme", "light")

    page.emulate_media(color_scheme="dark")
    expect(page.locator("html")).to_have_attribute("data-theme", "light")


def test_saved_theme_is_applied_by_the_inline_head_script(page: Page):
    """The theme is set before main.js runs, so returning visitors never see a flash."""
    page.emulate_media(color_scheme="light")
    page.goto("/")
    page.get_by_role("button", name="Switch to dark theme").click()

    # Block main.js: only the small script in <head> can apply the saved choice now.
    page.route("**/scripts/main.js*", lambda route: route.abort())
    page.reload()

    expect(page.locator("html")).to_have_attribute("data-theme", "dark")
