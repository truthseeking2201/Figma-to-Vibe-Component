/**
 * Normalizer: Pure, type-safe coercion from Figma API to IR
 */

import type {
  FigmaIRNode,
  FigmaBaseNode,
  FigmaFrameNode,
  FigmaTextNode,
  FigmaVectorNode,
  FigmaGroupNode,
  FigmaColor,
  FigmaFill,
  FigmaStroke,
  FigmaEffect,
  FigmaLayoutProps,
  FigmaCornerRadius,
  FigmaTextStyle,
  FigmaConstraints,
} from "./figma-ir";

// Helper functions to safely serialize data and avoid symbols
function safeStringify(obj: any): string | undefined {
  try {
    // First try to detect if object contains symbols or non-serializable data
    JSON.stringify(obj);
    return JSON.stringify(obj);
  } catch (error) {
    console.warn(
      "Could not stringify object, contains non-serializable data:",
      error,
    );
    return undefined;
  }
}

function safeCopyArray(arr: any): readonly number[][] | undefined {
  if (!arr || !Array.isArray(arr)) {
    return undefined;
  }

  try {
    // Deep copy array of arrays (for transform matrices)
    const copy: number[][] = [];

    for (const row of arr) {
      if (Array.isArray(row)) {
        copy.push(row.map((val: any) => (typeof val === "number" ? val : 0)));
      } else {
        // If it's not a 2D array, skip it to maintain type safety
        console.warn(
          "Expected 2D array for transform matrix, skipping non-array row",
        );
      }
    }

    // Validate it's serializable
    JSON.stringify(copy);
    return copy;
  } catch (error) {
    console.warn(
      "Could not safely copy array, contains non-serializable data:",
      error,
    );
    return undefined;
  }
}

function safeSerializeArray(arr: any): readonly any[] {
  if (!arr || !Array.isArray(arr)) {
    return [];
  }

  try {
    // Filter out non-serializable items
    const serializable = arr.filter((item) => {
      try {
        JSON.stringify(item);
        return true;
      } catch {
        return false;
      }
    });

    return serializable;
  } catch (error) {
    console.warn("Could not serialize array:", error);
    return [];
  }
}

// Final safety check to ensure the entire IR is serializable
function sanitizeIRNode(node: FigmaIRNode): FigmaIRNode {
  try {
    // Test full serialization
    const serialized = JSON.stringify(node);
    const parsed = JSON.parse(serialized);
    return parsed;
  } catch (error) {
    console.error(
      "IR node contains non-serializable data, returning fallback:",
      error,
    );
    // Return a minimal fallback node
    return {
      id: node.id || "fallback",
      name: node.name || "Unknown",
      type: "vector",
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      opacity: 1,
      fills: [],
      strokes: [],
      effects: [],
      constraints: { horizontal: "left", vertical: "top" },
      cornerRadius: {},
      blendMode: "normal",
      exportSettings: [],
    } as FigmaIRNode;
  }
}

function normalizeColorWithOpacity(color: RGBA): FigmaColor {
  return {
    r: Math.round(color.r * 255),
    g: Math.round(color.g * 255),
    b: Math.round(color.b * 255),
    a: color.a,
  };
}

function normalizeFills(
  fills: readonly Paint[] | typeof figma.mixed,
): readonly FigmaFill[] {
  if (fills === figma.mixed || !Array.isArray(fills)) {
    return [];
  }

  return fills
    .filter((fill) => fill.visible !== false)
    .map((fill): FigmaFill => {
      switch (fill.type) {
        case "SOLID":
          return {
            type: "solid",
            color: normalizeColorWithOpacity(fill.color),
            opacity: fill.opacity,
          };
        case "GRADIENT_LINEAR":
        case "GRADIENT_RADIAL":
        case "GRADIENT_ANGULAR":
        case "GRADIENT_DIAMOND":
          return {
            type: "gradient",
            gradient: {
              type: (fill.type
                ? fill.type.toLowerCase().replace("gradient_", "")
                : "linear") as any,
              stops:
                fill.gradientStops && Array.isArray(fill.gradientStops)
                  ? fill.gradientStops.map((stop: any) => ({
                      position:
                        stop && typeof stop.position === "number"
                          ? stop.position
                          : 0,
                      color:
                        stop && stop.color
                          ? normalizeColorWithOpacity(stop.color)
                          : { r: 0, g: 0, b: 0, a: 1 },
                    }))
                  : [],
              transform: safeCopyArray(fill.gradientTransform),
            },
            opacity: fill.opacity,
          };
        case "IMAGE":
          return {
            type: "image",
            imageHash: fill.imageHash,
            scaleMode:
              fill.scaleMode && typeof fill.scaleMode === "string"
                ? (fill.scaleMode.toLowerCase() as any)
                : "fill",
            opacity: fill.opacity,
          };
        default:
          return {
            type: "solid",
            color: { r: 0, g: 0, b: 0, a: 1 },
          };
      }
    });
}

