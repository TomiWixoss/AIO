/**
 * Tool Handler (Non-streaming)
 * Xử lý tool calling cho non-streaming mode
 */

import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ApiKey,
  ToolCall,
  ToolCallHandler,
  Message,
} from "../types.js";
import { AIOError } from "../types.js";
import { BaseProvider } from "../providers/base.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { KeyManager } from "../utils/key-manager.js";
import {
  generateToolSystemPrompt,
  formatToolResult,
  validateToolCall,
  applyDefaultValues,
} from "./tool-stream-parser.js";

export class ToolHandler {
  /**
   * Chat completion với tool calling support (non-streaming)
   */
  static async chatCompletionWithTools(
    request: ChatCompletionRequest,
    providerInstance: BaseProvider,
    apiKeys: ApiKey[],
    maxRetries: number,
    retryDelay: number,
    enableLogging: boolean
  ): Promise<ChatCompletionResponse> {
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

    let currentMessages = [...request.messages];
    let iteration = 0;

    // Inject tool system prompt
    const toolPrompt = generateToolSystemPrompt(tools);
    request.systemPrompt = (request.systemPrompt || "") + "\n\n" + toolPrompt;

    while (iteration < maxToolIterations) {
      iteration++;

      if (enableLogging) {
        logger.info("Tool iteration (non-streaming)", { iteration, maxToolIterations });
      }

      // Check abort signal
      if (request.signal?.aborted) {
        throw new Error("Request cancelled");
      }

      // Get response from LLM
      const response = await this.callProvider(
        { ...request, messages: currentMessages },
        providerInstance,
        apiKeys,
        maxRetries,
        retryDelay,
        enableLogging
      );

      const assistantMessage = response.choices[0].message.content;

      // Convert to string if needed
      const contentStr = typeof assistantMessage === "string" 
        ? assistantMessage 
        : assistantMessage.map(c => c.type === "text" ? c.text : "").join("");

      // Parse for tool calls
      const toolCall = this.extractToolCall(contentStr);

      // No tool call - return final response
      if (!toolCall) {
        return response;
      }

      if (enableLogging) {
        logger.info("Tool call detected (non-streaming)", {
          name: toolCall.name,
          params: toolCall.params,
        });
      }

      // Find tool definition
      const toolDef = tools.find((t) => t.name === toolCall.name);
      if (!toolDef) {
        const errorMsg = `Unknown tool: ${toolCall.name}`;
        
        currentMessages.push({
          role: "assistant",
          content: contentStr,
        });
        currentMessages.push({
          role: "user",
          content: formatToolResult(toolCall.name, null, errorMsg),
        });
        continue;
      }

      // Apply default values
      let validatedToolCall = applyDefaultValues(toolCall, toolDef);

      // Validate tool call
      const validation = validateToolCall(validatedToolCall, toolDef);
      if (!validation.valid) {
        currentMessages.push({
          role: "assistant",
          content: contentStr,
        });
        currentMessages.push({
          role: "user",
          content: formatToolResult(validatedToolCall.name, null, validation.error, {
            suggestion: "Check the tool definition and provide all required parameters with correct types.",
          }),
        });
        continue;
      }

      // Execute tool with retry
      if (enableLogging) {
        logger.info("Executing tool (non-streaming)", {
          name: validatedToolCall.name,
          params: validatedToolCall.params,
        });
      }

      const result = await this.executeToolWithRetry(
        validatedToolCall,
        onToolCall,
        3,
        enableLogging
      );

      // Add messages for next iteration
      currentMessages.push({
        role: "assistant",
        content: contentStr,
      });

      currentMessages.push({
        role: "user",
        content: formatToolResult(
          validatedToolCall.name,
          result.data,
          result.error,
          result.metadata
        ),
      });
    }

    // Max iterations reached - get final response
    if (enableLogging) {
      logger.warn("Max tool iterations reached (non-streaming)", { maxToolIterations });
    }

    return this.callProvider(
      { ...request, messages: currentMessages },
      providerInstance,
      apiKeys,
      maxRetries,
      retryDelay,
      enableLogging
    );
  }

  /**
   * Extract tool call from XML format
   */
  private static extractToolCall(content: string): ToolCall | null {
    // Match <tool_call>...</tool_call>
    const toolCallMatch = content.match(/<tool_call>(.*?)<\/tool_call>/s);
    if (!toolCallMatch) return null;

    const toolContent = toolCallMatch[1];

    // Extract function name from <function=name>
    const functionMatch = toolContent.match(/<function=(\w+)>/);
    if (!functionMatch) return null;

    const toolName = functionMatch[1];
    const params: Record<string, any> = {};

    // Extract parameters
    const paramRegex = /<(\w+)>(.*?)<\/\1>/gs;
    let match;

    while ((match = paramRegex.exec(toolContent)) !== null) {
      const [, paramName, paramValue] = match;
      
      // Skip the function tag itself
      if (paramName === "function") continue;

      // Try to parse as number
      const trimmedValue = paramValue.trim();
      if (/^\d+$/.test(trimmedValue)) {
        params[paramName] = parseInt(trimmedValue, 10);
      } else if (/^\d+\.\d+$/.test(trimmedValue)) {
        params[paramName] = parseFloat(trimmedValue);
      } else {
        params[paramName] = trimmedValue;
      }
    }

    return {
      name: toolName,
      params,
    };
  }

  /**
   * Execute tool with retry logic
   */
  private static async executeToolWithRetry(
    call: ToolCall,
    handler: ToolCallHandler,
    maxRetries: number,
    enableLogging: boolean
  ): Promise<{
    data?: any;
    error?: string;
    metadata: {
      executionTime: number;
      retryCount: number;
      suggestion?: string;
    };
  }> {
    const startTime = Date.now();
    let retryCount = 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await handler(call);
        const executionTime = Date.now() - startTime;

        return {
          data: result,
          metadata: {
            executionTime,
            retryCount,
          },
        };
      } catch (error: any) {
        lastError = error;
        retryCount++;

        if (enableLogging) {
          logger.warn("Tool execution failed (non-streaming)", {
            tool: call.name,
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            error: error.message,
          });
        }

        // Don't retry on last attempt
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 5000))
          );
        }
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      error: lastError?.message || "Unknown error",
      metadata: {
        executionTime,
        retryCount,
        suggestion:
          retryCount > 0
            ? "Tool failed after multiple retries. Check if the parameters are correct or if the tool is available."
            : "Tool execution failed. Check the error message and try again with different parameters.",
      },
    };
  }

  /**
   * Call provider với retry và key rotation
   */
  private static async callProvider(
    request: ChatCompletionRequest,
    providerInstance: BaseProvider,
    apiKeys: ApiKey[],
    maxRetries: number,
    retryDelay: number,
    enableLogging: boolean
  ): Promise<ChatCompletionResponse> {
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
        // Check abort
        if (request.signal?.aborted) {
          throw new Error("Request cancelled");
        }

        const response = await withRetry(
          async () => {
            if (request.signal?.aborted) {
              throw new Error("Request cancelled");
            }
            return await providerInstance.chatCompletion(request, keyObj.key);
          },
          {
            maxAttempts: maxRetries,
            delayMs: retryDelay,
          }
        );

        KeyManager.incrementUsage(keyObj);

        return response;
      } catch (error: any) {
        if (error.message?.includes("cancel")) {
          throw error;
        }

        lastError = error;
        const errorInfo = AIOError.classify(error);

        KeyManager.markError(keyObj, error.message, errorInfo.shouldRotateKey);

        if (enableLogging) {
          logger.warn("Key failed (non-streaming tool)", {
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
