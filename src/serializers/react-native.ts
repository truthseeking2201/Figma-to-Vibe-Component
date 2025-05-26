/**
 * React Native Serializer - React Native components with StyleSheet
 */

import type {
  FigmaIRNode,
  FigmaFrameNode,
  FigmaTextNode,
  FigmaColor,
} from "../core/figma-ir";
import type { Serializer, GeneratedFile, GenCtx } from "./types";
import { register } from "./registry";
import { sanitizeComponentName, toCamelCase, formatPrettier } from "./utils";

function colorToRN(color: FigmaColor): string {
  if (color.a === 1) {
    return `'rgb(${color.r}, ${color.g}, ${color.b})'`;
  }
  return `'rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})'`;
}

function generateRNStyles(
  node: FigmaIRNode,
  _styleName: string,
): Record<string, unknown> {
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
    style.transform = [{ rotate: `${node.rotation}deg` }];
  }

  if (node.fills.length > 0 && node.fills[0]?.type === "solid") {
    style.backgroundColor = colorToRN(node.fills[0].color);
  }

  if (
    node.strokes.length > 0 &&
    node.strokes[0]?.type === "solid" &&
    node.strokes[0].color
  ) {
    style.borderWidth = node.strokes[0].weight;
    style.borderColor = colorToRN(node.strokes[0].color);
    style.borderStyle = "solid";
  }

  // React Native doesn't support complex box shadows, use elevation for Android
  const shadows = node.effects.filter(
    (e) => e.type === "drop-shadow" && e.color && e.offset,
  );
  if (shadows.length > 0) {
    const shadow = shadows[0]!;
    style.shadowColor = colorToRN(shadow.color!);
    style.shadowOffset = { width: shadow.offset!.x, height: shadow.offset!.y };
    style.shadowOpacity = shadow.color!.a;
    style.shadowRadius = shadow.radius;
    style.elevation = shadow.radius; // Android
  }

  if (
    node.cornerRadius.all ||
    Object.values(node.cornerRadius).some((v) => v && v > 0)
  ) {
    if (node.cornerRadius.all) {
      style.borderRadius = node.cornerRadius.all;
    } else {
      style.borderTopLeftRadius = node.cornerRadius.topLeft || 0;
      style.borderTopRightRadius = node.cornerRadius.topRight || 0;
      style.borderBottomLeftRadius = node.cornerRadius.bottomLeft || 0;
      style.borderBottomRightRadius = node.cornerRadius.bottomRight || 0;
    }
  }

  if (
    node.type === "frame" &&
    (node as FigmaFrameNode).layoutProps.mode !== "none"
  ) {
    const layout = (node as FigmaFrameNode).layoutProps;
    style.flexDirection = layout.mode === "horizontal" ? "row" : "column";
    style.gap = layout.itemSpacing;
    style.paddingTop = layout.padding.top;
    style.paddingRight = layout.padding.right;
    style.paddingBottom = layout.padding.bottom;
    style.paddingLeft = layout.padding.left;
  }

  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    const textStyle = textNode.textStyle;

    style.fontFamily = textStyle.fontFamily;
    style.fontWeight = textStyle.fontWeight.toString();
    style.fontSize = textStyle.fontSize;

    if (typeof textStyle.lineHeight === "number") {
      style.lineHeight = textStyle.lineHeight;
    }

    if (textStyle.letterSpacing !== 0) {
      style.letterSpacing = textStyle.letterSpacing;
    }

    style.textAlign = textStyle.textAlignHorizontal;

    if (textStyle.textDecoration !== "none") {
      style.textDecorationLine = textStyle.textDecoration;
    }

    if (textStyle.textCase !== "original") {
      // React Native doesn't have textTransform, would need to transform the text content
    }
  }

  return style;
}

function generateRNComponent(
  node: FigmaIRNode,
  componentName: string,
  styles: Record<string, any>,
): string {
  const styleName = toCamelCase((node.name || "component").replace(/[^a-zA-Z0-9]/g, ""));

  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    return `    <Text style={styles.${styleName}}>${textNode.characters || ""}</Text>`;
  }

  if (node.type === "frame" || node.type === "group") {
    const frameNode = node as FigmaFrameNode;
    const layout = frameNode.layoutProps;

    const ViewComponent = layout.mode !== "none" ? "View" : "View";

    if (frameNode.children && frameNode.children.length > 0) {
      const children = frameNode.children
        .map((child, i) =>
          generateRNComponent(child, `${componentName}Child${i}`, styles),
        )
        .join("\n");

      return `    <${ViewComponent} style={styles.${styleName}}>\n${children}\n    </${ViewComponent}>`;
    }

    return `    <${ViewComponent} style={styles.${styleName}} />`;
  }

  return `    <View style={styles.${styleName}} />`;
}

function collectStyles(node: FigmaIRNode, styles: Record<string, any>): void {
  const styleName = toCamelCase((node.name || "component").replace(/[^a-zA-Z0-9]/g, ""));
  styles[styleName] = generateRNStyles(node, styleName);

  if ("children" in node && node.children) {
    for (const child of node.children) {
      collectStyles(child, styles);
    }
  }
}

const reactNativeSerializer: Serializer = {
  id: "react-native",
  label: "React Native",
  description: "React Native component with StyleSheet",
  supportedOptions: ["componentName"],

  async generate(
    ir: FigmaIRNode,
    ctx: GenCtx,
  ): Promise<readonly GeneratedFile[]> {
    const componentName =
      ctx.options.componentName ||
      sanitizeComponentName(ir.name) ||
      "FigmaComponent";

    const styles: Record<string, any> = {};
    collectStyles(ir, styles);

    const componentCode = generateRNComponent(ir, componentName, styles);

    const stylesCode = Object.entries(styles)
      .map(([key, style]) => {
        const styleEntries = Object.entries(style)
          .map(
            ([prop, value]) =>
              `    ${prop}: ${typeof value === "string" ? value : JSON.stringify(value)},`,
          )
          .join("\n");
        return `  ${key}: {\n${styleEntries}\n  },`;
      })
      .join("\n");

    const code = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ${componentName}Props {
  style?: any;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
${componentCode}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
${stylesCode}
});

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

register(reactNativeSerializer);
