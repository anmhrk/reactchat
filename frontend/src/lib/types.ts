export interface UserInfo {
  id: string | null;
  fullName: string | null;
  imageUrl: string | null;
  email: string | null;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  content?: string;
}

export interface RecentChat {
  id: string;
  github_url: string;
  created_at: string;
  is_bookmarked: boolean;
}

export type IngestStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "failed";

export type ChatStatus = {
  is_bookmarked: boolean;
};
