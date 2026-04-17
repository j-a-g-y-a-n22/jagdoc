import { useRef, useEffect } from "react";
import ElementNode from "./ElementNode";

export default function Canvas({ page, selectedId, selectedIds, onSelect, onUpdate, onDeselect, snapToGrid }) {
  const dragging = useRef(null); // { ids, startX, startY, origPositions: {id:{x,y}}, moved }
  const resizing = useRef(null); // { id, dir, startX, startY, origX, origY, origW, origH, isCircle }
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  const snapToGridRef = useRef(snapToGrid);
  useEffect(() => { snapToGridRef.current = snapToGrid; }, [snapToGrid]);

  const snap = (v) => snapToGridRef.current ? Math.round(v / 10) * 10 : Math.round(v);

  useEffect(() => {
    const onMove = (e) => {
      // ── Resize ──────────────────────────────────────────────────────────────
      if (resizing.current) {
        const r = resizing.current;
        const dx = e.clientX - r.startX;
        const dy = e.clientY - r.startY;
        let { origX: x, origY: y, origW: w, origH: h } = r;

        if (r.dir.includes("e")) w = Math.max(30, w + dx);
        if (r.dir.includes("s")) h = Math.max(30, h + dy);
        if (r.dir.includes("w")) { const nw = Math.max(30, w - dx); x = r.origX + (w - nw); w = nw; }
        if (r.dir.includes("n")) { const nh = Math.max(30, h - dy); y = r.origY + (h - nh); h = nh; }

        if (r.isCircle) {
          const sz = Math.round(Math.max(w, h));
          onUpdateRef.current(r.id, { x: Math.round(x), y: Math.round(y), width: sz, height: sz });
        } else {
          onUpdateRef.current(r.id, { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) });
        }
        return;
      }

      // ── Drag ────────────────────────────────────────────────────────────────
      if (dragging.current) {
        const d = dragging.current;
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
        if (d.moved) {
          const s = snapToGridRef.current;
          for (const id of d.ids) {
            const orig = d.origPositions[id];
            if (!orig) continue;
            const nx = s ? Math.round((orig.x + dx) / 10) * 10 : Math.round(orig.x + dx);
            const ny = s ? Math.round((orig.y + dy) / 10) * 10 : Math.round(orig.y + dy);
            onUpdateRef.current(id, { x: nx, y: ny });
          }
        }
      }
    };

    const onUp = () => {
      dragging.current = null;
      resizing.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);

  const startDrag = (e, el) => {
    if (el.locked) return;
    e.stopPropagation();

    const currentIds = selectedIdsRef.current;
    const isInSelection = currentIds.includes(el.id);

    // Determine selection change
    if (e.shiftKey) {
      onSelect(el.id, true);
    } else if (!isInSelection) {
      onSelect(el.id, false);
    }

    // Which elements to drag
    const dragIds = isInSelection && !e.shiftKey && currentIds.length > 1
      ? currentIds
      : e.shiftKey
        ? [...new Set([...currentIds, el.id])]
        : [el.id];

    // Capture original positions
    const origPositions = {};
    for (const id of dragIds) {
      const elem = page.elements.find((el2) => el2.id === id);
      if (elem) origPositions[id] = { x: elem.x, y: elem.y };
    }

    dragging.current = {
      ids: dragIds,
      startX: e.clientX,
      startY: e.clientY,
      origPositions,
      moved: false,
    };
  };

  const startResize = (e, el, dir) => {
    e.stopPropagation();
    const origW = Number(el.width) || 200;
    const origH = el.type === "circle" ? origW : (Number(el.height) || 120);
    resizing.current = {
      id: el.id, dir, isCircle: el.type === "circle",
      startX: e.clientX, startY: e.clientY,
      origX: el.x, origY: el.y, origW, origH,
    };
  };

  return (
    <div className="canvas-wrapper">
      {snapToGrid && (
        <div style={{
          position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)",
          background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)",
          color: "#818cf8", fontSize: 10, padding: "2px 8px", borderRadius: 4,
          pointerEvents: "none", zIndex: 20, letterSpacing: "0.05em",
        }}>
          SNAP 10px
        </div>
      )}
      <div
        className="canvas"
        style={{ width: 900, height: 540, background: page.background, position: "relative" }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onDeselect();
        }}
      >
        {page.elements.map((el) => (
          <ElementNode
            key={el.id}
            el={el}
            selected={el.id === selectedId}
            inMultiSelect={selectedIds.includes(el.id) && el.id !== selectedId}
            onMouseDown={(e) => startDrag(e, el)}
            onResizeStart={(e, dir) => startResize(e, el, dir)}
            onUpdate={(changes) => onUpdate(el.id, changes)}
          />
        ))}
      </div>
    </div>
  );
}
