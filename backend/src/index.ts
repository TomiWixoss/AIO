import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { errorHandler, notFoundHandler } from "shared/error-handler";
import { authRoutes } from "./routes/auth.js";
import { adminRoutes } from "./routes/admins.js";
import { providerRoutes } from "./routes/providers.js";
import { apiKeyRoutes } from "./routes/api-keys.js";
import { toolRoutes } from "./routes/tools.js";
import { modelRoutes } from "./routes/models.js";
import { chatRoutes } from "./routes/chat.js";
import { statsRoutes } from "./routes/stats.js";
import { knowledgeBaseRoutes } from "./routes/knowledge-bases.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/admins", adminRoutes);
app.use("/providers", providerRoutes);
app.use("/api-keys", apiKeyRoutes);
app.use("/tools", toolRoutes);
app.use("/models", modelRoutes);
app.use("/chat", chatRoutes);
app.use("/stats", statsRoutes);
app.use("/knowledge-bases", knowledgeBaseRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: config.services.database,
        gateway: config.services.gateway,
      },
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚀 Backend running on port ${config.port}`);
  console.log(`📡 Database Service: ${config.services.database}`);
  console.log(`🤖 LLM Gateway: ${config.services.gateway}`);
});

export default app;
