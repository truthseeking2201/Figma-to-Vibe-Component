/**
 * HTML Serializer - Clean, semantic HTML with modern CSS
 * Generates responsive, accessible HTML/CSS code
 */

import type {
  FigmaIRNode,
  FigmaFrameNode,
  FigmaTextNode,
  FigmaGroupNode,
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

// Generate unique class names
let classCounter = 0;
function generateClassName(node: FigmaIRNode): string {
  const baseName = node.name
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  classCounter++;
  return `${baseName || "element"}-${classCounter}`;
}

// Convert pixels to rem
function pxToRem(px: number): string {
  return `${(px / 16).toFixed(3)}rem`;
}

// Get semantic HTML tag
function getSemanticTag(node: FigmaIRNode): string {
  // Text nodes
  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    const fontSize = textNode.textStyle.fontSize;

    // Headings based on size
    if (fontSize >= 32) return "h1";
    if (fontSize >= 24) return "h2";
    if (fontSize >= 20) return "h3";
    if (fontSize >= 18) return "h4";
    if (fontSize >= 16) return "h5";
    if (fontSize >= 14) return "h6";

    return "p";
  }

  // Check name patterns
  const nameLower = node.name.toLowerCase();
  if (nameLower.includes("button") || nameLower.includes("btn"))
    return "button";
  if (nameLower.includes("link")) return "a";
  if (nameLower.includes("image") || nameLower.includes("img")) return "figure";
  if (nameLower.includes("card")) return "article";
  if (nameLower.includes("header")) return "header";
  if (nameLower.includes("footer")) return "footer";
  if (nameLower.includes("nav")) return "nav";
  if (nameLower.includes("section")) return "section";

  return "div";
}

// Check if node uses flexbox
function hasAutoLayout(node: FigmaIRNode): boolean {
  return (
    node.type === "frame" &&
    (node as FigmaFrameNode).layoutProps.mode !== "none"
  );
}

// Generate CSS for a node
function generateNodeStyles(
  node: FigmaIRNode,
  parent: FigmaIRNode | null = null,
  isRoot: boolean = false,
): string {
  const styles: string[] = [];

  // Layout
  if (hasAutoLayout(node)) {
    const frame = node as FigmaFrameNode;
    const layout = frame.layoutProps;

    styles.push("display: flex");

    if (layout.mode === "horizontal") {
      styles.push("flex-direction: row");
    } else if (layout.mode === "vertical") {
      styles.push("flex-direction: column");
    }

    if (layout.mode === "wrap") {
      styles.push("flex-wrap: wrap");
    }

    // Alignment
    const justifyMap = {
      min: "flex-start",
      center: "center",
      max: "flex-end",
      "space-between": "space-between",
    };

    const alignMap = {
      min: "flex-start",
      center: "center",
      max: "flex-end",
    };

    if (layout.primaryAxisAlignItems) {
      styles.push(
        `justify-content: ${justifyMap[layout.primaryAxisAlignItems]}`,
      );
    }

    if (layout.counterAxisAlignItems) {
      styles.push(`align-items: ${alignMap[layout.counterAxisAlignItems]}`);
    }

    if (layout.itemSpacing > 0) {
      styles.push(`gap: ${pxToRem(layout.itemSpacing)}`);
    }

    // Padding
    const { padding } = layout;
    if (
      padding &&
      (padding.top || padding.right || padding.bottom || padding.left)
    ) {
      const values = [
        padding.top,
        padding.right,
        padding.bottom,
        padding.left,
      ].map((p) => pxToRem(p));
      styles.push(`padding: ${values.join(" ")}`);
    }
  }

  // Dimensions
  if (isRoot) {
    styles.push("position: relative");
    styles.push("width: 100%");
    styles.push(`max-width: ${node.width}px`);
    styles.push(`min-height: ${node.height}px`);
    styles.push("margin: 0 auto"); // Center the container
  } else if (parent && hasAutoLayout(parent)) {
    // Flex children
    if (node.width > 0) {
      styles.push(`width: ${node.width}px`);
    }
    if (node.height > 0) {
      styles.push(`height: ${node.height}px`);
    }
  } else if (parent) {
    // Absolute positioning for non-flex children
    styles.push("position: absolute");
    styles.push(`left: ${node.x - parent.x}px`);
    styles.push(`top: ${node.y - parent.y}px`);
    styles.push(`width: ${node.width}px`);
    styles.push(`height: ${node.height}px`);
  } else {
    // Default dimensions
    if (node.width > 0) styles.push(`width: ${node.width}px`);
    if (node.height > 0) styles.push(`height: ${node.height}px`);
  }

  // Visual properties
  if (node.opacity !== 1) {
    styles.push(`opacity: ${node.opacity}`);
  }

  if (node.rotation !== 0) {
    styles.push(`transform: rotate(${node.rotation}deg)`);
  }

  // Background
  if (node.fills.length > 0) {
    const fill = fillToCss(node.fills[0]);
    if (fill) {
      styles.push(`background: ${fill}`);
    }
  }

  // Border
  if (node.strokes.length > 0) {
    const stroke = strokeToCss(node.strokes[0]);
    if (stroke) {
      styles.push(`border: ${stroke}`);
    }
  }

  // Border radius
  const borderRadius = cornerRadiusToCss(node.cornerRadius);
  if (borderRadius !== "0px") {
    styles.push(`border-radius: ${borderRadius}`);
  }

  // Effects
  const shadows = node.effects
    .filter(
      (e) =>
        (e.type === "drop-shadow" || e.type === "inner-shadow") && e.visible,
    )
    .map(effectToCss)
    .filter(Boolean);

  if (shadows.length > 0) {
    styles.push(`box-shadow: ${shadows.join(", ")}`);
  }

  const blurs = node.effects
    .filter((e) => e.type === "blur" && e.visible)
    .map(effectToCss)
    .filter(Boolean);

  if (blurs.length > 0) {
    styles.push(`filter: ${blurs.join(" ")}`);
  }

  // Text styles
  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    const textStyle = textNode.textStyle;

    styles.push(
      `font-family: "${textStyle.fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    );
    styles.push(`font-weight: ${textStyle.fontWeight}`);
    styles.push(`font-size: ${pxToRem(textStyle.fontSize)}`);

    if (typeof textStyle.lineHeight === "number") {
      styles.push(
        `line-height: ${(textStyle.lineHeight / textStyle.fontSize).toFixed(2)}`,
      );
    }

    if (textStyle.letterSpacing !== 0) {
      styles.push(`letter-spacing: ${textStyle.letterSpacing}px`);
    }

    styles.push(`text-align: ${textStyle.textAlignHorizontal}`);

    if (textStyle.textDecoration !== "none") {
      styles.push(`text-decoration: ${textStyle.textDecoration}`);
    }

    if (textStyle.textCase !== "original") {
      const caseMap = {
        upper: "uppercase",
        lower: "lowercase",
        title: "capitalize",
      };
      styles.push(`text-transform: ${caseMap[textStyle.textCase]}`);
    }

    // Text color
    if (textNode.fills.length > 0 && textNode.fills[0].type === "solid") {
      const color = textNode.fills[0].color;
      styles.push(
        `color: rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
      );
    }
  }

  return styles.join(";\n  ");
}

