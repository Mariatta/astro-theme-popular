"""Tests for the setup wizard (scripts/setup.py). Stdlib only; Tier-1 (runs in
both repos). Covers rendering, the write contract, format detection, validation
and DECISIONS.md."""
import importlib.util
import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stdout

_HERE = os.path.dirname(__file__)
_SPEC = importlib.util.spec_from_file_location(
    "setup", os.path.join(_HERE, "..", "setup.py"))
setup = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(setup)

FULL = {
    "community_name": "PyLadies Vancouver", "tagline": "Python, together",
    "base_url": "https://example.com/pyl/", "logo": "images/logo.png",
    "coc_contact": "coc@pyl.example", "chat": "https://discord.gg/xyz",
    "rsvp_home": "https://meetup.com/pyl", "speakers_invite": True,
    "social": [{"label": "Mastodon", "url": "https://m.example/@pyl"}],
    "repo_home": "github.com/pyl/site", "coc_choice": "PSF Code of Conduct",
}


class TestRender(unittest.TestCase):
    def test_full_skip_omits_optional_blocks(self):
        for fmt, tpl in (("hugo", "hugo.toml.tmpl"), ("astro", "config.ts.tmpl")):
            out = setup.render(setup.tmpl(tpl), {}, fmt)
            self.assertNotIn("popular:", out, f"{fmt}: markers must be stripped")
            self.assertNotIn("${", out, f"{fmt}: no unsubstituted placeholders")
        # the chat block is conditional -- absent when the question is skipped
        hugo = setup.render(setup.tmpl("hugo.toml.tmpl"), {}, "hugo")
        self.assertNotIn("[params.community.chat]", hugo)

    def test_defaults_used_when_skipped(self):
        out = setup.render(setup.tmpl("hugo.toml.tmpl"), {}, "hugo")
        self.assertIn('title = "Your Community"', out)

    def test_answers_substitute_and_include_blocks(self):
        out = setup.render(setup.tmpl("hugo.toml.tmpl"), FULL, "hugo")
        self.assertIn('title = "PyLadies Vancouver"', out)
        self.assertIn("[params.community.chat]", out)
        self.assertIn("https://discord.gg/xyz", out)
        self.assertIn("[params.coc]", out)
        self.assertIn("Mastodon", out)
        self.assertNotIn("${", out)

    def test_social_omitted_when_empty(self):
        out = setup.render(setup.tmpl("hugo.toml.tmpl"), {}, "hugo")
        self.assertNotIn("[[params.social]]", out)


class TestValidate(unittest.TestCase):
    def test_email(self):
        q = {"id": "coc_contact", "type": "email"}
        self.assertEqual(setup.validate(q, "a@b.co"), "a@b.co")
        with self.assertRaises(SystemExit):
            setup.validate(q, "not-an-email")

    def test_url(self):
        q = {"id": "chat", "type": "url"}
        self.assertEqual(setup.validate(q, "https://x.io"), "https://x.io")
        self.assertEqual(setup.validate(q, "/rel"), "/rel")
        with self.assertRaises(SystemExit):
            setup.validate(q, "ftp://x")


class TestDetect(unittest.TestCase):
    def test_hugo_and_astro(self):
        with tempfile.TemporaryDirectory() as d:
            open(os.path.join(d, "hugo.toml"), "w").close()
            self.assertEqual(setup.detect(d), "hugo")
        with tempfile.TemporaryDirectory() as d:
            os.makedirs(os.path.join(d, "src", "content"))
            self.assertEqual(setup.detect(d), "astro")
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(SystemExit):
                setup.detect(d)


class TestWriteContract(unittest.TestCase):
    def _site(self, d):
        open(os.path.join(d, "hugo.toml"), "w").write("old\n")
        return d

    def test_dry_run_writes_nothing(self):
        with tempfile.TemporaryDirectory() as d:
            self._site(d)
            before = sorted(os.listdir(d))
            files = setup.build_outputs(d, "hugo", setup.find_schema(), FULL)
            with redirect_stdout(io.StringIO()):
                rc = setup.apply(d, files, force=False, dry_run=True)
            self.assertEqual(rc, 0)
            self.assertEqual(sorted(os.listdir(d)), before, "dry-run wrote files")

    def test_refuse_then_force(self):
        with tempfile.TemporaryDirectory() as d:
            self._site(d)  # hugo.toml exists and differs
            files = setup.build_outputs(d, "hugo", setup.find_schema(), FULL)
            with redirect_stdout(io.StringIO()):
                rc = setup.apply(d, files, force=False, dry_run=False)
            self.assertEqual(rc, 1, "must refuse to overwrite existing config")
            self.assertEqual(open(os.path.join(d, "hugo.toml")).read(), "old\n")
            with redirect_stdout(io.StringIO()):
                rc = setup.apply(d, files, force=True, dry_run=False)
            self.assertEqual(rc, 0)
            self.assertIn("PyLadies Vancouver", open(os.path.join(d, "hugo.toml")).read())

    def test_writes_all_outputs(self):
        with tempfile.TemporaryDirectory() as d:
            open(os.path.join(d, "hugo.toml"), "w").close()  # empty, differs
            files = setup.build_outputs(d, "hugo", setup.find_schema(), FULL)
            with redirect_stdout(io.StringIO()):
                setup.apply(d, files, force=True, dry_run=False)
            for rel in ("hugo.toml", "content/code-of-conduct.md",
                        "DECISIONS.md", ".popular-setup.json"):
                self.assertTrue(os.path.exists(os.path.join(d, rel)), rel)
            self.assertEqual(json.load(open(os.path.join(d, ".popular-setup.json")))["community_name"],
                             "PyLadies Vancouver")


class TestDecisions(unittest.TestCase):
    def test_answered_and_open(self):
        os.environ["POPULAR_SETUP_DATE"] = "2026-08-03"
        md = setup.build_decisions(setup.find_schema(), FULL)
        self.assertIn("## Decided (2026-08-03)", md)
        self.assertIn("PyLadies Vancouver", md)
        self.assertIn("PSF Code of Conduct", md)  # decision-layer note recorded
        self.assertIn("## Still open", md)
        self.assertIn("handbook", md)  # citation present on a coc question

    def test_skips_listed_as_open(self):
        md = setup.build_decisions(setup.find_schema(), {})
        self.assertIn("## Still open", md)
        self.assertIn("What is your community called?", md)


if __name__ == "__main__":
    unittest.main()
