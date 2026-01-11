"use client";

import {
  Plus,
  Trash2,
  Pencil,
  Bot,
  MoreVertical,
  Zap,
  Globe,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatbots } from "@/hooks/use-chatbots";

export default function ChatbotsPage() {
  const router = useRouter();
  const { chatbots, isLoading, toggleActive, handleDelete } = useChatbots();

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Chatbots"
        description="Quản lý các chatbot AI"
        actions={
          <Button onClick={() => router.push("/admin/chatbots/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo Chatbot
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Danh sách Chatbots
            </CardTitle>
            <CardDescription>
              Click vào chatbot để mở trang chỉnh sửa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : chatbots.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  Chưa có chatbot nào
                </p>
                <Button onClick={() => router.push("/admin/chatbots/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo chatbot đầu tiên
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Truy cập</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chatbots.map((chatbot) => (
                    <TableRow
                      key={chatbot.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        router.push(`/admin/chatbots/${chatbot.id}`)
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{chatbot.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">
                          /{chatbot.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        {chatbot.auto_mode ? (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Auto
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {chatbot.model_display_name ||
                              chatbot.model_name ||
                              "N/A"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {chatbot.is_public ? (
                          <Badge className="text-xs bg-green-500/10 text-green-600">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={chatbot.is_active}
                          onCheckedChange={() => toggleActive(chatbot)}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/chatbots/${chatbot.id}`)
                              }
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(chatbot.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