function normalizeStrokes(node: SceneNode): readonly FigmaStroke[] {
  if (!("strokes" in node) || !Array.isArray(node.strokes)) {
    return [];
  }

  const strokeWeight =
    "strokeWeight" in node ? (node.strokeWeight as number) : 1;
  const strokeAlign =
    "strokeAlign" in node && node.strokeAlign
      ? (node.strokeAlign as string)
      : "inside";

  return node.strokes
    .filter((stroke) => stroke.visible !== false)
    .map((stroke): FigmaStroke => {
      switch (stroke.type) {
        case "SOLID":
          return {
            type: "solid",
            color: normalizeColorWithOpacity(stroke.color),
            weight: strokeWeight,
            align: (strokeAlign ? strokeAlign.toLowerCase() : "inside") as any,
            opacity: stroke.opacity,
          };
        case "GRADIENT_LINEAR":
        case "GRADIENT_RADIAL":
        case "GRADIENT_ANGULAR":
        case "GRADIENT_DIAMOND":
          return {
            type: "gradient",
            gradient: {
              type: (stroke.type
                ? stroke.type.toLowerCase().replace("gradient_", "")
                : "linear") as any,
              stops:
                stroke.gradientStops && Array.isArray(stroke.gradientStops)
                  ? stroke.gradientStops.map((stop: any) => ({
                      position:
                        stop && typeof stop.position === "number"
                          ? stop.position
                          : 0,
                      color:
                        stop && stop.color
                          ? normalizeColorWithOpacity(stop.color)
                          : { r: 0, g: 0, b: 0, a: 1 },
                    }))
                  : [],
              transform: safeCopyArray(stroke.gradientTransform),
            },
            weight: strokeWeight,
            align: (strokeAlign ? strokeAlign.toLowerCase() : "inside") as any,
            opacity: stroke.opacity,
          };
        default:
          return {
            type: "solid",
            color: { r: 0, g: 0, b: 0, a: 1 },
            weight: strokeWeight,
            align: (strokeAlign ? strokeAlign.toLowerCase() : "inside") as any,
          };
      }
    });
}

function normalizeEffects(effects: readonly Effect[]): readonly FigmaEffect[] {
  return effects
    .filter((effect: any) => effect.visible !== false)
    .map((effect: any): FigmaEffect => {
      switch (effect.type) {
        case "DROP_SHADOW":
          return {
            type: "drop-shadow",
            visible: effect.visible,
            radius: effect.radius,
            color: normalizeColorWithOpacity(effect.color),
            offset: effect.offset,
            spread: effect.spread,
          };
        case "INNER_SHADOW":
          return {
            type: "inner-shadow",
            visible: effect.visible,
            radius: effect.radius,
            color: normalizeColorWithOpacity(effect.color),
            offset: effect.offset,
            spread: effect.spread,
          };
        case "LAYER_BLUR":
          return {
            type: "blur",
            visible: effect.visible,
            radius: effect.radius,
          };
        case "BACKGROUND_BLUR":
          return {
            type: "background-blur",
            visible: effect.visible,
            radius: effect.radius,
          };
        default:
          return {
            type: "blur",
            visible: effect.visible,
            radius: 0,
          };
      }
    });
}

function normalizeConstraints(node: SceneNode): FigmaConstraints {
  if (!("constraints" in node)) {
    return { horizontal: "left", vertical: "top" };
  }

  const constraints = node.constraints;
  return {
    horizontal: constraints.horizontal.toLowerCase() as any,
    vertical: constraints.vertical.toLowerCase() as any,
  };
}

