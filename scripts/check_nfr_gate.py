#!/usr/bin/env python3
"""Check normalized NFR evidence artifacts against gate rules."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def first_int(obj: Any, paths: list[list[str]]) -> int | None:
    for path in paths:
        cur = obj
        ok = True
        for key in path:
            if isinstance(cur, dict) and key in cur:
                cur = cur[key]
            else:
                ok = False
                break
        if ok and isinstance(cur, (int, float)):
            return int(cur)
    return None


def first_float(obj: Any, paths: list[list[str]]) -> float | None:
    for path in paths:
        cur = obj
        ok = True
        for key in path:
            if isinstance(cur, dict) and key in cur:
                cur = cur[key]
            else:
                ok = False
                break
        if ok and isinstance(cur, (int, float)):
            return float(cur)
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Check NFR gate numeric conditions.")
    parser.add_argument("--artifact-dir", default="_bmad-output/test-artifacts")
    args = parser.parse_args()

    base = Path(args.artifact_dir)
    errors: list[str] = []

    for name in ["security-sast-report.json", "security-deps-report.json"]:
        data = load_json(base / name)
        critical = first_int(data, [["critical"], ["summary", "critical"], ["vulnerabilities", "critical"]])
        high = first_int(data, [["high"], ["summary", "high"], ["vulnerabilities", "high"]])
        if critical is None:
            errors.append(f"{name}: missing critical count field")
        elif critical != 0:
            errors.append(f"{name}: critical={critical} (must be 0)")
        if high is None:
            errors.append(f"{name}: missing high count field")
        elif high != 0:
            errors.append(f"{name}: high={high} (must be 0)")

    burnin = load_json(base / "reliability-burnin-summary.json")
    consecutive = first_int(
        burnin,
        [["consecutive_passes"], ["summary", "consecutive_passes"], ["metrics", "consecutive_passes"]],
    )
    if consecutive is None:
        errors.append("reliability-burnin-summary.json: missing consecutive_passes")
    elif consecutive < 100:
        errors.append(f"reliability-burnin-summary.json: consecutive_passes={consecutive} (<100)")

    recovery = load_json(base / "recovery-rto-rpo.json")
    success_rate = first_float(
        recovery,
        [["success_rate"], ["summary", "success_rate"], ["recovery", "success_rate"]],
    )
    if success_rate is None:
        errors.append("recovery-rto-rpo.json: missing success_rate")
    elif success_rate < 0.99:
        errors.append(f"recovery-rto-rpo.json: success_rate={success_rate} (<0.99)")

    perf = load_json(base / "perf-baseline.json")
    regression_pct = first_float(
        perf,
        [["regression_pct"], ["summary", "regression_pct"], ["comparison", "regression_pct"]],
    )
    if regression_pct is not None and regression_pct > 10.0:
        errors.append(f"perf-baseline.json: regression_pct={regression_pct} (>10)")

    if errors:
        print("NFR numeric gates failed:")
        for err in errors:
            print(f"- {err}")
        return 1

    print("NFR numeric gates passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
