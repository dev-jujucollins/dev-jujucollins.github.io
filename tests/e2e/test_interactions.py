"""Interactive pieces: the contact draft form and the restoration workflow switch."""

from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import Page, expect


def field(page: Page, label: str):
    return page.get_by_label(label, exact=True)


def fill_contact_form(page: Page, name: str, email: str, message: str) -> None:
    field(page, "Name").fill(name)
    field(page, "Email").fill(email)
    field(page, "Message").fill(message)


def test_contact_form_opens_an_encoded_email_draft(page: Page):
    page.goto("/")
    fill_contact_form(page, "Jules & Co", "jules@example.com", "Hello?\nRésumé & #1")

    # Chromium reports the mailto: handoff as a request, which lets the test read it.
    with page.expect_request(lambda req: req.url.startswith("mailto:")) as draft:
        page.get_by_role("button", name="Open email draft").click()

    url = urlsplit(draft.value.url)
    query = parse_qs(url.query)
    assert url.path == "collinsjulius@gmail.com"
    assert query["subject"] == ["Portfolio Contact from Jules & Co"]
    assert "Hello?\nRésumé & #1" in query["body"][0]
    expect(page.get_by_role("status")).to_contain_text("Review and send in your email app")
    # The draft does not claim delivery, so the visitor's text stays in place.
    expect(field(page, "Message")).to_have_value("Hello?\nRésumé & #1")


def test_contact_form_explains_an_invalid_email(page: Page):
    page.goto("/")
    # "jules@example" passes the browser's own email check but not the form's.
    fill_contact_form(page, "Jules", "jules@example", "Keep this message")

    page.get_by_role("button", name="Open email draft").click()

    expect(page.get_by_role("status")).to_have_text(
        "Enter your name, a valid email address, and a message."
    )
    expect(field(page, "Message")).to_have_value("Keep this message")


def test_contact_form_blocks_empty_required_fields(page: Page):
    page.goto("/")

    page.get_by_role("button", name="Open email draft").click()

    # The browser's required-field check stops the submit, so no status message appears.
    assert field(page, "Name").evaluate("field => field.validity.valueMissing")
    expect(page.locator(".form-status")).to_be_empty()


def test_workflow_switch_shows_one_panel_at_a_time(page: Page):
    page.goto("/")
    manual = page.locator("#workflow-manual")
    automated = page.locator("#workflow-automated")

    expect(page.get_by_role("radio", name="Manual")).to_be_checked()
    expect(manual).to_be_visible()
    expect(automated).to_be_hidden()

    page.get_by_role("radio", name="Automated").check()

    expect(manual).to_be_hidden()
    expect(automated).to_be_visible()
    expect(automated.get_by_role("listitem")).to_have_count(3)
