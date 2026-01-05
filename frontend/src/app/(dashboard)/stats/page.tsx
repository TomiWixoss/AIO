"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Zap, MessageSquare, TrendingUp } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { statsApi } from "@/lib/api";

export default function StatsPage() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => statsApi.get(),
  });

  const { data: todayData } = useQuery({
    queryKey: ["stats-today"],
    queryFn: () => statsApi.getToday(),
  });

  const stats = statsData?.data?.data;
  const today = todayData?.data?.data;

  const cards = [
    {
      title: "Tổng yêu cầu",
      value: stats?.total_requests || 0,
      description: "Tất cả thời gian",
      icon: MessageSquare,
      color: "text-blue-500",
    },
    {
      title: "Tổng tokens",
      value: stats?.total_tokens?.toLocaleString() || 0,
      description: "Đã sử dụng",
      icon: Zap,
      color: "text-yellow-500",
    },
    {
      title: "Yêu cầu hôm nay",
      value: today?.requests_today || 0,
      description: "24 giờ qua",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "Tokens hôm nay",
      value: today?.tokens_today?.toLocaleString() || 0,
      description: "24 giờ qua",
      icon: BarChart3,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="flex flex-col h-screen">
      <Header title="Thống kê" description="Tổng quan sử dụng hệ thống" />

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {card.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Lịch sử sử dụng</CardTitle>
            <CardDescription>
              Biểu đồ sử dụng theo thời gian (sắp có)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Biểu đồ thống kê sẽ được thêm vào đây</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
