/**
 * SwiftUI Serializer - Swift view code
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

function colorToSwift(color: FigmaColor): string {
  if (color.a === 1) {
    return `Color(red: ${(color.r / 255).toFixed(3)}, green: ${(color.g / 255).toFixed(3)}, blue: ${(color.b / 255).toFixed(3)})`;
  }
  return `Color(red: ${(color.r / 255).toFixed(3)}, green: ${(color.g / 255).toFixed(3)}, blue: ${(color.b / 255).toFixed(3)}, opacity: ${color.a.toFixed(3)})`;
}

function generateSwiftUIView(
  node: FigmaIRNode,
  indent: string = "        ",
): string {
  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    const style = textNode.textStyle;

    let textView = `Text("${(textNode.characters || "").replace(/"/g, '\\"')}")`;

    textView += `\n${indent}    .font(.custom("${style.fontFamily}", size: ${style.fontSize}))`;

    if (style.fontWeight !== 400) {
      const weightMap: Record<number, string> = {
        100: ".ultraLight",
        200: ".thin",
        300: ".light",
        400: ".regular",
        500: ".medium",
        600: ".semibold",
        700: ".bold",
        800: ".heavy",
        900: ".black",
      };
      textView += `\n${indent}    .fontWeight(${weightMap[style.fontWeight] || ".regular"})`;
    }

    if (typeof style.lineHeight === "number") {
      textView += `\n${indent}    .lineSpacing(${style.lineHeight - style.fontSize})`;
    }

    if (style.letterSpacing !== 0) {
      textView += `\n${indent}    .kerning(${style.letterSpacing})`;
    }

    if (node.fills.length > 0 && node.fills[0]?.type === "solid") {
      textView += `\n${indent}    .foregroundColor(${colorToSwift(node.fills[0].color)})`;
    }

    const alignMap = {
      center: ".center",
      right: ".trailing",
      justified: ".center",
    };
    if (style.textAlignHorizontal !== "left") {
      textView += `\n${indent}    .multilineTextAlignment(${alignMap[style.textAlignHorizontal as keyof typeof alignMap] || ".leading"})`;
    }

    if (style.textCase !== "original") {
      const caseMap = {
        upper: ".uppercase",
        lower: ".lowercase",
      };
      if (caseMap[style.textCase as keyof typeof caseMap]) {
        textView += `\n${indent}    .textCase(${caseMap[style.textCase as keyof typeof caseMap]})`;
      }
    }

    return applyModifiers(textView, node, indent);
  }

  if (node.type === "frame" || node.type === "group") {
    const frameNode = node as FigmaFrameNode;
    const layout = frameNode.layoutProps;

    if (frameNode.children && frameNode.children.length > 0) {
      let stackView: string;

      if (layout.mode === "horizontal") {
        stackView = `HStack(spacing: ${layout.itemSpacing}) {\n`;
        stackView += frameNode.children
          .map(
            (child) =>
              `${indent}    ${generateSwiftUIView(child, indent + "    ")}`,
          )
          .join("\n");
        stackView += `\n${indent}}`;
      } else if (layout.mode === "vertical") {
        stackView = `VStack(spacing: ${layout.itemSpacing}) {\n`;
        stackView += frameNode.children
          .map(
            (child) =>
              `${indent}    ${generateSwiftUIView(child, indent + "    ")}`,
          )
          .join("\n");
        stackView += `\n${indent}}`;
      } else {
        stackView = `ZStack {\n`;
        stackView += frameNode.children
          .map(
            (child) =>
              `${indent}    ${generateSwiftUIView(child, indent + "    ")}\n${indent}        .offset(x: ${child.x}, y: ${child.y})`,
          )
          .join("\n");
        stackView += `\n${indent}}`;
      }

      if (
        layout.padding.top ||
        layout.padding.left ||
        layout.padding.bottom ||
        layout.padding.right
      ) {
        stackView += `\n${indent}    .padding(.init(top: ${layout.padding.top}, leading: ${layout.padding.left}, bottom: ${layout.padding.bottom}, trailing: ${layout.padding.right}))`;
      }

      return applyModifiers(stackView, node, indent);
    }

    return applyModifiers("Rectangle()", node, indent);
  }

  return applyModifiers("Rectangle()", node, indent);
}

function applyModifiers(
  view: string,
  node: FigmaIRNode,
  indent: string,
): string {
  let result = view;

  result += `\n${indent}    .frame(width: ${node.width}, height: ${node.height})`;

  if (node.fills.length > 0 && node.fills[0]?.type === "solid") {
    result += `\n${indent}    .background(${colorToSwift(node.fills[0].color)})`;
  }

  if (
    node.cornerRadius.all ||
    Object.values(node.cornerRadius).some((v) => v && v > 0)
  ) {
    if (node.cornerRadius.all) {
      result += `\n${indent}    .cornerRadius(${node.cornerRadius.all})`;
    } else {
      // SwiftUI doesn't support individual corner radius easily, use RoundedRectangle
      result = `RoundedRectangle(cornerRadius: ${node.cornerRadius.topLeft || 0})\n${indent}    .fill(${node.fills.length > 0 && node.fills[0]?.type === "solid" ? colorToSwift(node.fills[0].color) : "Color.clear"})\n${indent}    .frame(width: ${node.width}, height: ${node.height})`;
    }
  }

  if (
    node.strokes.length > 0 &&
    node.strokes[0]?.type === "solid" &&
    node.strokes[0].color
  ) {
    result += `\n${indent}    .overlay(\n${indent}        RoundedRectangle(cornerRadius: ${node.cornerRadius.all || 0})\n${indent}            .stroke(${colorToSwift(node.strokes[0].color)}, lineWidth: ${node.strokes[0].weight})\n${indent}    )`;
  }

  if (node.effects.length > 0) {
    const shadow = node.effects.find(
      (e) => e.type === "drop-shadow" && e.color && e.offset,
    );
    if (shadow) {
      result += `\n${indent}    .shadow(color: ${colorToSwift(shadow.color!)}, radius: ${shadow.radius}, x: ${shadow.offset!.x}, y: ${shadow.offset!.y})`;
    }
  }

  if (node.opacity !== 1) {
    result += `\n${indent}    .opacity(${node.opacity})`;
  }

  if (node.rotation !== 0) {
    result += `\n${indent}    .rotationEffect(.degrees(${node.rotation}))`;
  }

  return result;
}

const swiftUISerializer: Serializer = {
  id: "swiftui",
  label: "SwiftUI",
  description: "SwiftUI view code for iOS/macOS",
  supportedOptions: ["iosCompat", "componentName"],

  async generate(
    ir: FigmaIRNode,
    ctx: GenCtx,
  ): Promise<readonly GeneratedFile[]> {
    const componentName =
      ctx.options.componentName ||
      sanitizeComponentName(ir.name) ||
      "FigmaView";
    const viewCode = generateSwiftUIView(ir);

    const code = `import SwiftUI

struct ${componentName}: View {
    var body: some View {
${viewCode}
    }
}

struct ${componentName}_Previews: PreviewProvider {
    static var previews: some View {
        ${componentName}()
    }
}`;

    return [
      {
        filename: `${componentName}.swift`,
        code: await formatPrettier(code, "swift", ctx.prettierOptions),
        language: "swift",
      },
    ];
  },
};

register(swiftUISerializer);
