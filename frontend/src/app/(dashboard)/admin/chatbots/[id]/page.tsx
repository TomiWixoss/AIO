"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  Loader2,
  Bot,
  Zap,
  Key,
  Copy,
  Check,
  Code,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { chatbotsApi, modelsApi, toolsApi } from "@/lib/api";

export default function ChatbotEditorPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = params.id === "new";
  const chatbotId = isNew ? null : Number(params.id);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [placeholderText, setPlaceholderText] = useState("Nhập tin nhắn...");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [autoMode, setAutoMode] = useState(true);
  const [providerId, setProviderId] = useState<number | null>(null);
  const [modelId, setModelId] = useState<number | null>(null);
  const [toolIds, setToolIds] = useState<number[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [apiKey, setApiKey] = useState("");

  // Fetch data
  const { data: modelsData } = useQuery({
    queryKey: ["models"],
    queryFn: () => modelsApi.getAll(),
  });

  const { data: toolsData } = useQuery({
    queryKey: ["tools"],
    queryFn: () => toolsApi.getAll(),
  });

  const models = modelsData?.data?.data || [];
  const tools = toolsData?.data?.data || [];

  const filteredModels = providerId
    ? models.filter((m) => m.provider_id === providerId)
    : models;

  // Generate slug from name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Load chatbot
  useEffect(() => {
    if (chatbotId) {
      chatbotsApi
        .getById(chatbotId)
        .then((res) => {
          const c = res.data.data;
          setName(c.name);
          setSlug(c.slug);
          setDescription(c.description || "");
          setSystemPrompt(c.system_prompt || "");
          setWelcomeMessage(c.welcome_message || "");
          setPlaceholderText(c.placeholder_text || "Nhập tin nhắn...");
          setTemperature(c.temperature);
          setMaxTokens(c.max_tokens);
          setAutoMode(c.auto_mode);
          setProviderId(c.provider_id);
          setModelId(c.model_id);
          setToolIds(c.tool_ids || []);
          setIsPublic(c.is_public);
          setAllowedOrigins(c.allowed_origins || []);
          setIsActive(c.is_active);
          setApiKey(c.api_key || "");
          setLoading(false);
        })
        .catch(() => {
          toast.error("Không tìm thấy chatbot");
          router.push("/admin/chatbots");
        });
    }
  }, [chatbotId, router]);

  const handleSave = async () => {
    if (!name || !slug) {
      toast.error("Vui lòng nhập tên và slug");
      return;
    }
    setSaving(true);
    try {
      const data: any = {
        name,
        slug,
        description,
        system_prompt: systemPrompt,
        welcome_message: welcomeMessage,
        placeholder_text: placeholderText,
        temperature,
        max_tokens: maxTokens,
        auto_mode: autoMode,
        provider_id: autoMode ? null : providerId,
        model_id: autoMode ? null : modelId,
        tool_ids: toolIds,
        is_public: isPublic,
        allowed_origins: allowedOrigins,
        is_active: isActive,
      };
      if (chatbotId) {
        await chatbotsApi.update(chatbotId, data);
        toast.success("Đã lưu!");
      } else {
        await chatbotsApi.create(data);
        toast.success("Đã tạo chatbot!");
        await queryClient.invalidateQueries({ queryKey: ["chatbots"] });
        router.push("/admin/chatbots");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || "Lỗi lưu chatbot");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!chatbotId) return;
    if (!confirm("Tạo API key mới? Key cũ sẽ không còn hoạt động.")) return;
    try {
      const res = await chatbotsApi.regenerateKey(chatbotId);
      setApiKey(res.data.data.api_key);
      toast.success("Đã tạo API key mới");
    } catch {
      toast.error("Lỗi tạo API key");
    }
  };

  const copyApiKey = () => {
    copyToClipboard(apiKey, "apiKey");
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Đã copy!");
    setTimeout(() => setCopied(null), 2000);
  };

  // Code samples
  const curlCode = `# Tạo session_key bất kỳ (UUID hoặc string) để giữ history
curl -X POST "${API_URL}/chatbots/public/${slug}/chat" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{"message": "Xin chào!", "session_key": "user-123-session-abc"}'`;

  const fetchCode = `// Tạo session_key 1 lần để giữ history cho cuộc trò chuyện
const sessionKey = crypto.randomUUID(); // hoặc bất kỳ string nào

async function sendMessage(message) {
  const response = await fetch("${API_URL}/chatbots/public/${slug}/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "${apiKey}"
    },
    body: JSON.stringify({ message, session_key: sessionKey })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Ví dụ: AI sẽ nhớ tên bạn vì cùng session_key
await sendMessage("Tên tôi là An");
await sendMessage("Tên tôi là gì?"); // AI sẽ trả lời "An"

// Muốn chat mới? Tạo session_key mới`;

  const streamCode = `// Streaming với session_key để giữ history
const sessionKey = crypto.randomUUID();

async function sendMessageStream(message, onChunk) {
  const response = await fetch("${API_URL}/chatbots/public/${slug}/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "${apiKey}"
    },
    body: JSON.stringify({ message, session_key: sessionKey, stream: true })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split("\\n").filter(line => line.startsWith("data: "));
    
    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.choices?.[0]?.delta?.content) {
          onChunk(data.choices[0].delta.content);
        }
      } catch {}
    }
  }
}`;

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-14 border-b flex items-center px-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-14 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/chatbots")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Bot className="h-5 w-5 text-muted-foreground" />
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (isNew) setSlug(generateSlug(e.target.value));
            }}
            placeholder="Tên chatbot"
            className="w-48 font-medium"
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Active</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Slug (URL)</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md">
                  /chatbots/public/
                </span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-chatbot"
                  className="rounded-l-none"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Mô tả</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về chatbot..."
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="prompt">
            <TabsList>
              <TabsTrigger value="prompt">Prompt</TabsTrigger>
              <TabsTrigger value="model">Model</TabsTrigger>
              <TabsTrigger value="features">
                Features
                {toolIds.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {toolIds.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="access">Truy cập</TabsTrigger>
              {chatbotId && (
                <TabsTrigger value="api">
                  <Code className="h-4 w-4 mr-1" />
                  API
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="prompt" className="mt-4 space-y-4">
              <div>
                <Label className="mb-2 block">System Prompt</Label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Hướng dẫn cho AI về cách trả lời..."
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Đây là hướng dẫn cho AI về cách hành xử và trả lời
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Tin nhắn chào mừng</Label>
                  <Input
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Xin chào! Tôi có thể giúp gì?"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Placeholder input</Label>
                  <Input
                    value={placeholderText}
                    onChange={(e) => setPlaceholderText(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="model" className="mt-4 space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 flex-1">
                  <Zap
                    className={
                      autoMode
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
                <Switch checked={autoMode} onCheckedChange={setAutoMode} />
              </div>

              {!autoMode && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Provider</Label>
                    <Select
                      value={providerId?.toString() || ""}
                      onValueChange={(v) => {
                        setProviderId(v ? parseInt(v) : null);
                        setModelId(null);
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
                  <div>
                    <Label className="mb-2 block">Model</Label>
                    <Select
                      value={modelId?.toString() || ""}
                      onValueChange={(v) => setModelId(v ? parseInt(v) : null)}
                      disabled={!providerId}
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
                <div>
                  <Label className="mb-2 block">
                    Temperature: {temperature}
                  </Label>
                  <Input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Chính xác</span>
                    <span>Sáng tạo</span>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Max Tokens</Label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) =>
                      setMaxTokens(parseInt(e.target.value) || 2048)
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Độ dài tối đa của câu trả lời
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="mt-4 space-y-4">
              <div>
                <Label className="mb-2 block">Tools (API tùy chỉnh)</Label>
                <div className="border rounded-lg p-3 space-y-2">
                  {tools.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Chưa có tool nào
                    </p>
                  ) : (
                    tools.map((tool) => (
                      <label
                        key={tool.id}
                        className="flex items-start gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={toolIds.includes(tool.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setToolIds([...toolIds, tool.id]);
                            } else {
                              setToolIds(
                                toolIds.filter((id) => id !== tool.id)
                              );
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
            </TabsContent>

            <TabsContent value="access" className="mt-4 space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-base">Public Access</Label>
                  <p className="text-xs text-muted-foreground">
                    Cho phép truy cập công khai qua API
                  </p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>

              {isPublic && (
                <div>
                  <Label className="mb-2 block">Allowed Origins (CORS)</Label>
                  <Textarea
                    value={allowedOrigins.join("\n")}
                    onChange={(e) =>
                      setAllowedOrigins(
                        e.target.value.split("\n").filter(Boolean)
                      )
                    }
                    placeholder="https://example.com&#10;https://mysite.com"
                    rows={3}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Mỗi domain một dòng. Để trống = cho phép tất cả
                  </p>
                </div>
              )}

              {chatbotId && apiKey && (
                <div>
                  <Label className="mb-2 block">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value={apiKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="icon" onClick={copyApiKey}>
                      {copied === "apiKey" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleRegenerateKey}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sử dụng key này để gọi API chatbot
                  </p>
                </div>
              )}
            </TabsContent>

            {chatbotId && (
              <TabsContent value="api" className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>cURL</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(curlCode, "curl")}
                    >
                      {copied === "curl" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {curlCode}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>JavaScript (Fetch)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(fetchCode, "fetch")}
                    >
                      {copied === "fetch" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {fetchCode}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>JavaScript (Streaming)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(streamCode, "stream")}
                    >
                      {copied === "stream" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                    {streamCode}
                  </pre>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
