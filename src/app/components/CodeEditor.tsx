/**
 * Modern Code Editor Component
 * Clean interface for displaying generated code with syntax highlighting
 */

import React, { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import {
  Copy,
  Check,
  Download,
  FileCode,
  FileText,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "./UIComponents";

interface CodeEditorProps {
  code: string;
  language: string;
  filename: string;
  onCopy?: () => void;
  onDownload?: () => void;
  readOnly?: boolean;
  height?: string;
}

const getFileIcon = (language: string) => {
  switch (language) {
    case "tsx":
    case "jsx":
    case "ts":
    case "js":
      return <FileCode className="h-3.5 w-3.5" />;
    default:
      return <FileText className="h-3.5 w-3.5" />;
  }
};

const getLanguageLabel = (language: string) => {
  const labels: Record<string, string> = {
    tsx: "TypeScript React",
    jsx: "JavaScript React",
    ts: "TypeScript",
    js: "JavaScript",
    css: "CSS",
    html: "HTML",
    dart: "Dart",
    swift: "Swift",
    json: "JSON",
    vue: "Vue",
  };
  return labels[language] || language.toUpperCase();
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  filename,
  onCopy,
  onDownload,
  readOnly = true,
  height = "400px",
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [code, onCopy]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const editorOptions = {
    readOnly,
    minimap: { enabled: false },
    fontSize: 13,
    fontFamily:
      "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
    lineHeight: 20,
    padding: { top: 16, bottom: 16 },
    scrollBeyondLastLine: false,
    renderLineHighlight: "none" as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    scrollbar: {
      vertical: "auto" as const,
      horizontal: "auto" as const,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    lineNumbers: "on" as const,
    glyphMargin: false,
    folding: true,
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 4,
  };

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-background"
    : "code-editor";

  const editorHeight = isFullscreen ? "calc(100vh - 48px)" : height;

  return (
    <div className={containerClasses}>
      <div className="code-header">
        <div className="code-filename">
          {getFileIcon(language)}
          <span className="font-medium text-neutral-100">{filename}</span>
          <Badge variant="neutral" size="sm">
            {getLanguageLabel(language)}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-neutral-400 hover:text-neutral-100"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1.5" />
                Copy
              </>
            )}
          </Button>
          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="text-neutral-400 hover:text-neutral-100"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-neutral-400 hover:text-neutral-100"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <Editor
        height={editorHeight}
        language={language === "vue" ? "html" : language}
        value={code}
        theme="vs-dark"
        options={editorOptions}
        loading={<EditorLoading />}
      />
    </div>
  );
};

// Badge Component for language label
interface BadgeProps {
  variant?: "neutral" | "success" | "error" | "warning";
  size?: "sm" | "md";
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  size = "md",
  children,
}) => {
  const variantClasses = {
    neutral: "bg-neutral-800 text-neutral-300",
    success: "bg-success-900/20 text-success-400",
    error: "bg-error-900/20 text-error-400",
    warning: "bg-brand-900/20 text-brand-400",
  };

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-0.5 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
};

// Loading state for editor
const EditorLoading: React.FC = () => (
  <div className="flex items-center justify-center h-full bg-neutral-900">
    <div className="flex flex-col items-center gap-3">
      <div className="spinner h-8 w-8 text-neutral-400" />
      <p className="text-sm text-neutral-400">Loading editor...</p>
    </div>
  </div>
);

// File tabs component for multiple files
interface FileTab {
  filename: string;
  language: string;
  isActive: boolean;
  onClick: () => void;
}

interface FileTabsProps {
  tabs: FileTab[];
}

export const FileTabs: React.FC<FileTabsProps> = ({ tabs }) => {
  return (
    <div className="flex items-center gap-1 border-b border-neutral-800 bg-neutral-950/50 px-2 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.filename}
          onClick={tab.onClick}
          className={`
            flex items-center gap-2 px-3 py-2 text-sm font-medium
            border-b-2 transition-all duration-150
            ${
              tab.isActive
                ? "border-brand-500 text-neutral-100 bg-neutral-900/50"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
            }
          `}
        >
          {getFileIcon(tab.language)}
          {tab.filename}
        </button>
      ))}
    </div>
  );
};

export default CodeEditor;
