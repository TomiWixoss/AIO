"use client";

import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api";

export function useStats() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => statsApi.get(),
  });

  const { data: todayData } = useQuery({
    queryKey: ["stats-today"],
    queryFn: () => statsApi.getToday(),
  });

  const statsRaw = statsData?.data?.data;
  const todayRaw = todayData?.data?.data;

  const totalRequests = statsRaw?.total_requests || 0;

  let totalTokens = 0;
  if (statsRaw?.total_tokens) {
    if (typeof statsRaw.total_tokens === "object") {
      totalTokens =
        (statsRaw.total_tokens.prompt || 0) +
        (statsRaw.total_tokens.completion || 0);
    } else {
      totalTokens = statsRaw.total_tokens;
    }
  }

  const requestsToday = todayRaw?.requests || 0;
  const tokensToday =
    (todayRaw?.prompt_tokens || 0) + (todayRaw?.completion_tokens || 0);

  return {
    isLoading,
    totalRequests,
    totalTokens,
    requestsToday,
    tokensToday,
  };
}
