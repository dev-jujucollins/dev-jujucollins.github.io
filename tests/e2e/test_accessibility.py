"""Automated accessibility scans with axe-core, in both themes and at desktop and phone sizes."""

import pytest
from axe_playwright_python.sync_playwright import Axe
from playwright.sync_api import Page

from helpers import reveal_lazy_images

AXE = Axe()
VIEWPORTS = {"desktop": {"width": 1440, "height": 900}, "phone": {"width": 393, "height": 852}}


def describe(violations: list[dict]) -> str:
    lines = []
    for violation in violations:
        targets = ", ".join(" ".join(node["target"]) for node in violation["nodes"][:5])
        lines.append(f"{violation['id']} ({violation['impact']}): {violation['help']} -> {targets}")
    return "\n".join(lines)


@pytest.mark.parametrize("scheme", ["light", "dark"])
@pytest.mark.parametrize("viewport", VIEWPORTS)
def test_home_page_has_no_axe_violations(page: Page, scheme: str, viewport: str):
    page.set_viewport_size(VIEWPORTS[viewport])
    page.emulate_media(color_scheme=scheme, reduced_motion="reduce")
    page.goto("/")
    reveal_lazy_images(page)

    violations = AXE.run(page).response["violations"]

    assert violations == [], describe(violations)


def test_not_found_page_has_no_axe_violations(page: Page):
    page.goto("/404.html")

    violations = AXE.run(page).response["violations"]

    assert violations == [], describe(violations)
