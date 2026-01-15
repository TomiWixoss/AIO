-- =============================================
-- Script: Xóa tools cũ và tạo tools mới cho CRUD API
-- Ngày: 2026-01-15
-- =============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Xóa tất cả tools hiện có
DELETE FROM tools;

-- Reset AUTO_INCREMENT
ALTER TABLE tools AUTO_INCREMENT = 1;

-- =============================================
-- PROVIDERS - Quản lý nhà cung cấp LLM
-- =============================================

INSERT INTO tools (name, description, endpoint_url, http_method, headers_template, body_template, query_params_template, parameters, response_mapping, is_active) VALUES
('list_providers', 'Lấy danh sách tất cả nhà cung cấp LLM (Google AI, OpenRouter, Groq)', 'http://backend:4000/providers', 'GET', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"_note":{"type":"string","description":"Không cần tham số","required":false}}', NULL, 1),

('get_provider', 'Lấy thông tin chi tiết một nhà cung cấp theo ID', 'http://backend:4000/providers/{{provider_id}}', 'GET', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"provider_id":{"type":"number","description":"ID của nhà cung cấp","required":true}}', NULL, 1),

('create_provider', 'Tạo nhà cung cấp LLM mới', 'http://backend:4000/providers', 'POST', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', '{"provider_id":"{{provider_id}}","is_active":"{{is_active}}","priority":"{{priority}}"}', NULL, '{"provider_id":{"type":"string","description":"Mã nhà cung cấp (vd: google-ai, openrouter)","required":true},"is_active":{"type":"boolean","description":"Trạng thái hoạt động","required":false},"priority":{"type":"number","description":"Độ ưu tiên","required":false}}', NULL, 1),

('update_provider', 'Cập nhật thông tin nhà cung cấp', 'http://backend:4000/providers/{{id}}', 'PUT', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', '{"is_active":"{{is_active}}","priority":"{{priority}}"}', NULL, '{"id":{"type":"number","description":"ID nhà cung cấp","required":true},"is_active":{"type":"boolean","description":"Trạng thái hoạt động","required":false},"priority":{"type":"number","description":"Độ ưu tiên","required":false}}', NULL, 1),

('delete_provider', 'Xóa nhà cung cấp theo ID', 'http://backend:4000/providers/{{id}}', 'DELETE', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"id":{"type":"number","description":"ID nhà cung cấp cần xóa","required":true}}', NULL, 1);

-- =============================================
-- MODELS - Quản lý models AI
-- =============================================

INSERT INTO tools (name, description, endpoint_url, http_method, headers_template, body_template, query_params_template, parameters, response_mapping, is_active) VALUES
('list_models', 'Lấy danh sách tất cả models AI có sẵn', 'http://backend:4000/models', 'GET', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"_note":{"type":"string","description":"Không cần tham số","required":false}}', NULL, 1),

('get_model', 'Lấy thông tin chi tiết một model theo ID', 'http://backend:4000/models/{{model_id}}', 'GET', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"model_id":{"type":"number","description":"ID của model","required":true}}', NULL, 1),

('create_model', 'Tạo model AI mới', 'http://backend:4000/models', 'POST', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', '{"provider_id":"{{provider_id}}","model_id":"{{model_id}}","display_name":"{{display_name}}","context_length":"{{context_length}}","is_active":"{{is_active}}","priority":"{{priority}}"}', NULL, '{"provider_id":{"type":"number","description":"ID nhà cung cấp","required":true},"model_id":{"type":"string","description":"Mã model (vd: gemini-2.5-flash)","required":true},"display_name":{"type":"string","description":"Tên hiển thị","required":true},"context_length":{"type":"number","description":"Độ dài context","required":false},"is_active":{"type":"boolean","description":"Trạng thái hoạt động","required":false},"priority":{"type":"number","description":"Độ ưu tiên","required":false}}', NULL, 1),

('update_model', 'Cập nhật thông tin model', 'http://backend:4000/models/{{id}}', 'PUT', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', '{"display_name":"{{display_name}}","is_active":"{{is_active}}","priority":"{{priority}}"}', NULL, '{"id":{"type":"number","description":"ID model","required":true},"display_name":{"type":"string","description":"Tên hiển thị","required":false},"is_active":{"type":"boolean","description":"Trạng thái hoạt động","required":false},"priority":{"type":"number","description":"Độ ưu tiên","required":false}}', NULL, 1),

('delete_model', 'Xóa model theo ID', 'http://backend:4000/models/{{id}}', 'DELETE', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"id":{"type":"number","description":"ID model cần xóa","required":true}}', NULL, 1);

-- =============================================
-- API KEYS - Quản lý API keys
-- =============================================

INSERT INTO tools (name, description, endpoint_url, http_method, headers_template, body_template, query_params_template, parameters, response_mapping, is_active) VALUES
('list_api_keys', 'Lấy danh sách tất cả API keys', 'http://backend:4000/api-keys', 'GET', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"_note":{"type":"string","description":"Không cần tham số","required":false}}', NULL, 1),

('get_api_key', 'Lấy thông tin chi tiết một API key theo ID', 'http://backend:4000/api-keys/{{api_key_id}}', 'GET', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"api_key_id":{"type":"number","description":"ID của API key","required":true}}', NULL, 1),

('create_api_key', 'Tạo API key mới cho provider', 'http://backend:4000/api-keys', 'POST', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', '{"key_type":"provider","provider_id":"{{provider_id}}","credentials":{"api_key":"{{api_key}}"},"name":"{{name}}","is_active":"{{is_active}}","priority":"{{priority}}","daily_limit":"{{daily_limit}}"}', NULL, '{"provider_id":{"type":"number","description":"ID nhà cung cấp","required":true},"api_key":{"type":"string","description":"API key thực","required":true},"name":{"type":"string","description":"Tên gợi nhớ","required":true},"is_active":{"type":"boolean","description":"Trạng thái hoạt động","required":false},"priority":{"type":"number","description":"Độ ưu tiên","required":false},"daily_limit":{"type":"number","description":"Giới hạn request/ngày","required":false}}', NULL, 1),

('update_api_key', 'Cập nhật thông tin API key', 'http://backend:4000/api-keys/{{id}}', 'PUT', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', '{"name":"{{name}}","is_active":"{{is_active}}","priority":"{{priority}}","daily_limit":"{{daily_limit}}"}', NULL, '{"id":{"type":"number","description":"ID API key","required":true},"name":{"type":"string","description":"Tên gợi nhớ","required":false},"is_active":{"type":"boolean","description":"Trạng thái hoạt động","required":false},"priority":{"type":"number","description":"Độ ưu tiên","required":false},"daily_limit":{"type":"number","description":"Giới hạn request/ngày","required":false}}', NULL, 1),

('delete_api_key', 'Xóa API key theo ID', 'http://backend:4000/api-keys/{{id}}', 'DELETE', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"id":{"type":"number","description":"ID API key cần xóa","required":true}}', NULL, 1);

-- =============================================
-- CHATBOTS - Quản lý chatbots
-- =============================================

INSERT INTO tools (name, description, endpoint_url, http_method, headers_template, body_template, query_params_template, parameters, response_mapping, is_active) VALUES
('list_chatbots', 'Lấy danh sách tất cả chatbots', 'http://backend:4000/chatbots', 'GET', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"_note":{"type":"string","description":"Không cần tham số","required":false}}', NULL, 1),

('get_chatbot', 'Lấy thông tin chi tiết một chatbot theo ID', 'http://backend:4000/chatbots/{{chatbot_id}}', 'GET', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"chatbot_id":{"type":"number","description":"ID của chatbot","required":true}}', NULL, 1),

('create_chatbot', 'Tạo chatbot mới', 'http://backend:4000/chatbots', 'POST', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', '{"name":"{{name}}","slug":"{{slug}}","description":"{{description}}","system_prompt":"{{system_prompt}}","auto_mode":"{{auto_mode}}","is_public":"{{is_public}}"}', NULL, '{"name":{"type":"string","description":"Tên chatbot","required":true},"slug":{"type":"string","description":"Slug URL (không dấu, viết thường)","required":true},"description":{"type":"string","description":"Mô tả chatbot","required":false},"system_prompt":{"type":"string","description":"System prompt cho AI","required":false},"auto_mode":{"type":"boolean","description":"Chế độ tự động chọn model","required":false},"is_public":{"type":"boolean","description":"Cho phép truy cập public","required":false}}', NULL, 1),

('update_chatbot', 'Cập nhật thông tin chatbot', 'http://backend:4000/chatbots/{{id}}', 'PUT', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', '{"name":"{{name}}","description":"{{description}}","system_prompt":"{{system_prompt}}","is_active":"{{is_active}}"}', NULL, '{"id":{"type":"number","description":"ID chatbot","required":true},"name":{"type":"string","description":"Tên chatbot","required":false},"description":{"type":"string","description":"Mô tả chatbot","required":false},"system_prompt":{"type":"string","description":"System prompt cho AI","required":false},"is_active":{"type":"boolean","description":"Trạng thái hoạt động","required":false}}', NULL, 1),

('delete_chatbot', 'Xóa chatbot theo ID', 'http://backend:4000/chatbots/{{id}}', 'DELETE', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"id":{"type":"number","description":"ID chatbot cần xóa","required":true}}', NULL, 1);

-- =============================================
-- TOOLS - Quản lý tools (CRUD đầy đủ)
-- =============================================

INSERT INTO tools (name, description, endpoint_url, http_method, headers_template, body_template, query_params_template, parameters, response_mapping, is_active) VALUES
('list_tools', 'Lấy danh sách tất cả tools có sẵn trong hệ thống', 'http://backend:4000/tools', 'GET', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"_note":{"type":"string","description":"Không cần tham số","required":false}}', NULL, 1),

('get_tool', 'Lấy thông tin chi tiết một tool theo ID', 'http://backend:4000/tools/{{tool_id}}', 'GET', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"tool_id":{"type":"number","description":"ID của tool","required":true}}', NULL, 1),

('create_tool', 'Tạo tool mới để gọi API bên ngoài', 'http://backend:4000/tools', 'POST', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', '{"name":"{{name}}","description":"{{description}}","endpoint_url":"{{endpoint_url}}","http_method":"{{http_method}}","parameters":"{{parameters}}","is_active":"{{is_active}}"}', NULL, '{"name":{"type":"string","description":"Tên tool (snake_case)","required":true},"description":{"type":"string","description":"Mô tả chức năng tool","required":true},"endpoint_url":{"type":"string","description":"URL endpoint API","required":true},"http_method":{"type":"string","description":"HTTP method (GET, POST, PUT, DELETE)","required":true},"parameters":{"type":"string","description":"JSON schema định nghĩa tham số","required":true},"is_active":{"type":"boolean","description":"Trạng thái hoạt động","required":false}}', NULL, 1),

('update_tool', 'Cập nhật thông tin tool', 'http://backend:4000/tools/{{id}}', 'PUT', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', '{"name":"{{name}}","description":"{{description}}","endpoint_url":"{{endpoint_url}}","is_active":"{{is_active}}"}', NULL, '{"id":{"type":"number","description":"ID tool","required":true},"name":{"type":"string","description":"Tên tool","required":false},"description":{"type":"string","description":"Mô tả chức năng","required":false},"endpoint_url":{"type":"string","description":"URL endpoint API","required":false},"is_active":{"type":"boolean","description":"Trạng thái hoạt động","required":false}}', NULL, 1),

('delete_tool', 'Xóa tool theo ID', 'http://backend:4000/tools/{{id}}', 'DELETE', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"id":{"type":"number","description":"ID tool cần xóa","required":true}}', NULL, 1);

-- =============================================
-- ADMINS - Quản lý admin users
-- =============================================

INSERT INTO tools (name, description, endpoint_url, http_method, headers_template, body_template, query_params_template, parameters, response_mapping, is_active) VALUES
('list_admins', 'Lấy danh sách tất cả admin users', 'http://backend:4000/admins', 'GET', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"_note":{"type":"string","description":"Không cần tham số","required":false}}', NULL, 1),

('get_admin', 'Lấy thông tin chi tiết một admin theo ID', 'http://backend:4000/admins/{{admin_id}}', 'GET', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"admin_id":{"type":"number","description":"ID của admin","required":true}}', NULL, 1),

('create_admin', 'Tạo admin user mới', 'http://backend:4000/admins', 'POST', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', '{"email":"{{email}}","password":"{{password}}","name":"{{name}}"}', NULL, '{"email":{"type":"string","description":"Email đăng nhập","required":true},"password":{"type":"string","description":"Mật khẩu","required":true},"name":{"type":"string","description":"Tên hiển thị","required":true}}', NULL, 1),

('update_admin', 'Cập nhật thông tin admin', 'http://backend:4000/admins/{{id}}', 'PUT', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', '{"name":"{{name}}","email":"{{email}}"}', NULL, '{"id":{"type":"number","description":"ID admin","required":true},"name":{"type":"string","description":"Tên hiển thị","required":false},"email":{"type":"string","description":"Email","required":false}}', NULL, 1),

('delete_admin', 'Xóa admin theo ID', 'http://backend:4000/admins/{{id}}', 'DELETE', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"id":{"type":"number","description":"ID admin cần xóa","required":true}}', NULL, 1);

-- =============================================
-- STATS - Thống kê hệ thống
-- =============================================

INSERT INTO tools (name, description, endpoint_url, http_method, headers_template, body_template, query_params_template, parameters, response_mapping, is_active) VALUES
('get_system_stats', 'Lấy thống kê tổng quan hệ thống: số lượng providers, models, tools, chatbots, sessions', 'http://backend:4000/stats', 'GET', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', NULL, NULL, '{"_note":{"type":"string","description":"Không cần tham số","required":false}}', NULL, 1);

-- =============================================
-- CHAT - Gửi tin nhắn
-- =============================================

INSERT INTO tools (name, description, endpoint_url, http_method, headers_template, body_template, query_params_template, parameters, response_mapping, is_active) VALUES
('send_chat_message', 'Gửi tin nhắn chat và nhận phản hồi từ AI', 'http://backend:4000/chat', 'POST', '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MCwiZW1haWwiOiJzeXN0ZW1AaW50ZXJuYWwiLCJ0eXBlIjoic2VydmljZSIsImlhdCI6MTc2ODQ1NTU0OSwiZXhwIjo0OTI0MjE1NTQ5fQ.SWLv9KZeiJTcE7_axgmf1bCjDgmIcy5yDa-tJU7HlJ4"}', '{"provider":"{{provider}}","model":"{{model}}","messages":[{"role":"user","content":"{{message}}"}],"temperature":"{{temperature}}","max_tokens":"{{max_tokens}}"}', NULL, '{"provider":{"type":"string","description":"Mã nhà cung cấp (vd: google-ai)","required":true},"model":{"type":"string","description":"Mã model (vd: gemini-2.5-flash)","required":true},"message":{"type":"string","description":"Nội dung tin nhắn","required":true},"temperature":{"type":"number","description":"Độ sáng tạo (0-1)","required":false},"max_tokens":{"type":"number","description":"Số token tối đa","required":false}}', NULL, 1);

-- Hiển thị kết quả
SELECT COUNT(*) as total_tools FROM tools;
SELECT id, name, http_method, description FROM tools ORDER BY id;
