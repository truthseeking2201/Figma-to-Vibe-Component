/**
 * Serializer Contract & Registry
 */

import type { FigmaIRNode } from "../core/figma-ir";

export type Lang =
  | "css"
  | "tsx"
  | "jsx"
  | "dart"
  | "swift"
  | "kt"
  | "vue"
  | "ts"
  | "html"
  | "json";

export interface GeneratedFile {
  readonly filename: string;
  readonly code: string;
  readonly language: Lang;
}

export interface GenCtx {
  readonly prettierOptions?: any;
  readonly options: SerializerOptions;
}

export interface SerializerOptions {
  readonly inlineCss?: boolean;
  readonly useTailwind?: boolean;
  readonly nullSafety?: boolean;
  readonly iosCompat?: boolean;
  readonly exportAsComponent?: boolean;
  readonly componentName?: string;
}

export interface Serializer {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly supportedOptions: readonly (keyof SerializerOptions)[];
  generate(ir: FigmaIRNode, ctx: GenCtx): Promise<readonly GeneratedFile[]>;
}

// Registry functions are now in ./registry.ts
