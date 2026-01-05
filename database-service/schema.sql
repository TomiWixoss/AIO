-- LLM Gateway Database Schema
-- 7 Tables + Sample Data

CREATE DATABASE IF NOT EXISTS llm_gateway;
USE llm_gateway;

-- 1. admins - Tài khoản quản trị
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. providers - 12 nhà cung cấp LLM
CREATE TABLE providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    base_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    free_tier_info TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. provider_keys - API Keys của providers (rotate)
CREATE TABLE provider_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    requests_today INT DEFAULT 0,
    daily_limit INT,
    last_used_at DATETIME,
    last_error_at DATETIME,
    last_error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- 4. models - Models của providers
CREATE TABLE models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    context_length INT,
    is_active BOOLEAN DEFAULT TRUE,
    is_fallback BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_provider_model (provider_id, model_id)
);

-- 5. chat_sessions - Phiên chat
CREATE TABLE chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_key VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. chat_messages - Tin nhắn trong phiên
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    role ENUM('system', 'user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    model_id INT,
    provider_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
);

-- 7. usage_logs - Log sử dụng
CREATE TABLE usage_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    provider_id INT NOT NULL,
    provider_key_id INT,
    model_id INT NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    latency_ms INT,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_key_id) REFERENCES provider_keys(id) ON DELETE SET NULL,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
    INDEX idx_usage_provider (provider_id, created_at),
    INDEX idx_usage_session (session_id, created_at)
);

-- =============================================
-- SEED DATA: Providers
-- =============================================
INSERT INTO providers (name, display_name, base_url, priority, free_tier_info) VALUES
('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1', 100, '30+ free models'),
('google-ai', 'Google AI Studio', 'https://generativelanguage.googleapis.com', 90, '1,500 req/day'),
('groq', 'Groq', 'https://api.groq.com/openai/v1', 85, '14,400 req/day'),
('mistral', 'Mistral', 'https://api.mistral.ai/v1', 80, '1B tokens/month'),
('codestral', 'Codestral', 'https://codestral.mistral.ai/v1', 75, 'Free code generation'),
('huggingface', 'HuggingFace', 'https://api-inference.huggingface.co/v1', 70, '~100 req/hour'),
('cerebras', 'Cerebras', 'https://api.cerebras.ai/v1', 65, 'Free API key'),
('cohere', 'Cohere', 'https://api.cohere.ai/v1', 60, 'Trial API'),
('nvidia-nim', 'NVIDIA NIM', 'https://integrate.api.nvidia.com/v1', 55, 'Developer access'),
('github-models', 'GitHub Models', 'https://models.inference.ai.azure.com', 50, 'Free with GitHub'),
('cloudflare', 'Cloudflare Workers AI', 'https://api.cloudflare.com/client/v4', 45, '10,000 neurons/day'),
('vertex-ai', 'Vertex AI', 'https://us-central1-aiplatform.googleapis.com', 40, '$300 credits');

-- =============================================
-- SEED DATA: API Keys (OpenRouter - AES-256-GCM encrypted)
-- Encrypted with ENCRYPTION_KEY from llm-gateway/.env
-- Format: iv:authTag:encrypted (hex)
-- =============================================
INSERT INTO provider_keys (provider_id, api_key_encrypted, name, priority, daily_limit) VALUES
-- OpenRouter key (provider_id = 1)
(1, '0b49a0e5e76fb6db24e7244b:8e1eed7a7db6a5cd18b23a4c28800075:94f06c27b7643b4cec830e5e1546cf28f959e4f57a19b847b17702900c2e50e994de5da4ad587b6fee00b926f5679d4efd87052b6c9e67f3a447415a45013f253ec9674397e487a6cd', 'OpenRouter Main Key', 100, 1000);

