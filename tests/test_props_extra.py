"""Extra prop vocabulary, animation contracts and browser render smoke tests."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from spec import KNOWN_PROPS, validate  # noqa: E402

KINDS = {"claw-crane", "rosette", "meat-bone", "bucket", "meat-grinder"}
LAYERS = [
    {"type": "prop", "kind": "claw-crane", "x": 0.5, "y": 0.42, "size": 360,
     "load": "pawn", "drop": {"at": 0.2, "dur": 0.53, "from": 0.6}, "releaseAt": 0.8},
    {"type": "prop", "kind": "rosette", "x": 0.5, "y": 0.4, "size": 380,
     "text": "DID NOTHING\nWRONG\nAWARD", "ribbonColor": "#365865", "swing": True},
    {"type": "prop", "kind": "meat-bone", "x": 0.5, "y": 0.5, "size": 380},
    {"type": "prop", "kind": "bucket", "x": 0.5, "y": 0.4, "size": 300,
     "tilt": [{"at": 0, "v": -10}, {"at": 1, "v": 15}], "upside": True},
    {"type": "prop", "kind": "meat-grinder", "x": 0.35, "y": 0.85, "size": 440,
     "crank": [[0.2, 1], [1.4, 2.5]], "feed": "pawn", "feedAt": 0.5,
     "extrude": {"at": 0.5, "dur": 2, "len": 600, "color": "#c0503a"}},
]


def film(layers, vertical=False):
    return {"seed": 7, "format": "vertical" if vertical else "landscape",
            "cast": {"host": {"robe": "#365865"}},
            "shots": [{"id": "props", "dur": 4, **({"frame": 0.5} if vertical else {}),
                       "bg": {"kind": "flat", "color": "#ddd3be"}, "camera": {"zoom": [1, 1]},
                       "layers": [{"enter": "none", **layer} for layer in layers]}]}


@pytest.mark.parametrize("layer", LAYERS, ids=lambda layer: layer["kind"])
def test_extra_prop_specs_validate(layer):
    assert validate(film([layer])) == []


def test_extra_vocabulary_and_handheld_bucket_validate():
    vocab = json.loads((ROOT / "scripts/vocab/props-extra.json").read_text())
    assert set(vocab["props"]) == KINDS
    assert KINDS <= KNOWN_PROPS
    assert validate(film([{"type": "bean", "who": "host", "hold": "bucket",
                           "holdL": "meat-bone", "pose": "hold", "size": 420}])) == []
    assert any("missing-prop" in e for e in validate(film([{"type": "prop", "kind": "missing-prop"}])))


# Run the actual module in Node with an affine Canvas recorder. This verifies geometry/timing without Chromium;
# real raster appearance and integration still run through the render tests below.
RECORDER = r"""
const fs = require('fs'), vm = require('vm');
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
class Matrix {
  constructor(a=1,b=0,c=0,d=1,e=0,f=0) { Object.assign(this,{a,b,c,d,e,f}); }
  transformPoint({x,y}) { return {x:this.a*x+this.c*y+this.e,y:this.b*x+this.d*y+this.f}; }
  mul(n) { return new Matrix(this.a*n.a+this.c*n.b,this.b*n.a+this.d*n.b,
    this.a*n.c+this.c*n.d,this.b*n.c+this.d*n.d,this.a*n.e+this.c*n.f+this.e,this.b*n.e+this.d*n.f+this.f); }
  inverse() { const z=this.a*this.d-this.b*this.c; return new Matrix(this.d/z,-this.b/z,-this.c/z,this.a/z,
    (this.c*this.f-this.d*this.e)/z,(this.b*this.e-this.a*this.f)/z); }
}
let ctx, held, shapes, strokes, rotations;
const T = {PAL:{ink:'#2a1c15'},DEG:Math.PI/180,PROPS:{},PROP_GROUND:new Set(['throne']),
  clamp:(v)=>Math.max(0,Math.min(1,v)),ease:{inOut:(p)=>p*p*(3-2*p)},
  shade:(c)=>'shadow:'+c,font:(s)=>s+'px sans-serif',fitSize:(ctx,t,s,w)=>Math.min(s,w/Math.max(1,t.length)*1.5),
  num:(v,t,d)=>typeof v==='number'?v:d,
  rrect:(c,x,y,w,h,r)=>c.rect(x,y,w,h),
  outlined:(c,path,fill,o)=>{c.beginPath();path(c);shapes.push({fill,path:c.path.slice(),m:c.m});
    if(o.shade){c.save();o.shade(c);c.restore();} c.beginPath();path(c);},
  drawProp:(c,kind,size,t,o={})=>{c.save();try {
    if(T.PROPS[kind]) T.PROPS[kind](c,size,t,o);
    else held.push({kind,size,x:c.m.e,y:c.m.f});
  }finally{c.restore();}}
};
global.window={TOON:T};
vm.runInThisContext(fs.readFileSync(input.source,'utf8'));
function sample(q) {
  held=[];shapes=[];strokes=[];rotations=[];
  ctx={m:new Matrix(),stack:[],path:[],
    save(){this.stack.push(this.m);},restore(){this.m=this.stack.pop();},
    translate(x,y){this.m=this.m.mul(new Matrix(1,0,0,1,x,y));},
    scale(x,y){this.m=this.m.mul(new Matrix(x,0,0,y));},
    rotate(a){rotations.push(a);this.m=this.m.mul(new Matrix(Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a)));},
    getTransform(){return this.m;},beginPath(){this.path=[];},
    stroke(){strokes.push({path:this.path.slice(),m:this.m});},clip(){},fill(){},fillText(){},
    measureText(t){return {width:t.length*10};}};
  for(const op of ['moveTo','lineTo','rect','ellipse','arc','quadraticCurveTo','bezierCurveTo','fillRect','closePath']) {
    ctx[op]=function(...args){if(args.some(x=>typeof x==='number'&&!Number.isFinite(x))) throw Error('non-finite '+op);
      this.path.push({op,args});};
  }
  ctx.scale(q.scale??1,q.scale??1);ctx.translate(500,400);
  T.drawProp(ctx,q.kind,q.size??400,q.t,q.o??{});
  if(ctx.stack.length) throw Error('unbalanced canvas state');
  return {held,shapes,strokes,rotations,ground:[...T.PROP_GROUND]};
}
process.stdout.write(JSON.stringify(input.samples.map(sample)));
"""


def record(*samples):
    result = subprocess.run(["node", "-e", RECORDER], text=True, capture_output=True,
                            input=json.dumps({"source": str(ROOT / "scripts/engine/lib/props/props-extra.js"),
                                              "samples": samples}))
    assert result.returncode == 0, result.stdout + result.stderr
    return json.loads(result.stdout)


def test_claw_load_lowers_releases_stays_and_cable_reaches_canvas_top():
    samples = [{"kind": "claw-crane", "t": t, "o": {"load": "pawn"}, "scale": 0.5}
               for t in (0, 0.265, 0.53, 0.73, 0.93, 0.265)]
    start, middle, released, rising, retracted, seek = record(*samples)
    ys = [v["held"][0]["y"] for v in (start, middle, released, rising, retracted)]
    assert ys == pytest.approx([80, 140, 200, 200, 200])
    assert middle == seek
    # First stroke is the cable: the transformed start is exactly at physical canvas y=0.
    for frame in (start, released, retracted):
        cable = frame["strokes"][0]
        x, y = cable["path"][0]["args"]
        m = cable["m"]
        assert m["b"] * x + m["d"] * y + m["f"] == pytest.approx(0)
    assert released["shapes"] != rising["shapes"] != retracted["shapes"]
    ground_load = record({"kind": "claw-crane", "t": 1, "o": {"load": "throne"}})[0]
    assert ground_load["held"][0]["y"] == pytest.approx(500)


def test_grinder_crank_pauses_runs_on_twos_resumes_and_feed_disappears():
    opts = {"crank": [[0, 0.2], [1, 2]], "feed": "pawn", "feedAt": 1}
    frames = record(*[{"kind": "meat-grinder", "t": t, "o": opts}
                      for t in (0.1, 0.12, 0.2, 0.8, 1.1, 1.3, 1.6)])
    assert frames[0]["rotations"] == frames[1]["rotations"]  # same two-frame pose
    assert frames[2]["rotations"] == frames[3]["rotations"]  # held through the gap
    assert frames[4]["rotations"] != frames[3]["rotations"]
    assert frames[5]["held"][0]["y"] > frames[4]["held"][0]["y"]
    assert frames[6]["held"] == []
    overlap = record({"kind": "meat-grinder", "t": 0.2, "o": {"crank": [[0.1, 0.2], [0, 0.2]]}})[0]
    assert overlap["rotations"] == frames[2]["rotations"]
    assert "meat-grinder" in overlap["ground"] and "bucket" not in overlap["ground"]


def test_sausage_grows_in_pixels_and_holds_at_target_length():
    opts = {"extrude": {"at": 1, "dur": 2, "len": 360, "color": "#c0503a"}}
    frames = record(*[{"kind": "meat-grinder", "t": t, "o": opts} for t in (0, 1, 2, 3, 4, 2)])
    def width(frame):
        paths = [s for s in frame["shapes"] if s["fill"] == "#c0503a"]
        return max((p["args"][0] for s in paths for p in s["path"] if p["op"] == "lineTo"), default=0)
    assert [width(f) for f in frames] == pytest.approx([0, 0, 180, 360, 360, 180])
    assert frames[2] == frames[-1]


def test_bucket_tilt_and_inversion_and_all_default_paths_are_finite():
    frames = record(*[{"kind": "bucket", "t": 0, "o": o} for o in ({}, {"tilt": 25}, {"upside": True})],
                    *[{"kind": kind, "t": 0.4} for kind in sorted(KINDS)])
    assert [f["rotations"][0] for f in frames[:3]] == pytest.approx([0, 25 * 3.141592653589793 / 180, 3.141592653589793])
    assert all(f["shapes"] for f in frames)


@pytest.mark.parametrize("vertical", [False, True], ids=["landscape", "vertical"])
def test_extra_props_render_without_page_errors(tmp_path, vertical):
    pytest.importorskip("playwright")
    layers = [{**layer, "x": 0.5} for layer in LAYERS]
    # One shot per prop avoids overlap; final shot exercises actual bean hand transforms.
    spec = film([layers[0]], vertical)
    spec["shots"] = [{**spec["shots"][0], "id": layer["kind"], "layers": [{"enter": "none", **layer}]}
                     for layer in layers]
    spec["shots"].append({"id": "held", "dur": 4, "bg": {"kind": "flat", "color": "#ddd3be"},
                          "layers": [{"type": "bean", "who": "host", "x": 0.5, "y": 0.85, "size": 550,
                                      "pose": "hold", "hold": "bucket", "holdL": "meat-bone"}]})
    assert validate(spec) == []
    path = tmp_path / "spec.json"
    path.write_text(json.dumps(spec))
    out = tmp_path / "stills"
    times = [i * 4 + t for i in range(6) for t in (0.2, 0.7, 1.1, 2.7)]
    result = subprocess.run([sys.executable, str(ROOT / "scripts/render.py"), str(path),
                             "--stills", ",".join(map(str, times)), "--scale", "0.25", "--out", str(out)],
                            capture_output=True, text=True)
    assert result.returncode == 0, result.stdout + result.stderr
    assert "[pageerror]" not in result.stdout + result.stderr
    assert len(list(out.glob("*.png"))) == len(times)


def test_extra_props_browser_frames_are_order_independent():
    pytest.importorskip("playwright")
    from playwright.sync_api import sync_playwright
    import render as R

    srv = R.serve(set())
    try:
        with sync_playwright() as pw:
            browser, page, errors = R.open_page(pw, film(LAYERS), srv.server_address[1], 0.25)
            try:
                grab = "t => {window.renderFrame(t); return window.__canvas.toDataURL();}"
                times = [0.2, 0.7, 1.1, 2.7]
                forward = [page.evaluate(grab, t) for t in times]
                assert forward == [page.evaluate(grab, t) for t in reversed(times)][::-1]
                assert len(set(forward)) == len(times)
                assert errors == [], errors
            finally:
                browser.close()
    finally:
        srv.shutdown()
