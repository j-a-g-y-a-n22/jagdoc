import { useState, useEffect, useRef, useCallback } from "react";
import "./PreviewModal.css";

// ─── Render one editor element to a DOM-style React node ─────────────────────
function RenderEl({ el, animate }) {
  const anim = animate && el.animation ? el.animation : "";
  const cls = `pv-el${anim ? " " + anim : ""}${animate ? " pv-show" : ""}`;

  const base = {
    position: "absolute",
    left: el.x + "px",
    top:  el.y + "px",
    "--d":     el.duration || "1s",
    "--delay": el.delay    || "0s",
  };

  if (el.type === "text") {
    return (
      <div className={cls} style={{
        ...base,
        color:      el.color || "#fff",
        fontSize:   (el.size || 20) + "px",
        fontWeight: el.bold ? "bold" : "normal",
        fontFamily: el.font ? `${el.font}, sans-serif` : "inherit",
        textAlign:  el.align || "left",
        opacity:    el.opacity ?? 1,
        whiteSpace: "nowrap",
      }}>
        {el.text}
      </div>
    );
  }

  if (el.type === "circle") {
    const sz = el.size || el.width || 100;
    return (
      <div className="pv-el pv-show" style={{
        ...base,
        width:        sz + "px",
        height:       sz + "px",
        background:   el.color || el.fill || "#fff",
        borderRadius: "50%",
        filter:       "blur(60px)",
        opacity:      el.opacity ?? 1,
        "--d": undefined, "--delay": undefined,
      }} />
    );
  }

  if (el.type === "box") {
    return (
      <div className="pv-el pv-show" style={{
        ...base,
        width:        (el.width  || 220) + "px",
        height:       (el.height || 130) + "px",
        background:   el.color || "#3b82f6",
        borderRadius: "10px",
        opacity:      el.opacity ?? 1,
      }} />
    );
  }

  if (el.type === "shape") {
    return (
      <div className="pv-el pv-show" style={{
        ...base,
        width:        (el.width  || 200) + "px",
        height:       (el.height || 120) + "px",
        background:   el.fill   || "rgba(99,102,241,.3)",
        border:       `2px solid ${el.border || "#6366f1"}`,
        borderRadius: el.shape === "circle" ? "50%" : "8px",
        opacity:      el.opacity ?? 1,
      }} />
    );
  }

  if (el.type === "image") {
    return (
      <img className={cls} src={el.src} alt="" style={{
        ...base,
        width:      (el.width  || 280) + "px",
        height:     el.height ? el.height + "px" : "auto",
        objectFit:  "cover",
        borderRadius: "10px",
        opacity:    el.opacity ?? 1,
      }} />
    );
  }

  return null;
}

