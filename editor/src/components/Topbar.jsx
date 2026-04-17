export default function Topbar({
  onAddText, onAddShape, onAddImage, onAddCircle, onAddBox,
  onToggleJagdoc, onDownload, jagdocOpen,
  canUndo, canRedo, onUndo, onRedo,
  hasSelection, onAlign, onPreview,
  livePreview, onToggleLivePreview, onImport,
  snapToGrid, onToggleSnap, onTemplates,
}) {
  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onImport(ev.target.result);
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="topbar">
      <div className="topbar-logo">jagdoc<span>.</span></div>
      <div className="topbar-divider" />

      {/* ── Add elements ── */}
      <button className="btn btn-ghost" onClick={onAddText}><b>T</b>&nbsp;Text</button>
      <button className="btn btn-ghost" onClick={onAddShape}>◻&nbsp;Shape</button>
      <button className="btn btn-ghost" onClick={onAddCircle}>●&nbsp;Glow</button>
      <button className="btn btn-ghost" onClick={onAddBox}>▬&nbsp;Box</button>
      <button className="btn btn-ghost" onClick={onAddImage}>⬚&nbsp;Image</button>

      <div className="topbar-divider" />

      {/* ── History ── */}
      <button className="btn btn-ghost" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        ↩&nbsp;Undo
      </button>
      <button className="btn btn-ghost" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        ↪&nbsp;Redo
      </button>

      {/* ── Align (shown only when an element is selected) ── */}
      {hasSelection && (
        <>
          <div className="topbar-divider" />
          <div className="align-group" title="Align to canvas">
            <button className="btn btn-ghost icon-only" title="Align left edge"   onClick={() => onAlign("left")}>⊢</button>
            <button className="btn btn-ghost icon-only" title="Center horizontal" onClick={() => onAlign("center")}>⟺</button>
            <button className="btn btn-ghost icon-only" title="Align right edge"  onClick={() => onAlign("right")}>⊣</button>
            <div className="align-sep" />
            <button className="btn btn-ghost icon-only" title="Align top edge"    onClick={() => onAlign("top")}>⊤</button>
            <button className="btn btn-ghost icon-only" title="Center vertical"   onClick={() => onAlign("middle")}>⊕</button>
            <button className="btn btn-ghost icon-only" title="Align bottom edge" onClick={() => onAlign("bottom")}>⊥</button>
          </div>
        </>
      )}

      <div className="topbar-divider" />
      <button
        className={`btn ${snapToGrid ? "btn-primary" : "btn-ghost"}`}
        onClick={onToggleSnap}
        title="Snap to 10px grid (toggle)"
      >
        ⊞&nbsp;Snap
      </button>
      <button className="btn btn-ghost" onClick={onTemplates} title="Insert a pre-built template page">
        ▦&nbsp;Templates
      </button>

      <div className="topbar-spacer" />

      <button
        className={`btn ${jagdocOpen ? "btn-primary" : "btn-secondary"}`}
        onClick={onToggleJagdoc}
      >
        {"</>"}&nbsp;.jagdoc
      </button>
      <label className="btn btn-secondary" style={{ cursor:"pointer" }}>
        ↑&nbsp;Import
        <input type="file" accept=".jagdoc,text/plain" hidden onChange={handleImport} />
      </label>
      <button className={`btn ${livePreview ? "btn-primary" : "btn-secondary"}`} onClick={onToggleLivePreview} title="Toggle live preview panel">
        {livePreview ? "◧ Live" : "◧ Live"}
      </button>
      <button className="btn btn-secondary" onClick={onPreview}>▶&nbsp;Preview</button>
      <button className="btn btn-primary" onClick={onDownload}>↓&nbsp;Export</button>
    </div>
  );
}
