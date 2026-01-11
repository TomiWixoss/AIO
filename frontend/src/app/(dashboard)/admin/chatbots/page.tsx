"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Bot,
  Code,
  Copy,
  Key,
  Globe,
  Lock,
  Zap,
  Send,
  X,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatbots, Chatbot } from "@/hooks";
import { modelsApi, toolsApi, knowledgeApi } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotsPage() {
  const {
    chatbots,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    editingChatbot,
    formData,
    updateFormData,
    openDialog,
    closeDialog,
    handleSubmit,
    toggleActive,
    isSubmitting,
    handleDelete,
    regenerateKey,
    exportCode,
    isExportDialogOpen,
    setIsExportDialogOpen,
    openExportDialog,
    generateSlug,
  } = useChatbots();

  // Test chat state
  const [testChatbot, setTestChatbot] = useState<Chatbot | null>(null);
  const [testMessages, setTestMessages] = useState<ChatMessage[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: modelsData } = useQuery({
    queryKey: ["models"],
    queryFn: () => modelsApi.getAll(),
  });

  const { data: toolsData } = useQuery({
    queryKey: ["tools"],
    queryFn: () => toolsApi.getAll(),
  });

  const { data: knowledgeData } = useQuery({
    queryKey: ["knowledge"],
    queryFn: () => knowledgeApi.getAll(),
  });

  const models = modelsData?.data?.data || [];
  const tools = toolsData?.data?.data || [];
  const knowledgeBases = knowledgeData?.data?.data || [];

  const filteredModels = formData.provider_id
    ? models.filter((m) => m.provider_id === formData.provider_id)
    : models;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã copy!");
  };

  // Test chat functions
  const openTestChat = (chatbot: Chatbot) => {
    setTestChatbot(chatbot);
    setTestMessages(
      chatbot.welcome_message
        ? [{ role: "assistant", content: chatbot.welcome_message }]
        : []
    );
    setTestInput("");
  };

  const closeTestChat = () => {
    setTestChatbot(null);
    setTestMessages([]);
  };

  const sendTestMessage = async () => {
    if (!testInput.trim() || testLoading || !testChatbot) return;

    const userMessage = testInput;
    setTestInput("");
    setTestMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setTestLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/chatbots/${testChatbot.id}/test-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
        }
      );

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        setTestMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.choices[0].message.content },
        ]);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Lỗi gửi tin nhắn");
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testMessages]);

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Chatbot Builder"
        description="Tạo và quản lý chatbot với cấu hình riêng"
        actions={
          <Button onClick={() => openDialog()}>
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
              Mỗi chatbot có cấu hình riêng về model, tools, knowledge và có thể
              xuất code tích hợp
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : chatbots.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có chatbot nào</p>
                <Button className="mt-4" onClick={() => openDialog()}>
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
                    <TableHead>Features</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chatbots.map((chatbot) => (
                    <TableRow key={chatbot.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{chatbot.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {chatbot.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {chatbot.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        {chatbot.auto_mode ? (
                          <Badge variant="secondary">
                            <Zap className="h-3 w-3 mr-1" />
                            Auto
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {chatbot.model_display_name ||
                              chatbot.model_name ||
                              "N/A"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {chatbot.is_public ? (
                            <Badge variant="default" className="text-xs">
                              <Globe className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Private
                            </Badge>
                          )}
                          {chatbot.tool_ids &&
                            (chatbot.tool_ids as number[]).length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {(chatbot.tool_ids as number[]).length} tools
                              </Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={chatbot.is_active}
                          onCheckedChange={() => toggleActive(chatbot)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openTestChat(chatbot)}
                            title="Test chat"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openExportDialog(chatbot)}
                            title="Xuất code"
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => regenerateKey(chatbot.id)}
                            title="Tạo API key mới"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDialog(chatbot)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(chatbot.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog tạo/sửa chatbot */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChatbot ? "Sửa Chatbot" : "Tạo Chatbot mới"}
            </DialogTitle>
            <DialogDescription>
              Cấu hình chatbot với model, tools và knowledge riêng
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Cơ bản</TabsTrigger>
              <TabsTrigger value="model">Model</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="access">Truy cập</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên chatbot *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      updateFormData({ name: e.target.value });
                      if (!editingChatbot) {
                        updateFormData({ slug: generateSlug(e.target.value) });
                      }
                    }}
                    placeholder="Hỗ trợ khách hàng"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => updateFormData({ slug: e.target.value })}
                    placeholder="ho-tro-khach-hang"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  placeholder="Chatbot hỗ trợ khách hàng 24/7..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>System Prompt</Label>
                <Textarea
                  value={formData.system_prompt}
                  onChange={(e) =>
                    updateFormData({ system_prompt: e.target.value })
                  }
                  placeholder="Bạn là trợ lý AI thân thiện..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tin nhắn chào mừng</Label>
                  <Input
                    value={formData.welcome_message}
                    onChange={(e) =>
                      updateFormData({ welcome_message: e.target.value })
                    }
                    placeholder="Xin chào! Tôi có thể giúp gì?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Placeholder</Label>
                  <Input
                    value={formData.placeholder_text}
                    onChange={(e) =>
                      updateFormData({ placeholder_text: e.target.value })
                    }
                    placeholder="Nhập tin nhắn..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="model" className="space-y-4 mt-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap
                    className={
                      formData.auto_mode ? "h-5 w-5 text-yellow-500" : "h-5 w-5"
                    }
                  />
                  <Label>Chế độ Auto</Label>
                </div>
                <Switch
                  checked={formData.auto_mode}
                  onCheckedChange={(checked) =>
                    updateFormData({ auto_mode: checked })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  Tự động chọn model theo priority và fallback khi lỗi
                </span>
              </div>

              {!formData.auto_mode && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                      value={formData.provider_id?.toString() || ""}
                      onValueChange={(v) => {
                        const providerId = v ? parseInt(v) : null;
                        updateFormData({
                          provider_id: providerId,
                          model_id: null,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {models
                          .filter(
                            (m, i, arr) =>
                              arr.findIndex(
                                (x) => x.provider_id === m.provider_id
                              ) === i
                          )
                          .map((m) => (
                            <SelectItem
                              key={m.provider_id}
                              value={m.provider_id.toString()}
                            >
                              {m.provider_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={formData.model_id?.toString() || ""}
                      onValueChange={(v) =>
                        updateFormData({ model_id: v ? parseInt(v) : null })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn model" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredModels.map((m) => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {m.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Temperature ({formData.temperature})</Label>
                  <Input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) =>
                      updateFormData({
                        temperature: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) =>
                      updateFormData({
                        max_tokens: parseInt(e.target.value) || 2048,
                      })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Tools</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {tools.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Chưa có tool nào
                    </p>
                  ) : (
                    tools.map((tool) => (
                      <label
                        key={tool.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.tool_ids.includes(tool.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateFormData({
                                tool_ids: [...formData.tool_ids, tool.id],
                              });
                            } else {
                              updateFormData({
                                tool_ids: formData.tool_ids.filter(
                                  (id) => id !== tool.id
                                ),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{tool.name}</span>
                        <span className="text-xs text-muted-foreground">
                          - {tool.description}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Knowledge Bases</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {knowledgeBases.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Chưa có knowledge base nào
                    </p>
                  ) : (
                    knowledgeBases.map((kb) => (
                      <label
                        key={kb.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.knowledge_base_ids.includes(kb.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateFormData({
                                knowledge_base_ids: [
                                  ...formData.knowledge_base_ids,
                                  kb.id,
                                ],
                              });
                            } else {
                              updateFormData({
                                knowledge_base_ids:
                                  formData.knowledge_base_ids.filter(
                                    (id) => id !== kb.id
                                  ),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{kb.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="access" className="space-y-4 mt-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  {formData.is_public ? (
                    <Globe className="h-5 w-5" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                  <Label>Public Access</Label>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) =>
                    updateFormData({ is_public: checked })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {formData.is_public
                    ? "Ai cũng có thể truy cập"
                    : "Cần API key để truy cập"}
                </span>
              </div>

              {editingChatbot && (
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value={editingChatbot.api_key}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(editingChatbot.api_key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Allowed Origins (CORS)</Label>
                <Textarea
                  value={formData.allowed_origins.join("\n")}
                  onChange={(e) =>
                    updateFormData({
                      allowed_origins: e.target.value
                        .split("\n")
                        .filter((o) => o.trim()),
                    })
                  }
                  placeholder="https://example.com&#10;https://app.example.com"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Mỗi origin một dòng. Để trống = cho phép tất cả.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingChatbot ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xuất code */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Xuất Code Tích Hợp</DialogTitle>
            <DialogDescription>
              Copy code để tích hợp chatbot vào website của bạn
            </DialogDescription>
          </DialogHeader>

          {exportCode && (
            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="stream">JS Stream</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="react">React</TabsTrigger>
                <TabsTrigger value="widget">HTML Widget</TabsTrigger>
              </TabsList>

              {[
                "curl",
                "javascript",
                "javascript_stream",
                "python",
                "react",
                "html_widget",
              ].map((key) => (
                <TabsContent
                  key={key}
                  value={key === "javascript_stream" ? "stream" : key}
                >
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(exportCode[key])}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <ScrollArea className="h-[400px] w-full rounded-md border">
                      <pre className="p-4 text-xs">
                        <code>{exportCode[key]}</code>
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog test chat */}
      <Dialog open={!!testChatbot} onOpenChange={() => closeTestChat()}>
        <DialogContent className="max-w-lg h-[600px] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Test: {testChatbot?.name}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {testMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {testLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t flex gap-2">
            <Input
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendTestMessage()}
              placeholder={testChatbot?.placeholder_text || "Nhập tin nhắn..."}
              disabled={testLoading}
            />
            <Button onClick={sendTestMessage} disabled={testLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
