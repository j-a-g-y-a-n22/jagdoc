export function generateJagdoc(pages) {
  return pages.map((page) => {
    let out = "PAGE\n";
    if (page.background && page.background !== "#111827") {
      out += `BACKGROUND: ${page.background}\n`;
    }
    out += "\n";

    for (const el of page.elements) {
      out += "ELEMENT\n";
      out += `TYPE: ${el.type}\n`;
      out += `X: ${el.x}\n`;
      out += `Y: ${el.y}\n`;

      if (el.type === "text") {
        out += `TEXT: ${el.text}\n`;
        out += `COLOR: ${el.color}\n`;
        out += `SIZE: ${el.size}\n`;
        if (el.bold) out += `BOLD: true\n`;
        if (el.font && el.font !== "Inter") out += `FONT: ${el.font}\n`;
        if (el.wrap) { out += `WRAP: true\n`; out += `MAXWIDTH: ${el.maxWidth || 400}\n`; }
      }

      if (el.type === "shape") {
        out += `SHAPE: ${el.shape}\n`;
        out += `WIDTH: ${el.width}\n`;
        out += `HEIGHT: ${el.height}\n`;
        out += `FILL: ${el.fill}\n`;
        out += `BORDER: ${el.border}\n`;
      }

      if (el.type === "circle") {
        out += `SIZE: ${el.width || 200}\n`;
        out += `COLOR: ${el.color || "#6366f1"}\n`;
      }

      if (el.type === "box") {
        out += `WIDTH: ${el.width || 220}\n`;
        out += `HEIGHT: ${el.height || 130}\n`;
        out += `COLOR: ${el.color || "#3b82f6"}\n`;
      }

      if (el.type === "image") {
        out += `SRC: ${el.src}\n`;
        out += `WIDTH: ${el.width}\n`;
        out += `HEIGHT: ${el.height}\n`;
      }

      if (el.animation) {
        out += `ANIMATION: ${el.animation}\n`;
        out += `DURATION: ${el.duration}\n`;
        if (el.delay && el.delay !== "0s") out += `DELAY: ${el.delay}\n`;
      }

      out += "\n";
    }

    return out;
  }).join("\n");
}
