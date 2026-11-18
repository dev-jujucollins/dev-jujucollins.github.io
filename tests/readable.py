"""Plain-language names for test node IDs, shared by the terminal output and its tests."""

from pathlib import Path


def describe(nodeid: str) -> tuple[str, str]:
    """Turn a node ID into (area, title): tests/e2e/test_theme.py::test_x_y[a-b] -> ("theme", "x y (a, b)")."""
    path, _, name = nodeid.partition("::")
    area = Path(path).stem.removeprefix("test_").replace("_", " ")
    function, _, params = name.partition("[")
    title = function.removeprefix("test_").replace("_", " ")
    # Every browser test runs in Chromium, so that parameter says nothing.
    values = [value for value in params.rstrip("]").split("-") if value and value != "chromium"]
    if values:
        title += f" ({', '.join(values)})"
    return area, title
