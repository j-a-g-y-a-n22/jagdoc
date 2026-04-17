import { useRef, useState } from "react";

export default function PageList({ pages, currentIndex, onSelect, onAdd, onDelete, onReorder, onDuplicate }) {
  const dragFrom = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  return (
    <div className="page-list">
      <div className="page-list-title">Pages</div>
      {pages.map((page, i) => (
        <div
          key={page.id}
          draggable
          onDragStart={() => { dragFrom.current = i; }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(null);
            if (dragFrom.current !== null && dragFrom.current !== i) {
              onReorder(dragFrom.current, i);
            }
            dragFrom.current = null;
          }}
          onDragEnd={() => { dragFrom.current = null; setDragOver(null); }}
          className={`page-thumb ${i === currentIndex ? "active" : ""}`}
          style={{
            outline: dragOver === i ? "2px dashed #6366f1" : undefined,
            opacity: dragFrom.current === i ? 0.4 : 1,
          }}
          onClick={() => onSelect(i)}
        >
          <div className="page-thumb-bg" style={{ background: page.background }}>
            <span className="page-thumb-num">{i + 1}</span>
          </div>
          <button
            className="page-thumb-dup"
            onClick={(e) => { e.stopPropagation(); onDuplicate(i); }}
            title="Duplicate page"
          >⧉</button>
          {pages.length > 1 && (
            <button
              className="page-thumb-delete"
              onClick={(e) => { e.stopPropagation(); onDelete(i); }}
            >×</button>
          )}
        </div>
      ))}
      <button className="page-add-btn" onClick={onAdd}>+</button>
    </div>
  );
}
