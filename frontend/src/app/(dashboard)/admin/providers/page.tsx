"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Database, Key } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { providersApi, Provider } from "@/lib/api";

const PROVIDER_TYPES = [
  { id: "google-ai", name: "Google AI" },
  { id: "groq", name: "Groq" },
  { id: "cerebras", name: "Cerebras" },
  { id: "openrouter", name: "OpenRouter" },
];

export default function ProvidersPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: () => providersApi.getAll(),
  });

  const providers = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: { provider_id: string }) => providersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Tạo provider thành công");
      setIsDialogOpen(false);
      setSelectedProviderId("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Lỗi tạo provider");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Provider> }) =>
      providersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Cập nhật thành công");
    },
    onError: () => toast.error("Lỗi cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => providersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Xóa thành công");
    },
    onError: () => toast.error("Lỗi xóa provider"),
  });

  const handleCreate = () => {
    if (!selectedProviderId) {
      toast.error("Vui lòng chọn loại provider");
      return;
    }
    createMutation.mutate({ provider_id: selectedProviderId });
  };

  const toggleActive = (provider: Provider) => {
    updateMutation.mutate({
      id: provider.id,
      data: { is_active: !provider.is_active },
    });
  };

  const getProviderDisplayName = (providerId: string) => {
    return PROVIDER_TYPES.find((p) => p.id === providerId)?.name || providerId;
  };

  // Lọc ra các provider chưa được thêm
  const existingProviderIds = providers.map((p) => p.provider_id);
  const availableProviders = PROVIDER_TYPES.filter(
    (p) => !existingProviderIds.includes(p.id)
  );

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Providers"
        description="Quản lý các nhà cung cấp LLM"
        actions={
          <Button
            onClick={() => setIsDialogOpen(true)}
            disabled={availableProviders.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Thêm Provider
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Danh sách Providers
            </CardTitle>
            <CardDescription>
              Các nhà cung cấp dịch vụ AI đã cấu hình
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : providers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Chưa có provider nào. Nhấn &quot;Thêm Provider&quot; để bắt đầu.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>API Keys</TableHead>
                    <TableHead>Độ ưu tiên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {provider.provider_id}
                          </Badge>
                          <span className="font-medium">
                            {getProviderDisplayName(provider.provider_id)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Key className="h-3 w-3 mr-1" />
                          {provider.active_keys_count || 0} keys
                        </Badge>
                      </TableCell>
                      <TableCell>{provider.priority || 0}</TableCell>
                      <TableCell>
                        <Switch
                          checked={provider.is_active}
                          onCheckedChange={() => toggleActive(provider)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Xác nhận xóa provider này?"))
                              deleteMutation.mutate(provider.id);
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Provider</DialogTitle>
            <DialogDescription>
              Chọn nhà cung cấp LLM để thêm vào hệ thống
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Loại Provider</Label>
              <Select
                value={selectedProviderId}
                onValueChange={setSelectedProviderId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn provider" />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableProviders.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Tất cả providers đã được thêm
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !selectedProviderId}
            >
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
