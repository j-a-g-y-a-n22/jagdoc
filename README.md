# jagdoc

> A new kind of document. Interactive. Animated. Alive.

---

## What is jagdoc?

**jagdoc** is a custom document ecosystem built around a plain-text file format (`.jagdoc`) that renders as a fully animated, interactive visual experience in any web browser — no plugins, no installs, no frameworks needed by the viewer.

Think of it as the middle ground between a PDF (static, boring) and a web app (too complex to author). A `.jagdoc` file is human-readable plain text you can open in Notepad, but renders like a cinematic presentation.

---

## The Three Pillars

```
┌─────────────────────────────────────────────────────────┐
│                    jagdoc ecosystem                      │
│                                                         │
│  .jagdoc file  ──▶  viewer  ──▶  animated experience   │
│       ▲                                                  │
│       │                                                  │
│    editor  (visual, no-code, Canva-like)                │
└─────────────────────────────────────────────────────────┘
```

| Pillar | What it is |
|--------|-----------|
| **File Format** | Plain-text `.jagdoc` files — human readable, always |
| **Viewer** | `viewer.html` — standalone single file, zero dependencies, works on phone |
| **Editor** | React + Vite visual editor — drag, drop, style, export |

---

## The `.jagdoc` File Format

Every `.jagdoc` file is made of **pages**. Each page has a background and a list of elements.

### Page structure

```
PAGE
BACKGROUND: linear-gradient(135deg, #0d0d1a 0%, #1a0030 100%)

TYPE: text
TEXT: Hello World
X: 100
Y: 80
SIZE: 48
COLOR: #ffffff
BOLD: true
ANIMATION: fade-in
DURATION: 1.2s

TYPE: circle
X: 600
Y: 100
SIZE: 300
COLOR: #6600ff

PAGE
BACKGROUND: #111827

TYPE: text
TEXT: Page Two
X: 60
Y: 60
SIZE: 32
COLOR: #00ffcc
```

### Rules

- `PAGE` starts a new page. Everything after it belongs to that page until the next `PAGE`.
- `TYPE:` starts a new element. All `KEY: VALUE` lines after it describe that element.
- Keys are case-insensitive. Values are read literally (URLs with colons work fine).
- Blank lines are ignored.
- No commas, no quotes, no brackets — just keys and values.

---

## Element Types

### `text` — Animated text label

| Property | Description | Default |
|----------|-------------|---------|
| `TEXT` | The text content | — |
| `X` / `Y` | Position in pixels | 0 / 0 |
| `SIZE` | Font size in px | 20 |
| `COLOR` | CSS color | `#ffffff` |
| `BOLD` | `true` or `false` | `false` |
| `FONT` | Font family name | inherit |
| `ALIGN` | `left`, `center`, `right` | `left` |
| `ANIMATION` | See animations table | none |
| `DURATION` | Animation duration | `1s` |
| `DELAY` | Animation delay | `0s` |

### `circle` — Blurry glow orb

| Property | Description |
|----------|-------------|
| `X` / `Y` | Position |
| `SIZE` | Diameter in px |
| `COLOR` | Glow color |

Used for ambient background lighting effects. Rendered with `filter: blur(60px)`.

### `box` — Solid rounded rectangle

| Property | Description |
|----------|-------------|
| `X` / `Y` | Position |
| `WIDTH` / `HEIGHT` | Size in px |
| `COLOR` | Fill color |

### `shape` — Bordered shape (rect or circle)

| Property | Description |
|----------|-------------|
| `SHAPE` | `rect` or `circle` |
| `X` / `Y` | Position |
| `WIDTH` / `HEIGHT` | Size in px |
| `FILL` | Background color |
| `BORDER` | Border color |

### `image` — Photo or graphic

| Property | Description |
|----------|-------------|
| `SRC` | URL or base64 data URI |
| `X` / `Y` | Position |
| `WIDTH` | Width in px |
| `HEIGHT` | Height in px (optional) |

---

## Animations

Apply to `text` and `image` elements via the `ANIMATION` property.

| Value | Effect |
|-------|--------|
| `fade-in` | Fades up from below |
| `slide-left` | Slides in from the right |
| `slide-right` | Slides in from the left |
| `slide-up` | Rises from below |
| `zoom-in` | Scales up from small |

