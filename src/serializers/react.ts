/**
 * React Serializer - Clean, production-ready React components
 * Generates semantic HTML with CSS modules and responsive design
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
  sanitizeComponentName,
  formatPrettier,
} from "./utils";

interface StyleClass {
  className: string;
  styles: Record<string, any>;
}

// Generate unique class names
let classCounter = 0;
function generateClassName(node: FigmaIRNode): string {
  const baseName = node.name
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .replace(/^(\d)/, "n$1") // Prefix with 'n' if starts with number
    .toLowerCase();

  classCounter++;
  return `${baseName || "element"}_${classCounter}`;
}

// Convert fixed pixels to responsive units
function toResponsiveUnit(
  value: number,
  type: "spacing" | "size" | "font" = "size",
): string {
  if (type === "font") {
    // Font sizes: use rem for better accessibility
    return `${(value / 16).toFixed(2)}rem`;
  } else if (type === "spacing") {
    // Spacing: use rem for consistency
    return `${(value / 16).toFixed(2)}rem`;
  } else {
    // Sizes: keep pixels for now, but could be converted to percentages
    return `${value}px`;
  }
}

// Check if node should use flexbox
function shouldUseFlexbox(node: FigmaIRNode): boolean {
  if (node.type === "frame") {
    const frame = node as FigmaFrameNode;
    return frame.layoutProps.mode !== "none";
  }
  return false;
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

    // Default to paragraph
    return "p";
  }

  // Check name patterns for semantic hints
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
  if (nameLower.includes("list")) return "ul";

  // Container types
  if (shouldUseFlexbox(node)) {
    return "div"; // Flex containers are usually divs
  }

  // Default
  return "div";
}

// Generate CSS for a node
function generateNodeStyles(
  node: FigmaIRNode,
  parent: FigmaIRNode | null = null,
  isRoot: boolean = false,
): Record<string, any> {
  const styles: Record<string, any> = {};

  // Layout mode
  if (shouldUseFlexbox(node)) {
    const frame = node as FigmaFrameNode;
    const layout = frame.layoutProps;

    styles.display = "flex";

    // Direction
    if (layout.mode === "horizontal") {
      styles.flexDirection = "row";
    } else if (layout.mode === "vertical") {
      styles.flexDirection = "column";
    }

    // Wrap
    if (layout.mode === "wrap") {
      styles.flexWrap = "wrap";
    }

    // Alignment
    switch (layout.primaryAxisAlignItems) {
      case "min":
        styles.justifyContent = "flex-start";
        break;
      case "center":
        styles.justifyContent = "center";
        break;
      case "max":
        styles.justifyContent = "flex-end";
        break;
      case "space-between":
        styles.justifyContent = "space-between";
        break;
    }

    switch (layout.counterAxisAlignItems) {
      case "min":
        styles.alignItems = "flex-start";
        break;
      case "center":
        styles.alignItems = "center";
        break;
      case "max":
        styles.alignItems = "flex-end";
        break;
    }

    // Gap instead of margin
    if (layout.itemSpacing > 0) {
      styles.gap = toResponsiveUnit(layout.itemSpacing, "spacing");
    }

    // Padding
    if (layout.padding) {
      const { top, right, bottom, left } = layout.padding;
      if (top || right || bottom || left) {
        styles.padding = [top, right, bottom, left]
          .map((p) => toResponsiveUnit(p, "spacing"))
          .join(" ");
      }
    }
  }

  // Dimensions
  if (isRoot) {
    // Root element uses relative positioning
    styles.position = "relative";
    styles.width = "100%";
    styles.maxWidth = toResponsiveUnit(node.width, "size");
    styles.minHeight = toResponsiveUnit(node.height, "size");
  } else if (parent && shouldUseFlexbox(parent)) {
    // Flex children adapt to content
    if (node.width > 0) {
      styles.width = toResponsiveUnit(node.width, "size");
    }
    if (node.height > 0) {
      styles.height = toResponsiveUnit(node.height, "size");
    }
  } else {
    // Non-flex children
    if (node.width > 0) {
      styles.width = toResponsiveUnit(node.width, "size");
    }
    if (node.height > 0) {
      styles.height = toResponsiveUnit(node.height, "size");
    }
  }

  // Visual properties
  if (node.opacity !== 1) {
    styles.opacity = node.opacity;
  }

  if (node.rotation !== 0) {
    styles.transform = `rotate(${node.rotation}deg)`;
  }

  // Background
  if (node.fills.length > 0) {
    const primaryFill = node.fills[0];
    if (primaryFill) {
      styles.background = fillToCss(primaryFill);
    }
  }

  // Border
  if (node.strokes.length > 0) {
    const primaryStroke = node.strokes[0];
    if (primaryStroke) {
      styles.border = strokeToCss(primaryStroke);
    }
  }

  // Border radius
  const borderRadius = cornerRadiusToCss(node.cornerRadius);
  if (borderRadius !== "0px") {
    styles.borderRadius = borderRadius;
  }

  // Effects
  const shadows = node.effects
    .filter((e) => e.type === "drop-shadow" || e.type === "inner-shadow")
    .map(effectToCss)
    .filter(Boolean);

  if (shadows.length > 0) {
    styles.boxShadow = shadows.join(", ");
  }

  const blurs = node.effects
    .filter((e) => e.type === "blur")
    .map(effectToCss)
    .filter(Boolean);

  if (blurs.length > 0) {
    styles.filter = blurs.join(" ");
  }

  // Text styles
  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    const textStyle = textNode.textStyle;

    styles.fontFamily = `"${textStyle.fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    styles.fontWeight = textStyle.fontWeight;
    styles.fontSize = toResponsiveUnit(textStyle.fontSize, "font");

    if (typeof textStyle.lineHeight === "number" && textStyle.fontSize > 0) {
      styles.lineHeight = (textStyle.lineHeight / textStyle.fontSize).toFixed(
        2,
      );
    }

    if (textStyle.letterSpacing !== 0) {
      styles.letterSpacing = `${textStyle.letterSpacing}px`;
    }

    styles.textAlign = textStyle.textAlignHorizontal;

    if (textStyle.textDecoration !== "none") {
      styles.textDecoration = textStyle.textDecoration;
    }

    if (textStyle.textCase !== "original") {
      const caseMap = {
        upper: "uppercase",
        lower: "lowercase",
        title: "capitalize",
      };
      styles.textTransform = caseMap[textStyle.textCase];
    }

    // Text color
    if (textNode.fills.length > 0 && textNode.fills[0]?.type === "solid") {
      const firstFill = textNode.fills[0];
      if (firstFill.type === "solid" && firstFill.color) {
        const color = firstFill.color;
        styles.color = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
      }
    }
  }

  return styles;
}

// Generate CSS string from styles object
function stylesToCss(styles: Record<string, any>): string {
  return Object.entries(styles)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `  ${cssKey}: ${value};`;
    })
    .join("\n");
}

// Generate JSX element
function generateJSXElement(
  node: FigmaIRNode,
  parent: FigmaIRNode | null,
  depth: number,
  styleClasses: Map<string, StyleClass>,
  options: GenCtx["options"],
): string {
  const indent = "  ".repeat(depth);
  const tag = getSemanticTag(node);
  const className = generateClassName(node);
  const styles = generateNodeStyles(node, parent, parent === null);

  // Store styles for CSS generation
  if (Object.keys(styles).length > 0) {
    styleClasses.set(className, {
      className,
      styles,
    });
  }

  // Handle text nodes
  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    const content = textNode.characters
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return `${indent}<${tag} className={styles.${className}}>${content}</${tag}>`;
  }

  // Handle container nodes
  const hasChildren =
    "children" in node && node.children && node.children.length > 0;

  if (!hasChildren) {
    return `${indent}<${tag} className={styles.${className}} />`;
  }

  // Generate children
  const containerNode = node as FigmaFrameNode | FigmaGroupNode;
  const children = containerNode.children
    .map((child) =>
      generateJSXElement(child, node, depth + 1, styleClasses, options),
    )
    .join("\n");

  return `${indent}<${tag} className={styles.${className}}>
${children}
${indent}</${tag}>`;
}

// Main serializer
const reactSerializer: Serializer = {
  id: "react",
  label: "React",
  description: "Clean React components with CSS modules",
  supportedOptions: ["componentName", "inlineCss", "useTailwind"],

  async generate(
    ir: FigmaIRNode,
    ctx: GenCtx,
  ): Promise<readonly GeneratedFile[]> {
    const componentName = sanitizeComponentName(
      ctx.options.componentName || ir.name || "Component",
    );

    classCounter = 0; // Reset counter
    const styleClasses = new Map<string, StyleClass>();

    // Generate JSX
    const jsxContent = generateJSXElement(
      ir,
      null,
      2,
      styleClasses,
      ctx.options,
    );

    // Generate CSS
    const cssContent = Array.from(styleClasses.values())
      .map(({ className, styles }) => {
        return `.${className} {
${stylesToCss(styles)}
}`;
      })
      .join("\n\n");

    // Generate React component
    const componentCode = `import React from 'react';
import styles from './${componentName}.module.css';

interface ${componentName}Props {
  className?: string;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ className }) => {
  return (
${jsxContent}
  );
};

export default ${componentName};`;

    // Format code
    const formattedComponent = await formatPrettier(
      componentCode,
      "typescript",
      ctx.prettierOptions,
    );

    const formattedCss = await formatPrettier(
      cssContent,
      "css",
      ctx.prettierOptions,
    );

    return [
      {
        filename: `${componentName}.tsx`,
        code: formattedComponent,
        language: "tsx",
      },
      {
        filename: `${componentName}.module.css`,
        code: formattedCss,
        language: "css",
      },
    ];
  },
};

register(reactSerializer);
