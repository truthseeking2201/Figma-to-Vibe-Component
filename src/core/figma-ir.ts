/**
 * Figma Intermediate Representation (IR)
 * Type-safe, normalized representation of Figma nodes
 */

export interface FigmaColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export interface FigmaGradientStop {
  readonly position: number;
  readonly color: FigmaColor;
}

export interface FigmaGradient {
  readonly type: "linear" | "radial" | "angular" | "diamond";
  readonly stops: readonly FigmaGradientStop[];
  readonly transform?: readonly number[][];
}

export interface FigmaSolidFill {
  readonly type: "solid";
  readonly color: FigmaColor;
  readonly opacity?: number;
}

export interface FigmaGradientFill {
  readonly type: "gradient";
  readonly gradient: FigmaGradient;
  readonly opacity?: number;
}

export interface FigmaImageFill {
  readonly type: "image";
  readonly imageHash?: string;
  readonly scaleMode: "fill" | "fit" | "crop" | "tile";
  readonly opacity?: number;
}

export type FigmaFill = FigmaSolidFill | FigmaGradientFill | FigmaImageFill;

export interface FigmaStroke {
  readonly type: "solid" | "gradient";
  readonly color?: FigmaColor;
  readonly gradient?: FigmaGradient;
  readonly weight: number;
  readonly align: "inside" | "outside" | "center";
  readonly opacity?: number;
}

export interface FigmaEffect {
  readonly type: "drop-shadow" | "inner-shadow" | "blur" | "background-blur";
  readonly visible: boolean;
  readonly radius: number;
  readonly color?: FigmaColor;
  readonly offset?: { readonly x: number; readonly y: number };
  readonly spread?: number;
}

export interface FigmaConstraints {
  readonly horizontal: "left" | "right" | "center" | "left-right" | "scale";
  readonly vertical: "top" | "bottom" | "center" | "top-bottom" | "scale";
}

export interface FigmaLayoutProps {
  readonly mode: "none" | "horizontal" | "vertical" | "wrap";
  readonly primaryAxisSizingMode: "fixed" | "auto";
  readonly counterAxisSizingMode: "fixed" | "auto";
  readonly primaryAxisAlignItems: "min" | "center" | "max" | "space-between";
  readonly counterAxisAlignItems: "min" | "center" | "max";
  readonly itemSpacing: number;
  readonly padding: {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
  };
}

export interface FigmaCornerRadius {
  readonly all?: number;
  readonly topLeft?: number;
  readonly topRight?: number;
  readonly bottomLeft?: number;
  readonly bottomRight?: number;
}

export interface FigmaTextStyle {
  readonly fontFamily: string;
  readonly fontWeight: number;
  readonly fontSize: number;
  readonly lineHeight: number | "auto";
  readonly letterSpacing: number;
  readonly textAlignHorizontal: "left" | "center" | "right" | "justified";
  readonly textAlignVertical: "top" | "center" | "bottom";
  readonly textDecoration: "none" | "underline" | "strikethrough";
  readonly textCase: "original" | "upper" | "lower" | "title";
}

export interface FigmaBaseNode {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
  readonly opacity: number;
  readonly fills: readonly FigmaFill[];
  readonly strokes: readonly FigmaStroke[];
  readonly effects: readonly FigmaEffect[];
  readonly constraints: FigmaConstraints;
  readonly cornerRadius: FigmaCornerRadius;
  readonly blendMode: string;
  readonly exportSettings: readonly any[];
}

export interface FigmaFrameNode extends FigmaBaseNode {
  readonly type: "frame" | "component" | "instance";
  readonly children: readonly FigmaIRNode[];
  readonly layoutProps: FigmaLayoutProps;
  readonly clipsContent: boolean;
  readonly background: readonly FigmaFill[];
}

export interface FigmaTextNode extends FigmaBaseNode {
  readonly type: "text";
  readonly characters: string;
  readonly textStyle: FigmaTextStyle;
}

export interface FigmaVectorNode extends FigmaBaseNode {
  readonly type: "vector" | "star" | "polygon" | "ellipse" | "rectangle";
  readonly vectorData?: string;
}

export interface FigmaImageNode extends FigmaBaseNode {
  readonly type: "image";
  readonly imageHash?: string;
}

export interface FigmaGroupNode extends FigmaBaseNode {
  readonly type: "group";
  readonly children: readonly FigmaIRNode[];
}

export type FigmaIRNode =
  | FigmaFrameNode
  | FigmaTextNode
  | FigmaVectorNode
  | FigmaImageNode
  | FigmaGroupNode;

export interface FigmaDocument {
  readonly root: FigmaIRNode;
  readonly metadata: {
    readonly fileId: string;
    readonly fileName: string;
    readonly version: string;
    readonly exportedAt: string;
  };
}
