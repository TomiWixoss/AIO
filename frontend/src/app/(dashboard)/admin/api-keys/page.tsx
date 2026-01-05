"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Key, AlertCircle } from "lucide-react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiKeysApi, providersApi, ApiKey } from "@/lib/api";

const PROVIDER_NAMES: Record<string, string> = {
  "google-ai": "Google AI",
  groq: "Groq",
  cerebras: "Cerebras",
  openrouter: "OpenRouter",
};

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    provider_id: 0,
    name: "",
    credentials: "",
    priority: 1,
    daily_limit: 0,
  });

  const { data: providersData } = useQuery({
    queryKey: ["providers"],
    queryFn: () => providersApi.getAll(),
  });

  const providers = providersData?.data?.data || [];

  const { data: keysData, isLoading } = useQuery({
    queryKey: ["api-keys", selectedProviderId],
    queryFn: () =>
      selectedProviderId ? apiKeysApi.getByProvider(selectedProviderId) : null,
    enabled: !!selectedProviderId,
  });

  const keys = keysData?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiKeysApi.createForProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Thêm API key thành công");
      setIsDialogOpen(false);
    },
    onError: () => toast.error("Lỗi thêm API key"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiKeysApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Cập nhật thành công");
    },
    onError: () => toast.error("Lỗi cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiKeysApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Xóa thành công");
    },
    onError: () => toast.error("Lỗi xóa"),
  });

  const openDialog = () => {
    setFormData({
      provider_id: selectedProviderId || providers[0]?.id || 0,
      name: "",
      credentials: "",
      priority: 1,
      daily_limit: 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    createMutation.mutate({
      ...formData,
      credentials_encrypted: JSON.stringify({ api_key: formData.credentials }),
    });
  };

  const toggleActive = (key: ApiKey) => {
    updateMutation.mutate({ id: key.id, data: { is_active: !key.is_active } });
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="API Keys"
        description="Quản lý API keys cho các providers"
        actions={
          <Button onClick={openDialog} disabled={!selectedProviderId}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm Key
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4">
          <Label>Chọn Provider</Label>
          <Select
            value={selectedProviderId?.toString() || ""}
            onValueChange={(v) => setSelectedProviderId(parseInt(v))}
          >
            <SelectTrigger className="w-64 mt-1">
              <SelectValue placeholder="Chọn provider để xem keys" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {PROVIDER_NAMES[p.provider_id] || p.provider_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProviderId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Danh sách API keys cho provider đã chọn
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : keys.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Chưa có API key nào
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Ưu tiên</TableHead>
                      <TableHead>Sử dụng hôm nay</TableHead>
                      <TableHead>Giới hạn</TableHead>
                      <TableHead>Lỗi gần nhất</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">
                          {key.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{key.priority}</Badge>
                        </TableCell>
                        <TableCell>{key.requests_today}</TableCell>
                        <TableCell>
                          {key.daily_limit || "Không giới hạn"}
                        </TableCell>
                        <TableCell>
                          {key.last_error && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{key.last_error}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={key.is_active}
                            onCheckedChange={() => toggleActive(key)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Xác nhận xóa?"))
                                deleteMutation.mutate(key.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm API Key</DialogTitle>
            <DialogDescription>Nhập thông tin API key mới</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Key chính"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={formData.credentials}
                onChange={(e) =>
                  setFormData({ ...formData, credentials: e.target.value })
                }
                placeholder="sk-..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Độ ưu tiên</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Giới hạn/ngày (0 = không giới hạn)</Label>
                <Input
                  type="number"
                  value={formData.daily_limit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      daily_limit: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