Use `DURATION` to control speed and `DELAY` to stagger multiple elements.

```
TYPE: text
TEXT: First line
ANIMATION: fade-in
DURATION: 0.8s
DELAY: 0s

TYPE: text
TEXT: Second line
ANIMATION: fade-in
DURATION: 0.8s
DELAY: 0.4s

TYPE: text
TEXT: Third line
ANIMATION: fade-in
DURATION: 0.8s
DELAY: 0.8s
```

---

## Backgrounds

Any CSS background value works:

```
BACKGROUND: #000000
BACKGROUND: linear-gradient(135deg, #0d0d1a 0%, #6600ff 100%)
BACKGROUND: radial-gradient(ellipse at center, #1a0035, #000000)
```

---

## The Viewer (`viewer.html`)

A standalone single HTML file — no server, no npm, no dependencies.

### Features
- **Slide mode** — one page at a time with arrows and dots
- **Scroll mode** — all pages stacked, PDF-style continuous scroll
- **Fullscreen** — browser fullscreen API
- **Animations** — trigger on page enter (slide mode) or scroll into view (scroll mode)
- **Keyboard** — Arrow keys, Space, Home, End
- **Swipe** — left/right swipe on mobile
- **Scroll wheel** — navigate pages in slide mode
- **Drag & drop** — drop a `.jagdoc` file onto the welcome screen
- **Open local** — file picker (works on mobile too)

### How to use on phone
1. Open `viewer.html` in a mobile browser (Chrome/Safari)
2. Tap **Open .jagdoc file**
3. Select the file from your Downloads or Files app

---

## The Editor

A visual Canva-like editor built with React + Vite.

### Features
- Drag elements freely on a 900×540 canvas
- Resize shapes and images with corner handles
- Double-click text to edit inline
- **Undo / Redo** (50 steps, Ctrl+Z / Ctrl+Y)
- **Copy / Paste / Duplicate** (Ctrl+C / Ctrl+V / Ctrl+D)
- **Layer order** — bring to front, send to back
- **Alignment tools** — align left/center/right/top/middle/bottom
- **Opacity slider**
- **Lock position** — prevent accidental moves
- **Background picker** — solid color or gradient builder (angle + color stops)
- **Animation selector** — all 5 types + duration + delay
- **Image upload** — from device (stored as base64) or URL
- **▶ Preview** — full-screen preview with slide + scroll modes
- **Export** — download as `.jagdoc` file

### Element types in editor
| Button | Creates |
|--------|---------|
| **T Text** | Text label |
| **◻ Shape** | Bordered rect or circle |
| **● Glow** | Blurry circle orb |
| **▬ Box** | Solid rounded rectangle |
| **⬚ Image** | Photo / graphic |

---

## Project Structure

```
jagdoc-project/
├── viewer.html              # Standalone viewer (no dependencies)
├── *.jagdoc                 # Document files
│
├── client/                  # React viewer app (with server integration)
│   └── src/
│       ├── App.jsx          # Parser + renderer + file picker
│       ├── App.css          # Viewer styles
│       └── index.css        # Animation keyframes
│
├── editor/                  # Visual editor app
│   └── src/
│       ├── App.jsx          # State management + layout
│       ├── components/
│       │   ├── Topbar.jsx
│       │   ├── PageList.jsx
│       │   ├── Canvas.jsx
│       │   ├── ElementNode.jsx
│       │   ├── PropertiesPanel.jsx
│       │   ├── JagdocPanel.jsx
│       │   └── PreviewModal.jsx
│       └── utils/
│           └── generateJagdoc.js
│
└── server/
    └── index.js             # Express file server
```

---

## Example Files

| File | Topic |
|------|-------|
| `jagdoc-showcase.jagdoc` | The jagdoc format advertising itself |
| `boring-docs.jagdoc` | "What if documents weren't boring?" |
| `world-war-3.jagdoc` | World War III — dramatic narrative |
| `black-holes.jagdoc` | Black Holes — where physics breaks |
| `document.jagdoc` | Minimal test file |

---

## Running Locally

### Viewer only (no server needed)
Just open `viewer.html` in any browser. Done.

### Client + Server
```bash
# Terminal 1 — server
cd server && node index.js

# Terminal 2 — client
cd client && npm run dev
```

### Editor
```bash
cd editor && npm run dev
```
