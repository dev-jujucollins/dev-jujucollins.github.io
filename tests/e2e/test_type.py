"""Reactive Allo type: the hero headline and hover roundness on links and buttons."""

import re

import pytest
from playwright.sync_api import Page, expect


def axes(locator) -> str:
    return locator.evaluate("el => getComputedStyle(el).fontVariationSettings")


def rond(locator) -> float:
    match = re.search(r'"ROND" ([\d.]+)', axes(locator))
    assert match, axes(locator)
    return float(match.group(1))


def wght(locator) -> float:
    return float(re.search(r'"wght" ([\d.]+)', axes(locator)).group(1))


def settled(page: Page) -> None:
    page.wait_for_function(
        "!document.querySelector('.hero-headline').matches('.is-settling, .is-arriving')"
    )


def test_headline_still_reads_as_one_sentence(page: Page):
    page.goto("/")

    heading = page.get_by_role("heading", level=1)
    expect(heading).to_have_accessible_name("QA Engineer. Python Automation.")
    expect(page.locator(".headline-char")).to_have_count(len("QAEngineer.PythonAutomation."))


def test_letters_near_the_pointer_get_rounder_and_heavier(page: Page):
    page.goto("/")
    settled(page)
    first = page.locator(".headline-char").first
    last = page.locator(".headline-char").last

    first.hover()

    page.wait_for_function(
        "getComputedStyle(document.querySelector('.headline-char')).fontVariationSettings.includes('\"ROND\" 100')"
    )
    assert wght(first) > 700
    assert rond(last) == 50

    page.mouse.move(5, 880)
    page.wait_for_function(
        "getComputedStyle(document.querySelector('.headline-char')).fontVariationSettings.includes('\"ROND\" 50')"
    )
    assert wght(first) == 650


def test_buttons_round_off_on_hover_without_changing_size(page: Page):
    page.goto("/")
    button = page.get_by_role("link", name="View work")
    before = button.bounding_box()
    assert rond(button) == 50

    button.hover()
    page.wait_for_timeout(400)

    assert rond(button) == 100
    after = button.bounding_box()
    assert abs(after["width"] - before["width"]) < 0.5


@pytest.mark.browser_context_args(reduced_motion="reduce")
def test_reduced_motion_keeps_the_headline_static(page: Page):
    page.goto("/")

    expect(page.locator(".headline-char")).to_have_count(0)
    page.get_by_role("heading", level=1).hover()
    expect(page.get_by_role("heading", level=1)).to_have_text("QA Engineer.Python Automation.")
