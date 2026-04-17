import { useState } from "react";

// Corner resize handles — only shown for shape and image
const DIRS = ["nw", "ne", "sw", "se"];

function resizeStyle(dir) {
  const s = {
    position: "absolute", width: 10, height: 10,
    background: "#6366f1", border: "2px solid #fff",
    borderRadius: 2, zIndex: 10,
    cursor: `${dir}-resize`,
  };
  if (dir.includes("n")) s.top = -5; else s.bottom = -5;
  if (dir.includes("w")) s.left = -5; else s.right = -5;
  return s;
}

function ResizeHandles({ onResizeStart }) {
  return DIRS.map((dir) => (
    <div
      key={dir}
      style={resizeStyle(dir)}
      onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, dir); }}
    />
  ));
}

export default function ElementNode({ el, selected, inMultiSelect, onMouseDown, onResizeStart, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const showHandles = selected && (el.type === "shape" || el.type === "image" || el.type === "circle" || el.type === "box");

  const shell = {
    position: "absolute",
    left: el.x, top: el.y,
    cursor: el.locked ? "not-allowed" : "move",
    userSelect: "none",
    opacity: el.opacity ?? 1,
    outline: selected ? "2px solid #6366f1" : inMultiSelect ? "2px solid rgba(99,102,241,0.5)" : "2px solid transparent",
    outlineOffset: 3,
    borderRadius: 4,
  };

  // ── Text ────────────────────────────────────────────────────────────────────
  if (el.type === "text") {
    return (
      <div
        style={{
          ...shell,
          color: el.color,
          fontSize: el.size,
          fontWeight: el.bold ? "bold" : "normal",
          fontFamily: `${el.font || "Inter"}, sans-serif`,
          textAlign: el.align || "left",
          padding: "4px 8px",
          whiteSpace: el.wrap ? "pre-wrap" : (editing ? "normal" : "nowrap"),
          maxWidth: el.wrap ? (el.maxWidth || 400) : undefined,
          wordBreak: el.wrap ? "break-word" : undefined,
          minWidth: 40,
        }}
        onMouseDown={onMouseDown}
        onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
      >
        {editing ? (
          <input
            autoFocus
            defaultValue={el.text}
            onBlur={(e) => { onUpdate({ text: e.target.value }); setEditing(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.target.blur();
              if (e.key === "Escape") setEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: "transparent", border: "none", outline: "none",
              color: "inherit", fontSize: "inherit", fontWeight: "inherit",
              fontFamily: "inherit", textAlign: "inherit", minWidth: 80,
            }}
          />
        ) : el.text}
      </div>
    );
  }

  // ── Shape ───────────────────────────────────────────────────────────────────
  if (el.type === "shape") {
    return (
      <div
        style={{
          ...shell,
          width: el.width || 220, height: el.height || 130,
          background: el.fill || "#3b82f6",
          border: `2px solid ${el.border || "#6366f1"}`,
          borderRadius: el.shape === "circle" ? "50%" : 8,
        }}
        onMouseDown={onMouseDown}
      >
        {showHandles && <ResizeHandles onResizeStart={onResizeStart} />}
      </div>
    );
  }

  // ── Image ───────────────────────────────────────────────────────────────────
  if (el.type === "image") {
    return (
      <div
        style={{
          ...shell,
          width: el.width || 280, height: el.height || 180,
          background: "#1e293b",
          border: "2px dashed #334155",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}
        onMouseDown={onMouseDown}
      >
        {el.src ? (
          <img
            src={el.src} alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
          />
        ) : (
          <span style={{ color: "#475569", fontSize: 12, textAlign: "center", padding: "0 12px" }}>
            Upload image in the panel →
          </span>
        )}
        {showHandles && <ResizeHandles onResizeStart={onResizeStart} />}
      </div>
    );
  }

  // ── Glow circle ─────────────────────────────────────────────────────────────
  if (el.type === "circle") {
    const sz = el.width || 200;
    return (
      <div
        style={{
          ...shell,
          width: sz, height: sz,
          background: el.color || "#6366f1",
          borderRadius: "50%",
          filter: "blur(40px)",
          outline: selected ? "2px solid rgba(99,102,241,0.6)" : "2px solid transparent",
        }}
        onMouseDown={onMouseDown}
      >
        {showHandles && <ResizeHandles onResizeStart={onResizeStart} />}
      </div>
    );
  }

  // ── Box ─────────────────────────────────────────────────────────────────────
  if (el.type === "box") {
    return (
      <div
        style={{
          ...shell,
          width: el.width || 220, height: el.height || 130,
          background: el.color || "#3b82f6",
          borderRadius: 10,
        }}
        onMouseDown={onMouseDown}
      >
        {showHandles && <ResizeHandles onResizeStart={onResizeStart} />}
      </div>
    );
  }

  return null;
}
