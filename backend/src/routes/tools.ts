import { Router } from "express";
import { dbGet, dbPost, dbPut, dbDelete } from "../utils/db-client.js";
import { authMiddleware } from "../middleware/auth.js";
import { ok, created } from "shared/response";
import { asyncHandler } from "shared/error-handler";

export const toolRoutes = Router();

toolRoutes.use(authMiddleware);

// GET all tools
toolRoutes.get(
  "/",
  asyncHandler(async (_req: any, res: any) => {
    const tools = await dbGet("/tools");
    return ok(res, tools);
  })
);

// GET active tools
toolRoutes.get(
  "/active",
  asyncHandler(async (_req: any, res: any) => {
    const tools = await dbGet("/tools/active");
    return ok(res, tools);
  })
);

// GET tool by id
toolRoutes.get(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    const tool = await dbGet(`/tools/${req.params.id}`);
    return ok(res, tool);
  })
);

// POST create tool
toolRoutes.post(
  "/",
  asyncHandler(async (req: any, res: any) => {
    const result = await dbPost("/tools", req.body);
    return created(res, result);
  })
);

// POST test tool - Execute tool with test parameters
toolRoutes.post(
  "/:id/test",
  asyncHandler(async (req: any, res: any) => {
    const { params } = req.body;

    // Get tool config
    const tool: any = await dbGet(`/tools/${req.params.id}`);

    // Build URL with path params
    let url = tool.endpoint_url;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`{{${key}}}`, encodeURIComponent(String(value)));
      });
    }

    // Build query params
    if (tool.query_params_template) {
      const queryParams = new URLSearchParams();
      Object.entries(tool.query_params_template).forEach(
        ([key, template]: [string, any]) => {
          let value = String(template);
          if (params) {
            Object.entries(params).forEach(([k, v]) => {
              value = value.replace(`{{${k}}}`, String(v));
            });
          }
          // Only add if no unresolved placeholders
          if (!value.includes("{{")) {
            queryParams.append(key, value);
          }
        }
      );
      const queryString = queryParams.toString();
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (tool.headers_template) {
      Object.entries(tool.headers_template).forEach(
        ([key, template]: [string, any]) => {
          let value = String(template);
          if (params) {
            Object.entries(params).forEach(([k, v]) => {
              value = value.replace(`{{${k}}}`, String(v));
            });
          }
          headers[key] = value;
        }
      );
    }

    // Build body for POST/PUT
    let body: string | undefined;
    if (["POST", "PUT"].includes(tool.http_method) && tool.body_template) {
      let bodyObj = JSON.stringify(tool.body_template);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          bodyObj = bodyObj.replace(new RegExp(`{{${k}}}`, "g"), String(v));
        });
      }
      body = bodyObj;
    }

    // Execute request
    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        method: tool.http_method,
        headers,
        body,
      });

      const responseTime = Date.now() - startTime;
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      return ok(res, {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        responseTime,
        request: {
          method: tool.http_method,
          url,
          headers,
          body: body ? JSON.parse(body) : undefined,
        },
      });
    } catch (error: any) {
      return ok(res, {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        request: {
          method: tool.http_method,
          url,
          headers,
          body: body ? JSON.parse(body) : undefined,
        },
      });
    }
  })
);

// PUT update tool
toolRoutes.put(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbPut(`/tools/${req.params.id}`, req.body);
    return ok(res, { id: parseInt(req.params.id) }, "Updated successfully");
  })
);

// DELETE tool
toolRoutes.delete(
  "/:id",
  asyncHandler(async (req: any, res: any) => {
    await dbDelete(`/tools/${req.params.id}`);
    return ok(res, null, "Deleted successfully");
  })
);
