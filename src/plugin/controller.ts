/**
 * FigVibe Plugin Controller - Enhanced multi-format export with improved error handling
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

function validateNode(node: SceneNode): { valid: boolean; warning?: string } {
  const supportedTypes = [
    "FRAME",
    "GROUP",
    "COMPONENT",
    "INSTANCE",
    "TEXT",
    "RECTANGLE",
    "ELLIPSE",
    "POLYGON",
    "STAR",
    "VECTOR",
    "LINE",
  ];

  if (!supportedTypes.includes(node.type)) {
    return {
      valid: true,
      warning: `Node type ${node.type} may have limited support`,
    };
  }

  if ("children" in node && node.children && node.children.length > 5000) {
    return {
      valid: false,
      warning: `Node has ${node.children.length} children, which exceeds the safe limit`,
    };
  }

  return { valid: true };
}

function estimateComplexity(node: SceneNode): number {
  let complexity = 1;

  if ("children" in node && node.children) {
    complexity += node.children.length;
    // Recursively estimate complexity
    for (const child of node.children.slice(0, 100)) {
      // Sample first 100 children
      complexity += estimateComplexity(child) * 0.5;
    }
  }

  if ("effects" in node && node.effects) {
    complexity += node.effects.length * 2;
  }

  if ("fills" in node && node.fills && node.fills !== figma.mixed) {
    complexity += node.fills.length;
  }

  return Math.min(complexity, 10000); // Cap complexity score
}

function sendSelectionData(): void {
  const selection = figma.currentPage.selection;

  if (selection.length === 1) {
    try {
      const node = selection[0];
      console.log(`Processing node: ${node.name} (type: ${node.type})`);

      // Validate node
      const validation = validateNode(node);
      if (!validation.valid) {
        figma.ui.postMessage({
          type: "selection-changed",
          data: null,
          error: {
            message: "Element too complex",
            details: validation.warning || "Please select a simpler element",
          },
        });
        return;
      }

      if (validation.warning) {
        console.warn(validation.warning);
      }

      // Estimate complexity
      const complexity = estimateComplexity(node);
      console.log(`Estimated complexity: ${complexity}`);

      if (complexity > 5000) {
        figma.notify(
          "⚠️ Processing complex element - this may take a moment...",
          { timeout: 3000 },
        );
      }

      const startTime = Date.now();
      let normalizedData: FigmaIRNode;

      try {
        normalizedData = collectNodeTree(node);
      } catch (normalizationError) {
        console.error("Normalization failed:", normalizationError);

        // Provide specific error messages based on error type
        let userMessage = "Failed to process element structure";
        let details = "The element couldn't be converted properly";

        if (normalizationError instanceof Error) {
          if (normalizationError.message.includes("Maximum recursion")) {
            userMessage = "Element has too many nested layers";
            details =
              "Try selecting a component with fewer nested groups or frames";
          } else if (normalizationError.message.includes("children")) {
            userMessage = "Element has too many child elements";
            details = `Try selecting a smaller component or breaking it into parts`;
          }
        }

        figma.ui.postMessage({
          type: "selection-changed",
          data: null,
          error: {
            message: userMessage,
            details: details,
          },
        });
        return;
      }

      const processingTime = Date.now() - startTime;
      console.log(`Node processing completed in ${processingTime}ms`);

      // Prepare message data
      const messageData = {
        node: normalizedData,
        metadata: {
          fileId: figma.fileKey || "unknown",
          fileName: figma.root.name || "Untitled",
          version: "2.0.0",
          exportedAt: new Date().toISOString(),
          processingTime: processingTime,
          nodeType: node.type,
          complexity: complexity,
          childrenCount:
            "children" in node && node.children ? node.children.length : 0,
        },
      };

      try {
        // Test serialization with size check
        const serializedData = JSON.stringify(messageData);
        const sizeInMB = serializedData.length / (1024 * 1024);

        console.log(`Serialized data size: ${sizeInMB.toFixed(2)}MB`);

        if (sizeInMB > 50) {
          throw new Error(
            `Data too large (${sizeInMB.toFixed(2)}MB) - exceeds safe limit`,
          );
        }

        if (sizeInMB > 10) {
          console.warn(
            `Large data size detected: ${sizeInMB.toFixed(2)}MB. Performance may be affected.`,
          );
        }

        figma.ui.postMessage({
          type: "selection-changed",
          data: messageData,
        });

        if (complexity > 1000) {
          figma.notify("✅ Complex element processed successfully!", {
            timeout: 2000,
          });
        }
      } catch (serializationError) {
        console.error("Data serialization failed:", serializationError);

        // Try to send a simplified version
        const simplifiedData = {
          node: {
            id: normalizedData.id,
            name: normalizedData.name,
            type: normalizedData.type,
            width: normalizedData.width,
            height: normalizedData.height,
            childrenCount:
              "children" in normalizedData
                ? normalizedData.children?.length || 0
                : 0,
          },
          metadata: messageData.metadata,
        };

        figma.ui.postMessage({
          type: "selection-changed",
          data: null,
          error: {
            message: "Element too large for export",
            details: `The selected element is too complex (${simplifiedData.node.childrenCount} children, ${messageData.metadata.complexity} complexity score). Try selecting a smaller component or use the "Export as Image" option instead.`,
            simplifiedData: simplifiedData,
          },
        });
      }
    } catch (error) {
      console.error("Error processing selection:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error("Error details:", {
        message: errorMessage,
        stack: errorStack,
        nodeType: selection[0]?.type,
        nodeName: selection[0]?.name,
      });

      // Provide helpful error messages
      let userMessage = "Failed to process selected element";
      let details = errorMessage;

      if (
        errorMessage.includes("Cannot read") ||
        errorMessage.includes("undefined")
      ) {
        userMessage = "Invalid element structure";
        details =
          "The selected element has an unexpected structure. This might be a plugin limitation with this specific element type.";
      } else if (errorMessage.includes("Maximum call stack")) {
        userMessage = "Element too deeply nested";
        details =
          "The selected element has too many nested layers. Try selecting a simpler component.";
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("Timeout")
      ) {
        userMessage = "Processing timeout";
        details =
          "The element took too long to process. Try selecting a smaller component.";
      }

      figma.ui.postMessage({
        type: "selection-changed",
        data: null,
        error: {
          message: userMessage,
          details: details,
        },
      });

      figma.notify("❌ " + userMessage, { timeout: 3000, error: true });
    }
  } else if (selection.length > 1) {
    // Validate multiple selection
    if (selection.length > 50) {
      figma.ui.postMessage({
        type: "selection-changed",
        data: null,
        error: {
          message: "Too many elements selected",
          details: `You've selected ${selection.length} elements. Please select fewer than 50 elements at once.`,
        },
      });
      return;
    }

    try {
      // Handle multiple selection - create a virtual group
      const bounds = selection.reduce(
        (acc, node) => {
          if (
            "x" in node &&
            "y" in node &&
            "width" in node &&
            "height" in node
          ) {
            return {
              left: Math.min(acc.left, node.x),
              top: Math.min(acc.top, node.y),
              right: Math.max(acc.right, node.x + node.width),
              bottom: Math.max(acc.bottom, node.y + node.height),
            };
          }
          return acc;
        },
        {
          left: Infinity,
          top: Infinity,
          right: -Infinity,
          bottom: -Infinity,
        },
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
        children: selection.map((node, index) => {
          try {
            return collectNodeTree(node);
          } catch (error) {
            console.error(
              `Error processing selected node ${index} (${node.name}):`,
              error,
            );
            // Return a fallback for failed nodes
            return {
              id: node.id || `fallback-${index}`,
              name: node.name || "Unknown",
              type: "vector",
              visible: true,
              locked: false,
              x: "x" in node ? node.x : 0,
              y: "y" in node ? node.y : 0,
              width: "width" in node ? node.width : 0,
              height: "height" in node ? node.height : 0,
              rotation: 0,
              opacity: 1,
              fills: [],
              strokes: [],
              effects: [],
              constraints: { horizontal: "left", vertical: "top" },
              cornerRadius: {},
              blendMode: "normal",
              exportSettings: [],
            };
          }
        }),
      };

      figma.ui.postMessage({
        type: "selection-changed",
        data: {
          node: virtualGroup,
          metadata: {
            fileId: figma.fileKey || "unknown",
            fileName: figma.root.name || "Untitled",
            version: "2.0.0",
            exportedAt: new Date().toISOString(),
            multipleSelection: true,
            selectionCount: selection.length,
          },
        },
      });
    } catch (error) {
      console.error("Error processing multiple selection:", error);
      figma.ui.postMessage({
        type: "selection-changed",
        data: null,
        error: {
          message: "Failed to process multiple selection",
          details:
            "There was an error combining the selected elements. Try selecting fewer elements.",
        },
      });
    }
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
            description: "React functional component with CSS modules",
          },
          {
            id: "react-native",
            label: "React Native",
            description: "React Native with StyleSheet",
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
          {
            id: "vue",
            label: "Vue 3",
            description: "Vue 3 single file component",
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
