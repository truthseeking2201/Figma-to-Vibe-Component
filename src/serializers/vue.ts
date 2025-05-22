/**
 * Vue 3 Serializer - Vue single file component
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
  sanitizeClassName,
  formatPrettier,
} from "./utils";

function generateVueTemplate(node: FigmaIRNode): string {
  const className = sanitizeClassName(node.name);

  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    return `  <p class="${className}">${textNode.characters}</p>`;
  }

  if (node.type === "frame" || node.type === "group") {
    const frameNode = node as FigmaFrameNode;
    const children =
      frameNode.children?.map(generateVueTemplate).join("\n") || "";

    if (children) {
      return `  <div class="${className}">\n${children}\n  </div>`;
    }
    return `  <div class="${className}"></div>`;
  }

  return `  <div class="${className}"></div>`;
}

function generateVueStyles(node: FigmaIRNode): string {
  const className = sanitizeClassName(node.name);
  const fills = node.fills.map(fillToCss).filter(Boolean);
  const strokes = node.strokes.map(strokeToCss).filter(Boolean);
  const effects = node.effects.map(effectToCss).filter(Boolean);

  const styles: string[] = [
    `position: absolute;`,
    `left: ${node.x}px;`,
    `top: ${node.y}px;`,
    `width: ${node.width}px;`,
    `height: ${node.height}px;`,
  ];

  if (node.opacity !== 1) {
    styles.push(`opacity: ${node.opacity};`);
  }

  if (node.rotation !== 0) {
    styles.push(`transform: rotate(${node.rotation}deg);`);
  }

  if (fills.length > 0) {
    styles.push(`background: ${fills[0]};`);
  }

  if (strokes.length > 0) {
    styles.push(`border: ${strokes[0]};`);
  }

  if (effects.length > 0) {
    const shadows = effects.filter((e) => e.includes("px"));
    const filters = effects.filter((e) => e.includes("blur"));

    if (shadows.length > 0) {
      styles.push(`box-shadow: ${shadows.join(", ")};`);
    }

    if (filters.length > 0) {
      styles.push(`filter: ${filters.join(" ")};`);
    }
  }

  const borderRadius = cornerRadiusToCss(node.cornerRadius);
  if (borderRadius !== "0px") {
    styles.push(`border-radius: ${borderRadius};`);
  }

  if (
    node.type === "frame" &&
    (node as FigmaFrameNode).layoutProps.mode !== "none"
  ) {
    const layout = (node as FigmaFrameNode).layoutProps;
    styles.push(`display: flex;`);

    if (layout.mode === "horizontal") {
      styles.push(`flex-direction: row;`);
    } else if (layout.mode === "vertical") {
      styles.push(`flex-direction: column;`);
    }

    styles.push(`gap: ${layout.itemSpacing}px;`);
    styles.push(
      `padding: ${layout.padding.top}px ${layout.padding.right}px ${layout.padding.bottom}px ${layout.padding.left}px;`,
    );
  }

  if (node.type === "text") {
    const textNode = node as FigmaTextNode;
    const style = textNode.textStyle;

    styles.push(`font-family: "${style.fontFamily}";`);
    styles.push(`font-weight: ${style.fontWeight};`);
    styles.push(`font-size: ${style.fontSize}px;`);

    if (typeof style.lineHeight === "number") {
      styles.push(`line-height: ${style.lineHeight}px;`);
    }

    if (style.letterSpacing !== 0) {
      styles.push(`letter-spacing: ${style.letterSpacing}px;`);
    }

    styles.push(`text-align: ${style.textAlignHorizontal};`);

    if (style.textDecoration !== "none") {
      styles.push(`text-decoration: ${style.textDecoration};`);
    }

    if (style.textCase !== "original") {
      styles.push(`text-transform: ${style.textCase};`);
    }
  }

  let result = `.${className} {\n  ${styles.join("\n  ")}\n}`;

  if ("children" in node && node.children) {
    for (const child of node.children) {
      result += "\n\n" + generateVueStyles(child);
    }
  }

  return result;
}

const vueSerializer: Serializer = {
  id: "vue3",
  label: "Vue 3",
  description: "Vue 3 single file component with script setup",
  supportedOptions: ["inlineCss", "componentName"],

  async generate(
    ir: FigmaIRNode,
    ctx: GenCtx,
  ): Promise<readonly GeneratedFile[]> {
    const componentName =
      ctx.options.componentName ||
      sanitizeComponentName(ir.name) ||
      "FigmaComponent";
    const template = generateVueTemplate(ir);
    const styles = generateVueStyles(ir);

    const code = `<template>
  <div class="figma-component">
${template}
  </div>
</template>

<script setup lang="ts">
// ${componentName} - Generated from Figma
defineOptions({
  name: '${componentName}'
})
</script>

<style scoped>
.figma-component {
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

${styles}
</style>`;

    return [
      {
        filename: `${componentName}.vue`,
        code: await formatPrettier(code, "vue", ctx.prettierOptions),
        language: "vue",
      },
    ];
  },
};

register(vueSerializer);
