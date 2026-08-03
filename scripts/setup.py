#!/usr/bin/env python3
"""setup.py -- Popular theme setup wizard (Layer 1 of the setup system).

Reads the setup-questions.json schema and writes a site's config, a couple of
seed pages, a DECISIONS.md audit trail, and a .popular-setup.json answer record
-- all by placeholder substitution on templates, never by parsing/re-serializing
the config. Sugar, never a gate: skip every question and you get the clean
starter config. Stdlib only; ships identically in both repos (see PARITY.md).

Usage:
  python3 scripts/setup.py                 # interactive, current dir
  python3 scripts/setup.py --answers a.json # non-interactive (agent / CI path)
  python3 scripts/setup.py --dry-run        # show the diff, write nothing
  python3 scripts/setup.py --site PATH --force

Exit codes: 0 success, 1 refusal/validation error, 2 bad invocation.

i18n: prompts/help live in the schema (the future translation surface); the
wizard's own strings are English-only in v1.
"""
import argparse
import datetime
import difflib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


# ---------------------------------------------------------------- schema + fs
def find_schema():
    root = os.path.abspath(os.path.join(HERE, ".."))
    for rel in ("data/setup-questions.json", "src/data/setup-questions.json"):
        p = os.path.join(root, rel)
        if os.path.exists(p):
            with open(p, encoding="utf-8") as fh:
                return json.load(fh)["questions"]
    fail("setup-questions.json not found next to the script")


def detect(site):
    """Hugo vs Astro, mirroring spreadsheet-import.py."""
    if os.path.exists(os.path.join(site, "hugo.toml")) or os.path.exists(os.path.join(site, "config.toml")):
        return "hugo"
    if os.path.exists(os.path.join(site, "src", "content")) or os.path.exists(os.path.join(site, "config.ts")):
        return "astro"
    fail(f"Cannot detect site format in {site} (no hugo.toml or config.ts)", code=2)


def config_path(site, fmt):
    return os.path.join(site, "hugo.toml" if fmt == "hugo" else "src/config.ts")


def tmpl(name):
    with open(os.path.join(HERE, "templates", name), encoding="utf-8") as fh:
        return fh.read()


def fail(msg, code=1):
    sys.stderr.write(f"setup.py: {msg}\n")
    sys.exit(code)


# ------------------------------------------------------------- answers input
def gather_interactive(questions):
    answers = {}
    print("Popular setup wizard. Press Enter to skip any question.\n")
    for q in questions:
        print(q["prompt"])
        print(f"  {q['help']}")
        if q["handbook_url"]:
            print(f"  handbook: {q['handbook_url']}")
        if q["layer"] == "decision":
            d = input("  Decided? note (or Enter to leave open): ").strip()
            if d:
                answers[q["id"]] = d
        elif q["type"] == "bool":
            v = input("  [y/N]: ").strip().lower()
            if v in ("y", "yes"):
                answers[q["id"]] = True
        elif q["id"] == "social":
            entries = []
            while True:
                label = input("  social label (or Enter to stop): ").strip()
                if not label:
                    break
                url = input(f"    URL for {label}: ").strip()
                if url:
                    entries.append({"label": label, "url": url})
            if entries:
                answers["social"] = entries
        else:
            v = input("  > ").strip()
            if v:
                answers[q["id"]] = validate(q, v)
        print()
    return answers


def load_answers(path, questions):
    with open(path, encoding="utf-8") as fh:
        raw = json.load(fh)
    ids = {q["id"] for q in questions}
    by_id = {q["id"]: q for q in questions}
    for k, v in raw.items():
        if k not in ids:
            fail(f"answers.json has unknown question id: {k}")
        if k != "social" and by_id[k]["layer"] == "config":
            raw[k] = validate(by_id[k], v)
    return raw


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate(q, value):
    t = q["type"]
    if t == "email" and not EMAIL_RE.match(str(value)):
        fail(f"{q['id']}: {value!r} is not a valid email")
    if t == "url" and not re.match(r"^(https?://|/)", str(value)):
        fail(f"{q['id']}: {value!r} is not a URL (http(s):// or /path)")
    if t == "bool" and not isinstance(value, bool):
        fail(f"{q['id']}: expected true/false")
    return value


# ------------------------------------------------------------ template render
IF_RE = re.compile(r"^\s*(?:#|//)\s*popular:if\s+(\w+)\s*$")
END_RE = re.compile(r"^\s*(?:#|//)\s*popular:end\s*$")
SOCIAL_RE = re.compile(r"^\s*(?:#|//)\s*popular:social\s*$")
PLACEHOLDER_RE = re.compile(r"\$\{(\w+)(?:\|([^}]*))?\}")


def render(text, answers, fmt):
    """Strip conditional blocks whose id is unanswered, expand the social
    block, then substitute ${id|default} placeholders."""
    out, skip_depth, keep_stack = [], 0, []
    for line in text.splitlines():
        m = IF_RE.match(line)
        if m:
            present = bool(answers.get(m.group(1)))
            keep_stack.append(present)
            if not present:
                skip_depth += 1
            continue
        if END_RE.match(line):
            if keep_stack and not keep_stack.pop():
                skip_depth -= 1
            continue
        if skip_depth:
            continue
        if SOCIAL_RE.match(line):
            out.append(render_social(answers.get("social", []), fmt).rstrip("\n"))
            continue
        out.append(line)
    rendered = "\n".join(out)

    def sub(mo):
        key, default = mo.group(1), mo.group(2) or ""
        val = answers.get(key)
        return str(val) if val is not None and not isinstance(val, (list, dict)) else default

    return PLACEHOLDER_RE.sub(sub, rendered)


