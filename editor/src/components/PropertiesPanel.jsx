import { useState, useEffect } from "react";

const ANIMATIONS = ["", "fade-in", "slide-left", "slide-right", "slide-up", "zoom-in"];
const FONTS = ["Inter", "Georgia", "Times New Roman", "monospace", "cursive"];

function Group({ label, children }) {
  return (
    <div className="prop-group">
      <div className="prop-label">{label}</div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div className="prop-row">{children}</div>;
}

function Divider() {
  return <div className="prop-divider" />;
}

function SectionTitle({ children }) {
  return <div className="prop-section-title">{children}</div>;
}

// ── Image file uploader ───────────────────────────────────────────────────────
function ImageUpload({ onUpload }) {
  return (
    <label className="upload-file-btn">
      Choose from device
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => onUpload(ev.target.result);
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

// ── Layer order buttons ───────────────────────────────────────────────────────
function LayerControls({ id, onLayer }) {
  const btns = [
    { dir: "front", label: "⬆⬆", title: "Bring to Front" },
    { dir: "up",    label: "↑",   title: "Bring Forward" },
    { dir: "down",  label: "↓",   title: "Send Backward" },
    { dir: "back",  label: "⬇⬇", title: "Send to Back" },
  ];
  return (
    <div className="layer-controls">
      {btns.map(({ dir, label, title }) => (
        <button key={dir} className="layer-btn" title={title} onClick={() => onLayer(id, dir)}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Text align buttons ────────────────────────────────────────────────────────
function AlignPicker({ value, onChange }) {
  return (
    <div className="text-align-btns">
      {["left", "center", "right"].map((a) => (
        <button
          key={a}
          className={`text-align-btn ${value === a ? "active" : ""}`}
          onClick={() => onChange(a)}
          title={`Align ${a}`}
        >
          {a === "left" ? "≡ L" : a === "center" ? "≡ C" : "≡ R"}
        </button>
      ))}
    </div>
  );
}

// ─── Background picker ────────────────────────────────────────────────────────
function parseGrad(val) {
  try {
    const isRadial = val.startsWith("radial");
    const inner = val.slice(val.indexOf("(") + 1, val.lastIndexOf(")"));
    const parts = inner.split(",").map(s => s.trim());
    let angle = 135, stops = ["#0d0d1a", "#2a0050"];
    if (!isRadial && /deg/.test(parts[0])) {
      angle = parseInt(parts[0]);
      stops = parts.slice(1).map(p => p.split(" ")[0]).filter(c => c.startsWith("#") || c.startsWith("rgb"));
    } else {
      stops = parts.map(p => p.split(" ")[0]).filter(c => c.startsWith("#") || c.startsWith("rgb"));
    }
    // ensure exactly 2 valid hex stops
    stops = stops.slice(0, 3);
    while (stops.length < 2) stops.push("#111827");
    return { isRadial, angle, stops };
  } catch { return { isRadial: false, angle: 135, stops: ["#0d0d1a", "#2a0050"] }; }
}

function buildGradient(isRadial, angle, stops) {
  if (isRadial) return `radial-gradient(ellipse at center, ${stops.join(", ")})`;
  return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
}

function BackgroundPicker({ value, onChange }) {
  const isGrad = value.startsWith("linear") || value.startsWith("radial");
  const isImg  = value.startsWith("url(");
  const parsed = isGrad ? parseGrad(value) : null;

  const [mode,    setMode]    = useState(isGrad ? "gradient" : isImg ? "image" : "solid");
  const [isRadial,setIsRadial]= useState(parsed?.isRadial ?? false);
  const [angle,   setAngle]   = useState(parsed?.angle ?? 135);
  const [stops,   setStops]   = useState(parsed?.stops ?? ["#0d0d1a", "#2a0050"]);
  const [solid,   setSolid]   = useState(isGrad ? "#111827" : value);

  // keep in sync when page changes
  useEffect(() => {
    const g = value.startsWith("linear") || value.startsWith("radial");
    setMode(g ? "gradient" : "solid");
    if (g) {
      const p = parseGrad(value);
      setIsRadial(p.isRadial); setAngle(p.angle); setStops(p.stops);
    } else {
      setSolid(value);
    }
  }, [value]);

  const emit = (r, a, s) => onChange(buildGradient(r, a, s));

  const setStop = (i, c) => {
    const next = stops.map((s, idx) => idx === i ? c : s);
    setStops(next);
    emit(isRadial, angle, next);
  };

  const addStop = () => {
    if (stops.length >= 4) return;
    const next = [...stops, "#ffffff"];
    setStops(next); emit(isRadial, angle, next);
  };
  const removeStop = (i) => {
    if (stops.length <= 2) return;
    const next = stops.filter((_, idx) => idx !== i);
    setStops(next); emit(isRadial, angle, next);
  };

  const modeBtn = (m, label) => (
    <button
      style={{
        flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 600,
        background: mode === m ? "#1e1e40" : "transparent",
        color: mode === m ? "#818cf8" : "#475569",
        border: "none", cursor: "pointer", borderRadius: 5, fontFamily: "inherit",
      }}
      onClick={() => {
        setMode(m);
        if (m === "solid") onChange(solid);
        else if (m === "gradient") emit(isRadial, angle, stops);
      }}
    >{label}</button>
  );

  return (
    <div>
      {/* Solid / Gradient / Image toggle */}
      <div style={{ display:"flex", background:"#0a0a18", borderRadius:6, border:"1px solid #1e1e3a", marginBottom:10 }}>
        {modeBtn("solid",    "Solid")}
        {modeBtn("gradient", "Gradient")}
        {modeBtn("image",    "Image")}
      </div>

      {mode === "image" && (
        <>
          <Group label="Image URL">
            <input className="prop-input" placeholder="https://..." defaultValue={isImg ? value.slice(4,-1).replace(/['"]/g,'') : ""}
              onBlur={(e) => { const v=e.target.value.trim(); if(v) onChange(`url('${v}')`); }} />
          </Group>
          <Group label="or upload">
            <label className="upload-file-btn">
              Choose image
              <input type="file" accept="image/*" hidden onChange={(e) => {
                const file=e.target.files[0]; if(!file) return;
                const r=new FileReader();
                r.onload=(ev)=>onChange(`url('${ev.target.result}')`);
                r.readAsDataURL(file); e.target.value="";
              }} />
            </label>
          </Group>
          <Group label="Sizing">
            <select className="prop-input" onChange={(e) => {
              const current = value.includes("center/") ? value : `${value} center/cover no-repeat`;
              onChange(current.replace(/center\/.+? no-repeat/, `center/${e.target.value} no-repeat`));
            }}>
              <option value="cover">Cover (fill)</option>
              <option value="contain">Contain (fit)</option>
              <option value="100% 100%">Stretch</option>
            </select>
          </Group>
          {isImg && (
            <div style={{ height:60, borderRadius:6, marginTop:4, background:value, backgroundSize:"cover", backgroundPosition:"center", border:"1px solid #1e293b" }} />
          )}
        </>
      )}

      {mode === "solid" && (
        <Group label="Color">
          <input type="color" className="prop-input"
            value={solid}
            onChange={(e) => { setSolid(e.target.value); onChange(e.target.value); }}
          />
        </Group>
      )}

      {mode === "gradient" && (
        <>
          {/* Linear / Radial */}
          <Group label="Type">
            <div style={{ display:"flex", gap:6 }}>
              {[["Linear","false"],["Radial","true"]].map(([lbl, val]) => (
                <button key={lbl}
                  style={{
                    flex:1, padding:"5px 0", fontSize:11, fontWeight:600, borderRadius:6,
                    border:"1px solid #1e293b", cursor:"pointer", fontFamily:"inherit",
                    background: String(isRadial) === val ? "#1e1e40" : "#111118",
                    color:      String(isRadial) === val ? "#818cf8" : "#64748b",
                  }}
                  onClick={() => { const r = val==="true"; setIsRadial(r); emit(r, angle, stops); }}
                >{lbl}</button>
              ))}
            </div>
          </Group>

          {/* Angle — only for linear */}
          {!isRadial && (
            <Group label={`Angle — ${angle}°`}>
              <input type="range" min={0} max={360} value={angle}
                style={{ width:"100%", accentColor:"#6366f1", cursor:"pointer" }}
                onChange={(e) => { const a=+e.target.value; setAngle(a); emit(isRadial, a, stops); }}
              />
            </Group>
          )}

          {/* Color stops */}
          <Group label="Colors">
            {stops.map((c, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <input type="color" className="prop-input"
                  style={{ flex:1, height:32, padding:"2px 4px" }}
                  value={c} onChange={(e) => setStop(i, e.target.value)}
                />
                <span style={{ fontSize:11, color:"#475569", minWidth:28 }}>
                  {Math.round((i / (stops.length - 1)) * 100)}%
                </span>
                {stops.length > 2 && (
                  <button onClick={() => removeStop(i)}
                    style={{ background:"none", border:"none", color:"#7f1d1d", cursor:"pointer", fontSize:14, padding:"0 2px" }}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            {stops.length < 4 && (
              <button className="prop-btn" onClick={addStop}>+ Add color stop</button>
            )}
          </Group>

          {/* Live preview strip */}
          <div style={{
            height: 28, borderRadius: 6, marginTop: 4,
            background: buildGradient(isRadial, angle, stops),
            border: "1px solid #1e293b",
          }} />
        </>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PropertiesPanel({
  element, selectedCount, page, onUpdate, onDelete, onBatchDelete, onBackground, onDuplicate, onLayer, clipboard, onPaste,
}) {
  // Multi-select → show batch panel
  if (selectedCount > 1) {
    return (
      <div className="props-panel">
        <div style={{ padding: "20px 16px", textAlign: "center" }}>
          <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>
            {selectedCount} elements selected
          </div>
          <button
            style={{ width: "100%", padding: "8px 0", background: "#7f1d1d", border: "none", borderRadius: 6, color: "#fca5a5", cursor: "pointer", fontSize: 13 }}
            onClick={onBatchDelete}
          >
            Delete all selected
          </button>
          <div style={{ color: "#334155", fontSize: 11, marginTop: 12 }}>
            Arrow keys to nudge · Drag to move together
          </div>
        </div>
      </div>
    );
  }

  // No selection → show page properties
  if (!element) {
    return (
      <div className="properties-panel">
        <h3>Page</h3>
        <BackgroundPicker value={page.background} onChange={onBackground} />
        {clipboard && (
          <button className="prop-btn" style={{ marginTop: 12 }} onClick={onPaste}>
            ⎘ Paste element
          </button>
        )}
        <p className="prop-hint">Click an element on the canvas to edit it.</p>
      </div>
    );
  }

  const upd = (key) => (e) => {
    const val =
      e.target.type === "checkbox" ? e.target.checked
      : e.target.type === "number" ? Number(e.target.value)
      : e.target.value;
    onUpdate(element.id, { [key]: val });
  };

  const set = (key, val) => onUpdate(element.id, { [key]: val });

  return (
    <div className="properties-panel">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="panel-header">
        <h3>{element.type}</h3>
        <div className="panel-header-actions">
          <button className="icon-btn" title="Duplicate (Ctrl+D)" onClick={onDuplicate}>⧉</button>
          <button className="icon-btn danger" title="Delete (Del)" onClick={() => onDelete(element.id)}>✕</button>
        </div>
      </div>

      {/* ── Text ──────────────────────────────────────────────────── */}
      {element.type === "text" && (
        <>
          <Group label="Text">
            <input className="prop-input" value={element.text} onChange={upd("text")} />
          </Group>
          <Group label="Color">
            <input type="color" className="prop-input" value={element.color} onChange={upd("color")} />
          </Group>
          <Row>
            <Group label="Size">
              <input type="number" className="prop-input" min={8} max={200} value={element.size} onChange={upd("size")} />
            </Group>
            <Group label="Bold">
              <div style={{ paddingTop: 8 }}>
                <input type="checkbox" checked={element.bold} onChange={upd("bold")} style={{ accentColor: "#6366f1", width: 16, height: 16 }} />
              </div>
            </Group>
          </Row>
          <Group label="Font">
            <select className="prop-input" value={element.font} onChange={upd("font")}>
              {FONTS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Group>
          <Group label="Text Align">
            <AlignPicker value={element.align || "left"} onChange={(v) => set("align", v)} />
          </Group>
          <Group label="Wrap text">
            <input type="checkbox" checked={element.wrap || false} onChange={upd("wrap")}
              style={{ accentColor:"#6366f1", width:16, height:16 }} />
          </Group>
          {element.wrap && (
            <Group label="Max width (px)">
              <input type="number" className="prop-input" min={60} max={860}
                value={element.maxWidth || 400}
                onChange={(e) => set("maxWidth", Number(e.target.value))} />
            </Group>
          )}
        </>
      )}

      {/* ── Shape ─────────────────────────────────────────────────── */}
      {element.type === "shape" && (
        <>
          <Group label="Shape">
            <select className="prop-input" value={element.shape} onChange={upd("shape")}>
              <option value="rect">Rectangle</option>
              <option value="circle">Circle</option>
            </select>
          </Group>
          <Row>
            <Group label="Fill">
              <input type="color" className="prop-input"
                value={(element.fill || "#3b82f6").slice(0, 7)}
                onChange={(e) => set("fill", e.target.value)}
              />
            </Group>
            <Group label="Border">
              <input type="color" className="prop-input"
                value={element.border || "#6366f1"}
                onChange={upd("border")}
              />
            </Group>
          </Row>
          <Row>
            <Group label="Width">
              <input type="number" className="prop-input" value={element.width} onChange={upd("width")} />
            </Group>
            <Group label="Height">
              <input type="number" className="prop-input" value={element.height} onChange={upd("height")} />
            </Group>
          </Row>
        </>
      )}

      {/* ── Glow Circle ───────────────────────────────────────────── */}
      {element.type === "circle" && (
        <>
          <Group label="Color">
            <input type="color" className="prop-input"
              value={(element.color || "#6366f1").slice(0, 7)}
              onChange={upd("color")}
            />
          </Group>
          <Group label="Size">
            <input type="number" className="prop-input" min={20} max={900}
              value={element.width || 200}
              onChange={(e) => {
                const s = Number(e.target.value);
                onUpdate(element.id, { width: s, height: s });
              }}
            />
          </Group>
          <p className="prop-hint" style={{ marginTop: 6 }}>
            Glow orb — blurry circle used for background ambience.
          </p>
        </>
      )}

      {/* ── Box ───────────────────────────────────────────────────── */}
      {element.type === "box" && (
        <>
          <Group label="Color">
            <input type="color" className="prop-input"
              value={(element.color || "#3b82f6").slice(0, 7)}
              onChange={upd("color")}
            />
          </Group>
          <Row>
            <Group label="Width">
              <input type="number" className="prop-input" value={element.width} onChange={upd("width")} />
            </Group>
            <Group label="Height">
              <input type="number" className="prop-input" value={element.height} onChange={upd("height")} />
            </Group>
          </Row>
        </>
      )}

      {/* ── Image ─────────────────────────────────────────────────── */}
      {element.type === "image" && (
        <>
          <Group label="Upload from device">
            <ImageUpload onUpload={(src) => set("src", src)} />
          </Group>
          <Group label="or paste URL">
            <input className="prop-input" value={element.src} onChange={upd("src")} placeholder="https://..." />
          </Group>
          <Row>
            <Group label="Width">
              <input type="number" className="prop-input" value={element.width} onChange={upd("width")} />
            </Group>
            <Group label="Height">
              <input type="number" className="prop-input" value={element.height} onChange={upd("height")} />
            </Group>
          </Row>
        </>
      )}

      <Divider />

      {/* ── Opacity ───────────────────────────────────────────────── */}
      <Group label={`Opacity — ${Math.round((element.opacity ?? 1) * 100)}%`}>
        <input
          type="range" min={0} max={1} step={0.01}
          value={element.opacity ?? 1}
          onChange={upd("opacity")}
          className="opacity-slider"
        />
      </Group>

      {/* ── Lock ──────────────────────────────────────────────────── */}
      <Group label="Lock position">
        <input
          type="checkbox" checked={element.locked || false} onChange={upd("locked")}
          style={{ accentColor: "#6366f1", width: 16, height: 16 }}
        />
      </Group>

      <Divider />

      {/* ── Animation ─────────────────────────────────────────────── */}
      <SectionTitle>Animation</SectionTitle>
      <Group label="Type">
        <select className="prop-input" value={element.animation} onChange={upd("animation")}>
          {ANIMATIONS.map((a) => <option key={a} value={a}>{a || "None"}</option>)}
        </select>
      </Group>
      {element.animation && (
        <Row>
          <Group label="Duration">
            <input className="prop-input" value={element.duration} onChange={upd("duration")} placeholder="1s" />
          </Group>
          <Group label="Delay">
            <input className="prop-input" value={element.delay} onChange={upd("delay")} placeholder="0s" />
          </Group>
        </Row>
      )}

      <Divider />

      {/* ── Position (manual) ─────────────────────────────────────── */}
      <SectionTitle>Position</SectionTitle>
      <Row>
        <Group label="X">
          <input type="number" className="prop-input" value={element.x} onChange={upd("x")} />
        </Group>
        <Group label="Y">
          <input type="number" className="prop-input" value={element.y} onChange={upd("y")} />
        </Group>
      </Row>

      <Divider />

      {/* ── Layer order ───────────────────────────────────────────── */}
      <SectionTitle>Layer Order</SectionTitle>
      <LayerControls id={element.id} onLayer={onLayer} />
    </div>
  );
}
