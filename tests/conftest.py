"""Readable test output: one line per test, grouped by area, in plain words.

Runs only in quiet mode (`-q`, set in pyproject.toml). Pass `-v` to get pytest's
standard per-test lines with full node IDs instead.

    navigation
      ✓ nav link scrolls to section and marks it current (Work, projects)  0.4s
      ✗ phone menu closes after choosing a section  1.2s
"""

import pytest
from readable import describe

MARKS = {
    "passed": ("✓", {"green": True}),
    "failed": ("✗", {"red": True, "bold": True}),
    "skipped": ("–", {"yellow": True}),
}


def _quiet(config: pytest.Config) -> bool:
    return config.get_verbosity() < 0


@pytest.hookimpl(wrapper=True)
def pytest_report_teststatus(report: pytest.TestReport, config: pytest.Config):
    category, letter, word = yield
    # Replace pytest's progress dots with the lines written below.
    return (category, "", word) if _quiet(config) else (category, letter, word)


def pytest_runtest_logreport(report: pytest.TestReport) -> None:
    config = getattr(report, "config", None)
    if config is None or not _quiet(config):
        return
    reporter = config.pluginmanager.get_plugin("terminalreporter")
    if reporter is None:
        return
    shown = (
        report.when == "call"
        or (report.when == "setup" and not report.passed)
        or (report.when == "teardown" and report.failed)
    )
    if not shown:
        return
    area, title = describe(report.nodeid)
    if area != _reporter.get("area"):
        reporter.write_line("")
        reporter.write_line(area, bold=True)
        _reporter["area"] = area
    mark, style = MARKS[report.outcome]
    reporter.write_line(f"  {mark} {title}  {report.duration:.1f}s", **style)


# The last area printed, so each area gets one heading.
_reporter: dict = {}


@pytest.hookimpl(wrapper=True)
def pytest_runtest_makereport(item: pytest.Item, call):
    report = yield
    report.config = item.config
    return report
