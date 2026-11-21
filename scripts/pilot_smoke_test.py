#!/usr/bin/env python3
"""Smoke-test a deployed Roost instance before an SMB pilot/demo."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass

PUBLIC_CHECKS = (
    ("/", "Roost"),
    ("/search", "Roost"),
    ("/login", "Roost"),
    ("/register", "Roost"),
)


@dataclass(frozen=True)
class CheckResult:
    name: str
    url: str
    ok: bool
    status: int | None
    detail: str


def normalize_base_url(value: str) -> str:
    text = str(value or "").strip().rstrip("/")
    parsed = urllib.parse.urlparse(text)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Base URL must be an absolute http:// or https:// URL.")
    return text


def fetch(base_url: str, path: str, timeout: float) -> tuple[int | None, bytes]:
    url = f"{base_url}{path}"
    request = urllib.request.Request(url, headers={"User-Agent": "Roost-Pilot-Smoke/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()
    except (urllib.error.URLError, TimeoutError, OSError):
        return None, b""


def run_smoke(base_url: str, timeout: float = 5.0) -> list[CheckResult]:
    base_url = normalize_base_url(base_url)
    results: list[CheckResult] = []

    health_url = f"{base_url}/health"
    status, body = fetch(base_url, "/health", timeout)
    health_ok = False
    detail = "health endpoint unavailable"

    if status is not None:
        try:
            payload = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            payload = {}
        health_ok = status == 200 and payload.get("status") == "ok"
        detail = ("database-backed health check passed" if health_ok
                  else f"expected HTTP 200 status=ok, got HTTP {status}")

    results.append(CheckResult("health", health_url, health_ok, status, detail))

    for path, marker in PUBLIC_CHECKS:
        url = f"{base_url}{path}"
        status, body = fetch(base_url, path, timeout)
        text = body.decode("utf-8", errors="replace")
        ok = status == 200 and marker in text
        detail = (f"HTTP 200 and marker {marker!r} found" if ok
                  else f"expected HTTP 200 containing {marker!r}, got HTTP {status}")
        results.append(CheckResult(path, url, ok, status, detail))

    return results


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default=os.environ.get("ROOST_BASE_URL", "http://localhost:3000"),
                        help="Roost base URL (default: ROOST_BASE_URL or http://localhost:3000)")
    parser.add_argument("--timeout", type=float, default=5.0,
                        help="Per-request timeout in seconds (default: 5)")
    parser.add_argument("--json", action="store_true",
                        help="Emit machine-readable JSON instead of text output")
    args = parser.parse_args(argv)

    try:
        results = run_smoke(args.base_url, timeout=args.timeout)
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps([asdict(result) for result in results], indent=2))
    else:
        for result in results:
            prefix = "PASS" if result.ok else "FAIL"
            print(f"{prefix} {result.name}: {result.detail} ({result.url})")

    return 0 if all(result.ok for result in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