// Generate HTML element
function generateHTMLElement(
  node: FigmaIRNode,
  parent: FigmaIRNode | null,
  depth: number,
  cssClasses: Map<string, string>,
): string {
  const indent = "  ".repeat(depth);
  const tag = getSemanticTag(node);
  const className = generateClassName(node);
  const styles = generateNodeStyles(node, parent, parent === null);

  // Store CSS for this class
  if (styles) {
    cssClasses.set(className, styles);
  }

  // Handle text nodes
  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    const content = textNode.characters
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return `${indent}<${tag} class="${className}">${content}</${tag}>`;
  }

  // Handle container nodes
  const hasChildren =
    "children" in node && node.children && node.children.length > 0;

  if (!hasChildren) {
    return `${indent}<${tag} class="${className}"></${tag}>`;
  }

  // Generate children
  const containerNode = node as FigmaFrameNode | FigmaGroupNode;
  const children = containerNode.children
    .map((child) => generateHTMLElement(child, node, depth + 1, cssClasses))
    .join("\n");

  return `${indent}<${tag} class="${className}">
${children}
${indent}</${tag}>`;
}

const htmlSerializer: Serializer = {
  id: "html",
  label: "HTML/CSS",
  description: "Clean, semantic HTML with modern CSS",
  supportedOptions: ["componentName", "inlineCss"],

  async generate(
    ir: FigmaIRNode,
    ctx: GenCtx,
  ): Promise<readonly GeneratedFile[]> {
    const componentName = sanitizeClassName(
      ctx.options.componentName || ir.name || "component",
    );

    classCounter = 0; // Reset counter
    const cssClasses = new Map<string, string>();

    // Generate HTML structure
    const htmlContent = generateHTMLElement(ir, null, 2, cssClasses);

    // Generate CSS
    const cssRules = Array.from(cssClasses.entries())
      .map(([className, styles]) => `.${className} {\n  ${styles};\n}`)
      .join("\n\n");

    // CSS reset and base styles
    const cssContent = `/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.5;
  color: #333;
  background-color: #fff;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

button {
  cursor: pointer;
  border: none;
  background: none;
  font: inherit;
}

/* Component styles */
${cssRules}`;

    // HTML document
    const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${componentName}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
${htmlContent}
</body>
</html>`;

    // Format files
    const formattedHtml = await formatPrettier(
      htmlDocument,
      "html",
      ctx.prettierOptions,
    );

    const formattedCss = await formatPrettier(
      cssContent,
      "css",
      ctx.prettierOptions,
    );

    return [
      {
        filename: "index.html",
        code: formattedHtml,
        language: "html",
      },
      {
        filename: "styles.css",
        code: formattedCss,
        language: "css",
      },
    ];
  },
};

register(htmlSerializer);
