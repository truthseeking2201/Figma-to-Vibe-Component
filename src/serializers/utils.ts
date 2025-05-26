/**
 * Shared utility functions for serializers
 */

import type {
  FigmaColor,
  FigmaFill,
  FigmaStroke,
  FigmaEffect,
  FigmaCornerRadius,
} from "../core/figma-ir";

export function rgbaToString(color: FigmaColor): string {
  if (color.a === 1) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

export function rgbaToHex(color: FigmaColor): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0");
  };
  if (color.a === 1) {
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}${toHex(color.a * 255)}`;
}

export function fillToCss(fill: FigmaFill): string {
  switch (fill.type) {
    case "solid": {
      const opacity = fill.opacity !== undefined ? fill.opacity : 1;
      const color = fill.color;
      if (!color) return "transparent";
      if (opacity < 1) {
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a * opacity})`;
      }
      return rgbaToString(color);
    }
    case "gradient": {
      const { gradient } = fill;
      const opacity = fill.opacity !== undefined ? fill.opacity : 1;

      if (gradient.stops.length === 0) {
        return "transparent";
      }

      const stops = gradient.stops
        .map((stop) => {
          const color = stop.color;
          const adjustedAlpha = opacity < 1 ? color.a * opacity : color.a;
          return `rgba(${color.r}, ${color.g}, ${color.b}, ${adjustedAlpha}) ${Math.round(stop.position * 100)}%`;
        })
        .join(", ");

      // Calculate gradient angle from transform matrix if available
      let angle = "90deg";
      if (gradient.transform && Array.isArray(gradient.transform) && gradient.transform.length >= 2) {
        const matrix = gradient.transform;
        const row0 = Array.isArray(matrix[0]) ? matrix[0] : [];
        const a = typeof row0[0] === 'number' ? row0[0] : 1;
        const b = typeof row0[1] === 'number' ? row0[1] : 0;
        const angleRad = Math.atan2(b, a);
        const angleDeg = (angleRad * 180) / Math.PI;
        angle = `${Math.round(angleDeg)}deg`;
      }

      switch (gradient.type) {
        case "linear":
          return `linear-gradient(${angle}, ${stops})`;
        case "radial":
          return `radial-gradient(circle, ${stops})`;
        case "angular":
          return `conic-gradient(from ${angle}, ${stops})`;
        default:
          return rgbaToString(
            gradient.stops[0]?.color || { r: 0, g: 0, b: 0, a: 1 },
          );
      }
    }
    case "image":
      return fill.imageHash
        ? `url('data:image/svg+xml;base64,${btoa(
            `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="#f0f0f0"/></svg>`,
          )}')`
        : "#f0f0f0";
    default:
      return "transparent";
  }
}

export function strokeToCss(stroke: FigmaStroke): string {
  const weight = typeof stroke.weight === 'number' ? stroke.weight : 1;
  const color = stroke.color ? rgbaToString(stroke.color) : "transparent";
  return `${weight}px solid ${color}`;
}

export function effectToCss(effect: FigmaEffect): string {
  if (!effect.visible) return "";

  switch (effect.type) {
    case "drop-shadow":
      if (!effect.color || !effect.offset) return "";
      return `${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px ${effect.spread || 0}px ${rgbaToString(effect.color)}`;
    case "inner-shadow":
      if (!effect.color || !effect.offset) return "";
      return `inset ${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px ${effect.spread || 0}px ${rgbaToString(effect.color)}`;
    case "blur":
      return effect.radius > 0 ? `blur(${effect.radius}px)` : "";
    case "background-blur":
      return effect.radius > 0
        ? `backdrop-filter: blur(${effect.radius}px)`
        : "";
    default:
      return "";
  }
}

export function cornerRadiusToCss(radius: FigmaCornerRadius): string {
  if (!radius || typeof radius !== 'object') {
    return "0px";
  }
  if (radius.all !== undefined) {
    return `${radius.all}px`;
  }

  const topLeft = radius.topLeft || 0;
  const topRight = radius.topRight || 0;
  const bottomRight = radius.bottomRight || 0;
  const bottomLeft = radius.bottomLeft || 0;

  if (
    topLeft === topRight &&
    topRight === bottomRight &&
    bottomRight === bottomLeft
  ) {
    return `${topLeft}px`;
  }

  return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
}

