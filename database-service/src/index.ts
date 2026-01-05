import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./config/database.js";
import { adminRoutes } from "./routes/admins.js";
import { providerRoutes } from "./routes/providers.js";
import { providerKeyRoutes } from "./routes/provider-keys.js";
import { modelRoutes } from "./routes/models.js";
import { chatSessionRoutes } from "./routes/chat-sessions.js";
import { chatMessageRoutes } from "./routes/chat-messages.js";
import { usageLogRoutes } from "./routes/usage-logs.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/admins", adminRoutes);
app.use("/providers", providerRoutes);
app.use("/provider-keys", providerKeyRoutes);
app.use("/models", modelRoutes);
app.use("/chat-sessions", chatSessionRoutes);
app.use("/chat-messages", chatMessageRoutes);
app.use("/usage-logs", usageLogRoutes);

// Health check
app.get("/health", async (_req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: dbConnected ? "ok" : "error",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🗄️ Database Service running on port ${PORT}`);
});

export default app;
