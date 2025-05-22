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
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  if (color.a === 1) {
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}${toHex(color.a * 255)}`;
}

export function fillToCss(fill: FigmaFill): string {
  switch (fill.type) {
    case "solid":
      return rgbaToString(fill.color);
    case "gradient": {
      const { gradient } = fill;
      const stops = gradient.stops
        .map(
          (stop) =>
            `${rgbaToString(stop.color)} ${Math.round(stop.position * 100)}%`,
        )
        .join(", ");

      switch (gradient.type) {
        case "linear":
          return `linear-gradient(90deg, ${stops})`;
        case "radial":
          return `radial-gradient(circle, ${stops})`;
        case "angular":
          return `conic-gradient(${stops})`;
        default:
          return rgbaToString(
            fill.gradient.stops[0]
              ? fill.gradient.stops[0].color
              : { r: 0, g: 0, b: 0, a: 1 },
          );
      }
    }
    case "image":
      return fill.imageHash
        ? `url('https://figma.com/file/${fill.imageHash}')`
        : "transparent";
    default:
      return "transparent";
  }
}

export function strokeToCss(stroke: FigmaStroke): string {
  const color = stroke.color ? rgbaToString(stroke.color) : "transparent";
  return `${stroke.weight}px solid ${color}`;
}

export function effectToCss(effect: FigmaEffect): string {
  switch (effect.type) {
    case "drop-shadow":
      if (!effect.color || !effect.offset) return "";
      return `${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px ${effect.spread || 0}px ${rgbaToString(effect.color)}`;
    case "inner-shadow":
      if (!effect.color || !effect.offset) return "";
      return `inset ${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px ${effect.spread || 0}px ${rgbaToString(effect.color)}`;
    case "blur":
      return `blur(${effect.radius}px)`;
    case "background-blur":
      return `blur(${effect.radius}px)`;
    default:
      return "";
  }
}

export function cornerRadiusToCss(radius: FigmaCornerRadius): string {
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
  return str.replace(/-([a-z])/g, (g) => g[1]!.toUpperCase());
}

export function toPascalCase(str: string): string {
  return str.replace(/(^\w|-\w)/g, (g) => g.replace("-", "").toUpperCase());
}

export function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function sanitizeClassName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/^[^a-zA-Z_]/, "_")
    .replace(/--+/g, "-")
    .toLowerCase();
}

export function sanitizeComponentName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^[^a-zA-Z]/, "Component")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function formatPrettier(
  code: string,
  _parser: string,
  _options: unknown = {},
): Promise<string> {
  // Note: In a real implementation, we'd use prettier/standalone here
  // For now, return formatted code with basic indentation
  return Promise.resolve(code);
}
