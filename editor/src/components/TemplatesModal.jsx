let _tid = 1;
const tid = () => `tpl_${_tid++}_${Date.now()}`;

const withIds = (elements) => elements.map(e => ({ ...e, id: tid(), animation: "", duration: "1s", delay: "0s", opacity: 1, locked: false }));

const TEMPLATES = [
  {
    name: "Title Slide",
    bg: "#111827",
    preview: ["Big Heading", "Subtitle"],
    elements: withIds([
      { type: "text", x: 80, y: 160, text: "Your Title Here", color: "#ffffff", size: 56, bold: true, font: "Inter", align: "left" },
      { type: "text", x: 80, y: 248, text: "A compelling subtitle goes right here", color: "#94a3b8", size: 24, bold: false, font: "Inter", align: "left" },
    ]),
  },
  {
    name: "Hero + Glow",
    bg: "#07070d",
    preview: ["Glow + Heading"],
    elements: withIds([
      { type: "circle", x: 180, y: 30, width: 380, height: 380, color: "#6366f1" },
      { type: "circle", x: 520, y: 80, width: 280, height: 280, color: "#8b5cf6" },
      { type: "text", x: 80, y: 170, text: "Big Idea.", color: "#ffffff", size: 68, bold: true, font: "Inter", align: "left" },
      { type: "text", x: 80, y: 265, text: "Make it unforgettable", color: "#c4b5fd", size: 24, bold: false, font: "Inter", align: "left" },
    ]),
  },
  {
    name: "Stats Row",
    bg: "#0f172a",
    preview: ["3 metric cards"],
    elements: withIds([
      { type: "text", x: 60, y: 60, text: "Our Numbers", color: "#ffffff", size: 34, bold: true, font: "Inter", align: "left" },
      { type: "box", x: 60, y: 150, width: 230, height: 130, color: "#1e293b" },
      { type: "box", x: 335, y: 150, width: 230, height: 130, color: "#1e293b" },
      { type: "box", x: 610, y: 150, width: 230, height: 130, color: "#1e293b" },
      { type: "text", x: 110, y: 175, text: "2.4M", color: "#6366f1", size: 38, bold: true, font: "Inter", align: "left" },
      { type: "text", x: 385, y: 175, text: "98%", color: "#22c55e", size: 38, bold: true, font: "Inter", align: "left" },
      { type: "text", x: 660, y: 175, text: "4.9★", color: "#f59e0b", size: 38, bold: true, font: "Inter", align: "left" },
      { type: "text", x: 110, y: 235, text: "Active Users", color: "#64748b", size: 14, bold: false, font: "Inter", align: "left" },
      { type: "text", x: 385, y: 235, text: "Uptime", color: "#64748b", size: 14, bold: false, font: "Inter", align: "left" },
      { type: "text", x: 660, y: 235, text: "Rating", color: "#64748b", size: 14, bold: false, font: "Inter", align: "left" },
    ]),
  },
  {
    name: "Quote Card",
    bg: "#111827",
    preview: ["Full-width quote"],
    elements: withIds([
      { type: "text", x: 80, y: 130, text: '"The best way to predict the future\nis to create it."', color: "#ffffff", size: 34, bold: true, font: "Inter", align: "left", wrap: true, maxWidth: 740 },
      { type: "text", x: 80, y: 330, text: "— Peter Drucker", color: "#6366f1", size: 20, bold: false, font: "Inter", align: "left" },
    ]),
  },
  {
    name: "Feature List",
    bg: "#0f172a",
    preview: ["Heading + 3 rows"],
    elements: withIds([
      { type: "text", x: 60, y: 55, text: "Key Features", color: "#ffffff", size: 36, bold: true, font: "Inter", align: "left" },
      { type: "box", x: 60, y: 145, width: 6, height: 44, color: "#6366f1" },
      { type: "text", x: 90, y: 153, text: "Lightning fast performance at scale", color: "#e2e8f0", size: 20, bold: false, font: "Inter", align: "left" },
      { type: "box", x: 60, y: 230, width: 6, height: 44, color: "#8b5cf6" },
      { type: "text", x: 90, y: 238, text: "Works on any device, any platform", color: "#e2e8f0", size: 20, bold: false, font: "Inter", align: "left" },
      { type: "box", x: 60, y: 315, width: 6, height: 44, color: "#a855f7" },
      { type: "text", x: 90, y: 323, text: "Built for teams, loved by developers", color: "#e2e8f0", size: 20, bold: false, font: "Inter", align: "left" },
    ]),
  },
  {
    name: "Two Column",
    bg: "#111827",
    preview: ["Left heading, right text"],
    elements: withIds([
      { type: "text", x: 60, y: 120, text: "Section\nTitle", color: "#ffffff", size: 44, bold: true, font: "Inter", align: "left", wrap: true, maxWidth: 320 },
      { type: "box", x: 418, y: 60, width: 2, height: 420, color: "#1e293b" },
      { type: "text", x: 456, y: 120, text: "Add your content here. This layout works great for comparing two ideas or presenting a concept with explanation on the side.", color: "#94a3b8", size: 18, bold: false, font: "Inter", align: "left", wrap: true, maxWidth: 380 },
    ]),
  },
  {
    name: "Dark Code",
    bg: "#07070d",
    preview: ["Monospace code block"],
    elements: withIds([
      { type: "box", x: 60, y: 80, width: 780, height: 360, color: "#0f172a" },
      { type: "text", x: 100, y: 118, text: "// Hello, World!", color: "#64748b", size: 16, bold: false, font: "monospace", align: "left" },
      { type: "text", x: 100, y: 156, text: "const magic = (idea) => {", color: "#e2e8f0", size: 18, bold: false, font: "monospace", align: "left" },
      { type: "text", x: 130, y: 196, text: "return idea.make('amazing');", color: "#818cf8", size: 18, bold: false, font: "monospace", align: "left" },
      { type: "text", x: 100, y: 236, text: "};", color: "#e2e8f0", size: 18, bold: false, font: "monospace", align: "left" },
    ]),
  },
  {
    name: "CTA Slide",
    bg: "#111827",
    preview: ["Call to action + button"],
    elements: withIds([
      { type: "circle", x: 600, y: 100, width: 340, height: 340, color: "#6366f1" },
      { type: "text", x: 80, y: 150, text: "Ready to get\nstarted?", color: "#ffffff", size: 46, bold: true, font: "Inter", align: "left", wrap: true, maxWidth: 460 },
      { type: "text", x: 80, y: 310, text: "Join thousands of teams already using Jagdoc", color: "#94a3b8", size: 18, bold: false, font: "Inter", align: "left" },
      { type: "box", x: 80, y: 360, width: 180, height: 52, color: "#6366f1" },
      { type: "text", x: 116, y: 376, text: "Get Started →", color: "#ffffff", size: 18, bold: true, font: "Inter", align: "left" },
    ]),
  },
];

