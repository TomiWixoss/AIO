"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Database,
  Bot,
  Key,
  Wrench,
  Blocks,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { statsApi } from "@/lib/api";

interface Stats {
  providers: { total: number; active: number };
  models: { total: number; active: number };
  tools: { total: number; active: number };
  api_keys: { total: number; active: number };
  chatbots: { total: number; active: number; public: number };
  knowledge_bases: { total: number; active: number };
  chat_sessions: { total: number };
}

export default function StatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => statsApi.get(),
  });

  const stats: Stats = data?.data?.data || {
    providers: { total: 0, active: 0 },
    models: { total: 0, active: 0 },
    tools: { total: 0, active: 0 },
    api_keys: { total: 0, active: 0 },
    chatbots: { total: 0, active: 0, public: 0 },
    knowledge_bases: { total: 0, active: 0 },
    chat_sessions: { total: 0 },
  };

  const cards = [
    {
      title: "Providers",
      value: stats.providers.total,
      sub: `${stats.providers.active} active`,
      icon: Database,
      color: "text-blue-500",
    },
    {
      title: "Models",
      value: stats.models.total,
      sub: `${stats.models.active} active`,
      icon: Bot,
      color: "text-green-500",
    },
    {
      title: "API Keys",
      value: stats.api_keys.total,
      sub: `${stats.api_keys.active} active`,
      icon: Key,
      color: "text-yellow-500",
    },
    {
      title: "Tools",
      value: stats.tools.total,
      sub: `${stats.tools.active} active`,
      icon: Wrench,
      color: "text-orange-500",
    },
    {
      title: "Chatbots",
      value: stats.chatbots.total,
      sub: `${stats.chatbots.active} active, ${stats.chatbots.public} public`,
      icon: Blocks,
      color: "text-purple-500",
    },
    {
      title: "Knowledge Bases",
      value: stats.knowledge_bases.total,
      sub: `${stats.knowledge_bases.active} active`,
      icon: BookOpen,
      color: "text-pink-500",
    },
    {
      title: "Chat Sessions",
      value: stats.chat_sessions.total,
      sub: "Tổng phiên chat",
      icon: MessageSquare,
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="flex flex-col h-screen">
      <Header title="Thống kê" description="Tổng quan hệ thống" />

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
                    <p className="text-xs text-muted-foreground">{card.sub}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
