import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

export function useClientFetch() {
  const { getToken } = useAuth();

  return useCallback(
    async function clientFetch(input: RequestInfo, init?: RequestInit) {
      // Get token using client-side Clerk token function
      const token = await getToken();

      const updatedInit: RequestInit = {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      };

      return fetch(input, updatedInit);
    },
    [getToken],
  );
}
