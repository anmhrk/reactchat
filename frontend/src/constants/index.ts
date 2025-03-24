import { env } from "~/env";
import { SiTypescript, SiJavascript, SiNextdotjs } from "react-icons/si";
import { FaInfoCircle, FaGitAlt, FaHtml5, FaCss3 } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import { FaReact } from "react-icons/fa";
import { VscJson } from "react-icons/vsc";

export const BACKEND_URL = env.NEXT_PUBLIC_BACKEND_URL;

export const ICON_MAP = {
  ".ts": SiTypescript,
  ".tsx": FaReact,
  ".js": SiJavascript,
  ".mjs": SiJavascript,
  ".cjs": SiJavascript,
  ".jsx": FaReact,
  ".json": VscJson,
  ".md": FaInfoCircle,
  ".gitignore": FaGitAlt,
  ".html": FaHtml5,
  "next.config.ts": SiNextdotjs,
  "next.config.js": SiNextdotjs,
  ".css": FaCss3,
  ".env.example": IoIosSettings,
};

export const ICON_COLORS = {
  ".ts": "text-[#0088D1]",
  ".tsx": "text-[#58C4DC]",
  ".js": "text-[#FFCA27]",
  ".mjs": "text-[#FFCA27]",
  ".cjs": "text-[#FFCA27]",
  ".jsx": "text-[#58C4DC]",
  ".json": "text-black dark:text-white/80",
  ".md": "text-[#42A5F5]",
  ".gitignore": "text-[#E64A19]",
  ".html": "text-[#FFCA27]",
  "next.config.ts": "dark:text-[#CFD8DB] text-black/80",
  "next.config.js": "dark:text-[#CFD8DB] text-black/80",
  ".css": "text-[#42A5F5]",
};

export const MODEL_OPTIONS = [
  {
    name: "GPT-4o",
    value: "gpt-4o",
  },
  {
    name: "Claude 3.5 Sonnet",
    value: "claude-3-5-sonnet-20241022",
    disabled: true,
  },
];
