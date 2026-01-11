"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  Send,
  Loader2,
  Settings,
  Zap,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  chatbotsApi,
  modelsApi,
  toolsApi,
  Chatbot,
  Model,
  Tool,
} from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export default function ChatPage() {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Config state
  const [configOpen, setConfigOpen] = useState(true);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [useCustomConfig, setUseCustomConfig] = useState(false);

  // Custom config
  const [customConfig, setCustomConfig] = useState({
    provider_id: null as number | null,
    model_id: null as number | null,
    system_prompt: "",
    temperature: 0.7,
    max_tokens: 2048,
    tool_ids: [] as number[],
    auto_mode: true,
  });

  // Fetch data
  const { data: chatbotsData } = useQuery({
    queryKey: ["chatbots"],
    queryFn: () => chatbotsApi.getAll(),
  });

  const { data: modelsData } = useQuery({
    queryKey: ["models"],
    queryFn: () => modelsApi.getAll(),
  });

  const { data: toolsData } = useQuery({
    queryKey: ["tools"],
    queryFn: () => toolsApi.getAll(),
  });

  const chatbots =
    chatbotsData?.data?.data?.filter((c: Chatbot) => c.is_active) || [];
  const models = modelsData?.data?.data || [];
  const tools = toolsData?.data?.data?.filter((t: Tool) => t.is_active) || [];

  const filteredModels = customConfig.provider_id
    ? models.filter((m: Model) => m.provider_id === customConfig.provider_id)
    : models;

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select chatbot
  const handleSelectChatbot = (chatbot: Chatbot) => {
    setSelectedChatbot(chatbot);
    setUseCustomConfig(false);
    setMessages(
      chatbot.welcome_message
        ? [
            {
              role: "assistant",
              content: chatbot.welcome_message,
              timestamp: new Date(),
            },
          ]
        : []
    );
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);
    setIsLoading(true);

    try {
      let response;

      if (selectedChatbot && !useCustomConfig) {
        // Use chatbot config
        response = await fetch(
          `${API_URL}/chatbots/${selectedChatbot.id}/test-chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage }),
          }
        );
      } else {
        // Use custom config
        const selectedModel = models.find(
          (m: Model) => m.id === customConfig.model_id
        );
        const selectedProvider = models.find(
          (m: Model) => m.provider_id === customConfig.provider_id
        );

        response = await fetch(`${API_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            provider: selectedProvider?.provider_name || "google-ai",
            model: selectedModel?.model_id || "gemini-2.0-flash",
            message: userMessage,
            system_prompt: customConfig.system_prompt,
            temperature: customConfig.temperature,
            max_tokens: customConfig.max_tokens,
            tool_ids: customConfig.tool_ids,
            auto_mode: customConfig.auto_mode,
          }),
        });
      }

      const data = await response.json();

      if (data.choices?.[0]?.message?.content) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.choices[0].message.content,
            timestamp: new Date(),
          },
        ]);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi gửi tin nhắn";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat
  const clearChat = () => {
    if (selectedChatbot?.welcome_message && !useCustomConfig) {
      setMessages([
        {
          role: "assistant",
          content: selectedChatbot.welcome_message,
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([]);
    }
  };

  // Copy conversation
  const copyConversation = () => {
    const text = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Đã copy cuộc trò chuyện");
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Chat Demo"
        description="Test chatbot hoặc chat trực tiếp với các model"
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Config */}
        <div className="w-80 border-r bg-muted/30 flex flex-col">
          <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Settings className="h-4 w-4" />
                  Cấu hình
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    configOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-4 space-y-4">
                  {/* Chatbot Selection */}
                  <div className="space-y-2">
                    <Label>Chọn Chatbot</Label>
                    <Select
                      value={selectedChatbot?.id?.toString() || ""}
                      onValueChange={(v) => {
                        const chatbot = chatbots.find(
                          (c: Chatbot) => c.id === parseInt(v)
                        );
                        if (chatbot) handleSelectChatbot(chatbot);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chatbot có sẵn" />
                      </SelectTrigger>
                      <SelectContent>
                        {chatbots.map((chatbot: Chatbot) => (
                          <SelectItem
                            key={chatbot.id}
                            value={chatbot.id.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4" />
                              {chatbot.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Chatbot Info */}
                  {selectedChatbot && !useCustomConfig && (
                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          {selectedChatbot.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {selectedChatbot.auto_mode ? (
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Auto
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {selectedChatbot.model_display_name}
                            </Badge>
                          )}
                        </div>
                        {selectedChatbot.system_prompt && (
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {selectedChatbot.system_prompt}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Custom Config Toggle */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label className="text-sm">Cấu hình tùy chỉnh</Label>
                    <Switch
                      checked={useCustomConfig}
                      onCheckedChange={(checked) => {
                        setUseCustomConfig(checked);
                        if (checked) setSelectedChatbot(null);
                      }}
                    />
                  </div>

                  {/* Custom Config Form */}
                  {useCustomConfig && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 p-3 border rounded-lg">
                        <Zap
                          className={
                            customConfig.auto_mode
                              ? "h-4 w-4 text-yellow-500"
                              : "h-4 w-4"
                          }
                        />
                        <Label className="flex-1 text-sm">Auto Mode</Label>
                        <Switch
                          checked={customConfig.auto_mode}
                          onCheckedChange={(checked) =>
                            setCustomConfig((prev) => ({
                              ...prev,
                              auto_mode: checked,
                            }))
                          }
                        />
                      </div>

                      {!customConfig.auto_mode && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm">Provider</Label>
                            <Select
                              value={customConfig.provider_id?.toString() || ""}
                              onValueChange={(v) =>
                                setCustomConfig((prev) => ({
                                  ...prev,
                                  provider_id: v ? parseInt(v) : null,
                                  model_id: null,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn provider" />
                              </SelectTrigger>
                              <SelectContent>
                                {models
                                  .filter(
                                    (m: Model, i: number, arr: Model[]) =>
                                      arr.findIndex(
                                        (x) => x.provider_id === m.provider_id
                                      ) === i
                                  )
                                  .map((m: Model) => (
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
                            <Label className="text-sm">Model</Label>
                            <Select
                              value={customConfig.model_id?.toString() || ""}
                              onValueChange={(v) =>
                                setCustomConfig((prev) => ({
                                  ...prev,
                                  model_id: v ? parseInt(v) : null,
                                }))
                              }
                              disabled={!customConfig.provider_id}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn model" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredModels.map((m: Model) => (
                                  <SelectItem
                                    key={m.id}
                                    value={m.id.toString()}
                                  >
                                    {m.display_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm">System Prompt</Label>
                        <Textarea
                          value={customConfig.system_prompt}
                          onChange={(e) =>
                            setCustomConfig((prev) => ({
                              ...prev,
                              system_prompt: e.target.value,
                            }))
                          }
                          placeholder="Hướng dẫn cho AI..."
                          rows={3}
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">
                          Temperature: {customConfig.temperature}
                        </Label>
                        <Input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={customConfig.temperature}
                          onChange={(e) =>
                            setCustomConfig((prev) => ({
                              ...prev,
                              temperature: parseFloat(e.target.value),
                            }))
                          }
                        />
                      </div>

                      {tools.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm">Tools</Label>
                          <div className="border rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto">
                            {tools.map((tool: Tool) => (
                              <label
                                key={tool.id}
                                className="flex items-center gap-2 text-sm cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={customConfig.tool_ids.includes(
                                    tool.id
                                  )}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setCustomConfig((prev) => ({
                                        ...prev,
                                        tool_ids: [...prev.tool_ids, tool.id],
                                      }));
                                    } else {
                                      setCustomConfig((prev) => ({
                                        ...prev,
                                        tool_ids: prev.tool_ids.filter(
                                          (id) => id !== tool.id
                                        ),
                                      }));
                                    }
                                  }}
                                  className="rounded"
                                />
                                {tool.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">
                {selectedChatbot
                  ? selectedChatbot.name
                  : useCustomConfig
                  ? "Custom Chat"
                  : "Chọn chatbot để bắt đầu"}
              </span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                disabled={messages.length === 0}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyConversation}
                disabled={messages.length === 0}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bot className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">
                    {selectedChatbot || useCustomConfig
                      ? "Bắt đầu cuộc trò chuyện"
                      : "Chọn chatbot hoặc bật cấu hình tùy chỉnh"}
                  </p>
                  <p className="text-sm">
                    {selectedChatbot || useCustomConfig
                      ? "Nhập tin nhắn để chat với AI"
                      : "Sử dụng panel bên trái để cấu hình"}
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                    {msg.timestamp && (
                      <p
                        className={`text-xs mt-1 ${
                          msg.role === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
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

          {/* Input */}
          <div className="p-4 border-t">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendMessage()
                }
                placeholder={
                  selectedChatbot?.placeholder_text ||
                  (selectedChatbot || useCustomConfig
                    ? "Nhập tin nhắn..."
                    : "Chọn chatbot trước")
                }
                disabled={isLoading || (!selectedChatbot && !useCustomConfig)}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={
                  isLoading ||
                  !input.trim() ||
                  (!selectedChatbot && !useCustomConfig)
                }
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
