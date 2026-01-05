import { create } from "zustand";
import { ChatMessage, ChatSession } from "@/lib/api";

interface ChatState {
  sessions: ChatSession[];
  currentSession: (ChatSession & { messages: ChatMessage[] }) | null;
  isStreaming: boolean;
  streamContent: string;
  selectedProvider: string;
  selectedModel: string;
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSession: (
    session: (ChatSession & { messages: ChatMessage[] }) | null
  ) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setStreamContent: (content: string) => void;
  appendStreamContent: (content: string) => void;
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;
  addMessage: (message: ChatMessage) => void;
  clearStreamContent: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  currentSession: null,
  isStreaming: false,
  streamContent: "",
  selectedProvider: "google-ai",
  selectedModel: "gemini-2.0-flash",

  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setStreamContent: (content) => set({ streamContent: content }),
  appendStreamContent: (content) =>
    set((state) => ({ streamContent: state.streamContent + content })),
  setSelectedProvider: (provider) => set({ selectedProvider: provider }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  addMessage: (message) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            messages: [...state.currentSession.messages, message],
          }
        : null,
    })),
  clearStreamContent: () => set({ streamContent: "" }),
}));