export default function TemplatesModal({ onClose, onInsert }) {
  const uid = () => `tpl_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const insert = (tpl) => {
    const page = {
      id: uid(),
      background: tpl.bg,
      elements: tpl.elements.map(e => ({ ...e, id: uid() })),
    };
    onInsert(page);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0f172a", border: "1px solid #1e293b",
          borderRadius: 12, padding: "28px 32px", width: 760, maxHeight: "80vh",
          overflow: "hidden", display: "flex", flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Templates</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              onClick={() => insert(tpl)}
              style={{
                background: tpl.bg,
                border: "1px solid #1e293b",
                borderRadius: 8, padding: "12px 10px",
                cursor: "pointer", textAlign: "left",
                transition: "border-color 0.15s",
                aspectRatio: "16/10",
                display: "flex", flexDirection: "column",
                justifyContent: "flex-end",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#6366f1"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#1e293b"}
            >
              <div style={{ color: "#ffffff", fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{tpl.name}</div>
              <div style={{ color: "#475569", fontSize: 9 }}>{tpl.preview[0]}</div>
            </button>
          ))}
        </div>
        <div style={{ color: "#334155", fontSize: 11, marginTop: 16, textAlign: "center" }}>
          Click a template to add it as a new page
        </div>
      </div>
    </div>
  );
}
