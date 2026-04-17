import { useReducer, useEffect, useState, useRef } from "react";
import Topbar from "./components/Topbar";
import PageList from "./components/PageList";
import Canvas from "./components/Canvas";
import PropertiesPanel from "./components/PropertiesPanel";
import JagdocPanel from "./components/JagdocPanel";
import PreviewModal from "./components/PreviewModal";
import TemplatesModal from "./components/TemplatesModal";
import { PageCanvas } from "./components/PreviewModal";
import { generateJagdoc } from "./utils/generateJagdoc";
import "./App.css";

// ─── Live Preview Pane ────────────────────────────────────────────────────────
function LivePreviewPane({ page, pageIndex, total }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.4);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(([e]) => {
      const w = e.contentRect.width - 24;
      setScale(Math.min(w / 900, (e.contentRect.height - 48) / 540));
    });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const pw = Math.round(900 * scale), ph = Math.round(540 * scale);
  return (
    <div ref={ref} style={{
      width: 300, flexShrink: 0, background: "#07070d",
      borderLeft: "1px solid #1e1e2e", display: "flex",
      flexDirection: "column", alignItems: "center", padding: "12px 12px 8px",
      overflow: "hidden",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, alignSelf: "flex-start" }}>
        Live Preview — {pageIndex + 1} / {total}
      </div>
      <div style={{ position: "relative", width: pw, height: ph, overflow: "hidden", flexShrink: 0, boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.7)" }}>
        <PageCanvas page={page} scale={scale} animate={false} key={page.id} />
      </div>
      <div style={{ fontSize: 10, color: "#1e293b", marginTop: 8 }}>Updates as you edit</div>
    </div>
  );
}

// ─── ID factory ───────────────────────────────────────────────────────────────
let _id = 1;
const uid = () => `el_${_id++}_${Date.now()}`;

// ─── Element / Page factories ─────────────────────────────────────────────────
const newPage = () => ({ id: uid(), background: "#111827", elements: [] });

const newElement = (type) => {
  const base = {
    id: uid(), type, x: 120, y: 100,
    animation: "", duration: "1s", delay: "0s",
    opacity: 1, locked: false,
  };
  if (type === "text")
    return { ...base, text: "Double-click to edit", color: "#ffffff", size: 28, bold: false, font: "Inter", align: "left" };
  if (type === "shape")
    return { ...base, shape: "rect", width: 220, height: 130, fill: "#3b82f6", border: "#6366f1" };
  if (type === "image")
    return { ...base, src: "", width: 280, height: 180 };
  if (type === "circle")
    return { ...base, x: 300, y: 100, width: 260, height: 260, color: "#6366f1" };
  if (type === "box")
    return { ...base, width: 220, height: 130, color: "#3b82f6" };
  return base;
};

// ─── History helpers ──────────────────────────────────────────────────────────
const MAX_HIST = 50;
const clone = (x) => JSON.parse(JSON.stringify(x));

