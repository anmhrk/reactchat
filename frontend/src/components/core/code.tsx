/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Editor as MonacoEditor, type Monaco } from "@monaco-editor/react";
import { FaChevronRight } from "react-icons/fa";
import { getRepo } from "~/lib/db";
import { Skeleton } from "../ui/skeleton";
import { FolderIcon } from "lucide-react";

export default function Code() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const file = searchParams.get("file");
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const [code, setCode] = useState<string>("");
  const [language, setLanguage] = useState<string>("typescript");
  const [isLoading, setIsLoading] = useState(true);

  const beforeMount = (monaco: Monaco) => {
    monaco.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955" },
        { token: "keyword", foreground: "569CD6", fontStyle: "bold" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "regexp", foreground: "D16969" },
        { token: "type", foreground: "4EC9B0" },
        { token: "class", foreground: "4EC9B0", fontStyle: "bold" },
        { token: "interface", foreground: "4EC9B0", fontStyle: "bold" },
        { token: "function", foreground: "DCDCAA" },
        { token: "variable", foreground: "9CDCFE" },
        { token: "constant", foreground: "4FC1FF" },
      ],
      colors: {
        "editor.background": "#0F0F10",
        "editor.foreground": "#D4D4D4",
        "editor.lineHighlightBackground": "#1F1F1F",
        "editor.lineHighlightBorder": "#282828",
        "editor.selectionBackground": "#264F78",
        "editor.selectionHighlightBackground": "#264F7844",
        "editor.findMatchBackground": "#515C6A",
        "editor.findMatchHighlightBackground": "#515C6A44",
        "editorLineNumber.foreground": "#6B7280",
        "editorLineNumber.activeForeground": "#D4D4D4",
        "editorCursor.foreground": "#FFFFFF",
        "editorIndentGuide.background": "#404040",
        "editorIndentGuide.activeBackground": "#707070",
        "editorRuler.foreground": "#404040",
        "editorBracketMatch.background": "#4C4C4C",
        "editorBracketMatch.border": "#6B7280",
        "scrollbarSlider.background": "#4E4E4E80",
        "scrollbarSlider.hoverBackground": "#646464B3",
        "scrollbarSlider.activeBackground": "#646464B3",
      },
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: [7027],
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: [7027],
    });
  };

  useEffect(() => {
    async function loadCode() {
      if (!file) {
        setIsLoading(false);
        return;
      }

      try {
        const repo = await getRepo(params.id);
        if (!repo) {
          setIsLoading(false);
          return;
        }

        const fileData = repo.files.find((f) => f.path === file);
        if (!fileData) {
          setIsLoading(false);
          return;
        }

        setCode(fileData.content);

        const extension = file.split(".").pop()?.toLowerCase();
        switch (extension) {
          case "ts":
          case "tsx":
            setLanguage("typescript");
            break;
          case "js":
          case "jsx":
            setLanguage("javascript");
            break;
          case "py":
            setLanguage("python");
            break;
          case "json":
            setLanguage("json");
            break;
          case "css":
            setLanguage("css");
            break;
          case "html":
            setLanguage("html");
            break;
          case "md":
            setLanguage("markdown");
            break;
          default:
            setLanguage("typescript");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadCode();
  }, [file, params.id]);

  // Change this to always open readme.md instead if no file is selected
  if (!file) {
    return (
      <main className="hidden flex-1 items-center justify-center border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:flex">
        <div className="space-y-3 text-center">
          <FolderIcon className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-500" />
          <div className="space-y-1">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No file selected
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Select a file from the sidebar to view its content
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="hidden flex-1 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:block">
        <div className="space-y-3 p-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="hidden flex-1 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:block">
      <div className="flex h-screen flex-col">
        <div className="flex items-center border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <FaChevronRight className="mr-2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {file}
          </span>
        </div>
        <div className="monaco-editor-container flex-1">
          <MonacoEditor
            height="100%"
            language={language}
            theme={isDarkMode ? "custom-dark" : "light"}
            value={code}
            beforeMount={beforeMount}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              fontLigatures: true,
              lineNumbers: "on",
              renderLineHighlight: "all",
              wordWrap: "on",
              automaticLayout: true,
              domReadOnly: true,
              padding: {
                top: 16,
                bottom: 16,
              },
              lineNumbersMinChars: 3,
              glyphMargin: false,
              folding: true,
              foldingHighlight: true,
              showFoldingControls: "mouseover",
              matchBrackets: "always",
              colorDecorators: true,
              contextmenu: false,
              mouseWheelZoom: false,
              rulers: [80],
              roundedSelection: true,
              scrollbar: {
                vertical: "visible",
                horizontal: "visible",
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
                verticalSliderSize: 8,
                horizontalSliderSize: 8,
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                arrowSize: 0,
              },
              smoothScrolling: true,
              cursorBlinking: "solid",
              cursorSmoothCaretAnimation: "on",
              renderWhitespace: "selection",
              guides: {
                indentation: true,
                bracketPairs: true,
              },
              occurrencesHighlight: "off",
              renderValidationDecorations: "off",
            }}
          />
        </div>
      </div>
    </main>
  );
}