function normalizeCornerRadius(node: SceneNode): FigmaCornerRadius {
  const result: any = {};

  if ("cornerRadius" in node && typeof node.cornerRadius === "number") {
    result.all = node.cornerRadius;
  }

  if ("topLeftRadius" in node) result.topLeft = node.topLeftRadius as number;
  if ("topRightRadius" in node) result.topRight = node.topRightRadius as number;
  if ("bottomLeftRadius" in node)
    result.bottomLeft = node.bottomLeftRadius as number;
  if ("bottomRightRadius" in node)
    result.bottomRight = node.bottomRightRadius as number;

  return result;
}

function normalizeLayoutProps(
  node: FrameNode | ComponentNode | InstanceNode,
): FigmaLayoutProps {
  return {
    mode: node.layoutMode ? (node.layoutMode.toLowerCase() as any) : "none",
    primaryAxisSizingMode: node.primaryAxisSizingMode
      ? (node.primaryAxisSizingMode.toLowerCase() as any)
      : "fixed",
    counterAxisSizingMode: node.counterAxisSizingMode
      ? (node.counterAxisSizingMode.toLowerCase() as any)
      : "fixed",
    primaryAxisAlignItems: node.primaryAxisAlignItems
      ? (node.primaryAxisAlignItems.toLowerCase() as any)
      : "min",
    counterAxisAlignItems: node.counterAxisAlignItems
      ? (node.counterAxisAlignItems.toLowerCase() as any)
      : "min",
    itemSpacing: node.itemSpacing || 0,
    padding: {
      top: node.paddingTop || 0,
      right: node.paddingRight || 0,
      bottom: node.paddingBottom || 0,
      left: node.paddingLeft || 0,
    },
  };
}

function normalizeTextStyle(node: TextNode): FigmaTextStyle {
  const fontName = node.fontName as any;
  const lineHeight = node.lineHeight as any;
  const letterSpacing = node.letterSpacing as any;

  return {
    fontFamily: fontName && fontName.family ? fontName.family : "Inter",
    fontWeight:
      parseInt(
        fontName && fontName.style ? fontName.style.replace(/\D/g, "") : "400",
      ) || 400,
    fontSize: (node.fontSize as number) || 16,
    lineHeight:
      typeof lineHeight === "object"
        ? lineHeight.value || "auto"
        : lineHeight || "auto",
    letterSpacing:
      letterSpacing && letterSpacing.value ? letterSpacing.value : 0,
    textAlignHorizontal: node.textAlignHorizontal
      ? (node.textAlignHorizontal.toLowerCase() as any)
      : "left",
    textAlignVertical: node.textAlignVertical
      ? (node.textAlignVertical.toLowerCase() as any)
      : "top",
    textDecoration: (node.textDecoration as any)
      ? (node.textDecoration as any).toLowerCase()
      : "none",
    textCase: (node.textCase as any)
      ? (node.textCase as any).toLowerCase()
      : "original",
  };
}

function normalizeBaseNode(node: SceneNode): FigmaBaseNode {
  return {
    id: node.id,
    name: node.name,
    type: node.type.toLowerCase(),
    visible: node.visible,
    locked: node.locked || false,
    x: "x" in node ? node.x : 0,
    y: "y" in node ? node.y : 0,
    width: "width" in node ? node.width : 0,
    height: "height" in node ? node.height : 0,
    rotation: "rotation" in node ? node.rotation : 0,
    opacity: "opacity" in node ? node.opacity : 1,
    fills: "fills" in node ? normalizeFills(node.fills) : [],
    strokes: normalizeStrokes(node),
    effects: "effects" in node ? normalizeEffects(node.effects) : [],
    constraints: normalizeConstraints(node),
    cornerRadius: normalizeCornerRadius(node),
    blendMode: "blendMode" in node ? node.blendMode : "normal",
    exportSettings:
      "exportSettings" in node ? safeSerializeArray(node.exportSettings) : [],
  };
}

const MAX_RECURSION_DEPTH = 100;
const MAX_CHILDREN_COUNT = 1000;

