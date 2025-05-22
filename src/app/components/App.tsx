/**
 * FigVibe - Enhanced Multi-Format Export UI
 */

import React, { useState, useEffect, useCallback } from "react";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Download,
  Copy,
  Settings,
  Code2,
  FileText,
  Layers,
} from "lucide-react";
import JSZip from "jszip";

import {
  getAvailableSerializers,
  getSerializer,
  initializeSerializers,
  type GeneratedFile,
  type SerializerOptions,
} from "../../serializers";
import type { FigmaIRNode } from "../../core/figma-ir";

interface AppState {
  selectedNode: FigmaIRNode | null;
  metadata: unknown | null;
  selectedFormat: string;
  serializerOptions: SerializerOptions;
  generatedFiles: readonly GeneratedFile[];
  isGenerating: boolean;
  activeFileIndex: number;
}

const INITIAL_STATE: AppState = {
  selectedNode: null,
  metadata: null,
  selectedFormat: "react",
  serializerOptions: {
    inlineCss: true,
    useTailwind: false,
    nullSafety: true,
    iosCompat: false,
    exportAsComponent: true,
    componentName: "",
  },
  generatedFiles: [],
  isGenerating: false,
  activeFileIndex: 0,
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);

  // Initialize serializers on mount
  React.useEffect(() => {
    try {
      initializeSerializers();
      console.log("Serializers initialized successfully");
      const serializers = getAvailableSerializers();
      console.log(
        "Available serializers:",
        serializers.map((s) => s.id),
      );
    } catch (error) {
      console.error("Error initializing serializers:", error);
    }
  }, []);

  const generateCode = useCallback(async () => {
    if (!state.selectedNode) return;

    setState((prev) => Object.assign({}, prev, { isGenerating: true }));

    try {
      const serializer = getSerializer(state.selectedFormat);
      if (!serializer) {
        console.error("Serializer not found:", state.selectedFormat);
        return;
      }

      const files = await serializer.generate(state.selectedNode, {
        options: state.serializerOptions,
        prettierOptions: {
          printWidth: 100,
          tabWidth: 2,
          useTabs: false,
          semi: true,
          singleQuote: true,
          trailingComma: "es5",
        },
      });

      setState((prev) =>
        Object.assign({}, prev, {
          generatedFiles: files,
          activeFileIndex: 0,
          isGenerating: false,
        }),
      );
    } catch (error) {
      console.error("Error generating code:", error);
      setState((prev) => Object.assign({}, prev, { isGenerating: false }));
    }
  }, [state.selectedNode, state.selectedFormat, state.serializerOptions]);

  // Handle messages from plugin
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const { pluginMessage } = event.data;
        if (pluginMessage && pluginMessage.type === "selection-changed") {
          if (pluginMessage.data) {
            setState((prev) =>
              Object.assign({}, prev, {
                selectedNode: pluginMessage.data.node,
                metadata: pluginMessage.data.metadata,
                generatedFiles: [],
                activeFileIndex: 0,
              }),
            );
          } else {
            setState((prev) =>
              Object.assign({}, prev, {
                selectedNode: null,
                metadata: null,
                generatedFiles: [],
                activeFileIndex: 0,
              }),
            );
          }
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Generate code when format or options change
  useEffect(() => {
    if (state.selectedNode) {
      generateCode();
    }
  }, [
    state.selectedNode,
    state.selectedFormat,
    state.serializerOptions,
    generateCode,
  ]);

  const copyToClipboard = async () => {
    if (state.generatedFiles.length === 0) return;

    const activeFile = state.generatedFiles[state.activeFileIndex];
    if (!activeFile) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(activeFile.code);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = activeFile.code;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const downloadFiles = async () => {
    if (state.generatedFiles.length === 0) return;

    if (state.generatedFiles.length === 1) {
      // Single file download
      const file = state.generatedFiles[0]!;
      const blob = new Blob([file.code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Multiple files - create ZIP
      const zip = new JSZip();

      for (const file of state.generatedFiles) {
        zip.file(file.filename, file.code);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${state.selectedNode ? state.selectedNode.name : "figma-export"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const updateOption = (key: keyof SerializerOptions, value: unknown) => {
    setState((prev) =>
      Object.assign({}, prev, {
        serializerOptions: Object.assign({}, prev.serializerOptions, {
          [key]: value,
        }),
      }),
    );
  };

  const serializers = getAvailableSerializers();
  const currentSerializer = getSerializer(state.selectedFormat);
  const activeFile = state.generatedFiles[state.activeFileIndex];

  if (!state.selectedNode) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Selection
          </h3>
          <p className="text-gray-600 text-sm">
            Select one or more layers in Figma to generate code
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">
                {state.selectedNode.name}
              </h1>
              <p className="text-xs text-gray-500 capitalize">
                {state.selectedNode.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              disabled={!activeFile}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? <span>✓</span> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={downloadFiles}
              disabled={state.generatedFiles.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* Format Selector */}
          <div className="p-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <Select.Root
              value={state.selectedFormat}
              onValueChange={(value) =>
                setState((prev) =>
                  Object.assign({}, prev, { selectedFormat: value }),
                )
              }
            >
              <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Select.Value />
                <Select.Icon>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                  <Select.Viewport>
                    {serializers.map((serializer) => (
                      <Select.Item
                        key={serializer.id}
                        value={serializer.id}
                        className="flex items-center px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                      >
                        <Select.ItemText>{serializer.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            {currentSerializer && (
              <p className="text-xs text-gray-500 mt-1">
                {currentSerializer.description}
              </p>
            )}
          </div>

          {/* Options */}
          {currentSerializer &&
            currentSerializer.supportedOptions.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Options
                  </span>
                </div>
                <div className="space-y-3">
                  {currentSerializer.supportedOptions.includes("inlineCss") && (
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Inline CSS</span>
                      <Switch.Root
                        checked={state.serializerOptions.inlineCss}
                        onCheckedChange={(checked) =>
                          updateOption("inlineCss", checked)
                        }
                        className="w-8 h-4 bg-gray-200 rounded-full data-[state=checked]:bg-blue-600"
                      >
                        <Switch.Thumb className="block w-3 h-3 bg-white rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-4" />
                      </Switch.Root>
                    </label>
                  )}
                  {currentSerializer.supportedOptions.includes(
                    "useTailwind",
                  ) && (
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        Use Tailwind
                      </span>
                      <Switch.Root
                        checked={state.serializerOptions.useTailwind}
                        onCheckedChange={(checked) =>
                          updateOption("useTailwind", checked)
                        }
                        className="w-8 h-4 bg-gray-200 rounded-full data-[state=checked]:bg-blue-600"
                      >
                        <Switch.Thumb className="block w-3 h-3 bg-white rounded-full transition-transform duration-100 translate-x-0.5 data-[state=checked]:translate-x-4" />
                      </Switch.Root>
                    </label>
                  )}
                  {currentSerializer.supportedOptions.includes(
                    "componentName",
                  ) && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Component Name
                      </label>
                      <input
                        type="text"
                        value={state.serializerOptions.componentName || ""}
                        onChange={(e) =>
                          updateOption("componentName", e.target.value)
                        }
                        placeholder="Auto-generated"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Layer Info */}
          <div className="p-4 flex-1 overflow-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Layer Properties
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Size:</span>
                <span>
                  {Math.round(state.selectedNode.width)} ×{" "}
                  {Math.round(state.selectedNode.height)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Position:</span>
                <span>
                  {Math.round(state.selectedNode.x)},{" "}
                  {Math.round(state.selectedNode.y)}
                </span>
              </div>
              {state.selectedNode.opacity !== 1 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Opacity:</span>
                  <span>{Math.round(state.selectedNode.opacity * 100)}%</span>
                </div>
              )}
              {"children" in state.selectedNode &&
                state.selectedNode.children && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Children:</span>
                    <span>{state.selectedNode.children.length}</span>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {state.isGenerating ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Generating code...</p>
              </div>
            </div>
          ) : state.generatedFiles.length > 0 ? (
            <>
              {/* File Tabs */}
              {state.generatedFiles.length > 1 && (
                <Tabs.Root
                  value={state.activeFileIndex.toString()}
                  onValueChange={(value) =>
                    setState((prev) =>
                      Object.assign({}, prev, {
                        activeFileIndex: parseInt(value),
                      }),
                    )
                  }
                >
                  <Tabs.List className="flex border-b border-gray-200 bg-gray-50">
                    {state.generatedFiles.map((file, index) => (
                      <Tabs.Trigger
                        key={index}
                        value={index.toString()}
                        className="px-4 py-2 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-blue-600"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {file.filename}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>
                </Tabs.Root>
              )}

              {/* Code Display */}
              <div className="flex-1 overflow-auto">
                {activeFile && (
                  <pre className="p-4 text-sm font-mono bg-gray-900 text-gray-100 h-full overflow-auto">
                    <code>{activeFile.code}</code>
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">No code generated</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
