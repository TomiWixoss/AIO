import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000"),
  jwt: {
    secret: process.env.JWT_SECRET || "default-secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  services: {
    database: process.env.DATABASE_SERVICE_URL || "http://localhost:5000",
    gateway: process.env.LLM_GATEWAY_URL || "http://localhost:3000",
  },
};
