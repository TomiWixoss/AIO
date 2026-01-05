-- LLM Gateway Database Schema

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

-- 2. providers - Nhà cung cấp LLM
CREATE TABLE providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    config JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. tools - Custom API Tools (cấu hình động)
-- Doanh nghiệp tự định nghĩa API endpoint để AI gọi
CREATE TABLE tools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,                    -- Tên tool: 'check_order', 'get_product', 'book_appointment'
    description TEXT NOT NULL,                     -- Mô tả cho AI hiểu tool làm gì
    
    -- API Configuration
    endpoint_url VARCHAR(500) NOT NULL,            -- URL API: https://api.company.com/orders/{order_id}
    http_method ENUM('GET', 'POST', 'PUT', 'DELETE') DEFAULT 'GET',
    headers_template JSON,                         -- Headers: {"Authorization": "Bearer {{api_key}}", "Content-Type": "application/json"}
    body_template JSON,                            -- Body template cho POST/PUT: {"customer_id": "{{customer_id}}"}
    query_params_template JSON,                    -- Query params: {"status": "{{status}}"}
    
    -- Parameters Schema (cho AI biết cần truyền gì)
    parameters JSON NOT NULL,                      -- JSON Schema: {"order_id": {"type": "string", "description": "Mã đơn hàng"}}
    
    -- Response mapping
    response_mapping JSON,                         -- Map response: {"status": "$.order.status", "total": "$.order.total"}
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. api_keys - API Keys chung cho providers và tools
CREATE TABLE api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_type ENUM('provider', 'tool') NOT NULL,
    provider_id INT,
    tool_id INT,
    credentials_encrypted TEXT NOT NULL,           -- JSON mã hóa: {"api_key": "xxx"} hoặc {"api_key": "xxx", "secret": "yyy"}
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

-- 5. models - Models của providers
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

-- 6. chat_sessions - Phiên chat
CREATE TABLE chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_key VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. chat_messages - Tin nhắn trong phiên
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    role ENUM('system', 'user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    model_id INT,
    provider_id INT,
    metadata JSON,                                 -- Lưu tool_executions nếu có
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
);

-- 8. usage_logs - Log sử dụng
CREATE TABLE usage_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_type ENUM('llm', 'tool') NOT NULL DEFAULT 'llm',
    session_id INT,
    provider_id INT,
    tool_id INT,
    api_key_id INT,
    model_id INT,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    input_params JSON,
    response_data JSON,
    latency_ms INT,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE SET NULL,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL,
    INDEX idx_usage_provider (provider_id, created_at),
    INDEX idx_usage_tool (tool_id, created_at),
    INDEX idx_usage_session (session_id, created_at)
);
