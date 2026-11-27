"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SplatBackdrop } from "@/components/splats/SplatBackdrop";
import { generate, kuixHeader } from "@/lib/splats/generate";
import { halos, type Halo } from "@/lib/splats/halos";
import { palettes } from "@/lib/splats/palettes";
import { forms, type Form, type PaletteName, type ShapeSpec, type SplatScene } from "@/lib/splats/spec";
import { MAX_SHAPES } from "@/lib/splats/build";

// The scene builder. A scene is plain data (lib/splats/spec.ts); this edits
// it with live preview and hands it back as JSON for the site to use.

const paletteNames = Object.keys(palettes) as PaletteName[];
const formNames: Record<Form, string> = {
  cube: "Cube",
  donut: "Donut",
  torus: "Torus",
  pyramid: "Pyramid",
  cylinder: "Cylinder",
  capsule: "Capsule",
  octahedron: "Octahedron",
};
const frames = {
  fill: { name: "Fill", aspect: null as number | null },
  desktop: { name: "Desktop", aspect: 16 / 10 },
  phone: { name: "Phone", aspect: 9 / 19.5 },
};
type FrameName = keyof typeof frames;

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const round = (v: number, d = 3) => Math.round(v * 10 ** d) / 10 ** d;

function Slider({ label, value, min, max, step = 0.01, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <label className="field slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <output>{step >= 1 ? Math.round(value) : value.toFixed(2)}</output>
    </label>
  );
}

function Section({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="section" open={open}>
      <summary>{title}</summary>
      <div className="section-body">{children}</div>
    </details>
  );
}

const swatch = (p: PaletteName) => ({ background: `linear-gradient(135deg, ${palettes[p].join(", ")})` });

// Fills in anything an imported scene leaves out, and drops what it cannot use.
function sanitise(input: unknown): SplatScene {
  const s = (typeof input === "object" && input ? input : {}) as Partial<SplatScene>;
  const shapes = Array.isArray(s.shapes) ? s.shapes : [];
  return {
    ...clone(kuixHeader),
    ...s,
    style: { ...kuixHeader.style, ...(s.style ?? {}) },
    shapes: shapes
      .filter((sh) => sh && forms.includes(sh.form) && paletteNames.includes(sh.palette))
      .slice(0, MAX_SHAPES)
      .map((sh) => ({ scatter: 0.5, ...sh })),
  };
}

