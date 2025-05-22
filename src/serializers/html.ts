/**
 * HTML/CSS Serializer
 */

import type {
  FigmaIRNode,
  FigmaFrameNode,
  FigmaTextNode,
} from "../core/figma-ir";
import type { Serializer, GeneratedFile, GenCtx } from "./types";
import { register } from "./registry";
import {
  fillToCss,
  strokeToCss,
  effectToCss,
  cornerRadiusToCss,
  sanitizeClassName,
  formatPrettier,
} from "./utils";

function generateCssClass(node: FigmaIRNode): string {
  const className = sanitizeClassName(node.name);
  const fills = node.fills.map(fillToCss).filter(Boolean);
  const strokes = node.strokes.map(strokeToCss).filter(Boolean);
  const effects = node.effects.map(effectToCss).filter(Boolean);

  const styles: string[] = [
    `position: absolute;`,
    `left: ${node.x}px;`,
    `top: ${node.y}px;`,
    `width: ${node.width}px;`,
    `height: ${node.height}px;`,
  ];

  if (node.opacity !== 1) {
    styles.push(`opacity: ${node.opacity};`);
  }

  if (node.rotation !== 0) {
    styles.push(`transform: rotate(${node.rotation}deg);`);
  }

  if (fills.length > 0) {
    styles.push(`background: ${fills[0]};`);
  }

  if (strokes.length > 0) {
    styles.push(`border: ${strokes[0]};`);
  }

  if (effects.length > 0) {
    const shadows = effects.filter((e) => e.includes("px"));
    const filters = effects.filter((e) => e.includes("blur"));

    if (shadows.length > 0) {
      styles.push(`box-shadow: ${shadows.join(", ")};`);
    }

    if (filters.length > 0) {
      styles.push(`filter: ${filters.join(" ")};`);
    }
  }

  const borderRadius = cornerRadiusToCss(node.cornerRadius);
  if (borderRadius !== "0px") {
    styles.push(`border-radius: ${borderRadius};`);
  }

  if (
    node.type === "frame" &&
    (node as FigmaFrameNode).layoutProps.mode !== "none"
  ) {
    const layout = (node as FigmaFrameNode).layoutProps;
    styles.push(`display: flex;`);

    if (layout.mode === "horizontal") {
      styles.push(`flex-direction: row;`);
    } else if (layout.mode === "vertical") {
      styles.push(`flex-direction: column;`);
    }

    styles.push(`gap: ${layout.itemSpacing}px;`);
    styles.push(
      `padding: ${layout.padding.top}px ${layout.padding.right}px ${layout.padding.bottom}px ${layout.padding.left}px;`,
    );
  }

  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    const style = textNode.textStyle;

    styles.push(`font-family: "${style.fontFamily}";`);
    styles.push(`font-weight: ${style.fontWeight};`);
    styles.push(`font-size: ${style.fontSize}px;`);

    if (typeof style.lineHeight === "number") {
      styles.push(`line-height: ${style.lineHeight}px;`);
    }

    if (style.letterSpacing !== 0) {
      styles.push(`letter-spacing: ${style.letterSpacing}px;`);
    }

    styles.push(`text-align: ${style.textAlignHorizontal};`);

    if (style.textDecoration !== "none") {
      styles.push(`text-decoration: ${style.textDecoration};`);
    }

    if (style.textCase !== "original") {
      styles.push(`text-transform: ${style.textCase};`);
    }
  }

  return `.${className} {\n  ${styles.join("\n  ")}\n}`;
}

function generateHtmlElement(node: FigmaIRNode): string {
  const className = sanitizeClassName(node.name);

  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    return `<p class="${className}">${textNode.characters}</p>`;
  }

  if (node.type === "frame" || node.type === "group") {
    const frameNode = node as FigmaFrameNode;
    const children =
      frameNode.children?.map(generateHtmlElement).join("\n  ") || "";

    if (children) {
      return `<div class="${className}">\n  ${children}\n</div>`;
    }
    return `<div class="${className}"></div>`;
  }

  return `<div class="${className}"></div>`;
}

function generateCss(node: FigmaIRNode): string {
  const classes: string[] = [generateCssClass(node)];

  if ("children" in node && node.children) {
    for (const child of node.children) {
      classes.push(generateCss(child));
    }
  }

  return classes.join("\n\n");
}

const htmlSerializer: Serializer = {
  id: "html",
  label: "HTML/CSS",
  description: "Static HTML with CSS styling",
  supportedOptions: ["inlineCss", "useTailwind"],

  async generate(
    ir: FigmaIRNode,
    ctx: GenCtx,
  ): Promise<readonly GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    const htmlContent = generateHtmlElement(ir);
    const cssContent = generateCss(ir);

    if (ctx.options.inlineCss) {
      const inlineHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Figma Export</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    ${cssContent}
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

      files.push({
        filename: "index.html",
        code: await formatPrettier(inlineHtml, "html", ctx.prettierOptions),
        language: "html",
      });
    } else {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Figma Export</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  ${htmlContent}
</body>
</html>`;

      const css = `body {
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

${cssContent}`;

      files.push(
        {
          filename: "index.html",
          code: await formatPrettier(html, "html", ctx.prettierOptions),
          language: "html",
        },
        {
          filename: "style.css",
          code: await formatPrettier(css, "css", ctx.prettierOptions),
          language: "css",
        },
      );
    }

    return files;
  },
};

register(htmlSerializer);
