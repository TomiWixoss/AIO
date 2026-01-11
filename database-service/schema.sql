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
    is_active BOOLEAN DEFAULT TRUE,
    is_fallback BOOLEAN DEFAULT FALSE,
    priority INT DEFAULT 0,                        -- Ưu tiên trong provider (cao hơn = ưu tiên hơn)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_provider_model (provider_id, model_id),
    INDEX idx_models_priority (is_active, priority DESC)
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

-- 8. knowledge_bases - Knowledge bases cho RAG
CREATE TABLE knowledge_bases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    collection_id INT,                             -- ID của collection trong vector-service
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 9. chatbots - Cấu hình chatbot
CREATE TABLE chatbots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,            -- URL-friendly identifier
    description TEXT,
    
    -- Model Configuration
    provider_id INT,                              -- NULL = auto mode
    model_id INT,                                 -- NULL = auto mode  
    auto_mode BOOLEAN DEFAULT FALSE,
    
    -- Behavior
    system_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INT DEFAULT 2048,
    
    -- Features
    tool_ids JSON,                                -- Array of tool IDs: [1, 2, 3]
    knowledge_base_ids JSON,                      -- Array of KB IDs: [1, 2]
    
    -- Appearance
    welcome_message TEXT,
    placeholder_text VARCHAR(255) DEFAULT 'Nhập tin nhắn...',
    
    -- Access
    is_public BOOLEAN DEFAULT FALSE,              -- Có thể truy cập không cần auth
    api_key VARCHAR(64),                          -- API key riêng cho chatbot này
    allowed_origins JSON,                         -- CORS origins: ["https://example.com"]
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL,
    INDEX idx_chatbots_slug (slug),
    INDEX idx_chatbots_api_key (api_key)
);


-- 10. knowledge_items (cuối cùng) - Dữ liệu trong knowledge base
CREATE TABLE knowledge_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    knowledge_base_id INT NOT NULL,
    content TEXT NOT NULL,
    metadata JSON,
    vector_doc_id INT,                             -- ID document trong vector-service (tự động tạo)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    INDEX idx_knowledge_items_kb (knowledge_base_id)
);
