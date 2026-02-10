/**
 * Tool Stream Handler
 * Xử lý streaming với tool calling support
 */

import type {
  ChatCompletionRequest,
  ProviderConfig,
  ApiKey,
  StreamChunk,
  ToolCall,
  ToolCallHandler,
  Message,
} from "../types.js";
import { AIOError } from "../types.js";
import { BaseProvider } from "../providers/base.js";
import { Readable } from "stream";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { KeyManager } from "../utils/key-manager.js";
import {
  ToolStreamParser,
  generateToolSystemPrompt,
  formatToolResult,
} from "./tool-stream-parser.js";

export class ToolStreamHandler {
  /**
   * Stream với tool calling support
   * Chỉ support streaming mode, không có non-streaming
   */
  static async streamWithTools(
    request: ChatCompletionRequest,
    providerInstance: BaseProvider,
    apiKeys: ApiKey[],
    maxRetries: number,
    retryDelay: number,
    enableLogging: boolean
  ): Promise<Readable> {
    const { provider, model, tools, onToolCall, maxToolIterations = 5 } = request;

    if (!provider || !model) {
      throw new AIOError(
        "provider and model are required",
        undefined,
        undefined,
        400
      );
    }

    if (!tools || tools.length === 0 || !onToolCall) {
      throw new AIOError(
        "tools and onToolCall are required for tool calling",
        provider,
        model,
        400
      );
    }

    // Main output stream
    const outputStream = new Readable({
      read() {},
    });

    // Start tool execution loop in background
    this.executeToolLoop(
      request,
      providerInstance,
      apiKeys,
      maxRetries,
      retryDelay,
      enableLogging,
      outputStream,
      maxToolIterations
    ).catch((error) => {
      outputStream.destroy(error);
    });

    return outputStream;
  }

