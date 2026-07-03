// Safe wrapper around Convex useQuery that catches server errors
// When the Convex function doesn't exist on the server, returns undefined
// instead of throwing an error that would crash the component.

import { useQuery_experimental } from "convex/react";

export function useSafeQuery(query: any, args?: any): any {
  if (!query) return undefined;

  const result = useQuery_experimental({
    query,
    args: args ?? {},
    throwOnError: false,
  });

  if (result?.status === "error") {
    console.warn("[useSafeQuery] Query error:", result.error);
    return undefined;
  }

  if (result?.status === "pending") {
    return undefined;
  }

  return result?.data;
}
