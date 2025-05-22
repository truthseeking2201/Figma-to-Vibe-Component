/**
 * React Serializer - React 18 functional components
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
  sanitizeComponentName,
  toCamelCase,
  formatPrettier,
} from "./utils";

function generateReactStyle(node: FigmaIRNode): Record<string, any> {
  const style: Record<string, any> = {
    position: "absolute",
    left: node.x,
    top: node.y,
    width: node.width,
    height: node.height,
  };

  if (node.opacity !== 1) {
    style.opacity = node.opacity;
  }

  if (node.rotation !== 0) {
    style.transform = `rotate(${node.rotation}deg)`;
  }

  if (node.fills.length > 0) {
    style.background = fillToCss(node.fills[0]!);
  }

  if (node.strokes.length > 0) {
    style.border = strokeToCss(node.strokes[0]!);
  }

  const shadows = node.effects.map(effectToCss).filter((e) => e.includes("px"));
  const filters = node.effects
    .map(effectToCss)
    .filter((e) => e.includes("blur"));

  if (shadows.length > 0) {
    style.boxShadow = shadows.join(", ");
  }

  if (filters.length > 0) {
    style.filter = filters.join(" ");
  }

  const borderRadius = cornerRadiusToCss(node.cornerRadius);
  if (borderRadius !== "0px") {
    style.borderRadius = borderRadius;
  }

  if (
    node.type === "frame" &&
    (node as FigmaFrameNode).layoutProps.mode !== "none"
  ) {
    const layout = (node as FigmaFrameNode).layoutProps;
    style.display = "flex";

    if (layout.mode === "horizontal") {
      style.flexDirection = "row";
    } else if (layout.mode === "vertical") {
      style.flexDirection = "column";
    }

    style.gap = layout.itemSpacing;
    style.padding = `${layout.padding.top}px ${layout.padding.right}px ${layout.padding.bottom}px ${layout.padding.left}px`;
  }

  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    const textStyle = textNode.textStyle;

    style.fontFamily = `"${textStyle.fontFamily}"`;
    style.fontWeight = textStyle.fontWeight;
    style.fontSize = textStyle.fontSize;

    if (typeof textStyle.lineHeight === "number") {
      style.lineHeight = `${textStyle.lineHeight}px`;
    }

    if (textStyle.letterSpacing !== 0) {
      style.letterSpacing = textStyle.letterSpacing;
    }

    style.textAlign = textStyle.textAlignHorizontal;

    if (textStyle.textDecoration !== "none") {
      style.textDecoration = textStyle.textDecoration;
    }

    if (textStyle.textCase !== "original") {
      style.textTransform = textStyle.textCase;
    }
  }

  return style;
}

function styleObjectToString(style: Record<string, any>): string {
  const entries = Object.entries(style).map(([key, value]) => {
    const camelKey = toCamelCase(key);
    const stringValue = typeof value === "string" ? `"${value}"` : value;
    return `    ${camelKey}: ${stringValue}`;
  });

  return `{\n${entries.join(",\n")}\n  }`;
}

function generateReactComponent(
  node: FigmaIRNode,
  componentName: string,
): string {
  const style = generateReactStyle(node);
  const styleString = styleObjectToString(style);

  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    return `  <div style={${styleString}}>\n    ${textNode.characters}\n  </div>`;
  }

  if (node.type === "frame" || node.type === "group") {
    const frameNode = node as FigmaFrameNode;
    const children =
      frameNode.children
        ?.map((child, i) =>
          generateReactComponent(child, `${componentName}Child${i}`),
        )
        .join("\n") || "";

    if (children) {
      return `  <div style={${styleString}}>\n${children}\n  </div>`;
    }
    return `  <div style={${styleString}} />`;
  }

  return `  <div style={${styleString}} />`;
}

const reactSerializer: Serializer = {
  id: "react",
  label: "React",
  description: "React 18 functional component with inline styles",
  supportedOptions: ["exportAsComponent", "componentName"],

  async generate(
    ir: FigmaIRNode,
    ctx: GenCtx,
  ): Promise<readonly GeneratedFile[]> {
    const componentName =
      ctx.options.componentName ||
      sanitizeComponentName(ir.name) ||
      "FigmaComponent";
    const componentCode = generateReactComponent(ir, componentName);

    const code = `import React from 'react';

interface ${componentName}Props {
  className?: string;
  style?: React.CSSProperties;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ 
  className, 
  style
}) => {
  return (
    <div className={className} style={style}>
${componentCode}
    </div>
  );
};

export default ${componentName};`;

    return [
      {
        filename: `${componentName}.tsx`,
        code: await formatPrettier(code, "typescript", ctx.prettierOptions),
        language: "tsx",
      },
    ];
  },
};

register(reactSerializer);