  /**
   * Tool execution loop
   */
  private static async executeToolLoop(
    request: ChatCompletionRequest,
    providerInstance: BaseProvider,
    apiKeys: ApiKey[],
    maxRetries: number,
    retryDelay: number,
    enableLogging: boolean,
    outputStream: Readable,
    maxIterations: number
  ): Promise<void> {
    const { tools, onToolCall, signal } = request;
    let currentMessages = [...request.messages];
    let iteration = 0;

    // Inject tool system prompt vào request.systemPrompt
    // Mỗi provider sẽ tự xử lý systemPrompt theo cách riêng
    const toolPrompt = generateToolSystemPrompt(tools!);
    request.systemPrompt = (request.systemPrompt || "") + "\n\n" + toolPrompt;

    while (iteration < maxIterations) {
      iteration++;

      if (enableLogging) {
        logger.info("Tool iteration", { iteration, maxIterations });
      }

      // Check abort signal
      if (signal?.aborted) {
        outputStream.push(null);
        return;
      }

      const parser = new ToolStreamParser();
      let assistantMessage = "";
      let toolCallDetected = false;
      let toolCall: ToolCall | null = null;

      try {
        // Stream from LLM
        const stream = await this.streamFromProvider(
          { ...request, messages: currentMessages },
          providerInstance,
          apiKeys,
          maxRetries,
          retryDelay,
          enableLogging
        );

        // Process stream chunks
        for await (const chunk of stream) {
          // Check abort
          if (signal?.aborted) {
            stream.destroy();
            outputStream.push(null);
            return;
          }

          const chunkStr = chunk.toString();

          // Split chunk into individual SSE messages
          const lines = chunkStr.split('\n');
          
          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            
            // Skip [DONE] marker
            if (line.includes('[DONE]')) continue;

            // Extract text content from SSE message
            let textContent = "";
            try {
              const data = JSON.parse(line.slice(6));
              textContent = data.choices?.[0]?.delta?.content || "";
            } catch (e) {
              // Skip invalid JSON
              continue;
            }

            if (!textContent) continue;
            
            assistantMessage += textContent;

            // Parse for tool calls BEFORE forwarding
            const parsed = parser.processChunk(textContent);

            // Tool call pending
            if (parsed.toolCallPending) {
              toolCallDetected = true;
              const event: StreamChunk = {
                id: `tool-${Date.now()}`,
                provider: request.provider!,
                model: request.model!,
                choices: [
                  {
                    index: 0,
                    delta: {},
                    finish_reason: null,
                  },
                ],
                tool_call: {
                  type: "pending",
                },
              };
              outputStream.push(`data: ${JSON.stringify(event)}\n\n`);
            }

            // Tool call complete - STOP STREAM IMMEDIATELY
            if (parsed.toolCall) {
              toolCall = parsed.toolCall;
              
              if (enableLogging) {
                logger.info("Tool call detected, stopping stream", {
                  name: toolCall.name,
                  params: toolCall.params,
                });
              }
              
              // Cancel stream to stop AI from generating more
              stream.destroy();

              const event: StreamChunk = {
                id: `tool-${Date.now()}`,
                provider: request.provider!,
                model: request.model!,
                choices: [
                  {
                    index: 0,
                    delta: {},
                    finish_reason: null,
                  },
                ],
                tool_call: {
                  type: "executing",
                  call: toolCall,
                },
              };
              outputStream.push(`data: ${JSON.stringify(event)}\n\n`);
              
              // Break out of loop to execute tool
              break;
            }

            // Tool call error
            if (parsed.toolCallError) {
              const event: StreamChunk = {
                id: `tool-${Date.now()}`,
                provider: request.provider!,
                model: request.model!,
                choices: [
                  {
                    index: 0,
                    delta: {},
                    finish_reason: null,
                  },
                ],
                tool_call: {
                  type: "error",
                  error: parsed.toolCallError,
                },
              };
              outputStream.push(`data: ${JSON.stringify(event)}\n\n`);
            }

            // Forward text content (not tool tags)
            if (parsed.text) {
              // Reconstruct SSE message with text
              try {
                const data = JSON.parse(line.slice(6));
                data.choices[0].delta.content = parsed.text;
                outputStream.push(`data: ${JSON.stringify(data)}\n\n`);
              } catch (e) {
                // Fallback
                outputStream.push(parsed.text);
              }
            }
          } // End of for loop over lines
        }

        // No tool call detected - finish
        if (!toolCallDetected || !toolCall) {
          outputStream.push(null);
          return;
        }

        // Execute tool
        if (enableLogging) {
          logger.info("Executing tool", {
            name: toolCall.name,
            params: toolCall.params,
          });
        }

        let toolResult: any;
        let toolError: string | undefined;

        try {
          toolResult = await onToolCall!(toolCall);

          const event: StreamChunk = {
            id: `tool-${Date.now()}`,
            provider: request.provider!,
            model: request.model!,
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: null,
              },
            ],
            tool_call: {
              type: "success",
              call: toolCall,
              result: toolResult,
            },
          };
          outputStream.push(`data: ${JSON.stringify(event)}\n\n`);
        } catch (error: any) {
          toolError = error.message;

          const event: StreamChunk = {
            id: `tool-${Date.now()}`,
            provider: request.provider!,
            model: request.model!,
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: null,
              },
            ],
            tool_call: {
              type: "error",
              call: toolCall,
              error: toolError,
            },
          };
          outputStream.push(`data: ${JSON.stringify(event)}\n\n`);
        }

        // Add messages for next iteration
        currentMessages.push({
          role: "assistant",
          content: assistantMessage,
        });

        currentMessages.push({
          role: "user",
          content: formatToolResult(toolCall.name, toolResult, toolError),
        });

        // Continue loop
      } catch (error: any) {
        if (enableLogging) {
          logger.error("Tool iteration error", {
            iteration,
            error: error.message,
          });
        }
        throw error;
      }
    }

    // Max iterations reached
    if (enableLogging) {
      logger.warn("Max tool iterations reached", { maxIterations });
    }

    // Stream final response without tool detection
    const stream = await this.streamFromProvider(
      { ...request, messages: currentMessages },
      providerInstance,
      apiKeys,
      maxRetries,
      retryDelay,
      enableLogging
    );

    for await (const chunk of stream) {
      if (signal?.aborted) {
        stream.destroy();
        break;
      }
      outputStream.push(chunk);
    }

    outputStream.push(null);
  }

  /**
   * Stream from provider với retry và key rotation
   */
  private static async streamFromProvider(
    request: ChatCompletionRequest,
    providerInstance: BaseProvider,
    apiKeys: ApiKey[],
    maxRetries: number,
    retryDelay: number,
    enableLogging: boolean
  ): Promise<Readable> {
    const { provider, model } = request;

    if (apiKeys.length === 0) {
      throw new AIOError(
        `No API keys configured for provider: ${provider}`,
        provider,
        model,
        503
      );
    }

    let lastError: Error | null = null;
    const triedKeys = new Set<string>();

    for (const keyObj of apiKeys) {
      if (triedKeys.has(keyObj.key)) continue;
      triedKeys.add(keyObj.key);

      try {
        const stream = new Readable({
          read() {},
        });

        const mockRes = {
          write: (chunk: string) => {
            stream.push(chunk);
          },
          end: () => {
            stream.push(null);
          },
          headersSent: false,
        } as any;

        const abortHandler = () => {
          stream.destroy(new Error("Stream cancelled by user"));
        };

        if (request.signal) {
          request.signal.addEventListener("abort", abortHandler);
        }

        await withRetry(
          () => providerInstance.streamChatCompletion(request, mockRes, keyObj.key),
          {
            maxAttempts: maxRetries,
            delayMs: retryDelay,
          }
        )
          .catch((err) => {
            stream.destroy(err);
            throw err;
          })
          .finally(() => {
            if (request.signal) {
              request.signal.removeEventListener("abort", abortHandler);
            }
          });

        KeyManager.incrementUsage(keyObj);

        return stream;
      } catch (error: any) {
        lastError = error;
        const errorInfo = AIOError.classify(error);

        KeyManager.markError(keyObj, error.message, errorInfo.shouldRotateKey);

        if (enableLogging) {
          logger.warn("Stream key failed", {
            provider,
            keyPriority: keyObj.priority,
            error: error.message?.substring(0, 100),
          });
        }

        if (errorInfo.shouldRotateKey) {
          continue;
        }

        throw error;
      }
    }

    throw new AIOError(
      `All API keys failed for ${provider}: ${lastError?.message}`,
      provider,
      model,
      503
    );
  }
}