// ─── Single page canvas ───────────────────────────────────────────────────────
export function PageCanvas({ page, scale, animate }) {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0,
      width: "900px", height: "540px",
      background: page.background || "#111827",
      transform: `scale(${scale})`,
      transformOrigin: "0 0",
      overflow: "hidden",
    }}>
      {page.elements.map(el => (
        <RenderEl key={el.id} el={el} animate={animate} />
      ))}
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
export default function PreviewModal({ pages, onClose, autoFullscreen }) {
  const [mode, setMode]   = useState("slide");
  const [cur,  setCur]    = useState(0);
  const [fs,   setFs]     = useState(false);
  const scrollRef         = useRef(null);
  const observersRef      = useRef([]);
  const modalRef          = useRef(null);

  // Auto-fullscreen when launched via F5
  useEffect(() => {
    if (autoFullscreen && modalRef.current) {
      modalRef.current.requestFullscreen?.().catch(() => {});
    }
  }, [autoFullscreen]);

  // ── Slide: fit scale ───────────────────────────────────────────────────────
  const [slideScale, setSlideScale] = useState(1);
  const [slideTx,    setSlideTx]    = useState(0);
  const [slideTy,    setSlideTy]    = useState(0);

  const calcSlide = useCallback(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const HDR = 52, DOTS = 44;
    const stageH = H - HDR - DOTS;
    const scale = Math.min(W / 900, stageH / 540) * 0.97;
    const sw = 900 * scale, sh = 540 * scale;
    setSlideScale(scale);
    setSlideTx((W - sw) / 2);
    setSlideTy((stageH - sh) / 2);
  }, []);

  useEffect(() => {
    calcSlide();
    window.addEventListener("resize", calcSlide);
    return () => window.removeEventListener("resize", calcSlide);
  }, [calcSlide]);

  // ── Scroll mode scale ──────────────────────────────────────────────────────
  const scrollScale = Math.min((window.innerWidth * 0.96) / 900, 1);
  const pw = Math.round(900 * scrollScale);
  const ph = Math.round(540 * scrollScale);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (mode !== "slide") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault(); setCur(c => Math.min(c + 1, pages.length - 1));
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault(); setCur(c => Math.max(c - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, pages.length, onClose]);

  // ── Scroll wheel in slide mode ─────────────────────────────────────────────
  const wheelCooldown = useRef(false);
  const onWheel = (e) => {
    if (mode !== "slide") return;
    e.preventDefault();
    if (wheelCooldown.current) return;
    wheelCooldown.current = true;
    setCur(c => Math.max(0, Math.min(pages.length - 1, c + (e.deltaY > 0 ? 1 : -1))));
    setTimeout(() => { wheelCooldown.current = false; }, 600);
  };

  // ── Touch swipe in slide mode ──────────────────────────────────────────────
  const touchStart = useRef({ x: 0, y: 0 });
  const onTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd   = (e) => {
    if (mode !== "slide") return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40)
      setCur(c => Math.max(0, Math.min(pages.length - 1, c + (dx < 0 ? 1 : -1))));
  };

  // ── Fullscreen ─────────────────────────────────────────────────────────────
  const toggleFs = () => {
    if (!document.fullscreenElement)
      document.documentElement.requestFullscreen?.();
    else
      document.exitFullscreen?.();
  };
  useEffect(() => {
    const onChange = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── Scroll view IntersectionObserver for per-page animations ──────────────
  const [revealed, setRevealed] = useState({});
  useEffect(() => {
    if (mode !== "pdf" || !scrollRef.current) return;
    setRevealed({});
    const boxes = scrollRef.current.querySelectorAll(".pv-pdf-box");
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = +entry.target.dataset.idx;
          setRevealed(r => ({ ...r, [idx]: true }));
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    boxes.forEach(b => io.observe(b));
    observersRef.current = [io];
    return () => io.disconnect();
  }, [mode, pages]);

  // ── Dots ───────────────────────────────────────────────────────────────────
  const dots = pages.map((_, i) => (
    <div
      key={i}
      className={"pv-dot" + (i === cur ? " on" : "")}
      onClick={() => setCur(i)}
    />
  ));

  return (
    <div
      ref={modalRef}
      className="pv-overlay"
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="pv-hdr">
        <span className="pv-logo">jagdoc<b>.</b></span>
        <span className="pv-count">
          {mode === "slide" ? `${cur + 1} / ${pages.length}` : `${pages.length} pages`}
        </span>

        <div className="pv-mode-toggle">
          <button className={"pv-mode-btn" + (mode === "slide" ? " on" : "")} onClick={() => setMode("slide")}>
            ▦ Slides
          </button>
          <button className={"pv-mode-btn" + (mode === "pdf" ? " on" : "")} onClick={() => setMode("pdf")}>
            ☰ Scroll
          </button>
        </div>

        <button className="pv-icon-btn" onClick={toggleFs} title="Fullscreen">
          {fs ? "✕" : "⛶"}
        </button>
        <button className="pv-icon-btn pv-close" onClick={onClose} title="Close preview (Esc)">
          ✕ Close
        </button>
      </div>

      {/* ── Slide mode ─────────────────────────────────────────────────────── */}
      {mode === "slide" && (
        <>
          <div className="pv-stage">
            <button className="pv-arr pv-prev" onClick={() => setCur(c => Math.max(0, c-1))} disabled={cur === 0}>&#8249;</button>
            <div style={{
              position: "absolute", top: 0, left: 0,
              width: "900px", height: "540px",
              transform: `translate(${slideTx}px,${slideTy}px) scale(${slideScale})`,
              transformOrigin: "0 0",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 20px 80px rgba(0,0,0,0.9)",
              overflow: "hidden",
            }}>
              <PageCanvas page={pages[cur]} scale={1} animate={true} key={cur} />
            </div>
            <button className="pv-arr pv-next" onClick={() => setCur(c => Math.min(pages.length-1, c+1))} disabled={cur === pages.length-1}>&#8250;</button>
          </div>
          <div className="pv-dots">{dots}</div>
        </>
      )}

      {/* ── Scroll / PDF mode ──────────────────────────────────────────────── */}
      {mode === "pdf" && (
        <div className="pv-scroll" ref={scrollRef}>
          {pages.map((page, i) => (
            <div key={i} className="pv-pdf-wrap">
              <div
                className="pv-pdf-box"
                data-idx={i}
                style={{ width: pw + "px", height: ph + "px" }}
              >
                <PageCanvas page={page} scale={scrollScale} animate={!!revealed[i]} key={i + "-" + !!revealed[i]} />
              </div>
              <div className="pv-pdf-label">Page {i + 1} of {pages.length}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
