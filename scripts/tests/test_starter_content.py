"""Tests for scripts/starter-content.py. Stdlib only; Tier-1 (runs in both
repos), so each assertion works from whichever checkout ships that starter."""
import importlib.util
import io
import os
import tempfile
import unittest
from contextlib import redirect_stdout

_HERE = os.path.dirname(__file__)
_SPEC = importlib.util.spec_from_file_location(
    "starter_content", os.path.join(_HERE, "..", "starter-content.py"))
starter = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(starter)

ROOT = os.path.abspath(os.path.join(_HERE, "..", ".."))
NATIVE = "hugo" if os.path.isdir(os.path.join(ROOT, "exampleSite")) else "astro"


class TestImportRewrite(unittest.TestCase):
    """A site consuming the npm package has no src/components/, so the
    starter's relative imports must become package specifiers or its build
    fails on the first MDX page."""

    def test_rewrites_relative_component_imports(self):
        for src in ("""import Callout from '../../components/Callout.astro';""",
                    '''import Callout from "../../../components/Callout.astro";'''):
            out = starter.package_imports(src)
            self.assertIn("astro-theme-popular/components/Callout.astro", out)
            self.assertNotIn("../", out)

    def test_leaves_everything_else_alone(self):
        for src in ("import Chart from '../../charts/Chart.astro';",
                    "import x from 'some-package';",
                    "See ../../components/Callout.astro in prose."):
            self.assertEqual(starter.package_imports(src), src)

    def test_quote_style_survives(self):
        out = starter.package_imports('''import C from "../../components/C.astro";''')
        self.assertIn('''from "astro-theme-popular/components/C.astro"''', out)


class TestCopy(unittest.TestCase):
    def test_copies_this_repo_starter_and_never_overwrites(self):
        with tempfile.TemporaryDirectory() as d:
            with redirect_stdout(io.StringIO()):
                starter.main(["--site", d, "--format", NATIVE])
            content = os.path.join(d, "content" if NATIVE == "hugo" else "src/content")
            self.assertTrue(os.path.isdir(content), "no starter content copied")
            marker = os.path.join(content, "KEEP.md")
            with open(marker, "w", encoding="utf-8") as fh:
                fh.write("mine\n")
            with redirect_stdout(io.StringIO()):
                starter.main(["--site", d, "--format", NATIVE])
            with open(marker, encoding="utf-8") as fh:
                self.assertEqual(fh.read(), "mine\n", "a re-run clobbered existing work")

    def test_wrong_checkout_fails_loudly(self):
        """Tier-1 script, per-repo content: --format astro from the Hugo
        checkout used to copy nothing and report success."""
        other = "astro" if NATIVE == "hugo" else "hugo"
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(SystemExit):
                starter.main(["--site", d, "--format", other])


if __name__ == "__main__":
    unittest.main()