def render_social(entries, fmt):
    if not entries:
        return ""
    def icon(label):
        return {"instagram": "fa-brands fa-instagram", "mastodon": "fa-brands fa-mastodon",
                "twitter": "fa-brands fa-x-twitter", "github": "fa-brands fa-github",
                "email": "fa-solid fa-envelope", "rss": "fa-solid fa-rss"}.get(
            label.strip().lower(), "fa-solid fa-link")
    if fmt == "hugo":
        blocks = []
        for e in entries:
            blocks.append(f'  [[params.social]]\n    label = "{e["label"]}"\n'
                          f'    icon  = "{icon(e["label"])}"\n    url   = "{e["url"]}"')
        return "\n".join(blocks)
    items = [f'  {{ label: {json.dumps(e["label"])}, icon: {json.dumps(icon(e["label"]))}, '
             f'url: {json.dumps(e["url"])} }},' for e in entries]
    return "\n".join(items)


# ------------------------------------------------------------------- outputs
def build_outputs(site, fmt, questions, answers):
    """Return {relpath: content} for every file the wizard would write."""
    files = {}
    files[config_path(site, fmt).replace(site + os.sep, "").replace(site + "/", "")] = \
        render(tmpl("hugo.toml.tmpl" if fmt == "hugo" else "config.ts.tmpl"), answers, fmt).rstrip("\n") + "\n"

    if answers.get("coc_contact"):
        coc_rel = "content/code-of-conduct.md" if fmt == "hugo" else "src/content/pages/code-of-conduct.mdx"
        # MDX rejects HTML comments; Hugo markdown renders JSX comments literally.
        comment = ("<!-- seeded by setup.py, edit freely -->" if fmt == "hugo"
                   else "{/* seeded by setup.py, edit freely */}")
        files[coc_rel] = render(tmpl("coc.md.tmpl"), {**answers, "__seed_comment": comment}, fmt)

    files["DECISIONS.md"] = build_decisions(questions, answers)
    files[".popular-setup.json"] = json.dumps(answers, indent=2, sort_keys=True) + "\n"
    return files


def build_decisions(questions, answers, revisit=False):
    today = os.environ.get("POPULAR_SETUP_DATE") or datetime.date.today().isoformat()
    lines = ["# Setup decisions", "",
             "Written by `scripts/setup.py`. The next organizer's answer to "
             '"why is it set up this way?" -- with citations.', ""]
    if revisit:
        lines += [f"## Revisited {today}", ""]
    answered, still_open = [], []
    for q in questions:
        a = answers.get(q["id"])
        cite = f" ([handbook]({q['handbook_url']}))" if q["handbook_url"] else ""
        if a is not None:
            shown = ", ".join(e["label"] for e in a) if isinstance(a, list) else a
            answered.append(f"- **{q['prompt']}** {shown}{cite}")
        else:
            still_open.append(f"- {q['prompt']}{cite}")
    lines += [f"## Decided ({today})", ""] + answered + ["", "## Still open", ""] + still_open + [""]
    return "\n".join(lines)


# ------------------------------------------------------------- write contract
def apply(site, files, force, dry_run):
    diffs, refused = [], []
    for rel, content in sorted(files.items()):
        path = os.path.join(site, rel)
        old = ""
        if os.path.exists(path):
            with open(path, encoding="utf-8") as fh:
                old = fh.read()
        if old == content:
            continue
        # DECISIONS.md is append-friendly; never refuse on it.
        protected = os.path.exists(path) and rel != "DECISIONS.md" and not force
        if protected:
            refused.append(rel)
        diff = "".join(difflib.unified_diff(old.splitlines(True), content.splitlines(True),
                                            f"a/{rel}", f"b/{rel}"))
        diffs.append(diff)
    print("".join(diffs) if diffs else "No changes.")
    if dry_run:
        print("\n(--dry-run: nothing written)")
        return 0
    if refused:
        sys.stderr.write("\nsetup.py: refusing to overwrite existing files: "
                         + ", ".join(refused) + "\n  re-run with --force to overwrite.\n")
        return 1
    for rel, content in files.items():
        path = os.path.join(site, rel)
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(content)
    print(f"\nWrote {len(files)} file(s). See DECISIONS.md for what was decided and what's still open.")
    return 0


# ----------------------------------------------------------------------- main
def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", default=".", help="target site directory (default: .)")
    ap.add_argument("--answers", help="JSON {id: value} file; non-interactive")
    ap.add_argument("--format", choices=["hugo", "astro"], help="override format detection")
    ap.add_argument("--dry-run", action="store_true", help="print the diff, write nothing")
    ap.add_argument("--force", action="store_true", help="overwrite existing config/seed files")
    args = ap.parse_args(argv)

    site = os.path.abspath(args.site)
    if not os.path.isdir(site):
        fail(f"--site {args.site} is not a directory", code=2)
    fmt = args.format or detect(site)
    questions = find_schema()

    if args.answers:
        answers = load_answers(args.answers, questions)
    elif sys.stdin.isatty():
        answers = gather_interactive(questions)
    else:
        fail("no --answers file and not a TTY; nothing to do", code=2)

    files = build_outputs(site, fmt, questions, answers)
    return apply(site, files, args.force, args.dry_run)


if __name__ == "__main__":
    sys.exit(main())
