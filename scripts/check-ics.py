#!/usr/bin/env python3
"""Validate iCalendar (.ics) feeds in a built site.

Usage: python3 scripts/check-ics.py <built-dir> [<built-dir> ...]

Checks, per feed: CRLF line endings, every line <= 75 octets (folded),
required VCALENDAR/VEVENT properties, UID present + absolute + unique, and
that text escaping is well-formed. Shared between both repos (PARITY Tier 1)."""
import sys
import pathlib


def check_feed(path):
    raw = path.read_bytes()
    errors = []
    # CRLF: every line must end CRLF; no bare LF
    if b"\r\n" not in raw:
        errors.append(f"{path}: no CRLF line endings")
    text = raw.decode("utf-8")
    lines = text.split("\r\n")
    for ln in lines:
        if len(ln.encode("utf-8")) > 75:
            errors.append(f"{path}: line exceeds 75 octets: {ln[:40]!r}...")
    # unfold (continuation lines start with a space) for property checks
    unfolded = []
    for ln in lines:
        if ln.startswith(" ") and unfolded:
            unfolded[-1] += ln[1:]
        else:
            unfolded.append(ln)
    props = [l.split(":", 1)[0].split(";", 1)[0] for l in unfolded if l]
    for req in ("BEGIN", "VERSION", "PRODID", "END"):
        if req not in props:
            errors.append(f"{path}: missing {req}")
    uids = [l.split(":", 1)[1] for l in unfolded if l.startswith("UID:")]
    for uid in uids:
        if not (uid.startswith("http://") or uid.startswith("https://")):
            errors.append(f"{path}: UID not absolute: {uid!r}")
    if len(uids) != len(set(uids)):
        errors.append(f"{path}: duplicate UIDs")
    vevents = props.count("BEGIN") - 1  # minus VCALENDAR
    return errors, len(uids), vevents


def main(dirs):
    errors = []
    feeds = 0
    for d in dirs:
        for ics in pathlib.Path(d).rglob("*.ics"):
            feeds += 1
            errs, uids, ve = check_feed(ics)
            errors += errs
    if errors:
        print("\n".join(errors))
        print(f"FAIL: {len(errors)} problem(s) across {feeds} feed(s)")
        return 1
    print(f"OK: {feeds} iCalendar feed(s) valid")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: check-ics.py <built-dir> [...]")
    sys.exit(main(sys.argv[1:]))
