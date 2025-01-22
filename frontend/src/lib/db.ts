import { openDB, type DBSchema } from "idb";

interface RepoSchema extends DBSchema {
  repos: {
    key: string; // chatId
    value: {
      files: { path: string; content: string }[];
      github_url: string;
    };
  };
}

const DB_NAME = "reactchat";
const STORE_NAME = "repos";

async function initDB() {
  return openDB<RepoSchema>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
}

export async function getRepo(chatId: string) {
  const db = await initDB();
  return db.get(STORE_NAME, chatId);
}

export async function setRepo(
  chatId: string,
  data: RepoSchema["repos"]["value"],
) {
  const db = await initDB();
  return db.put(STORE_NAME, data, chatId);
}
