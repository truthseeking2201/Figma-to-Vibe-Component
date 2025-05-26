/**
 * Flutter Serializer - Dart widgets
 */

import type {
  FigmaIRNode,
  FigmaFrameNode,
  FigmaTextNode,
  FigmaColor,
} from "../core/figma-ir";
import type { Serializer, GeneratedFile, GenCtx } from "./types";
import { register } from "./registry";
import { sanitizeComponentName, formatPrettier } from "./utils";

function colorToDart(color: FigmaColor): string {
  const alpha = Math.round(color.a * 255);
  const red = color.r;
  const green = color.g;
  const blue = color.b;

  if (alpha === 255) {
    return `Color(0xFF${red.toString(16).padStart(2, "0")}${green.toString(16).padStart(2, "0")}${blue.toString(16).padStart(2, "0")})`;
  }

  return `Color.fromARGB(${alpha}, ${red}, ${green}, ${blue})`;
}

function generateFlutterWidget(
  node: FigmaIRNode,
  indent: string = "      ",
): string {
  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    const style = textNode.textStyle;

    let textWidget = `Text(\n${indent}  '${(textNode.characters || "").replace(/'/g, "\\'")}',`;

    textWidget += `\n${indent}  style: TextStyle(`;
    textWidget += `\n${indent}    fontFamily: '${style.fontFamily}',`;
    textWidget += `\n${indent}    fontWeight: FontWeight.w${style.fontWeight},`;
    textWidget += `\n${indent}    fontSize: ${style.fontSize},`;

    if (typeof style.lineHeight === "number") {
      textWidget += `\n${indent}    height: ${(style.lineHeight / style.fontSize).toFixed(2)},`;
    }

    if (style.letterSpacing !== 0) {
      textWidget += `\n${indent}    letterSpacing: ${style.letterSpacing},`;
    }

    if (node.fills.length > 0 && node.fills[0]?.type === "solid") {
      textWidget += `\n${indent}    color: ${colorToDart(node.fills[0].color)},`;
    }

    textWidget += `\n${indent}  ),`;

    if (style.textAlignHorizontal !== "left") {
      const alignMap = {
        center: "TextAlign.center",
        right: "TextAlign.right",
        justified: "TextAlign.justify",
      };
      textWidget += `\n${indent}  textAlign: ${alignMap[style.textAlignHorizontal as keyof typeof alignMap] || "TextAlign.left"},`;
    }

    textWidget += `\n${indent})`;

    return wrapWithContainer(textWidget, node, indent);
  }

  if (node.type === "frame" || node.type === "group") {
    const frameNode = node as FigmaFrameNode;
    const layout = frameNode.layoutProps;

    if (frameNode.children && frameNode.children.length > 0) {
      let widget: string;

      if (layout.mode === "horizontal") {
        widget = `Row(\n${indent}  children: [\n`;
        widget += frameNode.children
          .map(
            (child) =>
              `${indent}    ${generateFlutterWidget(child, indent + "    ")},`,
          )
          .join("\n");
        widget += `\n${indent}  ],\n${indent})`;
      } else if (layout.mode === "vertical") {
        widget = `Column(\n${indent}  children: [\n`;
        widget += frameNode.children
          .map(
            (child) =>
              `${indent}    ${generateFlutterWidget(child, indent + "    ")},`,
          )
          .join("\n");
        widget += `\n${indent}  ],\n${indent})`;
      } else {
        widget = `Stack(\n${indent}  children: [\n`;
        widget += frameNode.children
          .map((child) => {
            const childWidget = generateFlutterWidget(child, indent + "      ");
            return `${indent}    Positioned(\n${indent}      left: ${child.x},\n${indent}      top: ${child.y},\n${indent}      child: ${childWidget},\n${indent}    ),`;
          })
          .join("\n");
        widget += `\n${indent}  ],\n${indent})`;
      }

      return wrapWithContainer(widget, node, indent);
    }

    return wrapWithContainer("SizedBox()", node, indent);
  }

  return wrapWithContainer("SizedBox()", node, indent);
}

function wrapWithContainer(
  widget: string,
  node: FigmaIRNode,
  indent: string,
): string {
  const decorationProps: string[] = [];

  if (node.fills.length > 0 && node.fills[0]?.type === "solid") {
    decorationProps.push(`color: ${colorToDart(node.fills[0].color)}`);
  }

  if (
    node.cornerRadius.all ||
    Object.values(node.cornerRadius).some((v) => v && v > 0)
  ) {
    if (node.cornerRadius.all) {
      decorationProps.push(
        `borderRadius: BorderRadius.circular(${node.cornerRadius.all})`,
      );
    } else {
      const tl = node.cornerRadius.topLeft || 0;
      const tr = node.cornerRadius.topRight || 0;
      const bl = node.cornerRadius.bottomLeft || 0;
      const br = node.cornerRadius.bottomRight || 0;
      decorationProps.push(
        `borderRadius: BorderRadius.only(topLeft: Radius.circular(${tl}), topRight: Radius.circular(${tr}), bottomLeft: Radius.circular(${bl}), bottomRight: Radius.circular(${br}))`,
      );
    }
  }

  if (
    node.strokes.length > 0 &&
    node.strokes[0]?.type === "solid" &&
    node.strokes[0].color
  ) {
    decorationProps.push(
      `border: Border.all(color: ${colorToDart(node.strokes[0].color)}, width: ${node.strokes[0].weight})`,
    );
  }

  if (node.effects.length > 0) {
    const shadows = node.effects
      .filter((e) => e.type === "drop-shadow" && e.color && e.offset)
      .map(
        (e) =>
          `BoxShadow(color: ${colorToDart(e.color!)}, offset: Offset(${e.offset!.x}, ${e.offset!.y}), blurRadius: ${e.radius}, spreadRadius: ${e.spread || 0})`,
      )
      .join(", ");

    if (shadows) {
      decorationProps.push(`boxShadow: [${shadows}]`);
    }
  }

  let result = `Container(\n${indent}  width: ${node.width},\n${indent}  height: ${node.height},`;

  if (decorationProps.length > 0) {
    result += `\n${indent}  decoration: BoxDecoration(\n${indent}    ${decorationProps.join(`,\n${indent}    `)},\n${indent}  ),`;
  }

  if (node.opacity !== 1) {
    result += `\n${indent}  child: Opacity(\n${indent}    opacity: ${node.opacity},\n${indent}    child: ${widget},\n${indent}  ),`;
  } else {
    result += `\n${indent}  child: ${widget},`;
  }

  result += `\n${indent})`;

  return result;
}

const flutterSerializer: Serializer = {
  id: "flutter",
  label: "Flutter",
  description: "Flutter Dart widget code",
  supportedOptions: ["nullSafety", "componentName"],

  async generate(
    ir: FigmaIRNode,
    ctx: GenCtx,
  ): Promise<readonly GeneratedFile[]> {
    const componentName =
      ctx.options.componentName ||
      sanitizeComponentName(ir.name) ||
      "FigmaWidget";
    const widgetCode = generateFlutterWidget(ir);

    const code = `import 'package:flutter/material.dart';

class ${componentName} extends StatelessWidget {
  const ${componentName}({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ${widgetCode};
  }
}`;

    return [
      {
        filename: `${componentName.toLowerCase()}.dart`,
        code: await formatPrettier(code, "dart", ctx.prettierOptions),
        language: "dart",
      },
    ];
  },
};

register(flutterSerializer);
