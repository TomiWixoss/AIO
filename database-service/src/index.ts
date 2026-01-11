import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, notFoundHandler } from "shared/error-handler";
import { testConnection } from "./config/database.js";
import { adminRoutes } from "./routes/admins.js";
import { providerRoutes } from "./routes/providers.js";
import { toolRoutes } from "./routes/tools.js";
import { apiKeyRoutes } from "./routes/api-keys.js";
import { modelRoutes } from "./routes/models.js";
import { chatSessionRoutes } from "./routes/chat-sessions.js";
import { chatMessageRoutes } from "./routes/chat-messages.js";
import { knowledgeBaseRoutes } from "./routes/knowledge-bases.js";
import { chatbotRoutes } from "./routes/chatbots.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/admins", adminRoutes);
app.use("/providers", providerRoutes);
app.use("/tools", toolRoutes);
app.use("/api-keys", apiKeyRoutes);
app.use("/models", modelRoutes);
app.use("/chat-sessions", chatSessionRoutes);
app.use("/chat-messages", chatMessageRoutes);
app.use("/knowledge-bases", knowledgeBaseRoutes);
app.use("/chatbots", chatbotRoutes);

// Health check
app.get("/health", async (_req, res) => {
  const dbConnected = await testConnection();
  res.json({
    success: true,
    data: {
      status: dbConnected ? "ok" : "error",
      database: dbConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🗄️ Database Service running on port ${PORT}`);
});

export default app;
