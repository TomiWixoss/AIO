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
  ExternalLink,
  Eye,
  Settings2,
  Sparkles,
  MessageSquare,
  Check,
  RefreshCw,
  Monitor,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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

// Chatbot type templates
const CHATBOT_TEMPLATES = [
  {
    id: "customer-support",
    name: "Hỗ trợ khách hàng",
    icon: "💬",
    description: "Chatbot trả lời câu hỏi, hỗ trợ khách hàng 24/7",
    system_prompt:
      "Bạn là trợ lý hỗ trợ khách hàng thân thiện và chuyên nghiệp. Hãy trả lời ngắn gọn, chính xác và luôn sẵn sàng giúp đỡ khách hàng.",
    temperature: 0.7,
    welcome_message: "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?",
  },
  {
    id: "sales",
    name: "Tư vấn bán hàng",
    icon: "🛒",
    description: "Chatbot tư vấn sản phẩm, hỗ trợ mua hàng",
    system_prompt:
      "Bạn là chuyên viên tư vấn bán hàng. Hãy giới thiệu sản phẩm một cách hấp dẫn, trả lời thắc mắc và hướng dẫn khách hàng mua hàng.",
    temperature: 0.8,
    welcome_message:
      "Chào bạn! Tôi có thể giúp bạn tìm sản phẩm phù hợp. Bạn đang quan tâm đến gì?",
  },
  {
    id: "faq",
    name: "FAQ Bot",
    icon: "❓",
    description: "Chatbot trả lời câu hỏi thường gặp từ knowledge base",
    system_prompt:
      "Bạn là trợ lý trả lời câu hỏi thường gặp. Chỉ trả lời dựa trên thông tin được cung cấp. Nếu không biết, hãy nói rằng bạn không có thông tin.",
    temperature: 0.3,
    welcome_message:
      "Xin chào! Tôi có thể giúp bạn tìm câu trả lời cho các câu hỏi thường gặp.",
  },
  {
    id: "assistant",
    name: "Trợ lý AI",
    icon: "🤖",
    description: "Chatbot đa năng, có thể thực hiện nhiều tác vụ",
    system_prompt:
      "Bạn là trợ lý AI thông minh và đa năng. Hãy giúp người dùng với mọi yêu cầu một cách sáng tạo và hiệu quả.",
    temperature: 0.9,
    welcome_message:
      "Xin chào! Tôi là trợ lý AI của bạn. Hãy cho tôi biết bạn cần gì!",
  },
  {
    id: "custom",
    name: "Tùy chỉnh",
    icon: "⚙️",
    description: "Tạo chatbot với cấu hình hoàn toàn tùy chỉnh",
    system_prompt: "",
    temperature: 0.7,
    welcome_message: "",
  },
];