function pushHist(history, histIdx, pages) {
  const next = history.slice(0, histIdx + 1);
  next.push(clone(pages));
  if (next.length > MAX_HIST) next.shift();
  return { history: next, histIdx: next.length - 1 };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
const INIT_PAGES = [newPage()];
const INIT = {
  pages: INIT_PAGES,
  history: [clone(INIT_PAGES)],
  histIdx: 0,
  currentPageIndex: 0,
  selectedId: null,
  selectedIds: [],
  clipboard: null,
  jagdocOpen: false,
  snapToGrid: false,
};

function mutPage(pages, idx, fn) {
  return pages.map((p, i) => (i === idx ? fn(p) : p));
}

function reducer(state, action) {
  const { pages, history, histIdx, currentPageIndex, selectedId, selectedIds, clipboard } = state;

  const commit = (newPages) => ({ ...state, pages: newPages, ...pushHist(history, histIdx, newPages) });
  const mutCur = (fn) => commit(mutPage(pages, currentPageIndex, fn));

  switch (action.type) {

    // ── History ──────────────────────────────────────────────────────────────
    case "UNDO": {
      if (histIdx <= 0) return state;
      const i = histIdx - 1;
      return { ...state, pages: clone(history[i]), histIdx: i, selectedId: null, selectedIds: [] };
    }
    case "REDO": {
      if (histIdx >= history.length - 1) return state;
      const i = histIdx + 1;
      return { ...state, pages: clone(history[i]), histIdx: i, selectedId: null, selectedIds: [] };
    }

    // ── Selection ─────────────────────────────────────────────────────────────
    case "SELECT": {
      if (action.shift) {
        const ids = state.selectedIds.includes(action.id)
          ? state.selectedIds.filter(x => x !== action.id)
          : [...state.selectedIds, action.id];
        return { ...state, selectedIds: ids, selectedId: ids.length ? action.id : null };
      }
      return { ...state, selectedId: action.id, selectedIds: [action.id] };
    }
    case "DESELECT": return { ...state, selectedId: null, selectedIds: [] };

    // ── Pages ─────────────────────────────────────────────────────────────────
    case "SET_PAGE": return { ...state, currentPageIndex: action.index, selectedId: null, selectedIds: [] };
    case "ADD_PAGE": {
      const p = newPage();
      const np = [...pages, p];
      return { ...commit(np), currentPageIndex: np.length - 1, selectedId: null, selectedIds: [] };
    }
    case "DELETE_PAGE": {
      if (pages.length === 1) return state;
      const np = pages.filter((_, i) => i !== action.index);
      return { ...commit(np), currentPageIndex: Math.min(currentPageIndex, np.length - 1), selectedId: null, selectedIds: [] };
    }
    case "DUPLICATE_PAGE": {
      const src = pages[action.index];
      const dup = { ...clone(src), id: uid(), elements: clone(src.elements).map(e => ({ ...e, id: uid() })) };
      const np = [...pages];
      np.splice(action.index + 1, 0, dup);
      return { ...commit(np), currentPageIndex: action.index + 1, selectedId: null, selectedIds: [] };
    }
    case "REORDER_PAGE": {
      const { from, to } = action;
      if (from === to) return state;
      const np = [...pages];
      const [moved] = np.splice(from, 1);
      np.splice(to, 0, moved);
      const newCur = currentPageIndex === from ? to
        : currentPageIndex >= Math.min(from, to) && currentPageIndex <= Math.max(from, to)
          ? currentPageIndex + (from < to ? -1 : 1)
          : currentPageIndex;
      return { ...commit(np), currentPageIndex: newCur, selectedId: null, selectedIds: [] };
    }
    case "IMPORT_JAGDOC": {
      const imported = action.pages.map(p => ({ ...newPage(), background: p.background, elements: p.elements }));
      return { ...commit(imported), currentPageIndex: 0, selectedId: null, selectedIds: [] };
    }
    case "ADD_TEMPLATE_PAGE": {
      const np = [...pages, action.page];
      return { ...commit(np), currentPageIndex: np.length - 1, selectedId: null, selectedIds: [] };
    }
    case "UPDATE_BG":
      return commit(mutPage(pages, currentPageIndex, (p) => ({ ...p, background: action.color })));

    // ── Elements ──────────────────────────────────────────────────────────────
    case "ADD_ELEMENT": {
      const el = action.el || newElement(action.elementType);
      return { ...mutCur((p) => ({ ...p, elements: [...p.elements, el] })), selectedId: el.id, selectedIds: [el.id] };
    }
    case "UPDATE_ELEMENT":
      return mutCur((p) => ({
        ...p,
        elements: p.elements.map((e) => (e.id === action.id ? { ...e, ...action.changes } : e)),
      }));
    case "DELETE_ELEMENT":
      return { ...mutCur((p) => ({ ...p, elements: p.elements.filter((e) => e.id !== action.id) })), selectedId: null, selectedIds: [] };
    case "BATCH_DELETE": {
      const ids = selectedIds.length ? selectedIds : (selectedId ? [selectedId] : []);
      return { ...mutCur((p) => ({ ...p, elements: p.elements.filter((e) => !ids.includes(e.id)) })), selectedId: null, selectedIds: [] };
    }

    case "NUDGE": {
      const ids = selectedIds.length ? selectedIds : (selectedId ? [selectedId] : []);
      if (!ids.length) return state;
      return mutCur((p) => ({
        ...p,
        elements: p.elements.map((e) => ids.includes(e.id) ? { ...e, x: e.x + action.dx, y: e.y + action.dy } : e),
      }));
    }

    case "TOGGLE_SNAP": return { ...state, snapToGrid: !state.snapToGrid };

    case "DUPLICATE": {
      const el = pages[currentPageIndex]?.elements.find((e) => e.id === selectedId);
      if (!el) return state;
      const dup = { ...clone(el), id: uid(), x: el.x + 20, y: el.y + 20 };
      return { ...mutCur((p) => ({ ...p, elements: [...p.elements, dup] })), selectedId: dup.id, selectedIds: [dup.id] };
    }
    case "COPY": {
      const el = pages[currentPageIndex]?.elements.find((e) => e.id === selectedId);
      return el ? { ...state, clipboard: clone(el) } : state;
    }
    case "PASTE": {
      if (!clipboard) return state;
      const el = { ...clone(clipboard), id: uid(), x: clipboard.x + 20, y: clipboard.y + 20 };
      return { ...mutCur((p) => ({ ...p, elements: [...p.elements, el] })), selectedId: el.id, selectedIds: [el.id] };
    }

    // ── Layer order ───────────────────────────────────────────────────────────
    case "LAYER": {
      const els = [...(pages[currentPageIndex]?.elements ?? [])];
      const i = els.findIndex((e) => e.id === action.id);
      if (i === -1) return state;
      if (action.dir === "front") els.push(els.splice(i, 1)[0]);
      else if (action.dir === "back") els.unshift(els.splice(i, 1)[0]);
      else if (action.dir === "up" && i < els.length - 1) [els[i], els[i + 1]] = [els[i + 1], els[i]];
      else if (action.dir === "down" && i > 0) [els[i], els[i - 1]] = [els[i - 1], els[i]];
      return commit(mutPage(pages, currentPageIndex, (p) => ({ ...p, elements: els })));
    }

    // ── Align to canvas ───────────────────────────────────────────────────────
    case "ALIGN": {
      const el = pages[currentPageIndex]?.elements.find((e) => e.id === selectedId);
      if (!el) return state;
      const W = 900, H = 540;
      const w = Number(el.width) || 100, h = Number(el.height) || 40;
      const changes = {};
      if (action.dir === "left")   changes.x = 0;
      if (action.dir === "center") changes.x = Math.round((W - w) / 2);
      if (action.dir === "right")  changes.x = W - w;
      if (action.dir === "top")    changes.y = 0;
      if (action.dir === "middle") changes.y = Math.round((H - h) / 2);
      if (action.dir === "bottom") changes.y = H - h;
      return mutCur((p) => ({
        ...p,
        elements: p.elements.map((e) => (e.id === selectedId ? { ...e, ...changes } : e)),
      }));
    }

    case "TOGGLE_JAGDOC": return { ...state, jagdocOpen: !state.jagdocOpen };

    default: return state;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const { pages, history, histIdx, currentPageIndex, selectedId, selectedIds, clipboard, jagdocOpen, snapToGrid } = state;

  const currentPage = pages[currentPageIndex] ?? pages[0];
  const selectedEl = currentPage?.elements.find((e) => e.id === selectedId) ?? null;
  const canUndo = histIdx > 0;
  const canRedo = histIdx < history.length - 1;

  const [livePreview, setLivePreview] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const tag = document.activeElement?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (ctrl && e.key === "z" && !e.shiftKey) { e.preventDefault(); dispatch({ type: "UNDO" }); }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); dispatch({ type: "REDO" }); }
      if (ctrl && e.key === "d") { e.preventDefault(); dispatch({ type: "DUPLICATE" }); }
      if (ctrl && e.key === "c" && !typing) dispatch({ type: "COPY" });
      if (ctrl && e.key === "v" && !typing) dispatch({ type: "PASTE" });

      if (e.key === "Delete" && !typing) {
        if (selectedIds.length > 1) dispatch({ type: "BATCH_DELETE" });
        else if (selectedId) dispatch({ type: "DELETE_ELEMENT", id: selectedId });
      }

      // Arrow nudge
      if (!typing && (selectedId || selectedIds.length)) {
        const step = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowLeft")  { e.preventDefault(); dispatch({ type: "NUDGE", dx: -step, dy: 0 }); }
        if (e.key === "ArrowRight") { e.preventDefault(); dispatch({ type: "NUDGE", dx:  step, dy: 0 }); }
        if (e.key === "ArrowUp")    { e.preventDefault(); dispatch({ type: "NUDGE", dx: 0, dy: -step }); }
        if (e.key === "ArrowDown")  { e.preventDefault(); dispatch({ type: "NUDGE", dx: 0, dy:  step }); }
      }

      // F5 — presentation mode
      if (e.key === "F5") { e.preventDefault(); setPreviewOpen(true); setPreviewFullscreen(true); }

      if (e.key === "Escape" && !previewOpen) dispatch({ type: "DESELECT" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selectedIds, previewOpen]);

  // ── Import .jagdoc parser ─────────────────────────────────────────────────
  function importJagdoc(text) {
    const pages = []; let page = null, el = null;
    const flushEl = () => { if (el && page) page.elements.push(el); el = null; };
    const hasContent = e => e && ["text","x","y","src","width","height","fill","shape"].some(k => k in e);

    for (const raw of text.split("\n")) {
      const line = raw.trim(); if (!line) continue;
      if (line === "PAGE") { flushEl(); if (page) pages.push(page); page = { background: "#111827", elements: [] }; continue; }
      if (line === "ELEMENT") { flushEl(); el = { type: "text" }; continue; }
      const ci = line.indexOf(":"); if (ci < 0) continue;
      const k = line.slice(0, ci).trim().toUpperCase();
      const v = line.slice(ci + 1).trim();

      if (k === "BACKGROUND" && page) { page.background = v; continue; }
      if (k === "TYPE") {
        if (!el || hasContent(el)) { flushEl(); el = { type: v.toLowerCase() }; }
        else el.type = v.toLowerCase();
        continue;
      }
      if (!el) continue;
      const map = { TEXT:"text",X:"x",Y:"y",SIZE:"size",COLOR:"color",BOLD:"bold",
        FONT:"font",ALIGN:"align",ANIMATION:"animation",DURATION:"duration",DELAY:"delay",
        OPACITY:"opacity",WIDTH:"width",HEIGHT:"height",FILL:"fill",BORDER:"border",
        SHAPE:"shape",SRC:"src",WRAP:"wrap" };
      const ek = map[k];
      if (!ek) continue;
      if (["x","y","size","width","height","opacity"].includes(ek)) el[ek] = parseFloat(v) || 0;
      else if (ek === "bold" || ek === "wrap") el[ek] = v === "true";
      else el[ek] = v;
    }
    flushEl(); if (page) pages.push(page);

    return pages.map(p => ({
      ...newPage(),
      background: p.background,
      elements: p.elements.map(e => {
        const base = { id: uid(), x: e.x||0, y: e.y||0, animation: e.animation||"", duration: e.duration||"1s", delay: e.delay||"0s", opacity: e.opacity??1, locked: false };
        const t = e.type;
        if (t === "text") return { ...base, type:"text", text: e.text||"", color: e.color||"#ffffff", size: e.size||20, bold: e.bold||false, font: e.font||"Inter", align: e.align||"left", wrap: e.wrap||false };
        if (t === "shape") return { ...base, type:"shape", shape: e.shape||"rect", width: e.width||220, height: e.height||130, fill: e.fill||"#3b82f6", border: e.border||"#6366f1" };
        if (t === "circle") return { ...base, type:"circle", width: e.size||e.width||200, height: e.size||e.width||200, color: e.color||"#6366f1" };
        if (t === "box") return { ...base, type:"box", width: e.width||220, height: e.height||130, color: e.color||"#3b82f6" };
        if (t === "image") return { ...base, type:"image", src: e.src||"", width: e.width||280, height: e.height||180 };
        return { ...base, type: t };
      }),
    }));
  }

  const download = () => {
    const text = generateJagdoc(pages);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "document.jagdoc"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      {previewOpen && (
        <PreviewModal
          pages={pages}
          autoFullscreen={previewFullscreen}
          onClose={() => { setPreviewOpen(false); setPreviewFullscreen(false); }}
        />
      )}
      {templatesOpen && (
        <TemplatesModal
          onClose={() => setTemplatesOpen(false)}
          onInsert={(page) => dispatch({ type: "ADD_TEMPLATE_PAGE", page })}
        />
      )}
      <Topbar
        onAddText={()   => dispatch({ type: "ADD_ELEMENT", elementType: "text" })}
        onAddShape={()  => dispatch({ type: "ADD_ELEMENT", elementType: "shape" })}
        onAddCircle={()  => dispatch({ type: "ADD_ELEMENT", elementType: "circle" })}
        onAddBox={()    => dispatch({ type: "ADD_ELEMENT", elementType: "box" })}
        onAddImage={()  => dispatch({ type: "ADD_ELEMENT", elementType: "image" })}
        onToggleJagdoc={() => dispatch({ type: "TOGGLE_JAGDOC" })}
        onDownload={download}
        jagdocOpen={jagdocOpen}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => dispatch({ type: "UNDO" })}
        onRedo={() => dispatch({ type: "REDO" })}
        hasSelection={!!selectedEl}
        onAlign={(dir) => dispatch({ type: "ALIGN", dir })}
        onPreview={() => { setPreviewOpen(true); setPreviewFullscreen(false); }}
        livePreview={livePreview}
        onToggleLivePreview={() => setLivePreview(v => !v)}
        onImport={(text) => dispatch({ type: "IMPORT_JAGDOC", pages: importJagdoc(text) })}
        snapToGrid={snapToGrid}
        onToggleSnap={() => dispatch({ type: "TOGGLE_SNAP" })}
        onTemplates={() => setTemplatesOpen(true)}
      />
      <div className="workspace">
        <PageList
          pages={pages}
          currentIndex={currentPageIndex}
          onSelect={(i) => dispatch({ type: "SET_PAGE", index: i })}
          onAdd={() => dispatch({ type: "ADD_PAGE" })}
          onDelete={(i) => dispatch({ type: "DELETE_PAGE", index: i })}
          onReorder={(from, to) => dispatch({ type: "REORDER_PAGE", from, to })}
          onDuplicate={(i) => dispatch({ type: "DUPLICATE_PAGE", index: i })}
        />
        <div className="center-area">
          <div style={{ display:"flex", flex:1, overflow:"hidden", minHeight:0 }}>
            <Canvas
              page={currentPage}
              selectedId={selectedId}
              selectedIds={selectedIds}
              snapToGrid={snapToGrid}
              onSelect={(id, shift) => dispatch({ type: "SELECT", id, shift })}
              onUpdate={(id, changes) => dispatch({ type: "UPDATE_ELEMENT", id, changes })}
              onDeselect={() => dispatch({ type: "DESELECT" })}
            />
            {livePreview && (
              <LivePreviewPane page={currentPage} pageIndex={currentPageIndex} total={pages.length} />
            )}
          </div>
          {jagdocOpen && (
            <JagdocPanel
              text={generateJagdoc(pages)}
              onClose={() => dispatch({ type: "TOGGLE_JAGDOC" })}
            />
          )}
        </div>
        <PropertiesPanel
          element={selectedEl}
          selectedCount={selectedIds.length}
          page={currentPage}
          onUpdate={(id, changes) => dispatch({ type: "UPDATE_ELEMENT", id, changes })}
          onDelete={(id) => dispatch({ type: "DELETE_ELEMENT", id })}
          onBatchDelete={() => dispatch({ type: "BATCH_DELETE" })}
          onBackground={(color) => dispatch({ type: "UPDATE_BG", color })}
          onDuplicate={() => dispatch({ type: "DUPLICATE" })}
          onLayer={(id, dir) => dispatch({ type: "LAYER", id, dir })}
          clipboard={clipboard}
          onPaste={() => dispatch({ type: "PASTE" })}
        />
      </div>
    </div>
  );
}