export function Builder() {
  const [scene, setScene] = useState<SplatScene>(() => clone(kuixHeader));
  // The preview rebuilds a moment after the last edit, not on every step of
  // a slider.
  const [shown, setShown] = useState<SplatScene>(scene);
  useEffect(() => {
    const id = setTimeout(() => setShown(scene), 250);
    return () => clearTimeout(id);
  }, [scene]);

  const [halo, setHalo] = useState<Halo>("loupe");
  const [draft, setDraft] = useState(true);
  const [frame, setFrame] = useState<FrameName>("desktop");
  const [safe, setSafe] = useState(true);
  const [seed, setSeed] = useState(42);
  const [allForms, setAllForms] = useState(true);
  const [picked, setPicked] = useState(0);
  const [note, setNote] = useState("");
  const [importText, setImportText] = useState("");
  const stage = useRef<HTMLDivElement>(null);

  const preview = useMemo(() => (draft ? { ...shown, count: Math.round(shown.count * 0.4) } : shown), [shown, draft]);

  const say = (text: string) => {
    setNote(text);
    setTimeout(() => setNote(""), 2400);
  };
  const edit = (fn: (s: SplatScene) => void) =>
    setScene((prev) => {
      const next = clone(prev);
      fn(next);
      return next;
    });
  const editShape = (i: number, fn: (sh: ShapeSpec) => void) => edit((s) => fn(s.shapes[i]));

  const load = (next: SplatScene) => {
    setScene(next);
    setPicked(0);
  };
  const rollSeed = (value: number) => {
    setSeed(value);
    load(generate(value, allForms ? forms : ["cube", "donut"]));
  };

  const json = () => JSON.stringify(scene, (_, v) => (typeof v === "number" ? round(v) : v), 2);
  const fileName = () => `${scene.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scene"}`;
  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(json());
      say("Scene copied as JSON.");
    } catch {
      download(new Blob([json()], { type: "application/json" }), `${fileName()}.json`);
    }
  };
  const importJson = (text: string) => {
    try {
      load(sanitise(JSON.parse(text)));
      setImportText("");
      say("Scene imported.");
    } catch {
      say("That isn’t a scene file (JSON could not be read).");
    }
  };
  const snapshot = () => {
    const canvas = stage.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob((b) => b && download(b, `${fileName()}.png`), "image/png");
  };

  const ratio = frames[frame].aspect;
  const shape = scene.shapes[picked];

  return (
    <div className="builder">
      <main className="preview">
        <div className="stage-wrap">
          <div ref={stage} className="stage" style={ratio ? { aspectRatio: String(ratio) } : { width: "100%", height: "100%" }}>
            <SplatBackdrop scene={preview} halo={halo} preserve />
            {safe && <div className="safe" aria-hidden />}
          </div>
        </div>
        <div className="bar">
          <span className="seg" role="group" aria-label="Frame">
            {(Object.keys(frames) as FrameName[]).map((f) => (
              <button key={f} type="button" aria-pressed={frame === f} onClick={() => setFrame(f)}>
                {frames[f].name}
              </button>
            ))}
          </span>
          <label className="check">
            <input type="checkbox" checked={safe} onChange={(e) => setSafe(e.target.checked)} /> Text area
          </label>
          <label className="check">
            <input type="checkbox" checked={!draft} onChange={(e) => setDraft(!e.target.checked)} /> Full quality
          </label>
          <span className="note" aria-live="polite">{note}</span>
        </div>
      </main>

      <aside className="panel">
        <header className="panel-head">
          <b>Scene builder</b>
          <input className="name" value={scene.name} onChange={(e) => edit((s) => (s.name = e.target.value))} aria-label="Scene name" />
        </header>

        <Section title="Start from">
          <div className="row">
            <button type="button" className="btn" onClick={() => load(clone(kuixHeader))}>
              KUIX header
            </button>
            <button type="button" className="btn" onClick={() => rollSeed(1 + Math.floor(Math.random() * 99999))}>
              Random
            </button>
          </div>
          <div className="row">
            <label className="field inline">
              <span>Seed</span>
              <input type="number" value={seed} min={1} onChange={(e) => setSeed(Number(e.target.value))} />
            </label>
            <button type="button" className="btn" onClick={() => rollSeed(seed)}>
              Generate
            </button>
          </div>
          <label className="check">
            <input type="checkbox" checked={allForms} onChange={(e) => setAllForms(e.target.checked)} /> All primitives (off: cubes and donuts only)
          </label>
        </Section>

        <Section title="Halo">
          <div className="seg" role="group" aria-label="Halo">
            {(Object.keys(halos) as Halo[]).map((h) => (
              <button key={h} type="button" aria-pressed={halo === h} onClick={() => setHalo(h)}>
                {halos[h].name}
              </button>
            ))}
          </div>
          <p className="hint">{halos[halo].description}</p>
        </Section>

        <Section title={`Shapes (${scene.shapes.length}/${MAX_SHAPES})`}>
          <div className="chips">
            {scene.shapes.map((sh, i) => (
              <button key={i} type="button" className="chip" aria-pressed={picked === i} onClick={() => setPicked(i)}>
                <i style={swatch(sh.palette)} /> {formNames[sh.form]}
              </button>
            ))}
            <button
              type="button"
              className="chip add"
              disabled={scene.shapes.length >= MAX_SHAPES}
              onClick={() => {
                edit((s) => s.shapes.push({ form: "torus", palette: "blue", at: [0.85, -0.2, 0], size: 0.5, rotate: [60, 0, 20], scatter: 0.5 }));
                setPicked(scene.shapes.length);
              }}
            >
              + Add
            </button>
          </div>
          {shape && (
            <div className="shape">
              <div className="row">
                <label className="field inline grow">
                  <span>Form</span>
                  <select value={shape.form} onChange={(e) => editShape(picked, (sh) => (sh.form = e.target.value as Form))}>
                    {forms.map((f) => (
                      <option key={f} value={f}>
                        {formNames[f]}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="btn"
                  disabled={scene.shapes.length >= MAX_SHAPES}
                  onClick={() => {
                    edit((s) => s.shapes.splice(picked + 1, 0, { ...clone(shape), at: [shape.at[0] - 0.15, shape.at[1] - 0.15, shape.at[2]] }));
                    setPicked(picked + 1);
                  }}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    edit((s) => s.shapes.splice(picked, 1));
                    setPicked(Math.max(0, picked - 1));
                  }}
                >
                  Remove
                </button>
              </div>
              <div className="swatches" role="radiogroup" aria-label="Colour">
                {paletteNames.map((p) => (
                  <button key={p} type="button" role="radio" aria-checked={shape.palette === p} title={p} style={swatch(p)} onClick={() => editShape(picked, (sh) => (sh.palette = p))} />
                ))}
              </div>
              <Slider label="Across" value={shape.at[0]} min={-1.3} max={1.3} onChange={(v) => editShape(picked, (sh) => (sh.at[0] = v))} />
              <Slider label="Up" value={shape.at[1]} min={-1.3} max={1.3} onChange={(v) => editShape(picked, (sh) => (sh.at[1] = v))} />
              <Slider label="Depth" value={shape.at[2]} min={-4} max={1} onChange={(v) => editShape(picked, (sh) => (sh.at[2] = v))} />
              <Slider label="Size" value={shape.size} min={0.1} max={1.6} onChange={(v) => editShape(picked, (sh) => (sh.size = v))} />
              <Slider label="Tilt X" value={shape.rotate[0]} min={-180} max={180} step={1} onChange={(v) => editShape(picked, (sh) => (sh.rotate[0] = v))} />
              <Slider label="Turn Y" value={shape.rotate[1]} min={-180} max={180} step={1} onChange={(v) => editShape(picked, (sh) => (sh.rotate[1] = v))} />
              <Slider label="Roll Z" value={shape.rotate[2]} min={-180} max={180} step={1} onChange={(v) => editShape(picked, (sh) => (sh.rotate[2] = v))} />
              <Slider label="Scatter" value={shape.scatter ?? 0.5} min={0} max={1} onChange={(v) => editShape(picked, (sh) => (sh.scatter = v))} />
            </div>
          )}
        </Section>

        <Section title="Look" open={false}>
          <label className="field inline">
            <span>Paper</span>
            <input type="color" value={scene.paper} onChange={(e) => edit((s) => (s.paper = e.target.value))} />
          </label>
          <Slider label="Splats (k)" value={scene.count / 1000} min={40} max={260} step={5} onChange={(v) => edit((s) => (s.count = v * 1000))} />
          <Slider label="Drift" value={scene.drift} min={0} max={0.3} onChange={(v) => edit((s) => (s.drift = v))} />
          <Slider label="Wind X" value={scene.wind[0]} min={-1} max={1} onChange={(v) => edit((s) => (s.wind[0] = v))} />
          <Slider label="Wind Y" value={scene.wind[1]} min={-1} max={1} onChange={(v) => edit((s) => (s.wind[1] = v))} />
          <Slider label="Accent" value={scene.accent} min={0} max={0.06} step={0.001} onChange={(v) => edit((s) => (s.accent = v))} />
          <Slider label="Grain size" value={scene.style.grain} min={0.004} max={0.03} step={0.001} onChange={(v) => edit((s) => (s.style.grain = v))} />
          <Slider label="Body size" value={scene.style.body} min={0.1} max={0.5} onChange={(v) => edit((s) => (s.style.body = v))} />
          <Slider label="Body share" value={scene.style.bodyShare} min={0.02} max={0.25} onChange={(v) => edit((s) => (s.style.bodyShare = v))} />
          <Slider label="Dither" value={scene.style.dither} min={0} max={1} onChange={(v) => edit((s) => (s.style.dither = v))} />
          <Slider label="Depth blur" value={scene.style.blur} min={0} max={1.2} onChange={(v) => edit((s) => (s.style.blur = v))} />
          <Slider label="Haze" value={scene.style.haze} min={0} max={0.3} onChange={(v) => edit((s) => (s.style.haze = v))} />
          <Slider label="Organic" value={scene.style.organic} min={0} max={1} onChange={(v) => edit((s) => (s.style.organic = v))} />
        </Section>

        <Section title="Export">
          <div className="row">
            <button type="button" className="btn primary" onClick={copyJson}>
              Copy JSON
            </button>
            <button type="button" className="btn" onClick={() => download(new Blob([json()], { type: "application/json" }), `${fileName()}.json`)}>
              .json
            </button>
            <button type="button" className="btn" onClick={snapshot}>
              .png
            </button>
          </div>
          <textarea className="import" placeholder="Paste a scene’s JSON here to load it" value={importText} onChange={(e) => setImportText(e.target.value)} rows={3} />
          <div className="row">
            <button type="button" className="btn" disabled={!importText.trim()} onClick={() => importJson(importText)}>
              Load pasted scene
            </button>
            <label className="btn file">
              Open file…
              <input type="file" accept="application/json,.json" onChange={(e) => e.target.files?.[0]?.text().then(importJson)} />
            </label>
          </div>
        </Section>
      </aside>
    </div>
  );
}
