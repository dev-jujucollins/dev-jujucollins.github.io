"""Navigation: section links on desktop and the collapsible menu on phones."""

import re

import pytest
from playwright.sync_api import Page, expect

SECTIONS = [
    ("Work", "projects"),
    ("Approach", "skills"),
    ("Experience", "experience"),
    ("Contact", "contact"),
]


@pytest.mark.parametrize(("label", "section_id"), SECTIONS)
def test_nav_link_scrolls_to_section_and_marks_it_current(
    page: Page, label: str, section_id: str
):
    page.goto("/")
    nav = page.get_by_role("navigation", name="Primary navigation")

    nav.get_by_role("link", name=label).click()

    expect(page).to_have_url(re.compile(f"#{section_id}$"))
    expect(page.locator(f"#{section_id}")).to_be_in_viewport()
    expect(nav.get_by_role("link", name=label)).to_have_attribute("aria-current", "location")


def test_phone_menu_opens_and_closes_with_escape(phone_page: Page):
    phone_page.goto("/")
    menu = phone_page.get_by_role("button", name="Menu")
    contact_link = phone_page.locator("#nav-links").get_by_role("link", name="Contact")

    expect(menu).to_have_attribute("aria-expanded", "false")
    expect(contact_link).to_be_hidden()

    menu.click()
    expect(menu).to_have_attribute("aria-expanded", "true")
    expect(contact_link).to_be_visible()

    phone_page.keyboard.press("Escape")
    expect(menu).to_have_attribute("aria-expanded", "false")
    expect(contact_link).to_be_hidden()
    expect(menu).to_be_focused()


def test_phone_menu_closes_after_choosing_a_section(phone_page: Page):
    phone_page.goto("/")
    menu = phone_page.get_by_role("button", name="Menu")

    menu.click()
    phone_page.locator("#nav-links").get_by_role("link", name="Experience").click()

    expect(menu).to_have_attribute("aria-expanded", "false")
    expect(phone_page.locator("#experience")).to_be_in_viewport()


def test_phone_menu_closes_when_tapping_outside(phone_page: Page):
    phone_page.goto("/")
    menu = phone_page.get_by_role("button", name="Menu")

    menu.click()
    phone_page.get_by_text("© 2026 Julius Collins").click()

    expect(menu).to_have_attribute("aria-expanded", "false")
