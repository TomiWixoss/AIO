-- Create database if not exists
CREATE DATABASE IF NOT EXISTS llm_gateway;
USE llm_gateway;

-- Drop existing tables to avoid conflicts
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS chatbots;
DROP TABLE IF EXISTS api_keys;
DROP TABLE IF EXISTS models;
DROP TABLE IF EXISTS tools;
DROP TABLE IF EXISTS providers;
DROP TABLE IF EXISTS admins;

-- Create tables
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    config JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    endpoint_url VARCHAR(500) NOT NULL,
    http_method ENUM('GET', 'POST', 'PUT', 'DELETE') DEFAULT 'GET',
    headers_template JSON,
    body_template JSON,
    query_params_template JSON,
    parameters JSON NOT NULL,
    response_mapping JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_type ENUM('provider', 'tool') NOT NULL,
    provider_id INT,
    tool_id INT,
    credentials_encrypted TEXT NOT NULL,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    requests_today INT DEFAULT 0,
    daily_limit INT,
    last_used_at DATETIME,
    last_error_at DATETIME,
    last_error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    INDEX idx_api_keys_provider (key_type, provider_id, is_active, priority),
    INDEX idx_api_keys_tool (key_type, tool_id, is_active, priority),
    CONSTRAINT chk_key_reference CHECK (
        (key_type = 'provider' AND provider_id IS NOT NULL AND tool_id IS NULL) OR
        (key_type = 'tool' AND tool_id IS NOT NULL AND provider_id IS NULL)
    )
);

CREATE TABLE models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    context_length INT,
    is_active BOOLEAN DEFAULT TRUE,
    is_fallback BOOLEAN DEFAULT FALSE,
    priority INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_provider_model (provider_id, model_id),
    INDEX idx_models_priority (is_active, priority DESC)
);

CREATE TABLE chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_key VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    role ENUM('system', 'user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    model_id INT,
    provider_id INT,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
);

CREATE TABLE chatbots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    provider_id INT,
    model_id INT,
    auto_mode BOOLEAN DEFAULT FALSE,
    system_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INT DEFAULT 2048,
    tool_ids JSON,
    welcome_message TEXT,
    placeholder_text VARCHAR(255) DEFAULT 'Nhập tin nhắn...',
    is_public BOOLEAN DEFAULT FALSE,
    api_key VARCHAR(64),
    allowed_origins JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL,
    INDEX idx_chatbots_slug (slug),
    INDEX idx_chatbots_api_key (api_key)
);
