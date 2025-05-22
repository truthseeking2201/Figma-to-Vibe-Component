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
              type: fill.type.toLowerCase().replace("gradient_", "") as any,
              stops: fill.gradientStops.map((stop: any) => ({
                position: stop.position,
                color: normalizeColorWithOpacity(stop.color),
              })),
              transform: fill.gradientTransform,
            },
            opacity: fill.opacity,
          };
        case "IMAGE":
          return {
            type: "image",
            imageHash: fill.imageHash,
            scaleMode: fill.scaleMode
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
    "strokeAlign" in node ? (node.strokeAlign as string) : "inside";

  return node.strokes
    .filter((stroke) => stroke.visible !== false)
    .map((stroke): FigmaStroke => {
      switch (stroke.type) {
        case "SOLID":
          return {
            type: "solid",
            color: normalizeColorWithOpacity(stroke.color),
            weight: strokeWeight,
            align: strokeAlign.toLowerCase() as any,
            opacity: stroke.opacity,
          };
        case "GRADIENT_LINEAR":
        case "GRADIENT_RADIAL":
        case "GRADIENT_ANGULAR":
        case "GRADIENT_DIAMOND":
          return {
            type: "gradient",
            gradient: {
              type: stroke.type.toLowerCase().replace("gradient_", "") as any,
              stops: stroke.gradientStops.map((stop: any) => ({
                position: stop.position,
                color: normalizeColorWithOpacity(stop.color),
              })),
              transform: stroke.gradientTransform,
            },
            weight: strokeWeight,
            align: strokeAlign.toLowerCase() as any,
            opacity: stroke.opacity,
          };
        default:
          return {
            type: "solid",
            color: { r: 0, g: 0, b: 0, a: 1 },
            weight: strokeWeight,
            align: strokeAlign.toLowerCase() as any,
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
    fontFamily: fontName.family,
    fontWeight: parseInt(fontName.style.replace(/\D/g, "")) || 400,
    fontSize: node.fontSize as number,
    lineHeight:
      typeof lineHeight === "object" ? lineHeight.value || "auto" : lineHeight,
    letterSpacing:
      letterSpacing && letterSpacing.value ? letterSpacing.value : 0,
    textAlignHorizontal: node.textAlignHorizontal.toLowerCase() as any,
    textAlignVertical: node.textAlignVertical.toLowerCase() as any,
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
    exportSettings: "exportSettings" in node ? node.exportSettings : [],
  };
}

export function normalizeNode(node: SceneNode): FigmaIRNode {
  const base = normalizeBaseNode(node);

  switch (node.type) {
    case "FRAME":
    case "COMPONENT":
    case "INSTANCE": {
      const frameNode = node as FrameNode | ComponentNode | InstanceNode;
      return Object.assign({}, base, {
        type: node.type.toLowerCase() as "frame" | "component" | "instance",
        children:
          "children" in frameNode ? frameNode.children.map(normalizeNode) : [],
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
          "vectorPaths" in node ? JSON.stringify(node.vectorPaths) : undefined,
      }) as FigmaVectorNode;
    }

    case "GROUP": {
      const groupNode = node as GroupNode;
      return Object.assign({}, base, {
        type: "group",
        children: groupNode.children.map(normalizeNode),
      }) as FigmaGroupNode;
    }

    default:
      return Object.assign({}, base, {
        type: "vector",
      }) as FigmaVectorNode;
  }
}