-- =============================================
-- SEED DATA: Models (OpenRouter free models)
-- =============================================
INSERT INTO models (provider_id, model_id, display_name, context_length, is_fallback) VALUES
-- OpenRouter models (provider_id = 1)
(1, 'meta-llama/llama-3.2-3b-instruct:free', 'Llama 3.2 3B (Free)', 131072, FALSE),
(1, 'meta-llama/llama-3.1-8b-instruct:free', 'Llama 3.1 8B (Free)', 131072, TRUE),
(1, 'google/gemma-2-9b-it:free', 'Gemma 2 9B (Free)', 8192, FALSE),
(1, 'mistralai/mistral-7b-instruct:free', 'Mistral 7B (Free)', 32768, FALSE),
(1, 'qwen/qwen-2-7b-instruct:free', 'Qwen 2 7B (Free)', 32768, FALSE),
(1, 'microsoft/phi-3-mini-128k-instruct:free', 'Phi-3 Mini (Free)', 128000, FALSE),

-- Google AI models (provider_id = 2)
(2, 'gemini-2.0-flash', 'Gemini 2.0 Flash', 1000000, FALSE),
(2, 'gemini-1.5-flash', 'Gemini 1.5 Flash', 1000000, TRUE),
(2, 'gemini-1.5-pro', 'Gemini 1.5 Pro', 2000000, FALSE),

-- Groq models (provider_id = 3)
(3, 'llama-3.3-70b-versatile', 'Llama 3.3 70B', 128000, FALSE),
(3, 'llama-3.1-8b-instant', 'Llama 3.1 8B Instant', 128000, TRUE),
(3, 'gemma2-9b-it', 'Gemma 2 9B', 8192, FALSE),
(3, 'mixtral-8x7b-32768', 'Mixtral 8x7B', 32768, FALSE),

-- Mistral models (provider_id = 4)
(4, 'mistral-small-latest', 'Mistral Small', 32000, FALSE),
(4, 'open-mistral-7b', 'Mistral 7B', 32000, TRUE),
(4, 'open-mixtral-8x7b', 'Mixtral 8x7B', 32000, FALSE),

-- Codestral models (provider_id = 5)
(5, 'codestral-latest', 'Codestral Latest', 256000, TRUE),

-- HuggingFace models (provider_id = 6)
(6, 'meta-llama/Llama-3.2-3B-Instruct', 'Llama 3.2 3B', 8192, TRUE),
(6, 'mistralai/Mistral-7B-Instruct-v0.3', 'Mistral 7B v0.3', 32768, FALSE),

-- Cerebras models (provider_id = 7)
(7, 'llama-3.3-70b', 'Llama 3.3 70B', 8192, FALSE),
(7, 'llama-3.1-8b', 'Llama 3.1 8B', 8192, TRUE),

-- Cohere models (provider_id = 8)
(8, 'command-r-plus', 'Command R+', 128000, FALSE),
(8, 'command-r', 'Command R', 128000, TRUE),

-- NVIDIA NIM models (provider_id = 9)
(9, 'meta/llama-3.1-8b-instruct', 'Llama 3.1 8B', 8192, TRUE),
(9, 'meta/llama-3.1-70b-instruct', 'Llama 3.1 70B', 8192, FALSE),

-- GitHub Models (provider_id = 10)
(10, 'gpt-4o', 'GPT-4o', 128000, FALSE),
(10, 'gpt-4o-mini', 'GPT-4o Mini', 128000, TRUE),
(10, 'Meta-Llama-3.1-8B-Instruct', 'Llama 3.1 8B', 8192, FALSE),

-- Cloudflare models (provider_id = 11)
(11, '@cf/meta/llama-3.1-8b-instruct', 'Llama 3.1 8B', 8192, TRUE),
(11, '@cf/mistral/mistral-7b-instruct-v0.2', 'Mistral 7B v0.2', 32768, FALSE),

-- Vertex AI models (provider_id = 12)
(12, 'gemini-2.0-flash', 'Gemini 2.0 Flash', 1000000, FALSE),
(12, 'gemini-1.5-flash', 'Gemini 1.5 Flash', 1000000, TRUE);

-- =============================================
-- SEED DATA: Default Admin
-- Password: admin123 (bcrypt hash)
-- =============================================
INSERT INTO admins (email, password_hash, name) VALUES
('admin@localhost', '$2b$10$rQZ8K.XqK8K8K8K8K8K8K.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8', 'Admin');
