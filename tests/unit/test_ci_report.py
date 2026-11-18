"""The CI report turns JUnit results into a readable summary and line-level annotations."""

from pathlib import Path

import ci_report
from readable import describe

PYTEST_XML = """<?xml version="1.0" encoding="utf-8"?>
<testsuites><testsuite name="pytest" tests="3">
  <testcase classname="tests.e2e.test_theme" name="test_toggle" file="tests/e2e/test_theme.py" line="17" time="0.4"/>
  <testcase classname="tests.e2e.test_type" name="test_letters" file="tests/e2e/test_type.py" line="52" time="1.2">
    <failure message="AssertionError: assert 651.43 == 650&#10;+  where 651.43 = wght(...)">tests/e2e/helpers.py:9: in settle
tests/e2e/test_type.py:62: in test_letters
    assert wght(first) == 650
E   AssertionError: assert 651.43 == 650</failure>
  </testcase>
  <testcase classname="tests.e2e.test_page" name="test_count" file="tests/e2e/test_page.py" line="100" time="0">
    <skipped message="Only meaningful when the whole browser suite runs"/>
  </testcase>
</testsuite></testsuites>"""

NODE_XML = """<?xml version="1.0" encoding="utf-8"?>
<testsuites>
  <testcase name="contact offers direct links and no form" time="0.001" classname="test"/>
</testsuites>"""


def write(tmp_path: Path, name: str, text: str) -> Path:
    path = tmp_path / name
    path.write_text(text)
    return path


def test_reads_outcomes_lines_and_first_message_line(tmp_path):
    suite = ci_report.read_suite(write(tmp_path, "pytest-junit.xml", PYTEST_XML))

    assert [case.outcome for case in suite.cases] == ["passed", "failed", "skipped"]
    failure = suite.cases[1]
    # The failing line comes from the traceback, not the test's first line (52 + 1).
    assert (failure.file, failure.line) == ("tests/e2e/test_type.py", 62)
    assert failure.name == "type › letters"
    assert failure.message == "AssertionError: assert 651.43 == 650"


def test_falls_back_to_the_test_line_without_a_traceback(tmp_path):
    xml = PYTEST_XML.replace(">tests/e2e/helpers.py", ">no traceback here. tests/e2e/helpers.py").replace(
        "tests/e2e/test_type.py:62: in", "elsewhere:62: in"
    )
    suite = ci_report.read_suite(write(tmp_path, "pytest-junit.xml", xml))

    assert suite.cases[1].line == 53


def test_finds_node_test_lines_by_name(tmp_path):
    (tmp_path / "tests").mkdir()
    (tmp_path / ci_report.NODE_TESTS).write_text(
        'const x = 1;\n\ntest("contact offers direct links and no form", () => {});\n'
    )

    suite = ci_report.read_suite(write(tmp_path, "node-junit.xml", NODE_XML), root=tmp_path)

    assert suite.title == "Unit tests (Node)"
    assert (suite.cases[0].file, suite.cases[0].line) == (ci_report.NODE_TESTS, 3)


def test_annotation_escapes_workflow_command_characters():
    case = ci_report.Case("a, b: c", "tests/x.py", 4, 0, "failed", "50% off\nnext")

    assert ci_report.annotation(case) == (
        "::error file=tests/x.py,line=4,title=a%2C b%3A c::50%25 off%0Anext"
    )


def test_summary_leads_with_the_failure_count_and_lists_failures(tmp_path):
    suites = [
        ci_report.read_suite(write(tmp_path, "pytest-junit.xml", PYTEST_XML)),
        ci_report.read_suite(write(tmp_path, "node-junit.xml", NODE_XML), root=tmp_path),
    ]

    text = ci_report.summary(suites)

    assert text.startswith("### ❌ 1 of 4 checks failed")
    assert "| Browser and accessibility tests (pytest) | 1 | 1 | 1 |" in text
    assert "**type › letters** — `tests/e2e/test_type.py:62`" in text


def test_summary_for_a_clean_run(tmp_path):
    suite = ci_report.read_suite(write(tmp_path, "node-junit.xml", NODE_XML), root=tmp_path)

    assert ci_report.summary([suite]).startswith("### ✅ All 1 checks passed")


def test_readable_names_drop_the_browser_parameter():
    assert describe("tests/e2e/test_navigation.py::test_nav_link_scrolls[Work-projects-chromium]") == (
        "navigation",
        "nav link scrolls (Work, projects)",
    )
    assert describe("tests/e2e/test_theme.py::test_toggle[chromium]") == ("theme", "toggle")
