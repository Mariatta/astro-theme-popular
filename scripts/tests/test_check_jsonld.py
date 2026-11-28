"""check-jsonld.py: the built-page validator, here for the multi-day event
contract (PARITY.md, "Multi-day events"): an Event's endDate is written only
when it is a plain date on a later day than startDate. Pages are written
inline, so the tests need no fixtures and no site build."""
import json
import pathlib
import tempfile
import unittest

from helpers import run_script


def page(**event):
    block = {"@context": "https://schema.org", "@type": "Event", "name": "Weekend away", **event}
    return f'<html><head><script type="application/ld+json">{json.dumps(block)}</script></head></html>'


class CheckJsonLd(unittest.TestCase):
    def run_on(self, html):
        with tempfile.TemporaryDirectory() as d:
            (pathlib.Path(d) / "index.html").write_text(html, encoding="utf-8")
            return run_script("check-jsonld.py", d)

    def test_one_day_event_passes(self):
        result = self.run_on(page(startDate="2027-01-16T09:00"))
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_multi_day_event_passes(self):
        result = self.run_on(page(startDate="2027-01-16T09:00", endDate="2027-01-17"))
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_end_date_on_the_start_day_fails(self):
        result = self.run_on(page(startDate="2027-01-16", endDate="2027-01-16"))
        self.assertEqual(result.returncode, 1)
        self.assertIn("is not a date after startDate", result.stdout)

    def test_end_date_with_a_time_fails(self):
        result = self.run_on(page(startDate="2027-01-16", endDate="2027-01-17T16:00"))
        self.assertEqual(result.returncode, 1)
        self.assertIn("is not a date after startDate", result.stdout)


if __name__ == "__main__":
    unittest.main()
