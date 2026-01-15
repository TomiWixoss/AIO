"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Send,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  chatbotsApi,
  chatApi,
  Chatbot,
  ChatSession,
  ChatMessage,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  id?: number;
}

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editingSessionKey, setEditingSessionKey] = useState<string | null>(
    null
  );
  const [editingTitle, setEditingTitle] = useState("");

  // Fetch Chatbots
  const { data: chatbotsData } = useQuery({
    queryKey: ["chatbots"],
    queryFn: () => chatbotsApi.getAll(),
  });

  const chatbots =
    chatbotsData?.data?.data?.filter((c: Chatbot) => c.is_active) || [];

  // Fetch Sessions
  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => chatApi.getSessions(),
  });

  const sessions = (sessionsData?.data?.data || []).sort(
    (a: ChatSession, b: ChatSession) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Auto-select first chatbot if available and none selected
  useEffect(() => {
    if (!selectedChatbot && chatbots.length > 0) {
      setSelectedChatbot(chatbots[0]);
    }
  }, [chatbots, selectedChatbot]);

  // Load session messages when sessionKey changes
  useEffect(() => {
    async function loadSession() {
      if (!sessionKey) return;

      try {
        const response = await chatApi.getSession(sessionKey);
        if (response.data?.success && response.data.data) {
          const sessionData = response.data.data;
          // Transform API messages to UI messages
          const uiMessages: Message[] = sessionData.messages.map(
            (m: ChatMessage) => ({
              role: m.role,
              content: m.content,
              timestamp: new Date(m.created_at),
              id: m.id,
            })
          );
          setMessages(uiMessages);
        }
      } catch (error) {
        console.error("Failed to load session:", error);
        toast.error("Không thể tải lịch sử trò chuyện");
      }
    }

    // Only load if it's an existing session (from our list)
    if (
      sessionKey &&
      sessions.some((s: ChatSession) => s.session_key === sessionKey)
    ) {
      loadSession();
    } else if (sessionKey) {
      // New session started effectively, keep current messages (e.g. from handleSelectChatbot)
    }
  }, [sessionKey, sessions]);

  // Scroll to bottom effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleCreateNewChat = () => {
    setSessionKey(null);
    setMessages(
      selectedChatbot?.welcome_message
        ? [
            {
              role: "assistant",
              content: selectedChatbot.welcome_message,
              timestamp: new Date(),
            },
          ]
        : []
    );
  };

  const handleSelectSession = (key: string) => {
    setSessionKey(key);
    // Clearing messages initially to avoid showing old chat while loading
    setMessages([]);
  };

  const handleSelectChatbot = (chatbot: Chatbot) => {
    setSelectedChatbot(chatbot);
    // If we are in a new session state (not in history list yet), reset messages
    if (
      !sessionKey ||
      !sessions.some((s: ChatSession) => s.session_key === sessionKey)
    ) {
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
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedChatbot) return;

    // Nếu chưa có sessionKey (hoặc null), tạo mới
    // Lưu ý: ta truyền session_key vào API, nếu null API sẽ tạo mới nhưng ta cần track nó.
    // Tuy nhiên, logic tốt hơn là:
    // 1. Tạo UUID mới ở frontend nếu là session mới.
    // 2. Gửi nó lên server.
    const currentSessionKey = sessionKey || crypto.randomUUID();
    const isNewSession = !sessionKey;

    if (isNewSession) {
      setSessionKey(currentSessionKey);
    }

    const userMessage = input.trim();
    setInput("");

    // Optimistic update
    const newMessages = [
      ...messages,
      { role: "user" as const, content: userMessage, timestamp: new Date() },
    ];
    setMessages(newMessages);

    setIsLoading(true);
    setStreamingContent("");

    try {
      const response = await fetch(
        `${API_URL}/chatbots/public/${selectedChatbot.slug}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add API Key if needed
            "x-api-key": selectedChatbot.api_key,
          },
          body: JSON.stringify({
            message: userMessage,
            session_key: currentSessionKey,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Lỗi kết nối");
      }

      // Check stream
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let hasInvalidatedForNewSession = false;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Invalidate query as soon as we start receiving data if it's a new session
            if (isNewSession && !hasInvalidatedForNewSession) {
              queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
              hasInvalidatedForNewSession = true;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);

                  // Use server session key if provided, though we invalidated early above
                  if (
                    parsed.session_key &&
                    isNewSession &&
                    !hasInvalidatedForNewSession
                  ) {
                    queryClient.invalidateQueries({
                      queryKey: ["chat-sessions"],
                    });
                    hasInvalidatedForNewSession = true;
                  }

                  const content = parsed.choices?.[0]?.delta?.content || "";
                  if (content) {
                    fullContent += content;
                    setStreamingContent(fullContent);
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
        }

        if (fullContent) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullContent, timestamp: new Date() },
          ]);
        }
        setStreamingContent("");
      } else {
        const data = await response.json();
        // Always refresh if new session, regardless of data.session_key presence,
        // as we successfully got a response for the new session key we sent.
        if (isNewSession) {
          queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
        }
        if (data.choices?.[0]?.message?.content) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.choices[0].message.content,
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Lỗi gửi tin nhắn");
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  const copyConversation = () => {
    const text = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Đã copy cuộc trò chuyện");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDeleteSession = async (key: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?")) {
      return;
    }

    try {
      await chatApi.deleteSession(key);
      toast.success("Đã xóa cuộc trò chuyện");

      // If deleting current session, reset
      if (sessionKey === key) {
        handleCreateNewChat();
      }

      // Refresh sessions list
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    } catch (error: any) {
      toast.error("Không thể xóa cuộc trò chuyện");
    }
  };

  const handleStartEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionKey(session.session_key);
    setEditingTitle(session.title || "");
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionKey(null);
    setEditingTitle("");
  };

  const handleSaveEdit = async (key: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!editingTitle.trim()) {
      toast.error("Tiêu đề không được để trống");
      return;
    }

    try {
      await chatApi.updateSession(key, { title: editingTitle.trim() });
      toast.success("Đã cập nhật tiêu đề");
      setEditingSessionKey(null);
      setEditingTitle("");

      // Refresh sessions list
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    } catch (error: any) {
      toast.error("Không thể cập nhật tiêu đề");
    }
  };

  return (
    <div className="flex h-[100svh] overflow-hidden bg-background">
      {/* Sidebar - History */}
      <div className="w-80 border-r flex flex-col h-full bg-muted/10 hidden md:flex shrink-0">
        <div className="p-4 border-b flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Lịch sử
          </h2>
          <Button size="sm" variant="ghost" onClick={handleCreateNewChat}>
            <Plus className="w-4 h-4 mr-2" />
            Chat mới
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full" type="always">
            <div className="p-2 space-y-1">
              {isLoadingSessions ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm">
                  Chưa có cuộc trò chuyện nào
                </div>
              ) : (
                sessions.map((session: ChatSession) => {
                  const isEditing = editingSessionKey === session.session_key;
                  const isActive = sessionKey === session.session_key;

                  return (
                    <div
                      key={session.id}
                      onClick={() =>
                        !isEditing && handleSelectSession(session.session_key)
                      }
                      className={cn(
                        "group relative flex flex-col gap-1 p-2.5 rounded-md cursor-pointer transition-all",
                        isActive ? "bg-muted/80 shadow-sm" : "hover:bg-muted/40"
                      )}
                    >
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveEdit(session.session_key, e as any);
                              } else if (e.key === "Escape") {
                                handleCancelEdit(e as any);
                              }
                            }}
                            className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-ring"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={(e) =>
                              handleSaveEdit(session.session_key, e)
                            }
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-sm leading-snug line-clamp-2 flex-1 min-w-0">
                              {session.title || "Cuộc trò chuyện mới"}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => handleStartEdit(session, e)}
                                title="Đổi tên"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={(e) =>
                                  handleDeleteSession(session.session_key, e)
                                }
                                title="Xóa"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(session.created_at), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Chat Header */}
        <div className="h-16 shrink-0 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/20">
          <div className="flex items-center gap-4">
            {/* Mobile sidebar trigger could go here */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 min-w-[200px] justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Bot className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {selectedChatbot ? selectedChatbot.name : "Chọn Chatbot"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                {chatbots.length === 0 ? (
                  <DropdownMenuItem disabled>
                    Không có chatbot nào
                  </DropdownMenuItem>
                ) : (
                  chatbots.map((chatbot: Chatbot) => (
                    <DropdownMenuItem
                      key={chatbot.id}
                      onClick={() => handleSelectChatbot(chatbot)}
                    >
                      {chatbot.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedChatbot && (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {selectedChatbot.model_name}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={copyConversation}
              disabled={messages.length === 0}
              title="Copy cuộc trò chuyện"
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
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full px-4" type="always">
            <div className="max-w-5xl mx-auto py-6 space-y-6">
              {messages.length === 0 && !streamingContent ? (
                <div className="text-center py-20 text-muted-foreground">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bot className="h-10 w-10 opacity-50" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {selectedChatbot
                      ? `Chat với ${selectedChatbot.name}`
                      : "Chọn Chatbot để bắt đầu"}
                  </h3>
                  <p className="text-sm max-w-sm mx-auto">
                    {selectedChatbot?.description ||
                      "Trợ lý ảo AI thông minh, hỗ trợ trả lời câu hỏi và thực hiện tác vụ."}
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex w-full",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "px-5 py-3", // Removed shadow-sm and reduced constraints
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm max-w-[85%] shadow-sm"
                            : "bg-transparent w-full pl-0" // Transparent, full width, no padding left
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-7">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </p>
                        )}
                        {msg.timestamp && (
                          <p
                            className={cn(
                              "text-[10px] mt-2 opacity-70",
                              msg.role === "user"
                                ? "text-primary-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {formatDistanceToNow(msg.timestamp, {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {streamingContent && (
                    <div className="flex w-full justify-start">
                      <div className="w-full px-5 py-3 bg-transparent pl-0">
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-7">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {streamingContent}
                          </ReactMarkdown>
                        </div>
                        <span className="inline-block w-2 h-4 ml-1 bg-primary/50 animate-pulse align-middle" />
                      </div>
                    </div>
                  )}

                  {isLoading && !streamingContent && (
                    <div className="flex w-full justify-start">
                      <div className="bg-transparent px-0 py-3 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background border-t">
          <div className="max-w-5xl mx-auto">
            <div className="relative flex items-end gap-2 bg-muted/30 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedChatbot?.placeholder_text || "Nhập tin nhắn..."
                }
                disabled={isLoading || !selectedChatbot}
                className="min-h-[20px] max-h-[200px] border-0 focus-visible:ring-0 shadow-none bg-transparent resize-none py-3"
                rows={1}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading || !selectedChatbot}
                className="mb-0.5 shrink-0 rounded-lg h-9 w-9"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="text-center mt-2">
              <p className="text-xs text-muted-foreground">
                {selectedChatbot
                  ? `Đang sử dụng model ${selectedChatbot.model_name}`
                  : "Hệ thống Chat AI"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
