"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Editor as MonacoEditor, type Monaco } from "@monaco-editor/react";
import { getRepo } from "~/lib/db";
import { Skeleton } from "../ui/skeleton";

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
      rules: [],
      colors: {
        "editor.background": "#09090B",
        "editor.foreground": "#ffffff",
        "editor.lineHighlightBackground": "#1f1f1f",
        "editor.selectionBackground": "#264f78",
        "editorCursor.foreground": "#ffffff",
        "editorLineNumber.foreground": "#858585",
        "editorLineNumber.activeForeground": "#c6c6c6",
        "sideBar.background": "#000000",
        "sideBar.foreground": "#ffffff",
        "scrollbarSlider.background": "#4e4e4e80",
        "scrollbarSlider.hoverBackground": "#646464b3",
        "scrollbarSlider.activeBackground": "#646464b3",
      },
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

        // Set language based on file extension
        const extension = file.split(".").pop();
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

  // improve this
  if (!file) {
    return (
      <main className="hidden flex-1 items-center justify-center border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:flex">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Select a file to view its content
        </p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="hidden flex-1 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:block">
        <Skeleton className="h-full w-full" />
      </main>
    );
  }

  return (
    <main className="hidden flex-1 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:block">
      <div className="monaco-editor-container h-screen">
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
            fontSize: 14,
            lineNumbers: "on",
            wordWrap: "on",
            automaticLayout: true,
            domReadOnly: true,
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
          }}
        />
      </div>
    </main>
  );
}
