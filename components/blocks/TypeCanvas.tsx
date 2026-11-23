import type { CSSProperties } from "react";
import { typeScale, type TypeSpec } from "@/content/typescale";

const px = (v: number) => `${Number.isInteger(v) ? v : v.toFixed(1)}px`;
const pct = (s: TypeSpec) => `${Math.round((s.lh / s.size) * 100)}%`;
const em = (s: TypeSpec) => (s.ls ? `${((s.ls / s.size) * 100).toFixed(1)}%` : "0%");

function Spec({ s }: { s: TypeSpec }) {
  return (
    <dl className="tc-spec">
      <div><dt>Size</dt><dd>{px(s.size)}</dd></div>
      <div><dt>Line height</dt><dd>{px(s.lh)} <span>{pct(s)}</span></dd></div>
      <div><dt>Letter spacing</dt><dd>{px(s.ls)} <span>{em(s)}</span></dd></div>
    </dl>
  );
}

// The type scale as a design canvas: every text style on the site, set at its
// desktop size, with its size, line height and letter spacing in px for
// desktop (1440) and mobile (390). Percentages are for Figma's fields.
export function TypeCanvas() {
  return (
    <div className="tc container">
      <header className="tc-head">
        <p className="label">KUIX · Type scale</p>
        <h1 className="h2">Typography</h1>
        <p className="body">
          Saans for headings, Saans Mono for body text. Desktop values at 1440×900, mobile at 390×844; in between, sizes scale linearly. Line height and letter spacing are also given in % of the font size.
        </p>
      </header>
      <div className="tc-cols label" aria-hidden>
        <span>Style</span>
        <span>Desktop · 1440</span>
        <span>Mobile · 390</span>
      </div>
      <ol className="tc-list">
        {typeScale.map((r) => {
          const style: CSSProperties = {
            fontFamily: r.font === "Saans" ? "var(--font-sans)" : "var(--font-body)",
            fontWeight: r.weight,
            fontSize: `min(${r.d.size}px, 18vw)`,
            lineHeight: r.d.lh / r.d.size,
            letterSpacing: `${r.d.ls / r.d.size}em`,
            textTransform: r.upper ? "uppercase" : "none",
          };
          return (
            <li key={r.name} className="tc-row">
              <div className="tc-meta">
                <h2 className="tc-name">{r.name}</h2>
                <p className="label tc-font">
                  {r.font} · {r.weight}
                  {r.upper ? " · Uppercase" : ""}
                </p>
                {r.note && <p className="tc-note">{r.note}</p>}
              </div>
              <Spec s={r.d} />
              <Spec s={r.m} />
              <p className="tc-sample" style={style}>{r.sample}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
