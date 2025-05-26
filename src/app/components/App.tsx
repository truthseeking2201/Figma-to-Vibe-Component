/**
 * FigVibe - Modern UI Revamp
 * Clean, elegant, and pixel-perfect design
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Code2, Layers, Sparkles, Package, Moon, Sun } from "lucide-react";
import JSZip from "jszip";

import {
  getAvailableSerializers,
  getSerializer,
  initializeSerializers,
  type GeneratedFile,
  type SerializerOptions,
} from "../../serializers";
import type { FigmaIRNode } from "../../core/figma-ir";

// Import our new components
import {
  Button,
  SelectField,
  SwitchField,
  Input,
  Card,
  EmptyState,
  ErrorMessage,
  LoadingSpinner,
  Badge,
} from "./UIComponents";
import CodeEditor, { FileTabs } from "./CodeEditor";

interface AppState {
  selectedNode: FigmaIRNode | null;
  metadata: any | null;
  selectedFormat: string;
  serializerOptions: SerializerOptions;
  generatedFiles: readonly GeneratedFile[];
  isGenerating: boolean;
  activeFileIndex: number;
  error: { message: string; details?: string } | null;
  theme: "light" | "dark";
}

const INITIAL_STATE: AppState = {
  selectedNode: null,
  metadata: null,
  selectedFormat: "react",
  serializerOptions: {
    inlineCss: false,
    useTailwind: false,
    nullSafety: true,
    iosCompat: false,
    exportAsComponent: true,
    componentName: "",
  },
  generatedFiles: [],
  isGenerating: false,
  activeFileIndex: 0,
  error: null,
  theme: "light",
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [availableSerializers, setAvailableSerializers] = useState<readonly any[]>([]);

  // Initialize serializers on mount
  useEffect(() => {
    try {
      initializeSerializers();
      const serializers = getAvailableSerializers();
      setAvailableSerializers(serializers);
    } catch (error) {
      console.error("Error initializing serializers:", error);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
  }, [state.theme]);

  // Toggle theme
  const toggleTheme = () => {
    setState((prev) => ({
      ...prev,
      theme: prev.theme === "light" ? "dark" : "light",
    }));
  };

  // Store refs to avoid dependency issues
  const generateCodeRef = useRef<() => Promise<void>>();
  
  // Generate code
  const generateCode = useCallback(async () => {
    if (!state.selectedNode) return;

    setState((prev) => ({ ...prev, isGenerating: true, error: null }));

    try {
      const serializer = getSerializer(state.selectedFormat);
      if (!serializer) {
        throw new Error(`Serializer not found: ${state.selectedFormat}`);
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

      setState((prev) => ({
        ...prev,
        generatedFiles: files,
        isGenerating: false,
        activeFileIndex: 0,
      }));
    } catch (error) {
      console.error("Error generating code:", error);
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: {
          message: "Failed to generate code",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    }
  }, [state.selectedNode, state.selectedFormat, state.serializerOptions]);
  
  // Update ref when generateCode changes
  useEffect(() => {
    generateCodeRef.current = generateCode;
  }, [generateCode]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    const activeFile = state.generatedFiles[state.activeFileIndex];
    if (!activeFile) return;

    try {
      await navigator.clipboard.writeText(activeFile.code);
      // Create temporary success message
      const successMsg = document.createElement('div');
      successMsg.textContent = 'Copied to clipboard!';
      successMsg.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; z-index: 1000; transition: opacity 0.3s;';
      document.body.appendChild(successMsg);
      setTimeout(() => {
        successMsg.style.opacity = '0';
        setTimeout(() => document.body.removeChild(successMsg), 300);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      setState((prev) => ({
        ...prev,
        error: {
          message: "Failed to copy to clipboard",
          details: "Please check clipboard permissions",
        },
      }));
    }
  }, [state.generatedFiles, state.activeFileIndex]);

  // Handle download
  const handleDownload = useCallback(async () => {
    if (state.generatedFiles.length === 0) return;

    try {
      if (state.generatedFiles.length === 1) {
        // Single file download
        const file = state.generatedFiles[0];
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
        state.generatedFiles.forEach((file) => {
          zip.file(file.filename, file.code);
        });
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${state.serializerOptions.componentName || "export"}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  }, [state.generatedFiles, state.serializerOptions.componentName]);

  // Handle messages from Figma
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      switch (msg.type) {
        case "selection-changed":
          if (msg.error) {
            setState((prev) => ({
              ...prev,
              selectedNode: null,
              metadata: null,
              error: msg.error,
              generatedFiles: [],
            }));
          } else if (msg.data) {
            setState((prev) => ({
              ...prev,
              selectedNode: msg.data.node,
              metadata: msg.data.metadata,
              error: null,
              generatedFiles: [],
            }));
            // Auto-generate code when selection changes
            if (generateCodeRef.current) {
              generateCodeRef.current();
            }
          } else {
            setState((prev) => ({
              ...prev,
              selectedNode: null,
              metadata: null,
              generatedFiles: [],
            }));
          }
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const activeFile = state.generatedFiles[state.activeFileIndex];
  const selectedSerializer = availableSerializers.find(
    (s) => s.id === state.selectedFormat,
  );

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-500" />
                <h1 className="text-lg font-semibold">FigVibe</h1>
                <Badge variant="warning">v2.2.0</Badge>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {state.theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r border-border bg-surface flex flex-col">
          <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            {/* Format Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Export Format
              </label>
              <SelectField
                value={state.selectedFormat}
                onValueChange={(value) =>
                  setState((prev) => ({ ...prev, selectedFormat: value }))
                }
                options={availableSerializers.map((s) => ({
                  value: s.id,
                  label: s.label,
                  description: s.description,
                }))}
                placeholder="Select format"
              />
            </div>

            {/* Component Name */}
            <Input
              label="Component Name"
              placeholder="MyComponent"
              value={state.serializerOptions.componentName}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  serializerOptions: {
                    ...prev.serializerOptions,
                    componentName: e.target.value,
                  },
                }))
              }
            />

            {/* Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Options</h3>

              {selectedSerializer?.supportedOptions.includes("inlineCss") && (
                <SwitchField
                  label="Inline CSS"
                  description="Include styles directly in components"
                  checked={state.serializerOptions.inlineCss || false}
                  onCheckedChange={(checked) =>
                    setState((prev) => ({
                      ...prev,
                      serializerOptions: {
                        ...prev.serializerOptions,
                        inlineCss: checked,
                      },
                    }))
                  }
                />
              )}

              {selectedSerializer?.supportedOptions.includes("useTailwind") && (
                <SwitchField
                  label="Use Tailwind CSS"
                  description="Generate Tailwind utility classes"
                  checked={state.serializerOptions.useTailwind || false}
                  onCheckedChange={(checked) =>
                    setState((prev) => ({
                      ...prev,
                      serializerOptions: {
                        ...prev.serializerOptions,
                        useTailwind: checked,
                      },
                    }))
                  }
                />
              )}

              {selectedSerializer?.supportedOptions.includes("nullSafety") && (
                <SwitchField
                  label="Null Safety"
                  description="Enable null safety for Dart/Flutter"
                  checked={state.serializerOptions.nullSafety || false}
                  onCheckedChange={(checked) =>
                    setState((prev) => ({
                      ...prev,
                      serializerOptions: {
                        ...prev.serializerOptions,
                        nullSafety: checked,
                      },
                    }))
                  }
                />
              )}

              {selectedSerializer?.supportedOptions.includes("iosCompat") && (
                <SwitchField
                  label="iOS Compatibility"
                  description="Ensure iOS 13+ compatibility"
                  checked={state.serializerOptions.iosCompat || false}
                  onCheckedChange={(checked) =>
                    setState((prev) => ({
                      ...prev,
                      serializerOptions: {
                        ...prev.serializerOptions,
                        iosCompat: checked,
                      },
                    }))
                  }
                />
              )}
            </div>

            {/* Selection Info */}
            {state.selectedNode && state.metadata && (
              <Card className="bg-surface-hover border-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-brand-500" />
                    <h3 className="text-sm font-medium">Selection Info</h3>
                  </div>
                  <div className="space-y-1 text-xs text-muted">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="font-medium text-foreground">
                        {state.selectedNode.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium text-foreground capitalize">
                        {state.selectedNode.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium text-foreground">
                        {Math.round(state.selectedNode.width)} ×{" "}
                        {Math.round(state.selectedNode.height)}
                      </span>
                    </div>
                    {state.metadata.childrenCount > 0 && (
                      <div className="flex justify-between">
                        <span>Children:</span>
                        <span className="font-medium text-foreground">
                          {state.metadata.childrenCount}
                        </span>
                      </div>
                    )}
                    {state.metadata.complexity && (
                      <div className="flex justify-between">
                        <span>Complexity:</span>
                        <Badge
                          variant={
                            state.metadata.complexity > 1000
                              ? "warning"
                              : "success"
                          }
                        >
                          {state.metadata.complexity > 1000 ? "High" : "Normal"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Generate Button */}
          <div className="p-4 border-t border-border">
            <Button
              variant="primary"
              className="w-full"
              onClick={generateCode}
              disabled={!state.selectedNode || state.isGenerating}
              isLoading={state.isGenerating}
            >
              {state.isGenerating ? "Generating..." : "Generate Code"}
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-background">
          {state.error && (
            <div className="p-4">
              <ErrorMessage
                title={state.error.message}
                message={state.error.details || "Please try again"}
                onDismiss={() => setState((prev) => ({ ...prev, error: null }))}
              />
            </div>
          )}

          {!state.selectedNode && !state.error && (
            <EmptyState
              icon={<Code2 className="h-12 w-12" />}
              title="No selection"
              description="Select a layer in Figma to start generating code"
            />
          )}

          {state.selectedNode &&
            state.generatedFiles.length === 0 &&
            !state.isGenerating &&
            !state.error && (
              <EmptyState
                icon={<Package className="h-12 w-12" />}
                title="Ready to generate"
                description="Click the Generate Code button to create your files"
              />
            )}

          {state.isGenerating && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-sm text-muted">Generating code...</p>
              </div>
            </div>
          )}

          {state.generatedFiles.length > 0 && activeFile && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* File Tabs */}
              {state.generatedFiles.length > 1 && (
                <FileTabs
                  tabs={state.generatedFiles.map((file, index) => ({
                    filename: file.filename,
                    language: file.language,
                    isActive: index === state.activeFileIndex,
                    onClick: () =>
                      setState((prev) => ({ ...prev, activeFileIndex: index })),
                  }))}
                />
              )}

              {/* Code Editor */}
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  code={activeFile.code}
                  language={activeFile.language}
                  filename={activeFile.filename}
                  onCopy={handleCopy}
                  onDownload={handleDownload}
                  height="100%"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