export default function ChatbotsPage() {
  const router = useRouter();
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

  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Test chat state
  const [testChatbot, setTestChatbot] = useState<Chatbot | null>(null);
  const [testMessages, setTestMessages] = useState<ChatMessage[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
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

  const copyToClipboard = (text: string, key?: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã copy!");
    if (key) {
      setCopiedCode(key);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Template selection handler
  const selectTemplate = (templateId: string) => {
    const template = CHATBOT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      updateFormData({
        system_prompt: template.system_prompt,
        temperature: template.temperature,
        welcome_message: template.welcome_message,
      });
    }
    setShowTemplates(false);
  };

  // Open dialog with template selection
  const openCreateDialog = () => {
    setSelectedTemplate(null);
    setShowTemplates(true);
    openDialog();
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi gửi tin nhắn";
      toast.error(errorMessage);
    } finally {
      setTestLoading(false);
    }
  };

  const clearTestChat = () => {
    setTestMessages(
      testChatbot?.welcome_message
        ? [{ role: "assistant", content: testChatbot.welcome_message }]
        : []
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testMessages]);

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Chatbot Builder"
        description="Tạo và quản lý nhiều loại chatbot với cấu hình riêng biệt"
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo Chatbot
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : chatbots.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">
                Chưa có chatbot nào
              </h3>
              <p className="text-muted-foreground mb-6">
                Tạo chatbot đầu tiên để bắt đầu tích hợp AI vào website của bạn
              </p>
              <Button size="lg" onClick={openCreateDialog}>
                <Sparkles className="h-4 w-4 mr-2" />
                Tạo chatbot đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chatbots.map((chatbot) => (
              <Card
                key={chatbot.id}
                className={`relative ${!chatbot.is_active ? "opacity-60" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {chatbot.name}
                        </CardTitle>
                        <code className="text-xs text-muted-foreground">
                          /{chatbot.slug}
                        </code>
                      </div>
                    </div>
                    <Switch
                      checked={chatbot.is_active}
                      onCheckedChange={() => toggleActive(chatbot)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {chatbot.description || "Không có mô tả"}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {chatbot.auto_mode ? (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Auto Mode
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {chatbot.model_display_name ||
                          chatbot.model_name ||
                          "N/A"}
                      </Badge>
                    )}
                    {chatbot.is_public ? (
                      <Badge className="text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20">
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
                    {chatbot.knowledge_base_ids &&
                      (chatbot.knowledge_base_ids as number[]).length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {(chatbot.knowledge_base_ids as number[]).length} KB
                        </Badge>
                      )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span>Temp: {chatbot.temperature}</span>
                    <span className="mx-2">•</span>
                    <span>Max: {chatbot.max_tokens} tokens</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t flex justify-between">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openTestChat(chatbot)}
                      title="Test chat"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/chatbots/${chatbot.id}/preview`)
                      }
                      title="Preview widget"
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openExportDialog(chatbot)}
                      title="Xuất code"
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => regenerateKey(chatbot.id)}
                      title="Tạo API key mới"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(null);
                        setShowTemplates(false);
                        openDialog(chatbot);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(chatbot.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog tạo/sửa chatbot */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChatbot ? "Chỉnh sửa Chatbot" : "Tạo Chatbot mới"}
            </DialogTitle>
            <DialogDescription>
              {editingChatbot
                ? "Cập nhật cấu hình chatbot của bạn"
                : "Chọn template hoặc tùy chỉnh chatbot theo nhu cầu"}
            </DialogDescription>
          </DialogHeader>

          {/* Template Selection (only for new chatbot) */}
          {!editingChatbot && showTemplates && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 py-4">
              {CHATBOT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => selectTemplate(template.id)}
                  className={`p-4 border rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <div className="text-2xl mb-2">{template.icon}</div>
                  <h4 className="font-medium text-sm">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Main Form */}
          {(!showTemplates || editingChatbot) && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Cơ bản</TabsTrigger>
                <TabsTrigger value="model">Model</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="access">Truy cập</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                {!editingChatbot && selectedTemplate && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {
                          CHATBOT_TEMPLATES.find(
                            (t) => t.id === selectedTemplate
                          )?.icon
                        }
                      </span>
                      <span className="text-sm font-medium">
                        Template:{" "}
                        {
                          CHATBOT_TEMPLATES.find(
                            (t) => t.id === selectedTemplate
                          )?.name
                        }
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTemplates(true)}
                    >
                      Đổi template
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên chatbot *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => {
                        updateFormData({ name: e.target.value });
                        if (!editingChatbot) {
                          updateFormData({
                            slug: generateSlug(e.target.value),
                          });
                        }
                      }}
                      placeholder="VD: Hỗ trợ khách hàng"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug (URL) *</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md">
                        /chatbots/public/
                      </span>
                      <Input
                        value={formData.slug}
                        onChange={(e) =>
                          updateFormData({ slug: e.target.value })
                        }
                        placeholder="ho-tro-khach-hang"
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData({ description: e.target.value })
                    }
                    placeholder="Mô tả ngắn về chatbot này..."
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
                    placeholder="Hướng dẫn cho AI về cách trả lời..."
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Đây là hướng dẫn cho AI về cách hành xử và trả lời
                  </p>
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
                    <Label>Placeholder input</Label>
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
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 flex-1">
                    <Zap
                      className={
                        formData.auto_mode
                          ? "h-5 w-5 text-yellow-500"
                          : "h-5 w-5 text-muted-foreground"
                      }
                    />
                    <div>
                      <Label className="text-base">Chế độ Auto</Label>
                      <p className="text-xs text-muted-foreground">
                        Tự động chọn model tốt nhất và fallback khi lỗi
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.auto_mode}
                    onCheckedChange={(checked) =>
                      updateFormData({ auto_mode: checked })
                    }
                  />
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
                        disabled={!formData.provider_id}
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
                    <Label>Temperature: {formData.temperature}</Label>
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
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Chính xác</span>
                      <span>Sáng tạo</span>
                    </div>
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
                    <p className="text-xs text-muted-foreground">
                      Độ dài tối đa của câu trả lời
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Tools (API tùy chỉnh)
                  </Label>
                  <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                    {tools.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Chưa có tool nào. Tạo tool trong mục Tools để sử dụng.
                      </p>
                    ) : (
                      tools.map((tool) => (
                        <label
                          key={tool.id}
                          className="flex items-start gap-3 p-2 rounded hover:bg-muted cursor-pointer"
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
                            className="mt-1 rounded"
                          />
                          <div>
                            <span className="text-sm font-medium">
                              {tool.name}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {tool.description}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Knowledge Bases (RAG)
                  </Label>
                  <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                    {knowledgeBases.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Chưa có knowledge base nào. Tạo trong mục Knowledge
                        Base.
                      </p>
                    ) : (
                      knowledgeBases.map((kb) => (
                        <label
                          key={kb.id}
                          className="flex items-start gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.knowledge_base_ids.includes(
                              kb.id
                            )}
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
                            className="mt-1 rounded"
                          />
                          <div>
                            <span className="text-sm font-medium">
                              {kb.name}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {kb.description}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="access" className="space-y-4 mt-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    {formData.is_public ? (
                      <Globe className="h-5 w-5 text-green-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <Label className="text-base">Public Access</Label>
                      <p className="text-xs text-muted-foreground">
                        {formData.is_public
                          ? "Ai cũng có thể sử dụng chatbot này"
                          : "Cần API key để sử dụng chatbot"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) =>
                      updateFormData({ is_public: checked })
                    }
                  />
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
                    <p className="text-xs text-muted-foreground">
                      Sử dụng key này trong header X-API-Key khi gọi API
                    </p>
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
                    Mỗi domain một dòng. Để trống = cho phép tất cả origins.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            {showTemplates && !editingChatbot ? (
              <Button
                variant="outline"
                onClick={() => setShowTemplates(false)}
                disabled={!selectedTemplate}
              >
                Tiếp tục với template đã chọn
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeDialog}>
                  Hủy
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingChatbot ? "Cập nhật" : "Tạo chatbot"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xuất code - Cải tiến */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Xuất Code Tích Hợp
            </DialogTitle>
            <DialogDescription>
              Copy code để tích hợp chatbot vào website, app hoặc hệ thống của
              bạn
            </DialogDescription>
          </DialogHeader>

          {exportCode && (
            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="curl" className="text-xs">
                  cURL
                </TabsTrigger>
                <TabsTrigger value="javascript" className="text-xs">
                  JavaScript
                </TabsTrigger>
                <TabsTrigger value="stream" className="text-xs">
                  JS Stream
                </TabsTrigger>
                <TabsTrigger value="python" className="text-xs">
                  Python
                </TabsTrigger>
                <TabsTrigger value="react" className="text-xs">
                  React
                </TabsTrigger>
                <TabsTrigger value="widget" className="text-xs">
                  HTML Widget
                </TabsTrigger>
                <TabsTrigger value="api" className="text-xs">
                  API Info
                </TabsTrigger>
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
                      variant={copiedCode === key ? "default" : "outline"}
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(exportCode[key], key)}
                    >
                      {copiedCode === key ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Đã copy
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <ScrollArea className="h-[400px] w-full rounded-md border bg-muted/30">
                      <pre className="p-4 text-xs">
                        <code className="language-javascript">
                          {exportCode[key]}
                        </code>
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
              ))}

              <TabsContent value="api">
                <div className="space-y-4 p-4 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Chat Endpoint</Label>
                    <div className="flex gap-2 mt-1">
                      <code className="flex-1 p-2 bg-muted rounded text-xs">
                        POST {exportCode.api_info?.endpoint}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(exportCode.api_info?.endpoint || "")
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Config Endpoint
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <code className="flex-1 p-2 bg-muted rounded text-xs">
                        GET {exportCode.api_info?.config_endpoint}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            exportCode.api_info?.config_endpoint || ""
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Headers</Label>
                    <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(exportCode.api_info?.headers, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Request Body</Label>
                    <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(exportCode.api_info?.body, null, 2)}
                    </pre>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-sm font-medium">
                      Response Format
                    </Label>
                    <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto">
                      {`{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Nội dung trả lời..."
    }
  }],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}`}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog test chat - Cải tiến */}
      <Dialog open={!!testChatbot} onOpenChange={() => closeTestChat()}>
        <DialogContent className="max-w-lg h-[650px] flex flex-col p-0">
          <DialogHeader className="p-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="text-base">{testChatbot?.name}</span>
                  <p className="text-xs text-muted-foreground font-normal">
                    {testChatbot?.auto_mode
                      ? "Auto Mode"
                      : testChatbot?.model_display_name}
                  </p>
                </div>
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={clearTestChat}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {testMessages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Bắt đầu cuộc trò chuyện</p>
                </div>
              )}
              {testMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
              {testLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t shrink-0">
            <div className="flex gap-2">
              <Input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendTestMessage()
                }
                placeholder={
                  testChatbot?.placeholder_text || "Nhập tin nhắn..."
                }
                disabled={testLoading}
                className="flex-1"
              />
              <Button
                onClick={sendTestMessage}
                disabled={testLoading || !testInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
