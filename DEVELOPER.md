# jagdoc — Developer Reference

Deep technical documentation of the parser, renderer, animation system, editor architecture, and how to extend the format.

---

## Table of Contents

1. [Parser](#1-parser)
2. [DOM Renderer — viewer.html](#2-dom-renderer--viewerhtml)
3. [DOM Renderer — React client](#3-dom-renderer--react-client)
4. [Animation System](#4-animation-system)
5. [Canvas Scaling](#5-canvas-scaling)
6. [Editor Architecture](#6-editor-architecture)
7. [State Management & Undo/Redo](#7-state-management--undoredo)
8. [Drag, Resize & Selection](#8-drag-resize--selection)
9. [generateJagdoc — Serializer](#9-generatejagdoc--serializer)
10. [Preview Modal](#10-preview-modal)
11. [Adding a New Element Type](#11-adding-a-new-element-type)
12. [File Format Grammar](#12-file-format-grammar)

---

## 1. Parser

**Location:** `viewer.html` (inline), `client/src/App.jsx`

The parser converts raw `.jagdoc` text into an array of page objects.

### Output shape

```js
[
  {
    bg: "#111827",
    elements: [
      { TYPE: "text", TEXT: "Hello", X: "60", Y: "80", COLOR: "#fff", ... },
      { TYPE: "circle", X: "400", Y: "100", SIZE: "300", COLOR: "#6600ff" },
    ]
  },
  // ... more pages
]
```

### Algorithm

```
for each line:
  if "PAGE"     → flush current element, push current page, start new page
  if "ELEMENT"  → flush current element, start new element (editor format)
  if "KEY: VAL" → dispatch:
      BACKGROUND → set on current page
      TYPE       → start new element OR set type on existing element
      anything   → set property on current element
flush last element + page
```

### The `elHasContent` disambiguation

The format has two variants:

**Old format (viewer files)** — `TYPE:` acts as element separator:
```
TYPE: text
TEXT: Hello
X: 60
TYPE: circle       ← starts NEW element
X: 400
```

**Editor format** — `ELEMENT` keyword separates elements, `TYPE:` is just a property:
```
ELEMENT
TYPE: text
TEXT: Hello
X: 60
ELEMENT            ← starts new element
TYPE: circle
X: 400
```

To handle both in one pass, the parser uses `elHasContent(el)`:

```js
function elHasContent(el) {
  return el && ["TEXT","X","Y","SRC","WIDTH","HEIGHT","FILL","SHAPE"]
    .some(k => k in el);
}

// When TYPE: is encountered:
if (!el || elHasContent(el)) {
  flush(); el = { TYPE: value };  // TYPE starts a new element
} else {
  el.TYPE = value;                // TYPE is just a property update
}
```

**Why this works:** An element freshly created by `ELEMENT` keyword has no content keys yet, so `elHasContent` returns false and `TYPE:` is treated as a property. An element already populated with content (X, Y, TEXT, etc.) causes `elHasContent` to return true, so `TYPE:` starts a new element.

---

## 2. DOM Renderer — viewer.html

**Location:** `viewer.html`, functions `build()` and `show()`

### `build(el)` → DOM node

Converts a parsed element object into a real DOM node. Each type has its own branch:

```
text   → <div class="el [animation]">text content</div>
circle → <div class="el"> with border-radius:50% + filter:blur(60px)
box    → <div class="el"> with border-radius:10px, solid background
shape  → <div class="el"> with optional border + 50% radius if circle
image  → <img class="el [animation]">
```

CSS custom properties `--d` and `--delay` are set on each element to drive animation timing:

```js
dom.style.setProperty('--d', el.DURATION || '1s');
dom.style.setProperty('--delay', el.DELAY || '0s');
```

### `show(i)` — Page transition

```js
function show(i) {
  canvas.style.background = page.bg;
  canvas.innerHTML = '';                         // clear previous page
  page.elements.forEach(el => canvas.appendChild(build(el)));

  // Double rAF: wait for browser to paint before triggering animations
  requestAnimationFrame(() => requestAnimationFrame(() => {
    canvas.querySelectorAll('.el').forEach(el => el.classList.add('show'));
  }));
}
```

The double `requestAnimationFrame` is critical — a single rAF fires before the browser has committed the new DOM to the render tree, so animations wouldn't trigger. Two rAFs guarantee the browser has painted at least one frame with `opacity: 0` before `show` class adds the animation.

---

## 3. DOM Renderer — React client

**Location:** `client/src/App.jsx`, `renderers` object

Same logic as viewer.html but expressed as React components:

```jsx
const renderers = {
  text:   (el, i) => <div key={i} className={`element ${el.ANIMATION}`} style={...}>{el.TEXT}</div>,
  circle: (el, i) => <div key={i} className="element" style={{...filter:"blur(60px)"}}/>,
  box:    (el, i) => <div key={i} className="element" style={{...borderRadius:"10px"}}/>,
  shape:  (el, i) => <div key={i} className="element" style={{...border:"2px solid"}}/>,
  image:  (el, i) => <img key={i} className={`element ${el.ANIMATION}`} src={el.SRC}/>,
};
```

Animations are triggered by an `IntersectionObserver` that watches `.element` nodes:

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "none";
    }
  });
}, { threshold: 0.2 });
```

---

## 4. Animation System

### CSS architecture

Elements start invisible:
```css
.el { position: absolute; opacity: 0; }
```

Adding `.show` reveals them — either with a plain transition or a keyframe animation:
```css
.el.show                { opacity: 1; transition: opacity 0.5s ease 0.05s; }
.el.fade-in.show        { animation: aFade      var(--d,1s) var(--delay,0s) both; }
.el.slide-left.show     { animation: aSlideLeft  var(--d,1s) var(--delay,0s) both; }
.el.slide-right.show    { animation: aSlideRight var(--d,1s) var(--delay,0s) both; }
.el.slide-up.show       { animation: aSlideUp    var(--d,1s) var(--delay,0s) both; }
.el.zoom-in.show        { animation: aZoom       var(--d,1s) var(--delay,0s) both; }
```

`animation-fill-mode: both` means the element holds its final state after animation completes, and holds its initial state (`opacity: 0`) during the delay period — so elements with a `DELAY` stay invisible until their cue.

### Keyframes

```css
@keyframes aFade      { from{opacity:0;transform:translateY(28px)}  to{opacity:1;transform:none} }
@keyframes aSlideLeft  { from{opacity:0;transform:translateX(70px)}  to{opacity:1;transform:none} }
@keyframes aSlideRight { from{opacity:0;transform:translateX(-70px)} to{opacity:1;transform:none} }
@keyframes aSlideUp    { from{opacity:0;transform:translateY(55px)}  to{opacity:1;transform:none} }
@keyframes aZoom       { from{opacity:0;transform:scale(0.55)}       to{opacity:1;transform:none} }
```

All animations go to `transform: none` so they don't conflict with the element's positioned layout.

### Scroll mode — IntersectionObserver

In PDF/scroll mode, each page is observed separately. When a `.pdf-page-box` enters the viewport, its inner elements get `.show` added:

```js
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      revealEls(entry.target.querySelector('.pdf-page-inner'));
      io.unobserve(entry.target); // fire once per page
    }
  });
}, { threshold: 0.1 });
```

---

## 5. Canvas Scaling

**Problem:** The jagdoc canvas is always 900×540px (16:9). Screens vary from 375px wide phones to 4K monitors.

**Solution:** CSS `transform: translate + scale` applied by JS after measuring the viewport.

```js
function fit() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const HDR = 50, DOTS = 42;          // reserved pixels for chrome
  const stageH = H - HDR - DOTS;

  // tightest fit that preserves aspect ratio
  const scale = Math.min(W / 900, stageH / 540) * 0.97;

  const sw = 900 * scale;             // scaled canvas width
  const sh = 540 * scale;             // scaled canvas height
  const tx = (W - sw) / 2;           // center horizontally
  const ty = (stageH - sh) / 2;      // center vertically

  canvas.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
}
```

`transform-origin: 0 0` on `#canvas` means the transform applies from the top-left corner, which matches the `translate()` math.

**Why `window.innerWidth` and not container dimensions?**  
The viewer header uses `display: flex` — reading `.clientWidth` before the browser commits layout returns 0. `window.innerWidth` is always correct regardless of layout state.

**Why called inside `requestAnimationFrame`?**  
After setting `viewer.style.display = 'flex'`, the browser hasn't painted yet. `fit()` must run after at least one layout pass.

### PDF mode scaling

Each page in scroll mode scales to fit screen width:

```js
const scale = Math.min((window.innerWidth * 0.96) / 900, 1);
const pw = Math.round(900 * scale);   // visual width
const ph = Math.round(540 * scale);   // visual height

// Outer box takes up correct space in document flow
box.style.width = pw + 'px';
box.style.height = ph + 'px';

// Inner 900×540 canvas scaled down via transform
inner.style.transform = `scale(${scale})`;
inner.style.transformOrigin = '0 0';
```

The outer box has `overflow: hidden` — so the inner canvas (which is 900px wide but scaled) gets clipped to the visual dimensions correctly.

---

## 6. Editor Architecture

**Location:** `editor/src/`

### Component tree

```
App.jsx
├── PreviewModal.jsx        (fullscreen overlay, conditional)
├── Topbar.jsx              (add elements, undo/redo, align, preview, export)
├── workspace
│   ├── PageList.jsx        (left sidebar — page thumbnails)
│   ├── center-area
│   │   ├── Canvas.jsx      (900×540 editing canvas)
│   │   │   └── ElementNode.jsx  (per-element: drag, resize, inline edit)
│   │   └── JagdocPanel.jsx      (bottom — live .jagdoc source code)
│   └── PropertiesPanel.jsx (right sidebar — element / page properties)
```

### Data model

**Page:**
```js
{
  id: "el_1_1700000000000",
  background: "#111827",
  elements: [ /* Element[] */ ]
}
```

**Element (text):**
```js
{
  id: "el_2_1700000000001",
  type: "text",
  x: 120, y: 100,
  text: "Hello", color: "#ffffff", size: 28,
  bold: false, font: "Inter", align: "left",
  animation: "fade-in", duration: "1s", delay: "0s",
  opacity: 1, locked: false
}
```

**Element (circle):**
```js
{ id, type: "circle", x, y, width: 260, height: 260, color: "#6366f1", opacity, locked }
```
> Note: circles use `width` for SIZE in the editor. `generateJagdoc` exports `SIZE: el.width`.

**Element (shape):**
```js
{ id, type: "shape", x, y, shape: "rect", width: 220, height: 130, fill: "#3b82f6", border: "#6366f1", opacity, locked }
```

---

## 7. State Management & Undo/Redo

**Location:** `editor/src/App.jsx`

The entire editor state lives in a single `useReducer`. Every mutation that should be undoable goes through `commit()` which snapshots the pages array into a history stack.

### History structure

```js
{
  pages: Page[],       // current state
  history: Page[][],   // stack of past states (max 50)
  histIdx: number,     // pointer into history stack
  currentPageIndex: number,
  selectedId: string | null,
  clipboard: Element | null,
  jagdocOpen: boolean,
}
```

### `pushHist` — append to history

```js
function pushHist(history, histIdx, pages) {
  const next = history.slice(0, histIdx + 1);  // discard any redo states
  next.push(clone(pages));                      // deep clone current pages
  if (next.length > MAX_HIST) next.shift();     // cap at 50
  return { history: next, histIdx: next.length - 1 };
}
```

`clone` uses `JSON.parse(JSON.stringify(x))` — safe because all page data is plain JSON (no functions, no DOM refs).

### Undo / Redo

```js
case "UNDO": {
  if (histIdx <= 0) return state;
  const i = histIdx - 1;
  return { ...state, pages: clone(history[i]), histIdx: i, selectedId: null };
}
case "REDO": {
  if (histIdx >= history.length - 1) return state;
  const i = histIdx + 1;
  return { ...state, pages: clone(history[i]), histIdx: i, selectedId: null };
}
```

Mutations that do NOT go through `commit()` (not undoable): `SELECT`, `DESELECT`, `SET_PAGE`, `TOGGLE_JAGDOC`. These are UI-only state changes.

### Keyboard shortcuts wired in `useEffect`

```js
useEffect(() => {
  const onKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') dispatch({ type: 'UNDO' });
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') dispatch({ type: 'REDO' });
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') dispatch({ type: 'DUPLICATE' });
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') dispatch({ type: 'COPY' });
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') dispatch({ type: 'PASTE' });
    if (e.key === 'Delete' || e.key === 'Backspace') dispatch({ type: 'DELETE_ELEMENT' });
    if (e.key === 'Escape') dispatch({ type: 'DESELECT' });
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, []);
```

---

## 8. Drag, Resize & Selection

**Location:** `editor/src/components/Canvas.jsx`, `ElementNode.jsx`

### Why `onMouseDown` not `onClick` for deselection

Using `onClick` on the canvas background caused a bug: after dragging an element, the browser fires a `click` event on mouseup. This deselected the element immediately after every drag.

**Fix:** Use `onMouseDown` with a target check:
```jsx
<div
  className="canvas"
  onMouseDown={(e) => {
    if (e.target === e.currentTarget) onDeselect(); // only bare canvas clicks
  }}
>
```

Elements call `e.stopPropagation()` via their own `onMouseDown`, so canvas `onMouseDown` only fires when clicking empty canvas space.

### Drag system

Drag state is stored in a `useRef` (not state — no re-render needed):

```js
const dragging = useRef(null);
// { id, startX, startY, origX, origY, moved: boolean }
```

A `moved` flag distinguishes clicks from drags — if the mouse moves more than 3px, `moved = true`. Only then does position update fire. On `mouseup`, if `!moved`, it's a click (select only, no move).

### Resize system

```js
const resizing = useRef(null);
// { id, dir, startX, startY, origX, origY, origW, origH, isCircle }
```

`dir` is a compass string (`"nw"`, `"ne"`, `"sw"`, `"se"`). The resize math:

```js
if (dir.includes("e")) w = Math.max(30, origW + dx);
if (dir.includes("s")) h = Math.max(30, origH + dy);
if (dir.includes("w")) { nw = Math.max(30, origW - dx); x = origX + (origW - nw); w = nw; }
if (dir.includes("n")) { nh = Math.max(30, origH - dy); y = origY + (origH - nh); h = nh; }
```

For circles, `isCircle: true` forces uniform scaling:
```js
if (r.isCircle) {
  const sz = Math.round(Math.max(w, h));
  onUpdate(id, { x, y, width: sz, height: sz });
}
```

Window-level event listeners are used (not canvas-level) so drag/resize continues even when the mouse leaves the canvas bounds.

---

## 9. generateJagdoc — Serializer

**Location:** `editor/src/utils/generateJagdoc.js`

Converts editor state (array of page objects) back to `.jagdoc` text format.

```js
export function generateJagdoc(pages) {
  return pages.map(page => {
    let out = "PAGE\n";
    if (page.background !== "#111827") out += `BACKGROUND: ${page.background}\n`;
    out += "\n";

    for (const el of page.elements) {
      out += "ELEMENT\n";
      out += `TYPE: ${el.type}\n`;
      out += `X: ${el.x}\n`;
      out += `Y: ${el.y}\n`;

      if (el.type === "text")   { /* TEXT, COLOR, SIZE, BOLD, FONT ... */ }
      if (el.type === "shape")  { /* SHAPE, WIDTH, HEIGHT, FILL, BORDER */ }
      if (el.type === "circle") { /* SIZE: el.width, COLOR */ }
      if (el.type === "box")    { /* WIDTH, HEIGHT, COLOR */ }
      if (el.type === "image")  { /* SRC, WIDTH, HEIGHT */ }

      if (el.animation) {
        out += `ANIMATION: ${el.animation}\n`;
        out += `DURATION: ${el.duration}\n`;
        if (el.delay !== "0s") out += `DELAY: ${el.delay}\n`;
      }
      out += "\n";
    }
    return out;
  }).join("\n");
}
```

**Circle serialization note:** The editor stores circle size as `width` (to reuse the resize system). `generateJagdoc` exports it as `SIZE: el.width`. The parser reads `SIZE` for circles. This is a deliberate internal/external representation difference.

---

## 10. Preview Modal

**Location:** `editor/src/components/PreviewModal.jsx`

Renders directly from editor state — no serialization/re-parsing round trip.

### `RenderEl` component

Maps editor element objects to styled React nodes. Handles all 5 types: text, circle, box, shape, image.

```jsx
function RenderEl({ el, animate }) {
  const anim = animate && el.animation ? el.animation : "";
  const cls = `pv-el${anim ? " " + anim : ""}${animate ? " pv-show" : ""}`;
  // ...
}
```

The `animate` prop is:
- `true` in slide mode (immediately — page just entered)
- `true` in scroll mode when the page's IntersectionObserver fires

### Scroll mode animation trigger

React state tracks which pages have been revealed:

```js
const [revealed, setRevealed] = useState({});

// IntersectionObserver in useEffect when mode === "pdf"
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const idx = +entry.target.dataset.idx;
      setRevealed(r => ({ ...r, [idx]: true }));
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
```

Each `PageCanvas` receives `animate={!!revealed[i]}`. When revealed flips to true, React re-renders that page with `pv-show` class on its elements, triggering CSS animations.

The `key={i + "-" + !!revealed[i]}` forces React to remount the PageCanvas when `animate` changes — this resets the animation so it plays fresh rather than being in a partially-completed state.

---

## 11. Adding a New Element Type

To add a new element type (e.g. `video`), touch these files in order:

### 1. `editor/src/App.jsx` — factory
```js
if (type === "video")
  return { ...base, src: "", width: 400, height: 225 };
```

### 2. `editor/src/components/Topbar.jsx` — button + prop
```jsx
// prop
onAddVideo,
// JSX
<button className="btn btn-ghost" onClick={onAddVideo}>▶ Video</button>
```

### 3. `editor/src/App.jsx` — wire dispatch
```jsx
onAddVideo={() => dispatch({ type: "ADD_ELEMENT", elementType: "video" })}
```

### 4. `editor/src/components/ElementNode.jsx` — canvas render
```jsx
if (el.type === "video") {
  return (
    <div style={{ ...shell, width: el.width, height: el.height, background: "#000" }}
         onMouseDown={onMouseDown}>
      <video src={el.src} style={{ width: "100%", height: "100%" }} />
      {selected && <ResizeHandles onResizeStart={onResizeStart} />}
    </div>
  );
}
```

Also update `showHandles`:
```js
const showHandles = selected && ["shape","image","circle","box","video"].includes(el.type);
```

### 5. `editor/src/components/PropertiesPanel.jsx` — properties UI
```jsx
{element.type === "video" && (
  <>
    <Group label="Video URL">
      <input className="prop-input" value={element.src} onChange={upd("src")} />
    </Group>
    <Row>
      <Group label="Width"><input type="number" className="prop-input" value={element.width} onChange={upd("width")} /></Group>
      <Group label="Height"><input type="number" className="prop-input" value={element.height} onChange={upd("height")} /></Group>
    </Row>
  </>
)}
```

### 6. `editor/src/utils/generateJagdoc.js` — serializer
```js
if (el.type === "video") {
  out += `SRC: ${el.src}\n`;
  out += `WIDTH: ${el.width}\n`;
  out += `HEIGHT: ${el.height}\n`;
}
```

### 7. `viewer.html` + `client/src/App.jsx` — viewer renderer
```js
if (t === "video") {
  dom = document.createElement("video");
  dom.src = el.SRC;
  dom.controls = true;
  dom.style.cssText = `left:${x}px;top:${y}px;width:${el.WIDTH||400}px;height:${el.HEIGHT||225}px;`;
  return dom;
}
```

### 8. `editor/src/components/PreviewModal.jsx` — preview renderer
```jsx
if (el.type === "video") {
  return <video className="pv-el pv-show" src={el.src} controls style={{ ...base, width: el.width, height: el.height }} />;
}
```

---

## 12. File Format Grammar

Informal EBNF:

```
document  ::= page+
page      ::= "PAGE" NEWLINE page-prop* element*
page-prop ::= "BACKGROUND:" value NEWLINE
element   ::= ("ELEMENT" NEWLINE)? "TYPE:" type NEWLINE prop*
prop      ::= key ":" value NEWLINE
key       ::= [A-Z]+
value     ::= .+   (everything after the first colon on the line)
type      ::= "text" | "circle" | "box" | "shape" | "image"
```

**Parsing rules:**
- Lines are trimmed. Empty lines are skipped.
- Keys are uppercased before matching.
- The colon split uses `indexOf(":")` — only the first colon is the separator. This allows URLs as values.
- `PAGE` and `ELEMENT` are sentinel keywords (no colon).
- `BACKGROUND` belongs to the page scope; all other keys belong to the current element.
- There is no escaping, quoting, or multiline syntax.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| File format | Plain text (custom) |
| Viewer | Vanilla HTML/CSS/JS — zero dependencies |
| React client | React 19 + Vite |
| Editor | React 19 + Vite + CSS Modules |
| Server | Express 5 (Node.js) |
| State | `useReducer` + manual history stack |
| Animations | CSS keyframes + IntersectionObserver |
| Scaling | CSS `transform: translate + scale` |
| Image storage | Base64 data URIs (editor) or URLs (format) |
