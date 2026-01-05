import { Response } from "express";

interface ActiveRequest {
  sessionKey: string;
  sessionId?: number; // Thêm session ID để lưu DB
  response?: Response; // Optional for non-streaming
  controller: AbortController;
  startTime: number;
  isStreaming: boolean;
  streamedContent: string; // Track content đã stream
  provider?: string;
  model?: string;
}

class StreamManager {
  private requests: Map<string, ActiveRequest> = new Map();

  // Register cho cả streaming và non-streaming
  register(
    sessionKey: string,
    sessionId?: number,
    response?: Response,
    isStreaming: boolean = true,
    provider?: string,
    model?: string
  ): AbortController {
    const controller = new AbortController();

    this.requests.set(sessionKey, {
      sessionKey,
      sessionId,
      response,
      controller,
      startTime: Date.now(),
      isStreaming,
      streamedContent: "",
      provider,
      model,
    });

    // KHÔNG auto cleanup - để stream handler tự cleanup trong finally block
    // Điều này tránh race condition khi cancel

    return controller;
  }

  // Append content khi streaming
  appendContent(sessionKey: string, content: string): void {
    const request = this.requests.get(sessionKey);
    if (request) {
      request.streamedContent += content;
    }
  }

  // Get streamed content
  getStreamedContent(sessionKey: string): string {
    return this.requests.get(sessionKey)?.streamedContent || "";
  }

  // Get request data for saving
  getRequestData(sessionKey: string) {
    const request = this.requests.get(sessionKey);
    if (!request) return null;

    return {
      sessionId: request.sessionId,
      streamedContent: request.streamedContent,
      provider: request.provider,
      model: request.model,
    };
  }

  cancel(sessionKey: string): boolean {
    const request = this.requests.get(sessionKey);
    if (!request) {
      return false;
    }

    // Abort the request - stream handler sẽ tự xử lý response
    request.controller.abort();

    return true;
  }

  unregister(sessionKey: string): void {
    this.requests.delete(sessionKey);
  }

  isActive(sessionKey: string): boolean {
    return this.requests.has(sessionKey);
  }

  getActiveRequests(): string[] {
    return Array.from(this.requests.keys());
  }

  getRequestInfo(sessionKey: string) {
    const request = this.requests.get(sessionKey);
    if (!request) return null;

    return {
      sessionKey: request.sessionKey,
      duration: Date.now() - request.startTime,
      isActive: true,
      isStreaming: request.isStreaming,
      contentLength: request.streamedContent.length,
    };
  }
}

export const streamManager = new StreamManager();
