"""Summarize JUnit XML results for GitHub Actions.

Writes a Markdown table of results to the job summary and prints an `::error`
annotation for each failure, so a failing test shows its name, message, and
line on the run page without opening the logs.

    python3 tests/ci_report.py --summary "$GITHUB_STEP_SUMMARY" test-results/*.xml

Standard library only, so it runs before or without the project's packages.
"""

import argparse
import re
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path

from readable import describe

REPO_ROOT = Path(__file__).resolve().parents[1]
NODE_TESTS = "tests/main.test.cjs"


@dataclass
class Case:
    name: str
    file: str | None
    line: int | None
    seconds: float
    outcome: str  # passed, failed, or skipped
    message: str = ""


@dataclass
class Suite:
    title: str
    cases: list[Case] = field(default_factory=list)

    def count(self, outcome: str) -> int:
        return sum(case.outcome == outcome for case in self.cases)


def node_test_line(name: str, root: Path = REPO_ROOT) -> int | None:
    """Find the line of `test("name", ...)` in the Node test file (its JUnit has no line numbers)."""
    source = root / NODE_TESTS
    if not source.exists():
        return None
    for number, text in enumerate(source.read_text().splitlines(), start=1):
        if text.startswith(f'test("{name}"'):
            return number
    return None


def read_suite(path: Path, root: Path = REPO_ROOT) -> Suite:
    """Read one JUnit file from pytest (xunit1, with file and line) or Node's test runner."""
    tree = ET.parse(path)
    is_node = "node" in path.stem
    suite = Suite("Unit tests (Node)" if is_node else "Browser and accessibility tests (pytest)")
    for element in tree.iter("testcase"):
        outcome, message, details = "passed", "", ""
        for tag in ("failure", "error"):
            problem = element.find(tag)
            if problem is not None:
                outcome = "failed"
                message = problem.get("message") or (problem.text or "").strip()
                details = problem.text or ""
        if element.find("skipped") is not None:
            outcome = "skipped"
            message = element.find("skipped").get("message", "")
        name = element.get("name", "")
        if is_node:
            file, line = NODE_TESTS, node_test_line(name, root)
        else:
            file = element.get("file")
            line = failing_line(details, file) or (
                int(element.get("line")) + 1 if element.get("line") else None
            )
            area, title = describe(f"{file}::{name}")
            name = f"{area} › {title}"
        suite.cases.append(
            Case(name, file, line, float(element.get("time") or 0), outcome, first_line(message))
        )
    return suite


def failing_line(traceback: str, file: str | None) -> int | None:
    """The last line of `file` in a pytest traceback: where the test itself failed."""
    if not traceback or not file:
        return None
    matches = re.findall(rf"^{re.escape(file)}:(\d+):", traceback, flags=re.MULTILINE)
    return int(matches[-1]) if matches else None


def first_line(message: str) -> str:
    """Keep the assertion line and drop the traceback that follows it."""
    lines = [line.strip() for line in message.strip().splitlines() if line.strip()]
    return lines[0][:300] if lines else ""


def escape(value: str, property_value: bool = False) -> str:
    """Escape text for a GitHub workflow command (data or property)."""
    value = value.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    if property_value:
        value = value.replace(":", "%3A").replace(",", "%2C")
    return value


def annotation(case: Case) -> str:
    where = ""
    if case.file:
        where = f"file={escape(case.file, True)}"
        if case.line:
            where += f",line={case.line}"
        where += ","
    return f"::error {where}title={escape(case.name, True)}::{escape(case.message or 'Test failed')}"


def summary(suites: list[Suite]) -> str:
    total_failed = sum(suite.count("failed") for suite in suites)
    total = sum(len(suite.cases) for suite in suites)
    heading = (
        f"### ✅ All {total} checks passed"
        if total_failed == 0
        else f"### ❌ {total_failed} of {total} checks failed"
    )
    rows = [
        heading,
        "",
        "| Suite | Passed | Failed | Skipped | Time |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    for suite in suites:
        seconds = sum(case.seconds for case in suite.cases)
        rows.append(
            f"| {suite.title} | {suite.count('passed')} | {suite.count('failed')} | "
            f"{suite.count('skipped')} | {seconds:.1f}s |"
        )
    failures = [case for suite in suites for case in suite.cases if case.outcome == "failed"]
    if failures:
        rows += ["", "#### Failures", ""]
        for case in failures:
            where = f" — `{case.file}:{case.line}`" if case.file and case.line else ""
            name = re.sub(r"([|*_`])", r"\\\1", case.name)
            rows.append(f"- **{name}**{where}  ")
            rows.append(f"  `{case.message or 'Test failed'}`")
    return "\n".join(rows) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("results", nargs="+", type=Path, help="JUnit XML files")
    parser.add_argument("--summary", type=Path, help="File to append the Markdown summary to")
    args = parser.parse_args(argv)

    suites = [read_suite(path) for path in sorted(args.results) if path.exists()]
    for suite in suites:
        for case in suite.cases:
            if case.outcome == "failed":
                print(annotation(case))
    text = summary(suites)
    if args.summary:
        with args.summary.open("a") as handle:
            handle.write(text)
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
