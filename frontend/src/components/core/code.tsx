/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { Editor as MonacoEditor, type Monaco } from "@monaco-editor/react";
import { FaReact, FaChevronRight } from "react-icons/fa";
import { getRepo } from "~/lib/db";
import { Skeleton } from "../ui/skeleton";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import type { SelectedContext } from "./layout-helper";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export default function Code({
  setSelectedContext,
}: {
  setSelectedContext: React.Dispatch<React.SetStateAction<SelectedContext>>;
}) {
  const [code, setCode] = useState<string>("");
  const [repoName, setRepoName] = useState<string>("");
  const [language, setLanguage] = useState<string>("typescript");
  const [isLoading, setIsLoading] = useState(true);
  const [isPathNotFound, setIsPathNotFound] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const pathContainerRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
    show: boolean;
  }>({ x: 0, y: 0, show: false });

  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const file = searchParams.get("file");
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const clerk = useClerk();

  const beforeMount = (monaco: Monaco) => {
    monaco.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#09090B",
      },
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
      diagnosticCodesToIgnore: [7027],
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
      diagnosticCodesToIgnore: [7027],
    });
  };

  const onMount = (editor: any) => {
    let cleanup: (() => void) | null = null;

    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection();
      const selectedText = editor.getModel().getValueInRange(selection);

      if (cleanup) {
        cleanup();
      }

      if (selectedText) {
        const startPosition = selection.getStartPosition();
        const coordinates = editor.getScrolledVisiblePosition(startPosition);
        const editorDomNode = editor.getDomNode();

        if (coordinates && editorDomNode) {
          const editorRect = editorDomNode.getBoundingClientRect();
          const x = editorRect.left + coordinates.left;
          const y = editorRect.top + coordinates.top;

          setTooltipPosition({
            x,
            y,
            show: true,
          });
        }

        const handleKeyPress = (e: KeyboardEvent) => {
          if (e.key.toLowerCase() === "q") {
            setSelectedContext((prev: SelectedContext) => {
              const newContext: SelectedContext = { ...prev };

              // if this file path already exists in the context
              if (file && file in newContext) {
                // add the new selection to the existing array
                newContext[file] = [...newContext[file]!, selectedText];
              } else {
                // else create a new array with this selection
                newContext[file!] = [selectedText];
              }
              return newContext;
            });

            setTooltipPosition((prev) => ({ ...prev, show: false }));
          }
        };

        document.addEventListener("keydown", handleKeyPress);

        cleanup = () => {
          setTooltipPosition((prev) => ({ ...prev, show: false }));
          document.removeEventListener("keydown", handleKeyPress);
        };
      } else {
        setTooltipPosition((prev) => ({ ...prev, show: false }));
      }
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  };

  useEffect(() => {
    async function loadCode() {
      if (!file) {
        setIsLoading(false);
        return;
      }

      try {
        const repo = await getRepo(params.id);
        const name = repo?.github_url.split("/").pop()?.split(".")[0];
        setRepoName(name ?? "");
        if (!repo) {
          setIsLoading(false);
          return;
        }

        const fileData = repo.files.find((f) => f.path === file);
        if (!fileData) {
          setIsPathNotFound(true);
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

  useEffect(() => {
    const checkOverflow = () => {
      if (pathContainerRef.current) {
        const isOverflowing =
          pathContainerRef.current.scrollWidth >
          pathContainerRef.current.clientWidth;
        setShouldTruncate(isOverflowing);
      }
    };

    const timeoutId = setTimeout(checkOverflow, 0);

    window.addEventListener("resize", checkOverflow);
    return () => {
      window.removeEventListener("resize", checkOverflow);
      clearTimeout(timeoutId);
    };
  }, [file, code, repoName]);

  if (isLoading && file) {
    return (
      <main className="hidden flex-1 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#09090B] md:block">
        <div className="flex flex-col">
          <div className="px-4 py-2">
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-3 p-4">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3.5 w-1/3" />
          </div>
        </div>
      </main>
    );
  }

  const renderPath = (path: string) => {
    const parts = path.split("/");
    if (!shouldTruncate || parts.length <= 4) {
      return parts.map((part, index) => (
        <span key={index} className="flex items-center">
          {index > 0 && (
            <FaChevronRight className="mx-1 h-3 w-3 flex-shrink-0" />
          )}
          <span className="min-w-0 flex-shrink truncate">{part}</span>
        </span>
      ));
    }

    return (
      <>
        <span className="flex items-center">
          <span className="min-w-0 flex-shrink truncate">{parts[0]}</span>
          <FaChevronRight className="mx-1 h-3 w-3 flex-shrink-0" />
          <span className="min-w-0 flex-shrink truncate">{parts[1]}</span>
          <FaChevronRight className="mx-1 h-3 w-3 flex-shrink-0" />
          <span className="min-w-0 flex-shrink truncate">{parts[2]}</span>
        </span>
        <span className="flex items-center">
          <FaChevronRight className="mx-1 h-3 w-3 flex-shrink-0" />
          <span className="flex-shrink-0 text-zinc-400">...</span>
          <FaChevronRight className="mx-1 h-3 w-3 flex-shrink-0" />
          <span className="min-w-0 flex-shrink truncate">
            {parts[parts.length - 1]}
          </span>
        </span>
      </>
    );
  };

  return (
    <main className="hidden flex-1 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#09090B] md:block">
      {tooltipPosition.show && (
        <div
          className="fixed z-50"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <TooltipProvider>
            <Tooltip defaultOpen>
              <TooltipTrigger asChild>
                <div className="h-1 w-1" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-sm font-semibold">
                Press
                <p className="ml-1 mr-1 inline-block rounded-lg bg-zinc-600 px-2 dark:bg-zinc-300">
                  Q
                </p>
                to quote
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {!file || isPathNotFound ? (
        <div className="flex h-screen flex-col items-center justify-center space-y-3 text-center">
          <FaReact className="mx-auto h-24 w-24 text-[#58C4DC]" />
          <p className="text-md text-zinc-500 dark:text-zinc-400">
            {isPathNotFound
              ? "File not found. Please select a different file."
              : "Select a file to view and interact with the code"}
          </p>
        </div>
      ) : (
        <div className="flex h-screen flex-col">
          <div className="flex min-w-0 items-center p-2 px-4 text-sm text-zinc-600 dark:text-zinc-400">
            <div
              className={`flex w-0 min-w-0 flex-1 whitespace-nowrap ${
                shouldTruncate ? "overflow-x-hidden" : "overflow-x-auto"
              }`}
              ref={pathContainerRef}
            >
              <Link
                href={`/chat/${params.id}`}
                className="flex-shrink-0 truncate font-semibold text-black dark:text-white/80 dark:hover:text-white/100"
              >
                {repoName}
              </Link>
              <p className="mx-2 flex-shrink-0 text-black dark:text-white/80">
                /
              </p>
              {renderPath(file)}
            </div>
          </div>
          <div className="monaco-editor-container flex-1">
            {clerk.loaded && (
              <MonacoEditor
                height="100%"
                language={language}
                theme={isDarkMode ? "custom-dark" : "light"}
                value={code}
                beforeMount={beforeMount}
                onMount={onMount}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  automaticLayout: true,
                  wordWrap: "on",
                  domReadOnly: true,
                  padding: {
                    top: 8,
                    bottom: 8,
                  },
                  scrollbar: {
                    verticalScrollbarSize: 7,
                    horizontalScrollbarSize: 7,
                    verticalSliderSize: 7,
                    horizontalSliderSize: 7,
                    useShadows: false,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                    arrowSize: 0,
                  },
                  smoothScrolling: true,
                  cursorBlinking: "solid",
                  cursorSmoothCaretAnimation: "on",
                  renderWhitespace: "selection",
                  renderValidationDecorations: "off",
                  hover: { enabled: false },
                }}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
