#!/usr/bin/env python3
"""Fail if any wiki [[link]] target does not resolve to an existing page id or filename."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WIKI = ROOT / "wiki"

LINK_RE = re.compile(r"\[\[([^\]|#]+)")
ID_RE = re.compile(r"^id:\s*(\S+)", re.MULTILINE)


def collect_ids() -> set[str]:
    ids: set[str] = set()
    for path in WIKI.rglob("*.md"):
        text = path.read_text(encoding="utf-8", errors="replace")
        match = ID_RE.search(text)
        if match:
            ids.add(match.group(1))
        ids.add(path.stem)
    return ids


def find_ghosts(ids: set[str]) -> dict[str, list[str]]:
    ghosts: dict[str, list[str]] = {}
    for path in WIKI.rglob("*.md"):
        rel = path.relative_to(WIKI)
        for line_no, line in enumerate(
            path.read_text(encoding="utf-8", errors="replace").splitlines(), start=1
        ):
            for match in LINK_RE.finditer(line):
                target = match.group(1).strip()
                if target not in ids:
                    ghosts.setdefault(target, []).append(f"{rel}:{line_no}")
    return ghosts


def main() -> int:
    if not WIKI.is_dir():
        print(f"error: wiki directory not found at {WIKI}", file=sys.stderr)
        return 2

    ids = collect_ids()
    ghosts = find_ghosts(ids)

    if not ghosts:
        print(f"wiki-lint ok: {len(ids)} ids, 0 ghost links")
        return 0

    print(f"wiki-lint failed: {len(ghosts)} ghost target(s)\n", file=sys.stderr)
    for target in sorted(ghosts):
        refs = ghosts[target]
        print(f"  [[{target}]] — {len(refs)} ref(s)", file=sys.stderr)
        for ref in refs[:8]:
            print(f"    {ref}", file=sys.stderr)
        if len(refs) > 8:
            print(f"    ... +{len(refs) - 8} more", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())