export function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter ? letter.toUpperCase() : "");
}

export function toPascalCase(str: string): string {
  return str.replace(/(^\w|-\w)/g, (g) => g.replace("-", "").toUpperCase());
}

export function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function sanitizeClassName(name: string): string {
  if (!name || typeof name !== "string") {
    return "component";
  }
  return name
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/^[^a-zA-Z_]/, "_")
    .replace(/--+/g, "-")
    .toLowerCase();
}

export function sanitizeComponentName(name: string): string {
  if (!name || typeof name !== "string") {
    return "FigmaComponent";
  }

  // Clean and normalize the name
  let cleanName = name
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, " ") // Replace special chars with spaces
    .replace(/\s+/g, " ") // Normalize whitespace
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

  // Ensure it starts with a letter
  if (!/^[a-zA-Z]/.test(cleanName)) {
    cleanName = "Component" + cleanName;
  }

  // Ensure it's not empty
  if (!cleanName) {
    return "FigmaComponent";
  }

  return cleanName;
}

export function formatPrettier(
  code: string,
  parser: string,
  _options: any = {},
): Promise<string> {
  try {
    // Basic code formatting for different languages
    if (parser === "typescript" || parser === "tsx") {
      return Promise.resolve(formatTypeScript(code));
    } else if (parser === "css") {
      return Promise.resolve(formatCSS(code));
    } else if (parser === "html") {
      return Promise.resolve(formatHTML(code));
    }
    return Promise.resolve(code);
  } catch (error) {
    console.warn("Code formatting failed, returning unformatted code:", error);
    return Promise.resolve(code);
  }
}

function formatTypeScript(code: string): string {
  // Basic indentation and formatting
  let formatted = code
    .split("\n")
    .map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      // Calculate indentation based on brackets
      let indent = 0;
      const prevLines = code.split("\n").slice(0, index);

      for (const prevLine of prevLines) {
        const openBrackets = (prevLine.match(/[{([]/g) || []).length;
        const closeBrackets = (prevLine.match(/[})]/g) || []).length;
        indent += openBrackets - closeBrackets;
      }

      // Adjust for current line closing brackets
      const currentClosing = (trimmed.match(/^[})]/g) || []).length;
      indent = Math.max(0, indent - currentClosing);

      return "  ".repeat(indent) + trimmed;
    })
    .join("\n");

  // Clean up extra blank lines
  formatted = formatted.replace(/\n\s*\n\s*\n/g, "\n\n");

  return formatted;
}

function formatCSS(code: string): string {
  // Format CSS with proper indentation
  const formatted = code
    .replace(/\s*{\s*/g, " {\n  ") // Opening braces
    .replace(/;\s*/g, ";\n  ") // Semicolons
    .replace(/\s*}\s*/g, "\n}\n") // Closing braces
    .replace(/\n\s*\n/g, "\n") // Remove empty lines
    .trim();

  // Clean up indentation
  const lines = formatted.split("\n");
  const result: string[] = [];
  let indent = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("}")) {
      indent = Math.max(0, indent - 1);
    }

    result.push("  ".repeat(indent) + trimmed);

    if (trimmed.endsWith("{")) {
      indent++;
    }
  }

  return result.join("\n");
}

function formatHTML(code: string): string {
  // Format HTML with proper indentation
  const formatted = code
    .replace(/>\s*</g, ">\n<") // Add newlines between tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  const lines = formatted.split("\n");
  const result: string[] = [];
  let indent = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Decrease indent for closing tags
    if (trimmed.startsWith("</") || trimmed.startsWith("<!")) {
      indent = Math.max(0, indent - 1);
    }

    result.push("  ".repeat(indent) + trimmed);

    // Increase indent for opening tags (not self-closing)
    if (
      trimmed.startsWith("<") &&
      !trimmed.startsWith("</") &&
      !trimmed.startsWith("<!") &&
      !trimmed.endsWith("/>") &&
      !trimmed.includes("</")
    ) {
      indent++;
    }
  }

  return result.join("\n");
}
