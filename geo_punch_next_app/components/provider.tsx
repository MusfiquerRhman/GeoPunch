"use client";

import { QueryClient, QueryClientProvider  } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min fresh cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}