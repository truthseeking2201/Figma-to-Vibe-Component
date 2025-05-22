/**
 * JSON Serializer - Raw IR export
 */

import type { FigmaIRNode } from "../core/figma-ir";
import type { Serializer, GeneratedFile, GenCtx } from "./types";
import { register } from "./registry";

const jsonSerializer: Serializer = {
  id: "json",
  label: "JSON",
  description: "Raw Figma IR as formatted JSON",
  supportedOptions: [],

  async generate(
    ir: FigmaIRNode,
    _ctx: GenCtx,
  ): Promise<readonly GeneratedFile[]> {
    const code = JSON.stringify(ir, null, 2);

    return [
      {
        filename: "figma-export.json",
        code,
        language: "json",
      },
    ];
  },
};

register(jsonSerializer);
