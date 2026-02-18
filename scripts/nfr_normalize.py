#!/usr/bin/env python3
"""
Normalize common NFR raw outputs into gate-compatible JSON artifacts.

Writes:
  - security-sast-report.json
  - security-deps-report.json
  - perf-baseline.json
  - perf-k6-summary.json
  - reliability-burnin-summary.json
  - recovery-rto-rpo.json

Usage example:
  python3 scripts/nfr_normalize.py \
    --artifact-dir _bmad-output/test-artifacts \
    --sast-raw /path/to/sast.json \
    --deps-raw /path/to/deps.json \
    --k6-raw /path/to/k6.json \
    --burnin-raw /path/to/burnin.json \
    --recovery-raw /path/to/recovery.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
from typing import Any


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def load_json(path: str | None) -> dict[str, Any]:
    if not path:
        return {}
    p = Path(path)
    if not p.exists():
        return {}
    return json.loads(p.read_text())


def deep_get_first(obj: Any, paths: list[list[str]]) -> Any:
    for path in paths:
        cur = obj
        ok = True
        for key in path:
            if isinstance(cur, dict) and key in cur:
                cur = cur[key]
            else:
                ok = False
                break
        if ok:
            return cur
    return None


def to_int(value: Any, default: int = 0) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        try:
            return int(float(value.strip()))
        except ValueError:
            return default
    return default


def to_float(value: Any, default: float = 0.0) -> float:
    if isinstance(value, bool):
        return float(value)
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except ValueError:
            return default
    return default


def normalize_security(raw: dict[str, Any], tool_name: str) -> dict[str, Any]:
    critical = deep_get_first(
        raw, [["critical"], ["summary", "critical"], ["vulnerabilities", "critical"]]
    )
    high = deep_get_first(raw, [["high"], ["summary", "high"], ["vulnerabilities", "high"]])
    medium = deep_get_first(
        raw, [["medium"], ["summary", "medium"], ["vulnerabilities", "medium"]]
    )
    low = deep_get_first(raw, [["low"], ["summary", "low"], ["vulnerabilities", "low"]])
    info = deep_get_first(raw, [["info"], ["summary", "info"]])

    c = to_int(critical, 0)
    h = to_int(high, 0)
    m = to_int(medium, 0)
    l = to_int(low, 0)
    i = to_int(info, 0)

    status = "PASS" if c == 0 and h == 0 else "CONCERNS"
    return {
        "tool": tool_name,
        "generated_at": now_iso(),
        "summary": {"critical": c, "high": h, "medium": m, "low": l, "info": i},
        "vulnerabilities": {"critical": c, "high": h, "medium": m, "low": l, "items": []},
        "status": status,
    }


def normalize_perf_baseline(raw: dict[str, Any]) -> dict[str, Any]:
    p95 = deep_get_first(raw, [["summary", "api_command_latency_p95_ms"], ["p95_ms"], ["p95"]])
    p99 = deep_get_first(raw, [["summary", "api_command_latency_p99_ms"], ["p99_ms"], ["p99"]])
    queue = deep_get_first(
        raw, [["summary", "queue_advance_latency_ms"], ["queue_advance_latency_ms"]]
    )
    highlight = deep_get_first(
        raw, [["summary", "highlight_sync_latency_ms"], ["highlight_sync_latency_ms"]]
    )
    regression = deep_get_first(
        raw,
        [["regression_pct"], ["summary", "regression_pct"], ["comparison", "regression_pct"]],
    )

    r = to_float(regression, 0.0)
    status = "PASS" if r <= 10.0 else "CONCERNS"
    return {
        "generated_at": now_iso(),
        "summary": {
            "api_command_latency_p95_ms": to_int(p95, 0),
            "api_command_latency_p99_ms": to_int(p99, 0),
            "queue_advance_latency_ms": to_int(queue, 0),
            "highlight_sync_latency_ms": to_int(highlight, 0),
            "regression_pct": r,
        },
        "thresholds": {
            "api_command_latency_p95_ms_max": 300,
            "api_command_latency_p99_ms_max": 700,
            "queue_advance_latency_ms_max": 150,
            "highlight_sync_latency_ms_max": 100,
            "regression_pct_max": 10.0,
        },
        "comparison": {"baseline_id": "normalized-baseline", "regression_pct": r},
        "status": status,
    }


def normalize_k6(raw: dict[str, Any]) -> dict[str, Any]:
    # Supports common k6 JSON summary keys.
    p95 = deep_get_first(
        raw,
        [
            ["metrics", "http_req_duration", "values", "p(95)"],
            ["metrics", "http_req_duration_p95_ms"],
            ["http_req_duration_p95_ms"],
        ],
    )
    p99 = deep_get_first(
        raw,
        [
            ["metrics", "http_req_duration", "values", "p(99)"],
            ["metrics", "http_req_duration_p99_ms"],
            ["http_req_duration_p99_ms"],
        ],
    )
    rps = deep_get_first(
        raw,
        [
            ["metrics", "http_reqs", "values", "rate"],
            ["metrics", "throughput_rps"],
            ["throughput_rps"],
        ],
    )
    err = deep_get_first(
        raw,
        [["metrics", "http_req_failed", "values", "rate"], ["metrics", "error_rate"], ["error_rate"]],
    )

    error_rate = to_float(err, 0.0)
    status = "PASS" if error_rate <= 0.01 else "CONCERNS"
    return {
        "tool": "k6",
        "generated_at": now_iso(),
        "scenario": "normalized-k6-input",
        "metrics": {
            "http_req_duration_p95_ms": to_int(p95, 0),
            "http_req_duration_p99_ms": to_int(p99, 0),
            "throughput_rps": to_float(rps, 0.0),
            "error_rate": error_rate,
        },
        "status": status,
    }


def normalize_burnin(raw: dict[str, Any]) -> dict[str, Any]:
    consecutive = deep_get_first(
        raw,
        [
            ["consecutive_passes"],
            ["summary", "consecutive_passes"],
            ["metrics", "consecutive_passes"],
            ["consecutive_successes"],
        ],
    )
    total = deep_get_first(raw, [["total_runs"], ["summary", "total_runs"], ["runs"]])
    failures = deep_get_first(
        raw, [["failure_count"], ["summary", "failure_count"], ["failures"]]
    )

    cp = to_int(consecutive, 0)
    tr = to_int(total, cp)
    fc = to_int(failures, max(tr - cp, 0))
    status = "PASS" if cp >= 100 else "CONCERNS"
    return {
        "generated_at": now_iso(),
        "suite": "core-invariant-suite",
        "summary": {"consecutive_passes": cp, "total_runs": tr, "failure_count": fc},
        "metrics": {"consecutive_passes": cp, "stability_rate": 0.0 if tr == 0 else cp / tr},
        "status": status,
    }


def normalize_recovery(raw: dict[str, Any]) -> dict[str, Any]:
    success_rate = deep_get_first(
        raw,
        [
            ["success_rate"],
            ["summary", "success_rate"],
            ["recovery", "success_rate"],
            ["metrics", "success_rate"],
        ],
    )
    drill_count = deep_get_first(raw, [["drill_count"], ["recovery", "drill_count"]])
    success_count = deep_get_first(raw, [["success_count"], ["recovery", "success_count"]])
    rto = deep_get_first(raw, [["rto_minutes"], ["summary", "rto_minutes"], ["recovery", "rto_minutes"]])
    rpo = deep_get_first(raw, [["rpo_minutes"], ["summary", "rpo_minutes"], ["recovery", "rpo_minutes"]])

    sr = to_float(success_rate, 0.0)
    status = "PASS" if sr >= 0.99 else "CONCERNS"
    return {
        "generated_at": now_iso(),
        "recovery": {
            "success_rate": sr,
            "drill_count": to_int(drill_count, 0),
            "success_count": to_int(success_count, 0),
            "rto_minutes": to_int(rto, 0),
            "rpo_minutes": to_int(rpo, 0),
        },
        "summary": {"success_rate": sr, "rto_minutes": to_int(rto, 0), "rpo_minutes": to_int(rpo, 0)},
        "status": status,
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Normalize NFR raw outputs for CI gates.")
    parser.add_argument("--artifact-dir", default="_bmad-output/test-artifacts")
    parser.add_argument("--sast-raw")
    parser.add_argument("--deps-raw")
    parser.add_argument("--k6-raw")
    parser.add_argument("--burnin-raw")
    parser.add_argument("--recovery-raw")
    args = parser.parse_args()

    artifact_dir = Path(args.artifact_dir)
    artifact_dir.mkdir(parents=True, exist_ok=True)

    sast_raw = load_json(args.sast_raw)
    deps_raw = load_json(args.deps_raw)
    k6_raw = load_json(args.k6_raw)
    burnin_raw = load_json(args.burnin_raw)
    recovery_raw = load_json(args.recovery_raw)

    write_json(
        artifact_dir / "security-sast-report.json",
        normalize_security(sast_raw, "normalized-sast"),
    )
    write_json(
        artifact_dir / "security-deps-report.json",
        normalize_security(deps_raw, "normalized-deps"),
    )
    write_json(artifact_dir / "perf-baseline.json", normalize_perf_baseline(k6_raw))
    write_json(artifact_dir / "perf-k6-summary.json", normalize_k6(k6_raw))
    write_json(
        artifact_dir / "reliability-burnin-summary.json", normalize_burnin(burnin_raw)
    )
    write_json(artifact_dir / "recovery-rto-rpo.json", normalize_recovery(recovery_raw))

    print(f"Normalized artifacts written to: {artifact_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
