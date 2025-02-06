import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";

export async function serverFetch(input: RequestInfo, init?: RequestInit) {
  // Grab the incoming cookie header
  const cookie = (await headers()).get("cookie") ?? "";
  const { getToken } = await auth();
  const token = await getToken();

  const updatedInit: RequestInit = {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      cookie,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  };

  return fetch(input, updatedInit);
}
