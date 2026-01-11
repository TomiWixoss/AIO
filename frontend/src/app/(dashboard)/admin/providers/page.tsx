"use client";

import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Loader2,
  Database,
  Key,
  Bot,
  Settings,
  ChevronRight,
  Sparkles,
  Zap,
  Brain,
  Globe,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useProviders } from "@/hooks";

const ProviderIcon = ({ providerId }: { providerId: string }) => {
  switch (providerId) {
    case "google-ai":
      return <Sparkles className="h-5 w-5 text-blue-500" />;
    case "groq":
      return <Zap className="h-5 w-5 text-orange-500" />;
    case "cerebras":
      return <Brain className="h-5 w-5 text-purple-500" />;
    case "openrouter":
      return <Globe className="h-5 w-5 text-green-500" />;
    default:
      return <Bot className="h-5 w-5 text-muted-foreground" />;
  }
};

export default function ProvidersPage() {
  const router = useRouter();
  const {
    providers,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    selectedProviderId,
    setSelectedProviderId,
    priority,
    setPriority,
    availableProviders,
    handleCreate,
    toggleActive,
    updatePriority,
    getProviderDisplayName,
    isSubmitting,
    handleDelete,
  } = useProviders();

  const handleProviderClick = (providerId: number) => {
    router.push(`/admin/providers/${providerId}`);
  };

  // Sort by priority DESC
  const sortedProviders = [...providers].sort(
    (a, b) => (b.priority || 0) - (a.priority || 0)
  );

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Providers"
        description="Quản lý các nhà cung cấp LLM - Bấm vào provider để cấu hình API Keys và Models"
        actions={
          <Button
            onClick={() => setIsDialogOpen(true)}
            disabled={availableProviders.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm Provider
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[180px] w-full" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Chưa có provider nào
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Thêm provider để bắt đầu sử dụng các model AI
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Provider đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedProviders.map((provider) => (
              <Card
                key={provider.id}
                className="cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => handleProviderClick(provider.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <ProviderIcon providerId={provider.provider_id} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {getProviderDisplayName(provider.provider_id)}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {provider.provider_id}
                        </CardDescription>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch
                        checked={provider.is_active}
                        onCheckedChange={() => toggleActive(provider)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {provider.active_keys_count || 0} keys
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {provider.models_count || 0} models
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={provider.is_active ? "default" : "secondary"}
                      >
                        {provider.is_active ? "Hoạt động" : "Tắt"}
                      </Badge>
                      {/* Priority controls */}
                      <div
                        className="flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            updatePriority(
                              provider,
                              (provider.priority || 0) + 1
                            )
                          }
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center font-mono text-xs">
                          {provider.priority || 0}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            updatePriority(
                              provider,
                              Math.max(0, (provider.priority || 0) - 1)
                            )
                          }
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(provider.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 group-hover:bg-primary group-hover:text-primary-foreground"
                      >
                        <Settings className="h-4 w-4" />
                        Cấu hình
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Provider</DialogTitle>
            <DialogDescription>
              Chọn nhà cung cấp LLM để thêm vào hệ thống. Sau khi thêm, bạn có
              thể cấu hình API Keys và Models.
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
                      <div className="flex items-center gap-2">
                        <ProviderIcon providerId={type.id} />
                        <span>{type.name}</span>
                        <span className="text-muted-foreground">
                          ({type.id})
                        </span>
                      </div>
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
            <div className="space-y-2">
              <Label>Độ ưu tiên (Priority)</Label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Số cao hơn = ưu tiên cao hơn trong Auto mode
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !selectedProviderId}
            >
              {isSubmitting && (
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
