"""assets/media.json must describe every README picture, and every entry must point at a real spec and shot.

  uv run --with pytest pytest tests/test_media_manifest.py -q
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from make_gallery import OUT as GALLERY, render as render_gallery  # noqa: E402
from make_media import load_manifest  # noqa: E402

MANUAL = {"social-preview.png"}  # uploaded to the GitHub repository settings by hand
ENTRIES = load_manifest()


def _shots(spec: str) -> set[str]:
    return {s["id"] for s in json.loads((ROOT / spec).read_text(encoding="utf-8"))["shots"]}


def test_every_asset_is_built_by_the_manifest():
    built = {e["out"] for e in ENTRIES}
    on_disk = {p.relative_to(ROOT / "assets").as_posix() for p in (ROOT / "assets").rglob("*")
               if p.is_file() and p.suffix in {".gif", ".jpg", ".png"}}
    assert on_disk - built - MANUAL == set(), "assets not in assets/media.json"
    assert built - on_disk == set(), "manifest outputs missing; run scripts/make_media.py"


def test_readme_pictures_exist():
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    refs = set(re.findall(r'src=["\']assets/([^"\']+)["\']', readme)) | set(re.findall(r"!\[[^\]]*\]\(assets/([^)\s]+)", readme))
    assert refs and refs <= {e["out"] for e in ENTRIES} | MANUAL


@pytest.mark.parametrize("entry", ENTRIES, ids=lambda e: e["out"])
def test_entry_sources_exist(entry):
    if "spec" in entry and "shot" in entry:
        assert set(entry["shot"].split(",")) <= _shots(entry["spec"])
    for spec in [entry.get("spec"), entry.get("sheet"), *[g[0] for g in entry.get("grid", [])]]:
        assert spec is None or (ROOT / spec).is_file(), spec
    if "from" in entry:
        assert 0 <= entry["from"] < entry["to"]


def test_gallery_is_current():
    assert GALLERY.read_text(encoding="utf-8") == render_gallery(), "run python3 scripts/make_gallery.py"


def test_gallery_links_point_at_real_files():
    page = render_gallery()
    for ref in set(re.findall(r'"(?:src|spec|script|sheet)": "([^"]+)"', page)):
        assert (ROOT / ref).is_file(), ref
    site = render_gallery("https://github.com/o/r/blob/main/")
    assert '"spec": "https://github.com/o/r/blob/main/examples/' in site and 'href="https://github.com/o/r/blob/main/README.md"' in site


def test_manifest_rejects_bad_ranges(tmp_path):
    for bad in ({"from": 3, "to": 1}, {"from": 1}, {"shot": "a", "trim": [2, 1]}):
        path = tmp_path / "m.json"
        path.write_text(json.dumps({"media": [{"out": "x.gif", "spec": "s.json", **bad}]}))
        with pytest.raises(SystemExit):
            load_manifest(path)
