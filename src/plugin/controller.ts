/**
 * FigVibe Plugin Controller - Enhanced multi-format export
 */

import { normalizeNode } from "../core/normalise";
import type { FigmaIRNode } from "../core/figma-ir";

// Show UI with larger dimensions for the enhanced interface
figma.showUI(__html__, { width: 600, height: 800 });

interface PluginMessage {
  type: "selection-changed" | "export-code" | "get-serializers";
  data?: any;
}

function collectNodeTree(node: SceneNode): FigmaIRNode {
  return normalizeNode(node);
}

function sendSelectionData(): void {
  const selection = figma.currentPage.selection;

  if (selection.length === 1) {
    try {
      const node = selection[0];
      const normalizedData = collectNodeTree(node);

      figma.ui.postMessage({
        type: "selection-changed",
        data: {
          node: normalizedData,
          metadata: {
            fileId: figma.fileKey || "unknown",
            fileName: figma.root.name || "Untitled",
            version: "1.0.0",
            exportedAt: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Error processing selection:", error);
      figma.ui.postMessage({
        type: "selection-changed",
        data: null,
      });
    }
  } else if (selection.length > 1) {
    // Handle multiple selection - create a virtual group
    const bounds = selection.reduce(
      (acc, node) => {
        if ("x" in node && "y" in node && "width" in node && "height" in node) {
          return {
            left: Math.min(acc.left, node.x),
            top: Math.min(acc.top, node.y),
            right: Math.max(acc.right, node.x + node.width),
            bottom: Math.max(acc.bottom, node.y + node.height),
          };
        }
        return acc;
      },
      { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity },
    );

    // Create a virtual group node
    const virtualGroup: FigmaIRNode = {
      id: "virtual-group",
      name: "Multiple Selection",
      type: "group",
      visible: true,
      locked: false,
      x: bounds.left,
      y: bounds.top,
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top,
      rotation: 0,
      opacity: 1,
      fills: [],
      strokes: [],
      effects: [],
      constraints: { horizontal: "left", vertical: "top" },
      cornerRadius: {},
      blendMode: "normal",
      exportSettings: [],
      children: selection.map(collectNodeTree),
    };

    figma.ui.postMessage({
      type: "selection-changed",
      data: {
        node: virtualGroup,
        metadata: {
          fileId: figma.fileKey || "unknown",
          fileName: figma.root.name || "Untitled",
          version: "1.0.0",
          exportedAt: new Date().toISOString(),
        },
      },
    });
  } else {
    figma.ui.postMessage({
      type: "selection-changed",
      data: null,
    });
  }
}

// Handle messages from UI
figma.ui.onmessage = (msg: PluginMessage) => {
  switch (msg.type) {
    case "get-serializers":
      // Send available serializers info to UI
      figma.ui.postMessage({
        type: "serializers-list",
        data: [
          {
            id: "json",
            label: "JSON",
            description: "Raw Figma IR as formatted JSON",
          },
          {
            id: "html",
            label: "HTML/CSS",
            description: "Static HTML with CSS styling",
          },
          {
            id: "react",
            label: "React",
            description: "React functional component",
          },
          {
            id: "flutter",
            label: "Flutter",
            description: "Flutter Dart widget",
          },
          {
            id: "swiftui",
            label: "SwiftUI",
            description: "SwiftUI view for iOS/macOS",
          },
        ],
      });
      break;

    case "export-code":
      // The actual code generation happens in the UI
      // This just confirms the export request
      figma.ui.postMessage({
        type: "export-confirmed",
        data: msg.data,
      });
      break;

    default:
      console.warn("Unknown message type:", msg.type);
  }
};

// Initialize
sendSelectionData();

// Listen for selection changes
figma.on("selectionchange", sendSelectionData);

// Cleanup on close
figma.on("close", () => {
  // Plugin cleanup if needed
});
