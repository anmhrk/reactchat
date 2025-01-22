export interface UserInfo {
  id: string | null;
  fullName: string | null;
  username: string | null;
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
