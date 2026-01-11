"use client";

import { Plus, Trash2, Pencil, Wrench, MoreVertical } from "lucide-react";
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
import { useTools } from "@/hooks/use-tools";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-500/20 text-green-600",
  POST: "bg-yellow-500/20 text-yellow-600",
  PUT: "bg-blue-500/20 text-blue-600",
  DELETE: "bg-red-500/20 text-red-600",
};

export default function ToolsPage() {
  const router = useRouter();
  const { tools, isLoading, toggleActive, handleDelete } = useTools();

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Tools"
        description="Quản lý các công cụ API cho AI sử dụng"
        actions={
          <Button onClick={() => router.push("/admin/tools/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo Tool
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Danh sách Tools
            </CardTitle>
            <CardDescription>
              Click vào tool để mở trang chỉnh sửa giống Postman
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tools.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">Chưa có tool nào</p>
                <Button onClick={() => router.push("/admin/tools/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo tool đầu tiên
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.map((tool) => (
                    <TableRow
                      key={tool.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/tools/${tool.id}`)}
                    >
                      <TableCell>
                        <Badge className={METHOD_COLORS[tool.http_method]}>
                          {tool.http_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="font-mono text-sm">{tool.name}</code>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {tool.description}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground truncate block max-w-[200px]">
                          {tool.endpoint_url}
                        </code>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={tool.is_active}
                          onCheckedChange={() => toggleActive(tool)}
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
                                router.push(`/admin/tools/${tool.id}`)
                              }
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                if (confirm("Xác nhận xóa tool này?")) {
                                  handleDelete(tool.id);
                                }
                              }}
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
