"""Small helpers shared by the browser tests."""

from playwright.sync_api import Page


def reveal_lazy_images(page: Page) -> None:
    """Scroll each lazy-loaded image into view and wait until it has decoded."""
    for image in page.locator("img[loading=lazy]").all():
        image.scroll_into_view_if_needed()
    page.wait_for_function(
        "[...document.images].every(img => img.complete && img.naturalWidth > 0)"
    )