function normalizeNodeWithDepth(
  node: SceneNode,
  depth: number = 0,
): FigmaIRNode {
  // Prevent infinite recursion and stack overflow
  if (depth > MAX_RECURSION_DEPTH) {
    console.warn(
      `Maximum recursion depth (${MAX_RECURSION_DEPTH}) exceeded for node: ${node.name}`,
    );
    return normalizeBaseNode(node) as FigmaIRNode;
  }

  const base = normalizeBaseNode(node);

  switch (node.type) {
    case "FRAME":
    case "COMPONENT":
    case "INSTANCE": {
      const frameNode = node as FrameNode | ComponentNode | InstanceNode;
      let children: readonly FigmaIRNode[] = [];

      try {
        if ("children" in frameNode && frameNode.children) {
          // Limit the number of children processed to prevent performance issues
          const childrenToProcess = frameNode.children.slice(
            0,
            MAX_CHILDREN_COUNT,
          );

          if (frameNode.children.length > MAX_CHILDREN_COUNT) {
            console.warn(
              `Too many children (${frameNode.children.length}) in node: ${node.name}. Processing first ${MAX_CHILDREN_COUNT} only.`,
            );
          }

          children = childrenToProcess.map((child, index) => {
            try {
              return normalizeNodeWithDepth(child, depth + 1);
            } catch (error) {
              console.error(
                `Error processing child ${index} of node ${node.name}:`,
                error,
              );
              // Return a minimal fallback node instead of failing completely
              return Object.assign({}, normalizeBaseNode(child), {
                type: "vector",
              }) as FigmaIRNode;
            }
          });
        }
      } catch (error) {
        console.error(`Error processing children of node ${node.name}:`, error);
        children = [];
      }

      return Object.assign({}, base, {
        type: node.type.toLowerCase() as "frame" | "component" | "instance",
        children: children,
        layoutProps: normalizeLayoutProps(frameNode),
        clipsContent: frameNode.clipsContent || false,
        background:
          "backgrounds" in frameNode
            ? normalizeFills(frameNode.backgrounds)
            : [],
      }) as FigmaFrameNode;
    }

    case "TEXT": {
      const textNode = node as TextNode;
      return Object.assign({}, base, {
        type: "text",
        characters: textNode.characters,
        textStyle: normalizeTextStyle(textNode),
      }) as FigmaTextNode;
    }

    case "VECTOR":
    case "STAR":
    case "POLYGON":
    case "ELLIPSE":
    case "RECTANGLE": {
      return Object.assign({}, base, {
        type: node.type.toLowerCase() as
          | "vector"
          | "star"
          | "polygon"
          | "ellipse"
          | "rectangle",
        vectorData:
          "vectorPaths" in node ? safeStringify(node.vectorPaths) : undefined,
      }) as FigmaVectorNode;
    }

    case "GROUP": {
      const groupNode = node as GroupNode;
      let children: readonly FigmaIRNode[] = [];

      try {
        if (groupNode.children) {
          // Limit the number of children processed to prevent performance issues
          const childrenToProcess = groupNode.children.slice(
            0,
            MAX_CHILDREN_COUNT,
          );

          if (groupNode.children.length > MAX_CHILDREN_COUNT) {
            console.warn(
              `Too many children (${groupNode.children.length}) in group: ${node.name}. Processing first ${MAX_CHILDREN_COUNT} only.`,
            );
          }

          children = childrenToProcess.map((child, index) => {
            try {
              return normalizeNodeWithDepth(child, depth + 1);
            } catch (error) {
              console.error(
                `Error processing child ${index} of group ${node.name}:`,
                error,
              );
              // Return a minimal fallback node instead of failing completely
              return Object.assign({}, normalizeBaseNode(child), {
                type: "vector",
              }) as FigmaIRNode;
            }
          });
        }
      } catch (error) {
        console.error(
          `Error processing children of group ${node.name}:`,
          error,
        );
        children = [];
      }

      return Object.assign({}, base, {
        type: "group",
        children: children,
      }) as FigmaGroupNode;
    }

    default:
      return Object.assign({}, base, {
        type: "vector",
      }) as FigmaVectorNode;
  }
}

export function normalizeNode(node: SceneNode): FigmaIRNode {
  try {
    const normalizedNode = normalizeNodeWithDepth(node, 0);
    // Final sanitization to ensure it's serializable
    return sanitizeIRNode(normalizedNode);
  } catch (error) {
    console.error(`Critical error normalizing node ${node.name}:`, error);
    // Return a minimal fallback to prevent complete failure
    const fallback = Object.assign({}, normalizeBaseNode(node), {
      type: "vector",
    }) as FigmaIRNode;
    return sanitizeIRNode(fallback);
  }
}
