function highlight(text) {
  return text.split("\n").map((line, i) => {
    if (line === "PAGE" || line === "ELEMENT") {
      return <div key={i}><span className="jkw">{line}</span></div>;
    }
    const ci = line.indexOf(":");
    if (ci > -1) {
      return (
        <div key={i}>
          <span className="jprop">{line.slice(0, ci + 1)}</span>
          <span className="jval">{line.slice(ci + 1)}</span>
        </div>
      );
    }
    return <div key={i} className="jempty">{line || "\u00A0"}</div>;
  });
}

export default function JagdocPanel({ text, onClose }) {
  const copy = () => navigator.clipboard?.writeText(text);
  return (
    <div className="jagdoc-panel">
      <div className="jagdoc-panel-header">
        <span className="jagdoc-panel-title">document.jagdoc</span>
        <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={copy}>
          Copy
        </button>
        <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="jagdoc-code">{highlight(text)}</div>
    </div>
  );
}
