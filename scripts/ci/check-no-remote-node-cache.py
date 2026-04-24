#!/usr/bin/env python3
from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS_DIR = ROOT / ".github" / "workflows"
PATTERN = re.compile(r"^\s*cache:\s*npm\s*$")


def main() -> int:
    violations: list[tuple[Path, int, str]] = []

    for workflow in sorted(WORKFLOWS_DIR.glob("*.yml")):
        lines = workflow.read_text(encoding="utf-8").splitlines()
        for idx, line in enumerate(lines, start=1):
            if PATTERN.match(line):
                violations.append((workflow, idx, line.strip()))

    if not violations:
        print("OK: no remote setup-node npm cache entries found in workflows.")
        return 0

    print("ERROR: remote setup-node npm cache is forbidden on self-hosted runners.")
    print("Remove `cache: npm` and rely on local npm cache path on runner.")
    print("")
    for path, line_no, snippet in violations:
        print(f"- {path.relative_to(ROOT)}:{line_no}: {snippet}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
