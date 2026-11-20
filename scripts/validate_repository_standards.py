#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "README.md",
    "AGENTS.md",
    "CONTRIBUTING.md",
    "SPRINTS.md",
    "BACKLOG.md",
    "RELEASES.md",
    "SECURITY.md",
)
START = "<!-- madmallard-badges:start -->"
END = "<!-- madmallard-badges:end -->"

errors = []

for name in REQUIRED:
    if not (ROOT / name).is_file():
        errors.append(f"missing required file: {name}")

readme = (ROOT / "README.md").read_text(encoding="utf-8")
if readme.count(START) != 1 or readme.count(END) != 1:
    errors.append("README must contain exactly one bounded Mad Mallard badge block")

expected_fragments = (
    "Next.js-15.5.28",
    "React-18.2.0",
    "Node.js-24",
    "Prisma-7.10.0",
    "PostgreSQL-17",
    "actions/workflows/ci.yml/badge.svg",
    "actions/workflows/repository-standards.yml/badge.svg",
    "img.shields.io/github/issues/drakeg/roost",
    "img.shields.io/github/issues-pr/drakeg/roost",
)
for fragment in expected_fragments:
    if fragment not in readme:
        errors.append(f"README badge block missing verified fragment: {fragment}")

license_files = ("LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING")
has_license = any((ROOT / name).is_file() for name in license_files)
if not has_license and "img.shields.io/github/license/drakeg/roost" in readme:
    errors.append("README claims a license badge but no license file exists")

if re.search(r"build[-_ ]passing|security[-_ ]passing", readme, re.IGNORECASE):
    errors.append("README contains a hard-coded passing status claim")

if errors:
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    raise SystemExit(1)

print("Repository standards validation passed.")
