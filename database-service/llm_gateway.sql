-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th1 15, 2026 lúc 05:14 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `llm_gateway`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `admins`
--

INSERT INTO `admins` (`id`, `email`, `password_hash`, `name`, `created_at`) VALUES
(1, 'admin@localhost', '$2a$10$cpyvQar7HEN/eauB/.mO6eYPR.5qYMT39mvB7vTfN7SWie9ZNn73q', 'Admin', '2026-01-05 19:29:58');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `api_keys`
--

CREATE TABLE `api_keys` (
  `id` int(11) NOT NULL,
  `key_type` enum('provider','tool') NOT NULL,
  `provider_id` int(11) DEFAULT NULL,
  `tool_id` int(11) DEFAULT NULL,
  `credentials_encrypted` text NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `priority` int(11) DEFAULT 0,
  `requests_today` int(11) DEFAULT 0,
  `daily_limit` int(11) DEFAULT NULL,
  `last_used_at` datetime DEFAULT NULL,
  `last_error_at` datetime DEFAULT NULL,
  `last_error_message` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ;

--
-- Đang đổ dữ liệu cho bảng `api_keys`
--

INSERT INTO `api_keys` (`id`, `key_type`, `provider_id`, `tool_id`, `credentials_encrypted`, `name`, `is_active`, `priority`, `requests_today`, `daily_limit`, `last_used_at`, `last_error_at`, `last_error_message`, `created_at`) VALUES
(1, 'provider', 2, NULL, 'f82154f2723c35a50bbc4590:beb1f55008f4864c931a9e63ef95b01b:5ea52d8b39142702e140941add7150e2143dcb71cf2b127afbb3f66979a8c38ddd88b6fe89cd0e2f3d41c97e3f1effd72a32b168ff', 'Google AI Key 1', 0, 29, 0, 1500, NULL, '2026-01-11 17:32:46', '{\"error\":{\"code\":403,\"message\":\"Your API key was reported as leaked. Please use another API key.\",\"status\":\"PERMISSION_DENIED\"}}', '2026-01-05 19:31:28'),
(2, 'provider', 2, NULL, 'a83224213cedca01f9586912:10d91a4d92ba1af17ba8c3af3112a81b:a08be339dbe6f81c533049c52218147293387eb6d676adba9e3f6994b38183597ddbd83e117e15612a8d9629877e5ec5cdbfea1c52', 'Google AI Key 2', 1, 28, 57, 1500, '2026-01-11 18:21:10', '2026-01-11 18:20:59', '{\"error\":{\"message\":\"{\\n  \\\"error\\\": {\\n    \\\"code\\\": 429,\\n    \\\"message\\\": \\\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-2.5-flash-lite\\\\nPlease retry in 59.539471102s.\\\",\\n    \\\"status\\\": \\\"RESOURCE_EXHAUSTED\\\",\\n    \\\"details\\\": [\\n      {\\n        \\\"@type\\\": \\\"type.googleapis.com/google.rpc.Help\\\",\\n        \\\"links\\\": [\\n          {\\n            \\\"description\\\": \\\"Learn more about Gemini API quotas\\\",\\n            \\\"url\\\": \\\"https://ai.google.dev/gemini-api/docs/rate-limits\\\"\\n          }\\n        ]\\n      },\\n      {\\n        \\\"@type\\\": \\\"type.googleapis.com/google.rpc.QuotaFailure\\\",\\n        \\\"violations\\\": [\\n          {\\n            \\\"quotaMetric\\\": \\\"generativelanguage.googleapis.com/generate_content_free_tier_requests\\\",\\n            \\\"quotaId\\\": \\\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\\\",\\n            \\\"quotaDimensions\\\": {\\n              \\\"location\\\": \\\"global\\\",\\n              \\\"model\\\": \\\"gemini-2.5-flash-lite\\\"\\n            },\\n            \\\"quotaValue\\\": \\\"20\\\"\\n          }\\n        ]\\n      },\\n      {\\n        \\\"@type\\\": \\\"type.googleapis.com/google.rpc.RetryInfo\\\",\\n        \\\"retryDelay\\\": \\\"59s\\\"\\n      }\\n    ]\\n  }\\n}\\n\",\"code\":429,\"status\":\"Too Many Requests\"}}', '2026-01-05 19:31:28'),
(3, 'provider', 2, NULL, '3c92e1f66448d0e5c94e033a:c776bc51a2915a1244c214ae011105fb:72eb568cd15e7766e67a70da1623d2d489510bffef4f20857e6c14d3c31815586c563b47568355e722c97182943cc596c3945acee7', 'Google AI Key 3', 1, 27, 17, 1500, '2026-01-05 19:49:05', '2026-01-11 15:13:02', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 56.393664062s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"56s\"}]}}', '2026-01-05 19:31:28'),
(4, 'provider', 2, NULL, '222b167a16593d4aa366e24d:6e8784647e2f916e9171b1fd60a232b9:00f008fd9350c633b24770ef49632e03a7f1672a47583be94edf7a6be4a055a5b6c1d1bde11f8d955c33b6e7460830c4477ef85aeb', 'Google AI Key 4', 1, 26, 6, 1500, '2026-01-05 19:49:37', '2026-01-11 15:13:02', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 56.249206338s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"56s\"}]}}', '2026-01-05 19:31:28'),
(5, 'provider', 2, NULL, 'ff6e199cabb81a0b6c887a64:60c5b9a0662e8dc4a85d86051e5fa3c1:28b31a15612853a96ccee62b5d2cac4945e91deb7f5791cb8ff579e4d6b18115fd719fbcd426541dde164ed9278ecdc1168404b03f', 'Google AI Key 5', 1, 25, 0, 1500, NULL, '2026-01-11 15:13:02', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 56.107304273s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"56s\"}]}}', '2026-01-05 19:31:28'),
(6, 'provider', 2, NULL, '1a45271fd2dbe50810c919bd:99ad51fbdc0033b073386a4b2f6e1262:54b75092e3bd773baa86bd4b432bcaafd72da447660fc6418917639f4562d8f9b4e2d8fe8380d816538e2dffd6732a64814350d84d', 'Google AI Key 6', 1, 24, 0, 1500, NULL, '2026-01-11 15:13:02', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \",\"status\":\"RESOURCE_EXHAUSTED\"}}', '2026-01-05 19:31:28'),
(7, 'provider', 2, NULL, '182f9abd45aff6f175ca085a:a9a1bae7fb5d179e4a8a42f6e7b2bbab:d14463ee193b6bd38d609b7eaaedfd2ad72c0df568f348f2d33baf8410da34661eec30cf53f1248ab7f42e61c61a5644498710f76d', 'Google AI Key 7', 1, 23, 0, 1500, NULL, '2026-01-11 15:13:03', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \",\"status\":\"RESOURCE_EXHAUSTED\"}}', '2026-01-05 19:31:28'),
(8, 'provider', 2, NULL, '56712aff22b3a184c6ca4996:8d9a33d4f1fc6a3bfe755b2e10d0a79a:35bd7853c5e889b2229a4de3a5dfcfabeaae56b44ca9682292eb2b6cbefaba645db209455fe060f74d8103cc535f20b0457d6a1dee', 'Google AI Key 8', 1, 22, 0, 1500, NULL, '2026-01-11 15:13:03', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \",\"status\":\"RESOURCE_EXHAUSTED\"}}', '2026-01-05 19:31:28'),
(9, 'provider', 2, NULL, 'e4a8eb3f634a11a92a300f5d:605d3bf7d0c2fe6acabff54e8750c6c2:1d0417ac4cb3c9145c4a9b0ac6795992395d4a8ab4c2979f0636bfb49d380861835ab0c7884cafd5a6b25dbcfaa7d47df4fbd98053', 'Google AI Key 9', 1, 21, 0, 1500, NULL, '2026-01-11 15:13:03', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \",\"status\":\"RESOURCE_EXHAUSTED\"}}', '2026-01-05 19:31:28'),
(10, 'provider', 2, NULL, '36ea9027f2957fefaf7febaa:8e0c69714d88a21af16b6b3d624f42d3:31295aa6d96811ca3f59ffecbe3b990f9bc9de475445d8bb9655d8f2aeacd4e5c65d33cf98eaa25a867b3fd5772c4829bdf9d71cd9', 'Google AI Key 10', 1, 20, 0, 1500, NULL, '2026-01-11 15:13:03', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \",\"status\":\"RESOURCE_EXHAUSTED\"}}', '2026-01-05 19:31:28'),
(11, 'provider', 2, NULL, 'cb22f91e616da1243605079f:65f82a6c44cfd796e31e51d1b4d4c65c:93311f1ba82986a084db1bf8aba8c23bc5843288fd2adeec20ecade0180350b4c42afb78fea2a2dee026cdb8ded3eeef404bb90e4d', 'Google AI Key 11', 1, 19, 0, 1500, NULL, '2026-01-11 15:13:04', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 54.891537928s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"54s\"}]}}', '2026-01-05 19:31:28'),
(12, 'provider', 2, NULL, 'd6831100ad146247754bae55:360468dab5d9f6acc709a8e2971d6bef:329b9aa86a4adbb30bbc299dcbfb494899ec27336dba3625337e56604501fd6d3562ec74b4604e83f5496bc6de76875702231496c1', 'Google AI Key 12', 1, 18, 0, 1500, NULL, '2026-01-11 15:13:04', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 54.756590496s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"54s\"}]}}', '2026-01-05 19:31:28'),
(13, 'provider', 2, NULL, '98f5f7a8e51fb412eb6c895a:96de11b22d9a23447a7bacc4938010f5:1189b0765869fcc9ffebada86ca166f7c0c57164d618989ddceb3a10bf91c98f7f2428c8cb84977c1eb1452ea9c999c3ba93bf9063', 'Google AI Key 13', 1, 17, 0, 1500, NULL, '2026-01-11 15:13:04', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 54.625878623s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"54s\"}]}}', '2026-01-05 19:31:29'),
(14, 'provider', 2, NULL, '8c4eeae868f004df89808eae:236d71dfe35be4a06197de601a3ce65c:95864c12a0d4d23168b233326c3ba6e2bbf3079e6440667be44f26f3cdf5f2e8b6473fa30c9a85a3cd95f93cd9ac951f82e3e37ec6', 'Google AI Key 14', 1, 16, 0, 1500, NULL, '2026-01-11 15:13:04', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 54.488914405s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"54s\"}]}}', '2026-01-05 19:31:29'),
(15, 'provider', 2, NULL, '05c657177b5d951cea174469:071dd25abe27cf99ef913753a2d6b65b:004c8f44130ae281711780f8470fd58c14de2a916b1daaa64c7bf4d1603ba66ad4da4540b7e6646d742356cf979818ba6c4615a48e', 'Google AI Key 15', 1, 15, 0, 1500, NULL, '2026-01-11 15:13:04', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 54.361828607s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"54s\"}]}}', '2026-01-05 19:31:29'),
(16, 'provider', 2, NULL, 'eeb307738c2de82ee8883084:a700ab16d80d6a79bd245172aefefb01:0a730359c59499c4fa1fcda0da1904acd6d3dbfe7f0c6d1987f0e717a7b17faa32fe7dbee70d055d671daa95df5a5a4ce47a7e347f', 'Google AI Key 16', 1, 14, 0, 1500, NULL, '2026-01-11 15:13:04', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 54.136317804s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"54s\"}]}}', '2026-01-05 19:31:29'),
(17, 'provider', 2, NULL, 'cf4a703118d001e4f7c9a273:cb0d66065b1ca7f1b77c5a79262802ae:98948baf8c66b23ab268dabd092a6407e1b075bd4545a6c9e1fd1932087cc6f6fd45325503f90b68e02718e448f4b64577d6b8af57', 'Google AI Key 17', 1, 13, 0, 1500, NULL, '2026-01-11 15:13:04', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 54.004618339s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"54s\"}]}}', '2026-01-05 19:31:29'),
(18, 'provider', 2, NULL, '78437b3466de41004a435f63:7968f0eef6b30f4170616964e8d3af43:2b1bc8e67b5338fbf84c195ff74f18f4e992021d5fcb225db33a7091c9160a07cf8b0106f23e4f0a2636f1b67730430de167186517', 'Google AI Key 18', 1, 12, 0, 1500, NULL, '2026-01-11 15:13:05', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 53.879166409s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"53s\"}]}}', '2026-01-05 19:31:29'),
(19, 'provider', 2, NULL, '7290c05e9f94a75237b1177f:5d5317541d11bb8a0a6a89863f862a3e:0e47fca617be4b5c7951ae8fbeaa21713d85ffd7130eb8099b978068eb8dce42806ada5d3b3480ede12c03184bf9754928905487ca', 'Google AI Key 19', 1, 11, 0, 1500, NULL, '2026-01-11 15:13:05', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 53.742530087s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"53s\"}]}}', '2026-01-05 19:31:29'),
(20, 'provider', 2, NULL, '89b970cc044d4d10ca574a10:6c6b434d2c7d3fe2ca6471df74d0042f:1af157723162b2319e640524228092a1b3146a90faca111fad0ec7f9371d2248a1c89d08d782c345cf310f03314d34af4ef0e81578', 'Google AI Key 20', 1, 10, 0, 1500, NULL, '2026-01-11 15:13:05', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 53.611103541s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"53s\"}]}}', '2026-01-05 19:31:29'),
(21, 'provider', 2, NULL, '20b2d6a1c3f3395fb1628f48:36cc9b172ea40940849228ee9214a689:8ff40678b0df13c13d28d2da6c81140afa3b54116a0690b39e2fcaaeaed4c6f009f088ea8581a7feffc72ff01d6bbee79585bf6f84', 'Google AI Key 21', 1, 9, 0, 1500, NULL, '2026-01-11 15:13:05', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 53.383097468s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"53s\"}]}}', '2026-01-05 19:31:29'),
(22, 'provider', 2, NULL, '8e76eb7e98bd9879873e6f19:f8fdeda598543896ce56e6140982f99e:42309efe0d0bbeeaed15664bfa438b7bf739c4f31e9427453459005fa1eb053a300404f848bebf177ae8441bee12aa1914acc25e2b', 'Google AI Key 22', 1, 8, 0, 1500, NULL, '2026-01-11 15:13:05', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 53.243572509s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"53s\"}]}}', '2026-01-05 19:31:29'),
(23, 'provider', 2, NULL, '3359950b9f6b6d7f175eee70:3c62acf478a084b6f26bf02b2c7d5dbb:91b04b820d97fda0f51840c0c4bed65acd9fe2aa387b7e5b77173497ce66ed4076f616d8cab58c234d8686a787080ca8dec4d7dd00', 'Google AI Key 23', 1, 7, 0, 1500, NULL, '2026-01-11 15:13:05', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 53.101013607s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"53s\"}]}}', '2026-01-05 19:31:29'),
(24, 'provider', 2, NULL, 'b679237919976c12c32313e9:3eeade703a6654cb343a8341a5f074f5:3efe41fb93452962ef8eef8c7119bf20be95d41ad83f0231d84f6784b717150ddb6dd4e7d4dc09ec8f605a9137c2ea287ff3df404f', 'Google AI Key 24', 1, 6, 0, 1500, NULL, '2026-01-11 15:13:05', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 52.969277369s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"52s\"}]}}', '2026-01-05 19:31:29'),
(25, 'provider', 2, NULL, '566559d18f2314e8420853d0:4149265f2e5ad08bf6f1d63afbe88a9b:a43a4d7878decfc9f4054336650235647693dc918ac578e10435f430fb523749da8414e67b3fa102697f159f302dc5537bd0886875', 'Google AI Key 25', 1, 5, 0, 1500, NULL, '2026-01-11 15:13:06', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 52.828209155s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"52s\"}]}}', '2026-01-05 19:31:29'),
(26, 'provider', 2, NULL, '965133adccf97060336f5122:cf420a1e419d01a77c2d6512b0b6a908:cda9086ae115db002747b4c8c7e060a890ccf234f99f447d6243196dfadfb451b5810d956e8759286f5b6f5211475a168fb4600d03', 'Google AI Key 26', 1, 4, 0, 1500, NULL, '2026-01-11 15:13:06', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 52.694041661s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"52s\"}]}}', '2026-01-05 19:31:29'),
(27, 'provider', 2, NULL, '2d2111b398ace5e6a5ddd66c:8b2aeb67908a96bc97bdefa07b273258:739b87f491cb2a04df85a76dffa33e5c5e0d2a34bd7ec2be615028574d653715cf4a449cd1c27da536400a64e7067f0218bf77ca33', 'Google AI Key 27', 1, 3, 0, 1500, NULL, '2026-01-11 15:13:06', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 52.551698142s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"52s\"}]}}', '2026-01-05 19:31:30');
INSERT INTO `api_keys` (`id`, `key_type`, `provider_id`, `tool_id`, `credentials_encrypted`, `name`, `is_active`, `priority`, `requests_today`, `daily_limit`, `last_used_at`, `last_error_at`, `last_error_message`, `created_at`) VALUES
(28, 'provider', 2, NULL, '9c766599b7f0441454b693e9:d18b638be2ddb9b5dda50242f214b4be:8ade97f0e2be99e26c0928df09668270579ae9290450243c2255c8159a6402350f43ca456a1a982b1362ce2f04b6b343b80e38e022', 'Google AI Key 28', 1, 2, 0, 1500, NULL, '2026-01-11 15:13:06', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 52.415937547s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"52s\"}]}}', '2026-01-05 19:31:30'),
(29, 'provider', 2, NULL, '242446b6f17409959284ce2e:0f569842cd979ae8a97b512a990bc213:932a81bf105769172e389abab17f4735936dca93dd0bf895395b47aac9886621891039b2a21e8c07b49c1168ddbd46d6b8513cfc76', 'Google AI Key 29', 1, 1, 0, 1500, NULL, '2026-01-11 15:13:06', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\nPlease retry in 52.284896888s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"model\":\"gemini-2.0-flash\",\"location\":\"global\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"52s\"}]}}', '2026-01-05 19:31:30'),
(30, 'provider', 2, NULL, '18f7cd89079a85af95511a9e:88d7e918c97015eff7498c747a86d34c:151889f890d2a2b0b2444e5849eb1e60a256ef7f0537815a361d1330afae309ec792512bc3b953a68fa9feb33aec8fe4cc37e0308e', 'Google AI Key 30', 1, 0, 0, 1500, NULL, '2026-01-11 15:13:06', '{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: gemini-2.0-flash\\nPlease retry in 52.153384589s.\",\"status\":\"RESOURCE_EXHAUSTED\",\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.Help\",\"links\":[{\"description\":\"Learn more about Gemini API quotas\",\"url\":\"https://ai.google.dev/gemini-api/docs/rate-limits\"}]},{\"@type\":\"type.googleapis.com/google.rpc.QuotaFailure\",\"violations\":[{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_requests\",\"quotaId\":\"GenerateRequestsPerMinutePerProjectPerModel-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}},{\"quotaMetric\":\"generativelanguage.googleapis.com/generate_content_free_tier_input_token_count\",\"quotaId\":\"GenerateContentInputTokensPerModelPerMinute-FreeTier\",\"quotaDimensions\":{\"location\":\"global\",\"model\":\"gemini-2.0-flash\"}}]},{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"52s\"}]}}', '2026-01-05 19:31:30'),
(31, 'provider', 5, NULL, '1b413c8e6becc20f711a0cc2:df7b21ea759d736f5b60dd4fde9ccd48:dbaee56ab4f40789648377e7827d0c9cf4d6e9007e2818dad7c7640c9881262b139d723dcee860559679c075aae0fa8f60c0c0647e3cd56970cee4f42d837e2a8b6e885691da9590c31909cd3363e791667519017ca9b2', 'OpenRouter Key', 1, 0, 4, NULL, '2026-01-11 15:54:50', NULL, NULL, '2026-01-11 15:30:44');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chatbots`
--

CREATE TABLE `chatbots` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `provider_id` int(11) DEFAULT NULL,
  `model_id` int(11) DEFAULT NULL,
  `auto_mode` tinyint(1) DEFAULT 0,
  `system_prompt` text DEFAULT NULL,
  `temperature` decimal(3,2) DEFAULT 0.70,
  `max_tokens` int(11) DEFAULT 2048,
  `tool_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tool_ids`)),
  `welcome_message` text DEFAULT NULL,
  `placeholder_text` varchar(255) DEFAULT 'Nhập tin nhắn...',
  `is_public` tinyint(1) DEFAULT 0,
  `api_key` varchar(64) DEFAULT NULL,
  `allowed_origins` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allowed_origins`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `chatbots`
--

INSERT INTO `chatbots` (`id`, `name`, `slug`, `description`, `provider_id`, `model_id`, `auto_mode`, `system_prompt`, `temperature`, `max_tokens`, `tool_ids`, `welcome_message`, `placeholder_text`, `is_public`, `api_key`, `allowed_origins`, `is_active`, `created_at`, `updated_at`) VALUES
(7, 'test', 'test', 'test', NULL, NULL, 1, 'test', 0.70, 2048, '[4,5,2,1,3]', 'test', 'Nhập tin nhắn...', 1, 'cb_cd09e74db247cba66448bda21ddcce86e21b5984eb5e665c', '[]', 1, '2026-01-11 17:52:33', '2026-01-11 18:20:27'),
(8, 'dfgdfhfg', 'dfgdfhfg', 'fhfhfgh', NULL, NULL, 1, '', 0.70, 2048, '[]', '', 'Nhập tin nhắn...', 0, 'cb_6344c70e803922b1febbf9f9501a775866345c545a0b4d49', '[]', 1, '2026-01-11 17:54:01', '2026-01-11 17:54:01'),
(9, 'bbbbbbbb', 'bbbbbbbb', 'bbb', NULL, NULL, 1, '', 0.70, 2048, '[]', '', 'Nhập tin nhắn...', 0, 'cb_214705188c3c105fe06b11e7f09bd00a8a3aaacec3cdfa5c', '[]', 1, '2026-01-11 17:55:49', '2026-01-11 17:55:49');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `role` enum('system','user','assistant') NOT NULL,
  `content` text NOT NULL,
  `model_id` int(11) DEFAULT NULL,
  `provider_id` int(11) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `session_id`, `role`, `content`, `model_id`, `provider_id`, `metadata`, `created_at`) VALUES
(1, 1, 'user', 'What is 2+2?', NULL, NULL, NULL, '2026-01-05 19:33:50'),
(2, 2, 'user', 'Hello, what is your name?', NULL, NULL, NULL, '2026-01-05 19:33:52'),
(3, 3, 'user', 'My name is Charlie', NULL, NULL, NULL, '2026-01-05 19:33:54'),
(4, 4, 'user', 'Count 1 to 3', NULL, NULL, NULL, '2026-01-05 19:33:56'),
(5, 5, 'user', 'What is 2+2?', NULL, NULL, NULL, '2026-01-05 19:33:59'),
(6, 6, 'user', 'What is 2+2?', NULL, NULL, NULL, '2026-01-05 19:37:48'),
(7, 7, 'user', 'Hello, what is your name?', NULL, NULL, NULL, '2026-01-05 19:37:54'),
(8, 8, 'user', 'My name is Charlie', NULL, NULL, NULL, '2026-01-05 19:37:59'),
(9, 9, 'user', 'What is 2+2?', NULL, NULL, NULL, '2026-01-05 19:40:46'),
(10, 9, 'assistant', '2 + 2 equals **4**.', 1, 2, NULL, '2026-01-05 19:40:48'),
(11, 10, 'user', 'Hello, what is your name?', NULL, NULL, NULL, '2026-01-05 19:40:50'),
(12, 10, 'assistant', 'Tôi là một mô hình ngôn ngữ lớn, được đào tạo bởi Google.', 1, 2, NULL, '2026-01-05 19:40:51'),
(13, 11, 'user', 'What is 2+2?', NULL, NULL, NULL, '2026-01-05 19:41:47'),
(14, 11, 'assistant', '2 + 2 = 4', 1, 2, NULL, '2026-01-05 19:41:48'),
(15, 12, 'user', 'Hello, what is your name?', NULL, NULL, NULL, '2026-01-05 19:41:50'),
(16, 12, 'assistant', 'Tôi là một mô hình ngôn ngữ lớn, được huấn luyện bởi Google.', 1, 2, NULL, '2026-01-05 19:41:51'),
(17, 13, 'user', 'My name is Charlie', NULL, NULL, NULL, '2026-01-05 19:41:53'),
(18, 13, 'assistant', 'Hi Charlie! It\'s nice to meet you. How can I help you today?', 1, 2, NULL, '2026-01-05 19:41:54'),
(19, 13, 'user', 'What is my name?', NULL, NULL, NULL, '2026-01-05 19:41:55'),
(20, 13, 'assistant', 'I do not have access to your personal information, so I cannot know your name. I am a large language model, trained by Google.', 1, 2, NULL, '2026-01-05 19:41:56'),
(21, 14, 'user', 'Count 1 to 3', NULL, NULL, NULL, '2026-01-05 19:41:58'),
(22, 14, 'assistant', 'Here\'s counting from 1 to 3:\n\n1\n2\n3', 1, 2, NULL, '2026-01-05 19:41:59'),
(23, 15, 'user', 'What is 2+2?', NULL, NULL, NULL, '2026-01-05 19:42:02'),
(24, 15, 'assistant', '2 + 2 = 4', 2, 2, NULL, '2026-01-05 19:42:03'),
(25, 16, 'user', 'Hello, what is your name?', NULL, NULL, NULL, '2026-01-05 19:42:05'),
(26, 16, 'assistant', 'Chào bạn, tôi là một mô hình ngôn ngữ lớn, được Google đào tạo.', 2, 2, NULL, '2026-01-05 19:42:07'),
(27, 17, 'user', 'My name is Charlie', NULL, NULL, NULL, '2026-01-05 19:42:09'),
(28, 17, 'assistant', 'Hello Charlie! It\'s nice to know your name. How can I help you today?', 2, 2, NULL, '2026-01-05 19:42:11'),
(29, 17, 'user', 'What is my name?', NULL, NULL, NULL, '2026-01-05 19:42:12'),
(30, 17, 'assistant', 'I don\'t know your name. As an AI, I don\'t have access to personal information about you unless you choose to tell me.', 2, 2, NULL, '2026-01-05 19:42:15'),
(31, 18, 'user', 'What is 2+2?', NULL, NULL, NULL, '2026-01-05 19:44:44'),
(32, 18, 'assistant', '2 + 2 = 4', 1, 2, NULL, '2026-01-05 19:44:46'),
(33, 19, 'user', 'Hello, what is your name?', NULL, NULL, NULL, '2026-01-05 19:44:48'),
(34, 19, 'assistant', 'Tôi là một mô hình ngôn ngữ lớn, được đào tạo bởi Google.', 1, 2, NULL, '2026-01-05 19:44:49'),
(35, 20, 'user', 'My name is Charlie', NULL, NULL, NULL, '2026-01-05 19:44:51'),
(36, 20, 'assistant', 'Hello Charlie! It\'s nice to meet you. How can I help you today?', 1, 2, NULL, '2026-01-05 19:44:52'),
(37, 20, 'user', 'What is my name?', NULL, NULL, NULL, '2026-01-05 19:44:53'),
(38, 20, 'assistant', 'Your name is Charlie.', 1, 2, NULL, '2026-01-05 19:44:54'),
(39, 21, 'user', 'Count 1 to 3', NULL, NULL, NULL, '2026-01-05 19:44:56'),
(40, 21, 'assistant', '1, 2, 3', 1, 2, NULL, '2026-01-05 19:44:57'),
(41, 22, 'user', 'What is 2+2?', NULL, NULL, NULL, '2026-01-05 19:45:00'),
(42, 22, 'assistant', '2 + 2 = 4', 2, 2, NULL, '2026-01-05 19:45:01'),
(43, 23, 'user', 'Cho tôi thông tin của user có ID là 1', NULL, NULL, NULL, '2026-01-05 19:47:05'),
(44, 23, 'assistant', 'Rất tiếc, tôi không thể cung cấp thông tin của người dùng có ID là 1. Là một mô hình ngôn ngữ AI, tôi được thiết kế để bảo vệ quyền riêng tư của người dùng và không có quyền truy cập hoặc lưu trữ thông tin cá nhân của bất kỳ ai.\n\nViệc truy cập và chia sẻ thông tin người dùng trái phép là vi phạm quyền riêng tư và pháp luật.\n\nNếu bạn có một lý do chính đáng để cần thông tin này, tôi khuyên bạn nên liên hệ trực tiếp với hệ thống hoặc dịch vụ mà bạn tin rằng người dùng này đang sử dụng. Họ sẽ có quy trình phù hợp để xử lý các yêu cầu thông tin, có thể yêu cầu xác minh danh tính hoặc các biện pháp bảo mật khác.', 1, 2, NULL, '2026-01-05 19:47:08'),
(45, 24, 'user', 'Lấy nội dung bài viết số 5', NULL, NULL, NULL, '2026-01-05 19:47:10'),
(46, 24, 'assistant', 'Để lấy nội dung bài viết số 5, tôi cần biết bạn đang tham chiếu đến bài viết nào. Bạn có thể cung cấp thêm thông tin chi tiết được không?\n\nVí dụ, bạn có thể cho tôi biết:\n\n*   **Nguồn bài viết:** Bạn thấy bài viết này ở đâu? (Ví dụ: một trang web cụ thể, một tài liệu PDF, một cuốn sách, một email, một diễn đàn, v.v.)\n*   **Tiêu đề hoặc chủ đề của bài viết:** Nếu bạn nhớ tiêu đề hoặc chủ đề chính, điều đó sẽ rất hữu ích.\n*   **Bối cảnh:** Bạn đang nói về danh sách các bài viết nào? (Ví dụ: \"bài viết số 5 trong danh sách các bài viết về AI mà bạn đã cung cấp trước đó\", hoặc \"bài viết số 5 trên trang web X\").\n\nKhi có thêm thông tin, tôi sẽ cố gắng hết sức để truy xuất và cung cấp nội dung bài viết số 5 cho bạn.', 1, 2, NULL, '2026-01-05 19:47:12'),
(47, 25, 'user', 'Liệt kê các bài viết của user ID 2', NULL, NULL, NULL, '2026-01-05 19:47:14'),
(48, 25, 'assistant', 'Để liệt kê các bài viết của user ID 2, bạn cần cung cấp thêm thông tin về nguồn dữ liệu bạn đang sử dụng. Cụ thể:\n\n1.  **Bạn đang sử dụng hệ thống nào?** (Ví dụ: một blog, một diễn đàn, một nền tảng mạng xã hội, một cơ sở dữ liệu tùy chỉnh, v.v.)\n2.  **Cấu trúc dữ liệu của bạn như thế nào?** (Bạn có một bảng `bai_viet` và trong đó có cột `user_id` không? Hay cách lưu trữ khác?)\n\nTuy nhiên, tôi có thể cung cấp cho bạn **câu lệnh truy vấn SQL mẫu** để lấy dữ liệu này, giả định bạn đang sử dụng một cơ sở dữ liệu quan hệ (như MySQL, PostgreSQL, SQL Server, v.v.) và có một bảng tên là `bai_viet` với cột `user_id` lưu trữ ID của người dùng đã tạo bài viết.\n\n**Câu lệnh SQL:**\n\n```sql\nSELECT *\nFROM bai_viet\nWHERE user_id = 2;\n```\n\n**Giải thích câu lệnh:**\n\n*   `SELECT *`: Chọn tất cả các cột (thông tin chi tiết về bài viết).\n*   `FROM bai_viet`: Lấy dữ liệu từ bảng có tên là `bai_viet`.\n*   `WHERE user_id = 2`: Lọc ra chỉ những dòng (bài viết) mà cột `user_id` có giá trị là `2`.\n\n**Nếu bạn có thể cung cấp thêm chi tiết, tôi có thể đưa ra câu trả lời chính xác hơn.** Ví dụ, nếu bạn đang sử dụng một API cụ thể, tôi có thể hướng dẫn bạn cách gọi API đó để lấy thông tin.', 1, 2, NULL, '2026-01-05 19:47:17'),
(49, 26, 'user', 'Tạo bài viết mới với tiêu đề \"Hello World\" và nội dung \"This is a test\" cho user 1', NULL, NULL, NULL, '2026-01-05 19:47:19'),
(50, 26, 'assistant', '## Hello World\n\nThis is a test', 1, 2, NULL, '2026-01-05 19:47:20'),
(51, 27, 'user', 'Lấy các bình luận của bài viết số 1', NULL, NULL, NULL, '2026-01-05 19:47:22'),
(52, 27, 'assistant', 'Để lấy các bình luận của bài viết số 1, tôi cần thêm thông tin. Vui lòng cho tôi biết:\n\n1.  **Bạn đang nói đến bài viết số 1 trên nền tảng nào?**\n    *   Một trang web tin tức cụ thể (ví dụ: VnExpress, Zing News, Tuổi Trẻ...)?\n    *   Một bài viết trên mạng xã hội (ví dụ: Facebook, YouTube, Reddit...)?\n    *   Một bài viết trong một hệ thống quản lý nội dung (CMS) nào đó?\n    *   Một bài viết trong một bài tập/dự án mà bạn đang làm?\n\n2.  **\"Bài viết số 1\" có được xác định bằng một ID duy nhất, một URL cụ thể, hay một cách nào khác?**\n\nNếu bạn cung cấp thêm thông tin chi tiết, tôi có thể hướng dẫn bạn cách lấy bình luận.\n\n**Ví dụ, nếu bạn đang hỏi về một bài viết trên một trang web tin tức và bạn có URL của bài viết đó, bạn có thể:**\n\n*   **Truy cập trực tiếp vào trang web:** Mở URL bài viết đó và cuộn xuống cuối trang. Thông thường, phần bình luận sẽ hiển thị ở đó.\n*   **Sử dụng các công cụ hoặc API (nếu có):** Một số trang web cung cấp API cho phép truy cập dữ liệu, bao gồm cả bình luận. Tuy nhiên, điều này thường yêu cầu kiến thức lập trình.\n\n**Nếu bạn đang hỏi về một bài viết trên mạng xã hội như Facebook hoặc YouTube, cách lấy bình luận sẽ là:**\n\n*   **Truy cập trực tiếp bài viết đó trên nền tảng:** Mở bài viết và xem phần bình luận hiển thị bên dưới.\n\nHãy cung cấp thêm ngữ cảnh để tôi có thể hỗ trợ bạn tốt nhất!', 1, 2, NULL, '2026-01-05 19:47:25'),
(53, 28, 'user', 'Xin chào, bạn khỏe không?', NULL, NULL, NULL, '2026-01-05 19:47:27'),
(54, 28, 'assistant', 'Chào bạn, tôi khỏe. Cảm ơn bạn đã hỏi thăm. Còn bạn thì sao? Bạn có khỏe không?', 1, 2, NULL, '2026-01-05 19:47:28'),
(55, 29, 'user', 'Lấy thông tin user có ID 999999', NULL, NULL, NULL, '2026-01-05 19:47:30'),
(56, 29, 'assistant', 'Để lấy thông tin người dùng có ID là 999999, tôi cần biết bạn đang sử dụng hệ thống hoặc nền tảng nào.\n\nVí dụ, nếu bạn đang làm việc với:\n\n*   **Một cơ sở dữ liệu (như SQL):** Bạn sẽ cần một câu truy vấn SQL.\n*   **Một API (như RESTful API):** Bạn sẽ cần biết endpoint API và cách gửi yêu cầu (GET).\n*   **Một ngôn ngữ lập trình (như Python, JavaScript):** Bạn sẽ cần sử dụng các thư viện hoặc SDK tương ứng để tương tác với hệ thống chứa thông tin người dùng.\n\n**Vui lòng cung cấp thêm thông tin về môi trường bạn đang làm việc để tôi có thể hỗ trợ bạn tốt hơn.**\n\nVí dụ, bạn có thể trả lời:\n\n*   \"Tôi đang sử dụng cơ sở dữ liệu PostgreSQL.\"\n*   \"Tôi đang tương tác với API của [tên dịch vụ].\"\n*   \"Tôi đang viết mã Python để truy cập dữ liệu.\"\n\nSau khi có thêm thông tin, tôi sẽ có thể đưa ra câu lệnh hoặc hướng dẫn cụ thể.', 1, 2, NULL, '2026-01-05 19:47:32'),
(57, 30, 'user', 'Cho tôi thông tin user 3 và bài viết số 10', NULL, NULL, NULL, '2026-01-05 19:47:34'),
(58, 30, 'assistant', 'Để có thể cung cấp thông tin chi tiết về \"user 3\" và \"bài viết số 10\", tôi cần thêm ngữ cảnh.\n\nBạn vui lòng cho tôi biết:\n\n*   **Bạn đang nói đến user và bài viết từ đâu?** (Ví dụ: một trang web cụ thể, một ứng dụng, một nền tảng mạng xã hội, một tài liệu, một cơ sở dữ liệu, v.v.)\n*   **\"user 3\" là user nào?** Bạn có thể cung cấp tên người dùng, ID, hoặc bất kỳ thông tin định danh nào khác không?\n*   **\"bài viết số 10\" là bài viết nào?** Bạn có thể cung cấp tiêu đề, link, hoặc bất kỳ thông tin nhận dạng nào khác không?\n\nKhi bạn cung cấp thêm thông tin, tôi sẽ cố gắng hết sức để tìm kiếm và cung cấp cho bạn những gì bạn cần.', 1, 2, NULL, '2026-01-05 19:47:37'),
(59, 31, 'user', 'Lấy thông tin user 5', NULL, NULL, NULL, '2026-01-05 19:47:39'),
(60, 31, 'assistant', 'Để tôi lấy thông tin của user 5, tôi cần biết bạn đang muốn lấy thông tin từ nguồn nào. Vui lòng cung cấp thêm thông tin về ngữ cảnh:\n\n*   **Bạn đang sử dụng hệ thống/ứng dụng/cơ sở dữ liệu nào?** (Ví dụ: một trang web cụ thể, một ứng dụng nội bộ, một cơ sở dữ liệu SQL, một API, v.v.)\n*   **Bạn có quyền truy cập vào hệ thống đó không?**\n*   **Bạn muốn lấy loại thông tin nào về user 5?** (Ví dụ: tên, email, số điện thoại, địa chỉ, thông tin đăng nhập, lịch sử hoạt động, v.v.)\n\n**Ví dụ:**\n\n*   Nếu bạn đang làm việc với một cơ sở dữ liệu SQL, bạn có thể cần một câu lệnh SQL như: `SELECT * FROM users WHERE user_id = 5;`\n*   Nếu bạn đang tương tác với một API, bạn có thể cần một yêu cầu GET đến một URL cụ thể, ví dụ: `/api/users/5`.\n\n**Hãy cho tôi biết thêm chi tiết để tôi có thể hỗ trợ bạn tốt hơn!**', 1, 2, NULL, '2026-01-05 19:47:41'),
(61, 31, 'user', 'User này làm việc ở công ty nào?', NULL, NULL, NULL, '2026-01-05 19:47:42'),
(62, 31, 'assistant', 'Để biết user 5 làm việc ở công ty nào, tôi cần bạn cung cấp thêm thông tin về nguồn dữ liệu mà bạn đang truy cập.\n\nCụ thể, bạn đang xem thông tin user 5 ở đâu? Ví dụ:\n\n*   **Trong một hệ thống quản lý nhân sự (HRM)?**\n*   **Trong một cơ sở dữ liệu của công ty?**\n*   **Trên một nền tảng mạng xã hội chuyên nghiệp (như LinkedIn)?**\n*   **Trong một hệ thống CRM (Quản lý Quan hệ Khách hàng)?**\n*   **Trong một ứng dụng nội bộ khác?**\n\nKhi bạn cho tôi biết bạn đang xem thông tin user 5 ở đâu, tôi sẽ có thể hướng dẫn bạn cách tìm kiếm thông tin về công ty mà user đó làm việc.', 1, 2, NULL, '2026-01-05 19:47:44'),
(63, 32, 'user', 'Cho tôi thông tin của user có ID là 1', NULL, NULL, NULL, '2026-01-05 19:48:25'),
(64, 32, 'assistant', 'Đây là thông tin của user có ID là 1:\n* Tên: Leanne Graham\n* Email: Sincere@april.biz\n* Số điện thoại: 1-770-736-8031 x56442\n* Công ty: Romaguera-Crona\n* Thành phố: Gwenborough', 1, 2, NULL, '2026-01-05 19:48:28'),
(65, 33, 'user', 'Lấy nội dung bài viết số 5', NULL, NULL, NULL, '2026-01-05 19:48:30'),
(66, 33, 'assistant', 'Nội dung bài viết số 5 là:\nrepudiandae veniam quaerat sunt sed\nalias aut fugiat sit autem sed est\nvoluptatem omnis possimus esse voluptatibus quis\nest aut tenetur dolor neque', 1, 2, NULL, '2026-01-05 19:48:33'),
(67, 34, 'user', 'Liệt kê các bài viết của user ID 2', NULL, NULL, NULL, '2026-01-05 19:48:35'),
(68, 34, 'assistant', 'Dưới đây là danh sách các bài viết của user ID 2:\n\n*   **Tiêu đề:** et ea vero quia laudantium autem\n    **Nội dung:** delectus reiciendis molestiae occaecati non minima eveniet qui voluptatibus\n    accusamus in eum beatae sit\n    vel qui neque voluptates ut commodi qui incidunt\n    ut animi commodi\n*   **Tiêu đề:** in quibusdam tempore odit est dolorem\n    **Nội dung:** itaque id aut magnam\n    praesentium quia et ea odit et ea voluptas et\n    sapiente quia nihil amet occaecati quia id voluptatem\n    incidunt ea est distinctio odio\n*   **Tiêu đề:** dolorum ut in voluptas mollitia et saepe quo animi\n    **Nội dung:** aut dicta possimus sint mollitia voluptas commodi quo doloremque\n    iste corrupti reiciendis voluptatem eius rerum\n    sit cumque quod eligendi laborum minima\n    perferendis recusandae assumenda consectetur porro architecto ipsum ipsam\n*   **Tiêu đề:** voluptatem eligendi optio\n    **Nội dung:** fuga et accusamus dolorum perferendis illo voluptas\n    non doloremque neque facere\n    ad qui dolorum molestiae beatae\n    sed aut voluptas totam sit illum\n*   **Tiêu đề:** eveniet quod temporibus\n    **Nội dung:** reprehenderit quos placeat\n    velit minima officia dolores impedit repudiandae molestiae nam\n    voluptas recusandae quis delectus\n    officiis harum fugiat vitae\n*   **Tiêu đề:** sint suscipit perspiciatis velit dolorum rerum ipsa laboriosam odio\n    **Nội dung:** suscipit nam nisi quo aperiam aut\n    asperiores eos fugit maiores voluptatibus quia\n    voluptatem quis ullam qui in alias quia est\n    consequatur magni mollitia accusamus ea nisi voluptate dicta\n*   **Tiêu đề:** fugit voluptas sed molestias voluptatem provident\n    **Nội dung:** eos voluptas et aut odit natus earum\n    aspernatur fuga molestiae ullam\n    deserunt ratione qui eos\n    qui nihil ratione nemo velit ut aut id quo\n*   **Tiêu đề:** voluptate et itaque vero tempora molestiae\n    **Nội dung:** eveniet quo quis\n    laborum totam consequatur non dolor\n    ut et est repudiandae\n    est voluptatem vel debitis et magnam\n*   **Tiêu đề:** adipisci placeat illum aut reiciendis qui\n    **Nội dung:** illum quis cupiditate provident sit magnam\n    ea sed aut omnis\n    veniam maiores ullam consequatur atque\n    adipisci quo iste expedita sit quos voluptas\n*   **Tiêu đề:** doloribus ad provident suscipit at\n    **Nội dung:** qui consequuntur ducimus possimus quisquam amet similique\n    suscipit porro ipsam amet\n    eos veritatis officiis exercitationem vel fugit aut necessitatibus totam\n    omnis rerum consequatur expedita quidem cumque explicabo', 1, 2, NULL, '2026-01-05 19:48:44'),
(69, 35, 'user', 'Tạo bài viết mới với tiêu đề \"Hello World\" và nội dung \"This is a test\" cho user 1', NULL, NULL, NULL, '2026-01-05 19:48:46'),
(70, 35, 'assistant', 'Đã tạo bài viết thành công với ID là 101.', 1, 2, NULL, '2026-01-05 19:48:48'),
(71, 36, 'user', 'Lấy các bình luận của bài viết số 1', NULL, NULL, NULL, '2026-01-05 19:48:50'),
(72, 36, 'assistant', 'Đây là các bình luận của bài viết số 1:\n\n1. **id labore ex et quam laborum** (Email: Eliseo@gardner.biz)\n   laudantium enim quasi est quidem magnam voluptate ipsam eos\n   tempora quo necessitatibus\n   dolor quam autem quasi\n   reiciendis et nam sapiente accusantium\n\n2. **quo vero reiciendis velit similique earum** (Email: Jayne_Kuhic@sydney.com)\n   est natus enim nihil est dolore omnis voluptatem numquam\n   et omnis occaecati quod ullam at\n   voluptatem error expedita pariatur\n   nihil sint nostrum voluptatem reiciendis et\n\n3. **odio adipisci rerum aut animi** (Email: Nikita@garfield.biz)\n   quia molestiae reprehenderit quasi aspernatur\n   aut expedita occaecati aliquam eveniet laudantium\n   omnis quibusdam delectus saepe quia accusamus maiores nam est\n   cum et ducimus et vero voluptates excepturi deleniti ratione\n\n4. **alias odio sit** (Email: Lew@alysha.tv)\n   non et atque\n   occaecati deserunt quas accusantium unde odit nobis qui voluptatem\n   quia voluptas consequuntur itaque dolor\n   et qui rerum deleniti ut occaecati\n\n5. **vero eaque aliquid doloribus et culpa** (Email: Hayden@althea.biz)\n   harum non quasi et ratione\n   tempore iure ex voluptates in ratione\n   harum architecto fugit inventore cupiditate\n   voluptates magni quo et', 1, 2, NULL, '2026-01-05 19:48:55'),
(73, 37, 'user', 'Xin chào, bạn khỏe không?', NULL, NULL, NULL, '2026-01-05 19:48:57'),
(74, 37, 'assistant', 'Chào bạn, tôi khỏe, cảm ơn bạn. Còn bạn thì sao?', 1, 2, NULL, '2026-01-05 19:48:58'),
(75, 38, 'user', 'Lấy thông tin user có ID 999999', NULL, NULL, NULL, '2026-01-05 19:49:00'),
(76, 38, 'assistant', 'ID người dùng phải nằm trong khoảng từ 1 đến 10. Vui lòng cung cấp ID hợp lệ.', 1, 2, NULL, '2026-01-05 19:49:01'),
(77, 39, 'user', 'Cho tôi thông tin user 3 và bài viết số 10', NULL, NULL, NULL, '2026-01-05 19:49:03'),
(78, 39, 'assistant', 'User 3 có tên là Clementine Bauch, email là Nathan@yesenia.net, số điện thoại 1-463-123-4447, làm việc tại công ty Romaguera-Jacobson và sống tại thành phố McKenziehaven. Bài viết số 10 có tiêu đề \"optio molestias id quia eum\" và nội dung là \"quo et expedita modi cum officia vel magni\\ndoloribus qui repudiandae\\nvero nisi sit\\nquos veniam quod sed accusamus veritatis error\".', 1, 2, NULL, '2026-01-05 19:49:05'),
(79, 40, 'user', 'Lấy thông tin user 5', NULL, NULL, NULL, '2026-01-05 19:49:07'),
(80, 40, 'assistant', 'Tên: Chelsey Dietrich\nEmail: Lucio_Hettinger@annie.ca\nSố điện thoại: (254)954-1289\nCông ty: Keebler LLC\nThành phố: Roscoeview', 1, 2, NULL, '2026-01-05 19:49:10'),
(81, 40, 'user', 'User này làm việc ở công ty nào?', NULL, NULL, NULL, '2026-01-05 19:49:11'),
(82, 40, 'assistant', 'Chelsey Dietrich làm việc ở công ty Keebler LLC.', 1, 2, NULL, '2026-01-05 19:49:13'),
(83, 41, 'user', 'Cho tôi thông tin của user có ID là 1', NULL, NULL, NULL, '2026-01-05 19:49:35'),
(84, 41, 'assistant', 'Đây là thông tin của user có ID 1:\n\n*   **Tên:** Leanne Graham\n*   **Email:** Sincere@april.biz\n*   **Điện thoại:** 1-770-736-8031 x56442\n*   **Công ty:** Romaguera-Crona\n*   **Thành phố:** Gwenborough', 1, 2, NULL, '2026-01-05 19:49:37'),
(85, 42, 'user', 'Tôi muốn hỏi về chính sách đổi trả sản phẩm', NULL, NULL, NULL, '2026-01-05 20:37:02'),
(86, 42, 'assistant', 'Chính sách đổi trả sản phẩm là một phần rất quan trọng trong hoạt động kinh doanh của bất kỳ cửa hàng, doanh nghiệp hay nền tảng thương mại điện tử nào, giúp bảo vệ quyền lợi của cả người mua và người bán.\n\nĐể hiểu rõ về chính sách đổi trả, bạn cần xem xét các yếu tố sau:\n\n**I. Các Yếu Tố Chính Thường Có Trong Chính Sách Đổi Trả:**\n\n1.  **Thời gian đổi trả:**\n    *   Hầu hết các cửa hàng/doanh nghiệp đều quy định một khoảng thời gian nhất định kể từ ngày mua hàng/nhận hàng để khách hàng có thể đổi trả (ví dụ: 7 ngày, 14 ngày, 30 ngày).\n    *   Quá thời hạn này, yêu cầu đổi trả có thể sẽ bị từ chối.\n\n2.  **Điều kiện sản phẩm:**\n    *   **Nguyên vẹn:** Sản phẩm phải còn nguyên vẹn, không bị hư hỏng, trầy xước, dơ bẩn, chưa qua sử dụng.\n    *   **Đầy đủ phụ kiện:** Kèm theo đầy đủ phụ kiện, quà tặng, tài liệu hướng dẫn (nếu có).\n    *   **Tem mác, bao bì gốc:** Còn nguyên tem, mác, niêm phong của nhà sản xuất (nếu có) và hộp đựng, bao bì gốc của sản phẩm.\n    *   *Lưu ý:* Đối với sản phẩm bị lỗi từ nhà sản xuất, điều kiện về tình trạng \"chưa qua sử dụng\" có thể được nới lỏng hơn, nhưng vẫn cần đảm bảo các điều kiện khác.\n\n3.  **Chứng từ mua hàng:**\n    *   Khách hàng cần cung cấp đầy đủ chứng từ mua hàng như hóa đơn, biên lai, phiếu bảo hành, xác nhận đặt hàng online, hoặc các bằng chứng khác chứng minh việc mua hàng tại cửa hàng/doanh nghiệp đó.\n\n4.  **Lý do đổi trả:**\n    *   **Lỗi từ nhà sản xuất/người bán:** Sản phẩm bị lỗi kỹ thuật, không hoạt động đúng chức năng, sai màu sắc/kích thước so với mô tả, giao nhầm sản phẩm... (Đây là lý do phổ biến nhất và thường được chấp nhận rộng rãi).\n    *   **Sản phẩm không đúng mô tả:** Chất lượng không như cam kết, hình ảnh khác biệt quá nhiều so với thực tế.\n    *   **Thay đổi ý định mua hàng (Change of mind):** Một số cửa hàng có chính sách linh hoạt cho phép khách hàng trả lại sản phẩm nếu không còn nhu cầu, nhưng thường áp dụng các điều kiện nghiêm ngặt hơn (ví dụ: chỉ đổi lấy sản phẩm khác, không hoàn tiền, hoặc có phí xử lý).\n\n5.  **Chi phí vận chuyển:**\n    *   **Lỗi từ nhà bán hàng/sản xuất:** Thường thì bên bán sẽ chịu toàn bộ chi phí vận chuyển đổi trả.\n    *   **Lý do từ phía khách hàng (ví dụ: đổi ý, muốn đổi size/màu):** Khách hàng có thể sẽ phải chịu chi phí vận chuyển hai chiều.\n\n**II. Các Hình Thức Đổi Trả Thường Gặp:**\n\n1.  **Hoàn tiền:** Trả lại toàn bộ hoặc một phần số tiền đã thanh toán cho khách hàng (có thể bằng tiền mặt, chuyển khoản, hoặc hoàn trả vào thẻ).\n2.  **Đổi sản phẩm khác:** Khách hàng có thể đổi sang sản phẩm cùng loại (ví dụ: đổi size, đổi màu) hoặc đổi sang sản phẩm khác có giá trị tương đương hoặc cao hơn (khách hàng bù thêm tiền).\n3.  **Tín dụng cửa hàng (Store Credit):** Giá trị sản phẩm được ghi nhận dưới dạng điểm, voucher, hoặc tài khoản để khách hàng sử dụng mua hàng trong tương lai tại cửa hàng đó.\n\n**III. Các Trường Hợp Sản Phẩm Thường Bị Từ Chối Đổi Trả:**\n\n*   Sản phẩm đã quá thời hạn đổi trả quy định.\n*   Không có chứng từ mua hàng hợp lệ.\n*   Sản phẩm đã qua sử dụng, hư hỏng, mất mát, bể vỡ, trầy xước do lỗi của người dùng.\n*   Thiếu phụ kiện, tem mác, bao bì gốc.\n*   Sản phẩm thuộc danh mục không hỗ trợ đổi trả (ví dụ: hàng hóa đặc biệt, hàng thanh lý, đồ lót, đồ bơi, mỹ phẩm đã mở nắp, phần mềm, thẻ quà tặng, sản phẩm đã cá nhân hóa...).\n\n**IV. Làm Thế Nào Để Tìm Hiểu Chính Sách Đổi Trả Cụ Thể?**\n\n*   **Trên website:** Hầu hết các cửa hàng online đều có mục \"Chính sách đổi trả,\" \"Chính sách bảo hành,\" \"Điều khoản dịch vụ\" ở cuối trang (footer) hoặc trong phần Hỗ trợ/FAQ.\n*   **Hỏi nhân viên bán hàng:** Khi mua sắm tại cửa hàng vật lý, bạn có thể trực tiếp hỏi nhân viên tư vấn.\n*   **Trên hóa đơn/biên lai:** Một số chính sách cơ bản có thể được in trực tiếp trên hóa đơn hoặc biên lai mua hàng.\n*   **Đọc kỹ khi mua hàng online:** Luôn có mục \"Điều khoản & Điều kiện\" hoặc \"Chính sách mua hàng\" mà bạn cần đồng ý trước khi hoàn tất đơn hàng.\n\n**Lời Khuyên Quan Trọng Cho Người Mua Hàng:**\n\n*   **Luôn đọc kỹ chính sách đổi trả TRƯỚC KHI mua hàng,** đặc biệt là với các sản phẩm có giá trị cao hoặc các cửa hàng bạn mua lần đầu.\n*   **Giữ lại hóa đơn, biên lai, phiếu bảo hành và toàn bộ bao bì gốc, hộp đựng sản phẩm** ít nhất trong thời gian cho phép đổi trả.\n*   **Kiểm tra sản phẩm ngay khi nhận hàng** để phát hiện sớm các lỗi hoặc hư hỏng do vận chuyển/sản xuất.\n*   **Liên hệ với nhà cung cấp sớm nhất có thể** nếu bạn có nhu cầu đổi trả, tránh để quá thời hạn.\n\nHy vọng những thông tin này giúp bạn hiểu rõ hơn về chính sách đổi trả sản phẩm!', 2, 2, NULL, '2026-01-05 20:37:20'),
(87, 43, 'user', 'Tôi muốn hỏi về chính sách đổi trả sản phẩm', NULL, NULL, NULL, '2026-01-05 20:37:44'),
(88, 43, 'assistant', 'Chính sách đổi trả sản phẩm là một phần quan trọng giúp bảo vệ quyền lợi của người tiêu dùng và tạo dựng lòng tin với nhà cung cấp. Tuy nhiên, mỗi cửa hàng, nhà bán lẻ hoặc thương hiệu sẽ có chính sách riêng của mình.\n\nDưới đây là những điểm chung thường có trong một chính sách đổi trả sản phẩm mà bạn cần lưu ý:\n\n---\n\n### Các Yếu Tố Chính Trong Chính Sách Đổi Trả\n\n1.  **Thời gian đổi trả:**\n    *   **Phổ biến:** Thường từ **7 đến 30 ngày** kể từ ngày mua hàng hoặc ngày nhận hàng.\n    *   **Lưu ý:** Một số sản phẩm đặc biệt (ví dụ: hàng điện tử giá trị cao, hàng khuyến mãi, hàng thanh lý) có thể có thời gian đổi trả ngắn hơn hoặc không được áp dụng chính sách đổi trả.\n\n2.  **Tình trạng sản phẩm khi đổi trả:**\n    *   **Nguyên vẹn:** Sản phẩm phải còn nguyên vẹn, đầy đủ tem mác, niêm phong (nếu có), hộp, sách hướng dẫn, phụ kiện đi kèm như lúc ban đầu.\n    *   **Chưa qua sử dụng:** Sản phẩm chưa được sử dụng (trừ trường hợp lỗi do nhà sản xuất). Có thể chấp nhận mở hộp để kiểm tra nhưng sản phẩm bên trong phải mới hoàn toàn.\n    *   **Không hư hỏng:** Không bị trầy xước, móp méo, dính bẩn, hư hỏng do tác động bên ngoài (trừ trường hợp sản phẩm bị lỗi ngay khi nhận).\n\n3.  **Lý do đổi trả:**\n    *   **Lỗi do nhà sản xuất:** Sản phẩm bị lỗi kỹ thuật, hỏng hóc, không hoạt động đúng chức năng ngay từ khi nhận hàng. Đây là lý do phổ biến nhất và thường được chấp nhận dễ dàng nhất.\n    *   **Giao sai sản phẩm:** Khách hàng nhận được sản phẩm không đúng mẫu mã, màu sắc, kích thước hoặc số lượng đã đặt.\n    *   **Sản phẩm bị hỏng trong quá trình vận chuyển:** Khách hàng cần kiểm tra ngay khi nhận hàng và báo cáo tình trạng này cho người giao hàng và cửa hàng ngay lập tức.\n    *   **Khách hàng thay đổi ý định/Không ưng ý:** Một số cửa hàng chấp nhận đổi trả nếu khách hàng không ưng ý, nhưng thường áp dụng các điều kiện nghiêm ngặt hơn (ví dụ: chỉ đổi sản phẩm khác, không hoàn tiền, hoặc có thể bị tính phí tái nhập kho).\n\n4.  **Hình thức hoàn trả:**\n    *   **Hoàn tiền:** Tiền mặt, chuyển khoản ngân hàng, hoàn vào thẻ tín dụng/ghi nợ.\n    *   **Đổi sản phẩm khác:** Khách hàng có thể đổi sang sản phẩm cùng loại, hoặc sản phẩm khác và bù trừ phần chênh lệch (nếu có).\n    *   **Phiếu mua hàng (Store Credit):** Cửa hàng cấp một phiếu mua hàng có giá trị tương đương để sử dụng cho các lần mua sau.\n\n5.  **Chứng từ mua hàng:**\n    *   Bắt buộc phải có hóa đơn, biên nhận, phiếu bảo hành, hoặc bất kỳ bằng chứng mua hàng nào khác để xác minh giao dịch.\n\n6.  **Chi phí vận chuyển khi đổi trả:**\n    *   **Lỗi do nhà sản xuất/cửa hàng:** Cửa hàng/nhà bán lẻ thường sẽ chịu toàn bộ chi phí vận chuyển phát sinh khi đổi trả.\n    *   **Lỗi do khách hàng (ví dụ: thay đổi ý định):** Khách hàng thường sẽ phải chịu chi phí vận chuyển hai chiều hoặc theo thỏa thuận của cửa hàng.\n\n7.  **Quy trình đổi trả:**\n    *   **Liên hệ:** Khách hàng cần liên hệ với bộ phận chăm sóc khách hàng của cửa hàng/nhà bán lẻ để thông báo về yêu cầu đổi trả.\n    *   **Cung cấp thông tin:** Chuẩn bị các thông tin cần thiết như mã đơn hàng, thông tin sản phẩm, lý do đổi trả và bằng chứng mua hàng.\n    *   **Gửi sản phẩm:** Gửi sản phẩm về địa chỉ được chỉ định theo hướng dẫn.\n    *   **Kiểm tra:** Cửa hàng sẽ kiểm tra tình trạng sản phẩm và các điều kiện đổi trả.\n    *   **Xử lý:** Sau khi kiểm tra, yêu cầu đổi trả sẽ được xử lý theo chính sách đã định.\n\n---\n\n### Các Trường Hợp Đặc Biệt Không Được Áp Dụng Đổi Trả (Thường Gặp)\n\n*   Sản phẩm thuộc danh mục hàng khuyến mãi, hàng thanh lý, hàng tặng kèm.\n*   Sản phẩm đặc thù như đồ lót, đồ bơi, mỹ phẩm, thực phẩm, phần mềm, hoặc các sản phẩm có tính chất cá nhân, vệ sinh.\n*   Sản phẩm đã qua sử dụng, hư hỏng do lỗi của người dùng.\n*   Sản phẩm không còn đầy đủ phụ kiện, hộp, tem mác như ban đầu.\n*   Hết thời hạn đổi trả theo quy định.\n\n---\n\n**Để có thông tin chính xác nhất và chi tiết nhất về chính sách đổi trả sản phẩm, bạn VUI LÒNG KIỂM TRA CHÍNH SÁCH ĐỔI TRẢ CỦA CỬA HÀNG/WEBSITE BÁN HÀNG CỤ THỂ mà bạn đã mua hoặc đang có ý định mua sản phẩm đó.** Thông tin này thường được đăng tải rõ ràng trên website, tại cửa hàng hoặc bạn có thể hỏi trực tiếp nhân viên bán hàng.', 2, 2, NULL, '2026-01-05 20:38:00'),
(89, 44, 'user', 'Tôi muốn hỏi về chính sách đổi trả sản phẩm', NULL, NULL, NULL, '2026-01-05 20:39:16'),
(90, 44, 'assistant', 'Chào bạn, chính sách đổi trả sản phẩm là một phần rất quan trọng khi mua sắm, giúp bảo vệ quyền lợi của người tiêu dùng. Tuy nhiên, **mỗi cửa hàng, công ty hoặc nhà bán lẻ sẽ có chính sách đổi trả riêng của họ**, nên điều quan trọng nhất là bạn cần tìm hiểu chính sách cụ thể của nơi bạn đã mua hoặc dự định mua hàng.\n\nDưới đây là các yếu tố chính thường có trong một chính sách đổi trả sản phẩm mà bạn cần lưu ý:\n\n### Các Yếu Tố Chính Thường Có Trong Chính Sách Đổi Trả\n\n1.  **Thời gian đổi trả (Return Window):**\n    *   Đây là khoảng thời gian tối đa kể từ ngày mua hàng mà bạn có thể yêu cầu đổi trả.\n    *   Thời gian này thường dao động từ **7 ngày, 14 ngày, đến 30 ngày**, hoặc thậm chí lâu hơn tùy vào loại sản phẩm và chính sách của nhà bán lẻ.\n\n2.  **Điều kiện sản phẩm (Product Condition):**\n    *   **Sản phẩm phải còn nguyên vẹn:** Chưa qua sử dụng, không bị hỏng hóc, trầy xước, dơ bẩn.\n    *   **Đầy đủ phụ kiện:** Phải còn đầy đủ hộp, sách hướng dẫn, tem mác, thẻ bảo hành (nếu có) và các phụ kiện đi kèm như lúc ban đầu.\n    *   **Nguyên tem, mác:** Các tem niêm phong, tem chống hàng giả, tem bảo hành phải còn nguyên vẹn, chưa bị bóc gỡ.\n    *   *Lưu ý:* Trừ trường hợp sản phẩm bị lỗi do nhà sản xuất hoặc do quá trình vận chuyển.\n\n3.  **Giấy tờ chứng minh mua hàng (Proof of Purchase):**\n    *   Bạn thường được yêu cầu cung cấp hóa đơn mua hàng, phiếu mua hàng, biên lai, xác nhận đặt hàng trực tuyến, hoặc bất kỳ tài liệu nào chứng minh bạn đã mua sản phẩm tại cửa hàng đó.\n\n4.  **Lý do đổi trả (Reason for Return):**\n    *   **Lỗi từ nhà sản xuất:** Sản phẩm bị lỗi kỹ thuật, không hoạt động đúng chức năng.\n    *   **Giao sai sản phẩm:** Khác với mô tả, khác màu, khác kích thước hoặc sai mẫu mã.\n    *   **Sản phẩm bị hỏng hóc trong quá trình vận chuyển.**\n    *   **Đổi ý (Change of Mind):** Một số cửa hàng cho phép đổi trả nếu bạn đơn giản là không thích sản phẩm nữa, nhưng điều này không phải lúc nào cũng có sẵn và thường có điều kiện nghiêm ngặt hơn (ví dụ: mất phí tái nhập kho).\n\n5.  **Các sản phẩm không áp dụng đổi trả (Exclusions):**\n    *   Một số mặt hàng đặc biệt thường không được đổi trả:\n        *   Sản phẩm giảm giá, khuyến mãi đặc biệt (Final Sale).\n        *   Sản phẩm được làm theo yêu cầu riêng của khách hàng.\n        *   Hàng hóa dễ hỏng (thực phẩm tươi sống).\n        *   Các mặt hàng liên quan đến vệ sinh cá nhân (đồ lót, mỹ phẩm đã mở).\n        *   Phần mềm, game, thẻ quà tặng, sản phẩm kỹ thuật số đã kích hoạt.\n        *   Sản phẩm điện tử đã kích hoạt bảo hành.\n\n### Các Hình Thức Đổi Trả Phổ Biến\n\n*   **Hoàn tiền (Refund):** Tiền sẽ được trả lại cho bạn qua phương thức ban đầu (tiền mặt, chuyển khoản ngân hàng, hoàn vào thẻ tín dụng) hoặc dưới dạng phiếu mua hàng/tín dụng cửa hàng.\n*   **Đổi sản phẩm khác (Exchange):** Bạn có thể đổi sang một sản phẩm cùng loại (khác kích thước, màu sắc) hoặc một sản phẩm khác có giá trị tương đương (có thể phải bù trừ nếu có chênh lệch).\n*   **Phiếu mua hàng / Tín dụng cửa hàng (Store Credit):** Bạn sẽ nhận được một phiếu có giá trị tương đương số tiền đã thanh toán để mua sắm các sản phẩm khác tại cửa hàng đó trong tương lai.\n\n### Quy Trình Thực Hiện Đổi Trả Thường Gặp\n\n1.  **Liên hệ bộ phận chăm sóc khách hàng:** Thông báo về việc bạn muốn đổi trả sản phẩm và cung cấp thông tin cần thiết.\n2.  **Điền mẫu yêu cầu đổi trả:** Nếu có.\n3.  **Gửi trả sản phẩm:** Mang sản phẩm đến cửa hàng trực tiếp hoặc gửi qua đường bưu điện/dịch vụ chuyển phát.\n4.  **Chờ xác nhận và xử lý:** Cửa hàng sẽ kiểm tra sản phẩm và xử lý yêu cầu của bạn theo chính sách.\n\n### Những Điều Bạn Nên Làm\n\n*   **Đọc kỹ chính sách đổi trả** của nhà bán lẻ TRƯỚC KHI mua hàng, đặc biệt là với những mặt hàng giá trị cao hoặc có tính chất đặc biệt.\n*   **Giữ gìn cẩn thận hóa đơn, hộp đựng, và tất cả phụ kiện** của sản phẩm.\n*   **Kiểm tra sản phẩm ngay sau khi nhận được** để phát hiện lỗi kịp thời.\n*   Khi có vấn đề, hãy **liên hệ ngay với bộ phận chăm sóc khách hàng** của nhà bán lẻ để được hướng dẫn cụ thể.\n\nNếu bạn đang muốn hỏi về chính sách đổi trả của một cửa hàng cụ thể, hãy cho mình biết tên cửa hàng đó nhé!', 2, 2, NULL, '2026-01-05 20:39:31'),
(91, 45, 'user', 'Chào', NULL, NULL, NULL, '2026-01-05 21:13:10'),
(92, 45, 'assistant', 'Chào bạn! Tôi có thể giúp gì cho bạn?', 2, 2, NULL, '2026-01-05 21:13:16'),
(93, 46, 'user', 'hi', NULL, NULL, NULL, '2026-01-05 21:23:32'),
(94, 47, 'user', 'Chào', NULL, NULL, NULL, '2026-01-05 21:34:52'),
(95, 48, 'user', 'Chào', NULL, NULL, NULL, '2026-01-05 21:35:02'),
(96, 48, 'assistant', 'Chào bạn! Mình có thể giúp gì cho bạn?', 2, 2, NULL, '2026-01-05 21:35:04'),
(97, 49, 'user', 'Bạn có tool gì', NULL, NULL, NULL, '2026-01-05 21:35:09'),
(98, 49, 'assistant', 'Chào bạn,\n\nVới vai trò là một Trí tuệ nhân tạo, tôi không có \"công cụ\" vật lý như con người (ví dụ: búa, kìm, máy tính cầm tay, v.v.).\n\n\"Công cụ\" của tôi thực chất là những khả năng và tài nguyên số được xây dựng bên trong mô hình của tôi, bao gồm:\n\n1.  **Mô hình ngôn ngữ lớn (Large Language Model - LLM):** Đây là \"bộ não\" chính của tôi, một kiến trúc mạng nơ-ron phức tạp được huấn luyện trên một lượng lớn dữ liệu văn bản và mã. Nó cho phép tôi:\n    *   Hiểu và phân tích ngôn ngữ tự nhiên.\n    *   Tạo ra văn bản mạch lạc, có liên quan và sáng tạo.\n    *   Nhận diện các mẫu, logic và ý nghĩa trong ngôn ngữ.\n\n2.  **Dữ liệu huấn luyện khổng lồ:** Tôi được huấn luyện trên một kho tàng thông tin khổng lồ từ internet và nhiều nguồn khác. Đây là \"nguồn kiến thức\" của tôi, cho phép tôi:\n    *   Trả lời câu hỏi về vô số chủ đề.\n    *   Cung cấp thông tin và giải thích các khái niệm.\n    *   Có kiến thức về ngữ pháp, từ vựng, phong cách viết của nhiều ngôn ngữ.\n\n3.  **Các thuật toán và logic xử lý:** Đây là \"công cụ tư duy\" giúp tôi:\n    *   Phân tích yêu cầu của bạn để xác định ý định.\n    *   Tìm kiếm và tổng hợp thông tin liên quan từ kiến thức của tôi.\n    *   Xây dựng câu trả lời một cách có cấu trúc và logic.\n    *   Thực hiện các tác vụ như tóm tắt, dịch thuật, lập trình, sáng tạo nội dung.\n\n4.  **Khả năng được tích hợp với công cụ bên ngoài (tùy thuộc vào nền tảng):** Trong một số môi trường triển khai, tôi có thể được kết nối với các công cụ bên ngoài để mở rộng khả năng của mình, ví dụ:\n    *   **Tìm kiếm web thời gian thực:** Để truy cập thông tin mới nhất mà kiến thức huấn luyện của tôi có thể chưa có.\n    *   **Công cụ tính toán (Calculator):** Để thực hiện các phép toán phức tạp.\n    *   **Trình thông dịch mã (Code Interpreter):** Để chạy và kiểm tra mã lập trình.\n\nTóm lại, \"công cụ\" của tôi là những khả năng xử lý thông tin, kiến thức và logic được tích hợp trong phần mềm của tôi để giúp bạn với các tác vụ ngôn ngữ và thông tin.', 2, 2, NULL, '2026-01-05 21:35:21'),
(99, 50, 'user', 'Xin chào! Bạn là AI nào? Trả lời 1 câu.', NULL, NULL, NULL, '2026-01-11 15:01:21'),
(100, 50, 'assistant', 'Tôi là một mô hình ngôn ngữ lớn, được đào tạo bởi Google.', NULL, 2, NULL, '2026-01-11 15:01:24'),
(101, 51, 'user', 'Đếm từ 1 đến 5', NULL, NULL, NULL, '2026-01-11 15:01:24'),
(102, 51, 'assistant', '1\n2\n3\n4\n5', NULL, 2, NULL, '2026-01-11 15:01:24'),
(103, 52, 'user', 'Xin chào! Bạn là AI nào? Trả lời ngắn gọn.', NULL, NULL, NULL, '2026-01-11 15:12:59'),
(104, 52, 'assistant', 'Tôi là một mô hình ngôn ngữ lớn, được đào tạo bởi Google.', NULL, 2, NULL, '2026-01-11 15:13:01'),
(105, 53, 'user', 'Kể một câu chuyện ngắn 2 câu', NULL, NULL, NULL, '2026-01-11 15:13:01'),
(106, 53, 'assistant', 'Dưới ánh trăng mờ ảo, hai bóng người xa lạ vô tình va vào nhau, đánh rơi những bí mật được chôn giấu trong tim. Một ánh mắt gặp gỡ, một nụ cười hé nở, và thế giới của họ bắt đầu xoay chuyển theo một nhịp điệu mới.', NULL, 2, NULL, '2026-01-11 15:13:02'),
(107, 54, 'user', 'Xin chào!', NULL, NULL, NULL, '2026-01-11 15:13:02'),
(108, 55, 'user', 'Xin chào! Bạn là AI nào? Trả lời ngắn gọn.', NULL, NULL, NULL, '2026-01-11 15:13:52'),
(109, 56, 'user', 'Kể một câu chuyện ngắn 2 câu', NULL, NULL, NULL, '2026-01-11 15:13:55'),
(110, 57, 'user', 'Xin chào!', NULL, NULL, NULL, '2026-01-11 15:13:58'),
(111, 58, 'user', 'Chào', NULL, NULL, NULL, '2026-01-11 15:54:37'),
(112, 58, 'assistant', 'Chào bạn! 👋\n\nCó gì tôi có thể giúp bạn hôm nay không? 😊', NULL, 2, NULL, '2026-01-11 15:54:38'),
(113, 59, 'user', 'Chào', NULL, NULL, NULL, '2026-01-11 15:54:46'),
(114, 59, 'assistant', 'Chào bạn! Tôi là MiMo, trợ lý AI được phát triển bởi Xiaomi. Rất vui được gặp bạn! 😊\n\nBạn có cần tôi giúp gì không? Tôi có thể hỗ trợ bạn trong nhiều lĩnh vực như:\n\n- **Trợ giúp kỹ thuật**: Hỏi đáp về smartphone, laptop,智能家居 (thiết bị nhà thông minh) Xiaomi\n- **Tư vấn sản phẩm**: Giúp bạn chọn lựa thiết bị phù hợp\n- **Hướng dẫn sử dụng**: Cách cài đặt, sử dụng các tính năng\n- **Giải trí**: Trò chuyện, kể chuyện, giải trí\n- **Học tập & Công việc**: Hỗ trợ viết lách, tính toán, phân tích...\n\nBạn đang quan tâm đến điều gì? Hãy cho tôi biết nhé!', NULL, 2, NULL, '2026-01-11 15:54:50'),
(115, 60, 'user', 'TEst', NULL, NULL, NULL, '2026-01-11 17:32:46'),
(116, 60, 'assistant', 'Hello! How can I help you today?', NULL, 2, NULL, '2026-01-11 17:32:47'),
(117, 61, 'user', 'full makrdown', NULL, NULL, NULL, '2026-01-11 17:32:59'),
(118, 61, 'assistant', 'Okay, you\'ve asked for \"full markdown.\" This is a broad request, so I\'ll interpret it as wanting a comprehensive overview and demonstration of Markdown\'s capabilities.\n\nHere\'s a breakdown of common Markdown elements, followed by examples.\n\n---\n\n# Markdown: A Comprehensive Guide and Examples\n\nMarkdown is a lightweight markup language with plain-text formatting syntax. Its goal is to be easy-to-read and easy-to-write. It\'s widely used for README files, documentation, and in many online forums and chat platforms.\n\n---\n\n## I. Headings\n\nHeadings are created using the hash symbol (`#`). The number of hashes indicates the heading level.\n\n```markdown\n# Heading Level 1\n## Heading Level 2\n### Heading Level 3\n#### Heading Level 4\n##### Heading Level 5\n###### Heading Level 6\n```\n\n---\n\n## II. Paragraphs and Line Breaks\n\nParagraphs are separated by one or more blank lines. To force a line break within a paragraph, end a line with two or more spaces.\n\n```markdown\nThis is the first paragraph.\n\nThis is the second paragraph.\n\nThis is a line with\na forced line break.\n```\n\n---\n\n## III. Emphasis (Formatting Text)\n\nYou can emphasize text using asterisks (`*`) or underscores (`_`).\n\n*   **Bold:** `**bold text**` or `__bold text__`\n*   *   *Italic:* `*italic text*` or `_italic text_`\n*   ***Bold and Italic:*** `***bold and italic text***` or `___bold and italic text___`\n*   ~~Strikethrough:~~ `~~strikethrough text~~`\n\n---\n\n## IV. Lists\n\nMarkdown supports both unordered (bulleted) and ordered (numbered) lists.\n\n### Unordered Lists\n\nUse asterisks (`*`), hyphens (`-`), or plus signs (`+`) for unordered lists. You can also nest them.\n\n```markdown\n* Item 1\n* Item 2\n  * Sub-item 2.1\n  * Sub-item 2.2\n- Item 3\n+ Item 4\n```\n\n### Ordered Lists\n\nUse numbers followed by a period. The numbering doesn\'t have to be sequential, Markdown will render it correctly.\n\n```markdown\n1. First item\n2. Second item\n3. Third item\n   1. Sub-item 3.1\n   2. Sub-item 3.2\n```\n\n---\n\n## V. Links\n\nLinks can be inline or reference-style.\n\n### Inline Links\n\n```markdown\n[This is an inline link](https://www.example.com)\n[Link with title](https://www.example.com \"This is a title\")\n```\n\n### Reference-Style Links\n\nReference-style links are useful for cleaner text and for reusing links.\n\n```markdown\nI get my information from [Google][1].\nYou can also find me on [Twitter][twitter].\n\n[1]: https://www.google.com\n[twitter]: https://www.twitter.com \"Twitter Profile\"\n```\n\n---\n\n## VI. Images\n\nImages are similar to links but start with an exclamation mark (`!`).\n\n### Inline Images\n\n```markdown\n![Alt text for the image](https://www.example.com/image.jpg)\n![Image with title](https://www.example.com/image.png \"An example image\")\n```\n\n### Reference-Style Images\n\n```markdown\n![Alt text for the image][logo]\n\n[logo]: https://www.example.com/logo.png \"Company Logo\"\n```\n\n---\n\n## VII. Code\n\nMarkdown supports inline code and code blocks.\n\n### Inline Code\n\nUse single backticks (` `) for inline code.\n\n```markdown\nThis is `inline code`.\n```\n\n### Code Blocks\n\nUse triple backticks (``` ```) for code blocks. You can also specify the language for syntax highlighting.\n\n```markdown\n```python\ndef greet(name):\n    print(f\"Hello, {name}!\")\n```\n\n```javascript\nconsole.log(\"This is a JavaScript code block.\");\n```\n\n```\nThis is a plain code block without syntax highlighting.\n```\n```\n\n---\n\n## VIII. Blockquotes\n\nUse the greater-than symbol (`>`) to create blockquotes.\n\n```markdown\n> This is a blockquote.\n> It can span multiple lines.\n>\n> > This is a nested blockquote.\n```\n\n---\n\n## IX. Horizontal Rules (Thematic Breaks)\n\nHorizontal rules can be created using three or more hyphens (`-`), asterisks (`*`), or underscores (`_`) on a line by themselves.\n\n```markdown\n---\n***\n___\n```\n\n---\n\n## X. Tables\n\nTables are created using pipes (`|`) and hyphens (`-`). Alignment can be controlled with colons (`:`).\n\n```markdown\n| Header 1 | Header 2 | Header 3 |\n| :------- | :------: | -------: |\n| Left     | Center   | Right    |\n| Cell 1   | Cell 2   | Cell 3   |\n| Another  | Row      | Example  |\n```\n\n---\n\n## XI. Task Lists\n\nTask lists are a common extension, often used in GitHub Flavored Markdown.\n\n```markdown\n- [x] This task is complete.\n- [ ] This task is not complete.\n- [ ] Another pending task.\n```\n\n---\n\n## XII. Escaping Characters\n\nTo display characters that would otherwise be interpreted as Markdown syntax, you can escape them with a backslash (`\\`).\n\n```markdown\nThis is a literal \\*asterisk\\*.\nThis is a literal \\`backtick\\`.\nThis is a literal \\> greater-than sign.\n```\n\n---\n\n## XIII. HTML\n\nMarkdown allows you to embed raw HTML.\n\n```html\n<p>This is a paragraph created with HTML.</p>\n<a href=\"https://www.example.com\">This is an HTML link.</a>\n```\n\n---\n\n## XIV. Footnotes (Less Common, but Supported in some flavors)\n\n```markdown\nHere is some text with a footnote[^1].\n\n[^1]: This is the footnote content.\n```\n\n---\n\n## XV. Extended Markdown Features (Commonly found in GitHub Flavored Markdown - GFM)\n\n*   **Strikethrough:** ~~`~~strikethrough text~~`~~\n*   **Task Lists:** `- [ ] To do`\n*   **Tables:** (See Section X)\n*   **Fenced Code Blocks with Syntax Highlighting:** (See Section VII)\n*   **Emojis:** `:smile:` (often rendered as a smiley face)\n\n---\n\n## Conclusion\n\nMarkdown is a powerful yet simple tool for formatting text. Its readability and ease of use have made it a de facto standard for many applications. This guide covers the most common elements, and mastering them will significantly enhance your ability to communicate effectively in plain text.\n\n---\n\nThis is a comprehensive Markdown example. If you have any specific elements you\'d like to see demonstrated or explained further, feel free to ask!', NULL, 2, NULL, '2026-01-11 17:33:07'),
(119, 62, 'user', 'Chaiof', NULL, NULL, NULL, '2026-01-11 18:11:03'),
(120, 62, 'assistant', '\"Chaiof\" does not appear to be a recognized word or name in common English or Italian.\n\nCould you provide more context or clarify what you mean by \"Chaiof\"? For example:\n\n*   **Is it a misspelling?** Perhaps you intended to type something else.\n*   **Is it a name?** It might be a less common surname or a given name.\n*   **Is it from a specific context?** Is it from a book, a game, a movie, or a particular region?\n*   **Is it a made-up word?**\n\nThe more information you can give me, the better I can understand and respond to your request.', NULL, NULL, NULL, '2026-01-11 18:11:04'),
(121, 63, 'user', 'Tui vừa nói gì?', NULL, NULL, NULL, '2026-01-11 18:11:10'),
(122, 63, 'assistant', 'Bạn vừa hỏi: \"Tui vừa nói gì?\"', NULL, NULL, NULL, '2026-01-11 18:11:11'),
(123, 64, 'user', 'Chào', NULL, NULL, NULL, '2026-01-11 18:18:55'),
(124, 64, 'assistant', 'Chào bạn! Tôi có thể giúp gì cho bạn?', NULL, NULL, NULL, '2026-01-11 18:18:56'),
(125, 64, 'user', 'Tui vừa nói gì?', NULL, NULL, NULL, '2026-01-11 18:18:59'),
(126, 64, 'assistant', 'Bạn vừa nói: \"Tui vừa nói gì?\".', NULL, NULL, NULL, '2026-01-11 18:19:00'),
(127, 65, 'user', 'Chào', NULL, NULL, NULL, '2026-01-11 18:19:55'),
(128, 65, 'assistant', 'Chào bạn! Tôi có thể giúp gì cho bạn hôm nay?', NULL, NULL, NULL, '2026-01-11 18:19:56'),
(129, 65, 'user', 'Tui vừa nói gì', NULL, NULL, NULL, '2026-01-11 18:20:00'),
(130, 65, 'assistant', 'Bạn vừa nói \"Chào\".', NULL, NULL, NULL, '2026-01-11 18:20:01'),
(131, 66, 'user', 'Bạn có thể sài tool gì?', NULL, NULL, NULL, '2026-01-11 18:20:42'),
(132, 66, 'assistant', 'Tôi có thể sử dụng các công cụ sau:\n\n*   **create_post**: Tạo bài viết mới.\n*   **get_comments**: Lấy danh sách bình luận của một bài viết.\n*   **get_post**: Lấy bài viết theo ID.\n*   **get_user**: Lấy thông tin người dùng theo ID.\n*   **get_user_posts**: Lấy danh sách bài viết của một người dùng.\n*   **search_knowledge**: Tìm kiếm thông tin trong cơ sở kiến thức.', NULL, NULL, NULL, '2026-01-11 18:20:43'),
(133, 67, 'user', 'Bạn có thể sài tool gì?', NULL, NULL, NULL, '2026-01-11 18:20:59'),
(134, 67, 'assistant', 'Tôi không \"sài\" công cụ theo cách mà con người làm (như mở một phần mềm, click chuột, v.v.). Tôi là một mô hình ngôn ngữ AI, và \"công cụ\" chính của tôi là khả năng xử lý và tạo ra ngôn ngữ.\n\nTuy nhiên, tôi có thể được **tích hợp và kết nối** với các hệ thống hoặc công cụ khác để mở rộng khả năng của mình. Khi đó, tôi sẽ hoạt động như một **giao diện thông minh** để tương tác với các công cụ đó.\n\nDưới đây là những \"công cụ\" hoặc khả năng mà tôi có thể sử dụng (hoặc được tích hợp để sử dụng):\n\n1.  **Khả năng xử lý ngôn ngữ tự nhiên (NLP):** Đây là \"công cụ\" cốt lõi của tôi. Tôi dùng nó để:\n    *   Hiểu câu hỏi và yêu cầu của bạn.\n    *   Tạo ra văn bản (câu trả lời, bài viết, mã code, thơ, truyện...).\n    *   Dịch ngôn ngữ.\n    *   Tóm tắt văn bản dài.\n    *   Phân tích và trích xuất thông tin.\n    *   Viết lại hoặc cải thiện văn bản.\n\n2.  **Công cụ tìm kiếm web (Web Search):** Nếu nền tảng mà tôi đang hoạt động có tích hợp tính năng tìm kiếm web (ví dụ: Google Search cho Gemini, Bing Search cho ChatGPT Plus), tôi có thể:\n    *   Truy cập thông tin cập nhật từ internet.\n    *   Xác minh sự thật.\n    *   Tìm kiếm dữ liệu cụ thể.\n\n3.  **Công cụ tính toán và logic (Calculation & Logic Engines):**\n    *   Thực hiện các phép tính toán học phức tạp.\n    *   Giải quyết các bài toán logic.\n    *   Phân tích dữ liệu số (nếu được cung cấp).\n\n4.  **Công cụ tạo hình ảnh (Image Generation Tools):** Một số phiên bản hoặc nền tảng của tôi có thể được kết nối với các mô hình AI tạo hình ảnh (ví dụ: DALL-E, Midjourney). Khi đó, tôi có thể:\n    *   Tạo ra hình ảnh dựa trên mô tả văn bản của bạn.\n\n5.  **Công cụ phân tích dữ liệu (Data Analysis Tools):** Nếu được cung cấp dữ liệu cấu trúc (ví dụ: bảng, biểu đồ) và được tích hợp với các công cụ phân tích, tôi có thể:\n    *   Phân tích xu hướng.\n    *   Tạo báo cáo.\n    *   Diễn giải dữ liệu.\n\n6.  **Công cụ lập trình và gỡ lỗi (Coding & Debugging Tools):** Mặc dù tôi không \"chạy\" code, tôi có thể:\n    *   Viết mã code bằng nhiều ngôn ngữ lập trình.\n    *   Tìm lỗi trong mã code.\n    *   Giải thích các đoạn mã.\n    *   Chuyển đổi code giữa các ngôn ngữ.\n\n7.  **Các API (Application Programming Interfaces) khác:** Tôi có thể được lập trình để giao tiếp với vô số API khác nhau để thực hiện các tác vụ cụ thể, ví dụ:\n    *   Kiểm tra thời tiết.\n    *   Đặt lịch hẹn.\n    *   Truy vấn cơ sở dữ liệu.\n    *   Gửi email/tin nhắn.\n\nTóm lại, \"công cụ\" chính của tôi là trí thông minh ngôn ngữ và khả năng suy luận. Tôi có thể \"sử dụng\" các công cụ khác thông qua việc được tích hợp và giao tiếp với chúng, hoạt động như một bộ não điều khiển hoặc một giao diện thông minh.', NULL, NULL, NULL, '2026-01-11 18:21:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chat_sessions`
--

CREATE TABLE `chat_sessions` (
  `id` int(11) NOT NULL,
  `session_key` varchar(100) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `chat_sessions`
--

INSERT INTO `chat_sessions` (`id`, `session_key`, `title`, `created_at`, `updated_at`) VALUES
(1, 'bff105e9-6f8f-47a0-935c-c83697825f40', 'What is 2+2?', '2026-01-05 19:33:50', '2026-01-05 19:33:50'),
(2, '10c0c4b7-cb9d-4bb1-b708-c21623cd6ae8', 'Hello, what is your name?', '2026-01-05 19:33:52', '2026-01-05 19:33:52'),
(3, 'd0554de8-322f-4078-8cc4-84bd5dfa47de', 'My name is Charlie', '2026-01-05 19:33:54', '2026-01-05 19:33:54'),
(4, '161e70c5-2752-4d72-a498-7313b2bde867', 'Count 1 to 3', '2026-01-05 19:33:56', '2026-01-05 19:33:56'),
(5, 'b7d45bb9-c777-45b6-b9e4-aab756902a14', 'What is 2+2?', '2026-01-05 19:33:59', '2026-01-05 19:33:59'),
(6, '291a2853-a772-4129-8462-65e1cdd1b993', 'What is 2+2?', '2026-01-05 19:37:48', '2026-01-05 19:37:48'),
(7, '069a49bd-8c08-4744-8596-e0389e8e84d1', 'Hello, what is your name?', '2026-01-05 19:37:54', '2026-01-05 19:37:54'),
(8, 'fea954b6-5282-4474-8574-4d101e645b6e', 'My name is Charlie', '2026-01-05 19:37:59', '2026-01-05 19:37:59'),
(9, 'f53cda12-7e94-40fe-8367-5894f5af36d3', 'What is 2+2?', '2026-01-05 19:40:46', '2026-01-05 19:40:46'),
(10, '3434f4d8-334e-4b26-9c67-03ad0f5b4c10', 'Hello, what is your name?', '2026-01-05 19:40:50', '2026-01-05 19:40:50'),
(11, '4e52aa00-be4a-43c1-9fc9-6eeb9191bfd8', 'What is 2+2?', '2026-01-05 19:41:47', '2026-01-05 19:41:47'),
(12, '0c8d79ed-6756-4f39-a76c-8a912e931bcd', 'Hello, what is your name?', '2026-01-05 19:41:50', '2026-01-05 19:41:50'),
(13, '84f2b044-0dd2-46e4-b98d-fc4af9a7bcaf', 'My name is Charlie', '2026-01-05 19:41:53', '2026-01-05 19:41:53'),
(14, '55b39bd0-ec22-45d0-a780-42d5710a60bd', 'Count 1 to 3', '2026-01-05 19:41:58', '2026-01-05 19:41:58'),
(15, '0414d2da-3e21-485e-b865-9816e51522be', 'What is 2+2?', '2026-01-05 19:42:02', '2026-01-05 19:42:02'),
(16, '8fd7beb3-4db5-424f-a13b-34e7acba575e', 'Hello, what is your name?', '2026-01-05 19:42:05', '2026-01-05 19:42:05'),
(17, '6dcbad87-edba-4ded-816b-57befe5ce999', 'My name is Charlie', '2026-01-05 19:42:09', '2026-01-05 19:42:09'),
(18, 'e6854c7e-fadd-40c3-8c97-e97cbdaeb020', 'What is 2+2?', '2026-01-05 19:44:44', '2026-01-05 19:44:44'),
(19, 'f08a66b7-b20b-42b3-a1d0-b034c314ed9d', 'Hello, what is your name?', '2026-01-05 19:44:48', '2026-01-05 19:44:48'),
(20, '3e9cc9e5-5858-4661-8922-673da7d1b220', 'My name is Charlie', '2026-01-05 19:44:51', '2026-01-05 19:44:51'),
(21, '0c970e7d-adf9-4427-adc9-e9e7c586b2ef', 'Count 1 to 3', '2026-01-05 19:44:56', '2026-01-05 19:44:56'),
(22, '536245c6-2282-4060-8641-63a333aeebdd', 'What is 2+2?', '2026-01-05 19:45:00', '2026-01-05 19:45:00'),
(23, '61a667ce-7030-4ffe-bb37-6a6f0d7b13dd', 'Cho tôi thông tin của user có ID là 1', '2026-01-05 19:47:05', '2026-01-05 19:47:05'),
(24, 'aac1928a-c8ca-4432-819b-3a7a4785042b', 'Lấy nội dung bài viết số 5', '2026-01-05 19:47:10', '2026-01-05 19:47:10'),
(25, '59f696f6-b944-49ac-a259-822da717a99e', 'Liệt kê các bài viết của user ID 2', '2026-01-05 19:47:14', '2026-01-05 19:47:14'),
(26, '7e4b261b-6eea-43d7-956c-970461d4abf9', 'Tạo bài viết mới với tiêu đề \"Hello World\" và nội ', '2026-01-05 19:47:19', '2026-01-05 19:47:19'),
(27, '3b19a6cf-a31b-4e98-8017-5c05a4f2093a', 'Lấy các bình luận của bài viết số 1', '2026-01-05 19:47:22', '2026-01-05 19:47:22'),
(28, '54e53ad1-ed70-48fb-83b2-31219c363553', 'Xin chào, bạn khỏe không?', '2026-01-05 19:47:27', '2026-01-05 19:47:27'),
(29, 'f39db800-b4cc-42c1-a907-36b0a38350c9', 'Lấy thông tin user có ID 999999', '2026-01-05 19:47:30', '2026-01-05 19:47:30'),
(30, '5ad34e99-61a8-4055-96d1-1b15836772e3', 'Cho tôi thông tin user 3 và bài viết số 10', '2026-01-05 19:47:34', '2026-01-05 19:47:34'),
(31, '15e08bb0-f331-48a5-bfc1-eeffd4ca0f11', 'Lấy thông tin user 5', '2026-01-05 19:47:39', '2026-01-05 19:47:39'),
(32, '85c7c158-26ef-49f0-98e6-e66340a9f8a4', 'Cho tôi thông tin của user có ID là 1', '2026-01-05 19:48:25', '2026-01-05 19:48:25'),
(33, 'f415832a-bf23-42fe-a960-433fcb26d9b0', 'Lấy nội dung bài viết số 5', '2026-01-05 19:48:30', '2026-01-05 19:48:30'),
(34, 'eb672c4c-4c08-4bbb-8cf1-ed31ff849b32', 'Liệt kê các bài viết của user ID 2', '2026-01-05 19:48:35', '2026-01-05 19:48:35'),
(35, '6b624671-936a-4e38-9389-c1475d9ac042', 'Tạo bài viết mới với tiêu đề \"Hello World\" và nội ', '2026-01-05 19:48:46', '2026-01-05 19:48:46'),
(36, '6872658a-4016-4d94-b197-699c32ff826a', 'Lấy các bình luận của bài viết số 1', '2026-01-05 19:48:50', '2026-01-05 19:48:50'),
(37, 'eba4a2d2-2f40-4c4d-a599-9d05f026290b', 'Xin chào, bạn khỏe không?', '2026-01-05 19:48:57', '2026-01-05 19:48:57'),
(38, '8753e4ae-0426-4cc6-acbc-47e6dbab0775', 'Lấy thông tin user có ID 999999', '2026-01-05 19:49:00', '2026-01-05 19:49:00'),
(39, 'e89353b5-6d93-49a3-805b-12ada009ee26', 'Cho tôi thông tin user 3 và bài viết số 10', '2026-01-05 19:49:03', '2026-01-05 19:49:03'),
(40, 'be4ba985-9b2b-42df-8ec0-25d4dafd77e4', 'Lấy thông tin user 5', '2026-01-05 19:49:07', '2026-01-05 19:49:07'),
(41, '0be0a48f-e573-4a3d-94d2-2fe1abade5e5', 'Cho tôi thông tin của user có ID là 1', '2026-01-05 19:49:35', '2026-01-05 19:49:35'),
(42, 'test-kb-1767620222964', 'Tôi muốn hỏi về chính sách đổi trả sản phẩm', '2026-01-05 20:37:02', '2026-01-05 20:37:02'),
(43, 'test-kb-1767620264039', 'Tôi muốn hỏi về chính sách đổi trả sản phẩm', '2026-01-05 20:37:44', '2026-01-05 20:37:44'),
(44, 'test-kb-1767620356721', 'Tôi muốn hỏi về chính sách đổi trả sản phẩm', '2026-01-05 20:39:16', '2026-01-05 20:39:16'),
(45, 'fd0bde6e-39da-4212-ad26-5c17586ad4a3', 'Chào', '2026-01-05 21:13:10', '2026-01-05 21:13:10'),
(46, '5653e4ad-7fce-4698-b3f4-4ace48e67391', 'hi', '2026-01-05 21:23:32', '2026-01-05 21:23:32'),
(47, '12114df8-fb4a-4df8-8eb2-19ca7d6f8ef0', 'Chào', '2026-01-05 21:34:52', '2026-01-05 21:34:52'),
(48, 'e21cc02a-10ea-45c6-94fc-13457e5265d6', 'Chào', '2026-01-05 21:35:02', '2026-01-05 21:35:02'),
(49, '1c9d1269-db86-4b97-8155-98d7303545f7', 'Bạn có tool gì', '2026-01-05 21:35:09', '2026-01-05 21:35:09'),
(50, 'ad6f4dbe-4a10-4ae6-a761-273a90483297', 'Xin chào! Bạn là AI nào? Trả lời 1 câu.', '2026-01-11 15:01:21', '2026-01-11 15:01:21'),
(51, 'e0788866-fa10-43a7-b0fb-a9da95572c40', 'Đếm từ 1 đến 5', '2026-01-11 15:01:24', '2026-01-11 15:01:24'),
(52, '59eee4a6-2ee5-4fec-b9e4-57df02aad014', 'Xin chào! Bạn là AI nào? Trả lời ngắn gọn.', '2026-01-11 15:12:59', '2026-01-11 15:12:59'),
(53, '73152ffd-e3ad-44ec-9bbc-6338b5d78e13', 'Kể một câu chuyện ngắn 2 câu', '2026-01-11 15:13:01', '2026-01-11 15:13:01'),
(54, '093eaed0-d13a-47cb-b73c-f386a2399282', 'Xin chào!', '2026-01-11 15:13:02', '2026-01-11 15:13:02'),
(55, 'e84cb0a2-9c1b-4d5d-a29b-744e981b5999', 'Xin chào! Bạn là AI nào? Trả lời ngắn gọn.', '2026-01-11 15:13:52', '2026-01-11 15:13:52'),
(56, '71e9d32c-25a8-4b27-a3c6-e6bcf3387ec5', 'Kể một câu chuyện ngắn 2 câu', '2026-01-11 15:13:55', '2026-01-11 15:13:55'),
(57, '9ff77b77-2edb-44c5-92d9-4430301074e9', 'Xin chào!', '2026-01-11 15:13:58', '2026-01-11 15:13:58'),
(58, '1ed49db7-8275-4167-b633-0fb47b26052a', 'Chào', '2026-01-11 15:54:37', '2026-01-11 15:54:37'),
(59, '1764b4de-cae7-454b-a81e-10ca8549c3e7', 'Chào', '2026-01-11 15:54:46', '2026-01-11 15:54:46'),
(60, '3cac369f-cada-418c-b48a-95e9bb92994f', 'TEst', '2026-01-11 17:32:46', '2026-01-11 17:32:46'),
(61, 'ed49ed2d-6be2-4b58-8c5d-50910e2a4c9b', 'full makrdown', '2026-01-11 17:32:59', '2026-01-11 17:32:59'),
(62, 'fa20c276-3e15-4116-92bc-02979e404c07', 'Chaiof', '2026-01-11 18:11:03', '2026-01-11 18:11:03'),
(63, 'fb22481f-7fc7-4676-b2ef-5a397def73f8', 'Tui vừa nói gì?', '2026-01-11 18:11:10', '2026-01-11 18:11:10'),
(64, '8be68c58-f0b1-486f-bf2d-526788f194d8', 'Chào', '2026-01-11 18:18:55', '2026-01-11 18:18:55'),
(65, 'd97f9d29-2245-4eb4-8371-2ffbdab40f31', 'Chào', '2026-01-11 18:19:55', '2026-01-11 18:19:55'),
(66, 'd3cf30cd-44a8-4edb-8b8d-3efaa9d8618f', 'Bạn có thể sài tool gì?', '2026-01-11 18:20:42', '2026-01-11 18:20:42'),
(67, '9edbbc45-a7a6-4210-aba7-665e7e6f5508', 'Bạn có thể sài tool gì?', '2026-01-11 18:20:59', '2026-01-11 18:20:59');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `models`
--

CREATE TABLE `models` (
  `id` int(11) NOT NULL,
  `provider_id` int(11) NOT NULL,
  `model_id` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `context_length` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_fallback` tinyint(1) DEFAULT 0,
  `priority` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `models`
--

INSERT INTO `models` (`id`, `provider_id`, `model_id`, `display_name`, `context_length`, `is_active`, `is_fallback`, `priority`, `created_at`) VALUES
(1, 2, 'gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 1048576, 1, 0, 80, '2026-01-05 19:30:05'),
(2, 2, 'gemini-2.5-flash', 'Gemini 2.5 Flash', 1048576, 1, 0, 70, '2026-01-05 19:30:05'),
(3, 2, 'gemini-3-flash-preview', 'Gemini 3 Flash Preview', 1048576, 1, 0, 60, '2026-01-05 19:30:05'),
(4, 2, 'gemini-robotics-er-1.5-preview', 'Gemini Robotics ER 1.5 Preview', 1048576, 1, 0, 50, '2026-01-05 19:30:05'),
(5, 2, 'gemma-3-1b-it', 'Gemma 3 1B (IT)', 32768, 1, 0, 40, '2026-01-05 19:30:06'),
(6, 2, 'gemma-3-4b-it', 'Gemma 3 4B (IT)', 131072, 1, 0, 30, '2026-01-05 19:30:06'),
(7, 2, 'gemma-3-12b-it', 'Gemma 3 12B (IT)', 131072, 1, 0, 20, '2026-01-05 19:30:06'),
(8, 2, 'gemma-3-27b-it', 'Gemma 3 27B (IT)', 131072, 1, 0, 10, '2026-01-05 19:30:06'),
(23, 5, 'allenai/olmo-3.1-32b-think:free', 'AllenAI: Olmo 3.1 32B Think (free)', 65536, 1, 0, 0, '2026-01-11 15:31:30'),
(24, 5, 'xiaomi/mimo-v2-flash:free', 'Xiaomi: MiMo-V2-Flash (free)', 262144, 1, 0, 100, '2026-01-11 15:31:31'),
(25, 5, 'nvidia/nemotron-3-nano-30b-a3b:free', 'NVIDIA: Nemotron 3 Nano 30B A3B (free)', 256000, 1, 0, 0, '2026-01-11 15:31:31'),
(26, 5, 'mistralai/devstral-2512:free', 'Mistral: Devstral 2 2512 (free)', 262144, 1, 0, 0, '2026-01-11 15:31:31'),
(27, 5, 'nex-agi/deepseek-v3.1-nex-n1:free', 'Nex AGI: DeepSeek V3.1 Nex N1 (free)', 131072, 1, 0, 0, '2026-01-11 15:31:31'),
(28, 5, 'arcee-ai/trinity-mini:free', 'Arcee AI: Trinity Mini (free)', 131072, 1, 0, 0, '2026-01-11 15:31:31'),
(29, 5, 'allenai/olmo-3-32b-think:free', 'AllenAI: Olmo 3 32B Think (free)', 65536, 1, 0, 0, '2026-01-11 15:31:31'),
(30, 5, 'kwaipilot/kat-coder-pro:free', 'Kwaipilot: KAT-Coder-Pro V1 (free)', 256000, 1, 0, 0, '2026-01-11 15:31:31'),
(31, 5, 'nvidia/nemotron-nano-12b-v2-vl:free', 'NVIDIA: Nemotron Nano 12B 2 VL (free)', 128000, 1, 0, 0, '2026-01-11 15:31:31'),
(32, 5, 'nvidia/nemotron-nano-9b-v2:free', 'NVIDIA: Nemotron Nano 9B V2 (free)', 128000, 1, 0, 0, '2026-01-11 15:31:31'),
(33, 5, 'openai/gpt-oss-120b:free', 'OpenAI: gpt-oss-120b (free)', 131072, 1, 0, 0, '2026-01-11 15:31:32'),
(34, 5, 'openai/gpt-oss-20b:free', 'OpenAI: gpt-oss-20b (free)', 131072, 1, 0, 0, '2026-01-11 15:31:32'),
(35, 5, 'z-ai/glm-4.5-air:free', 'Z.AI: GLM 4.5 Air (free)', 131072, 1, 0, 0, '2026-01-11 15:31:32'),
(36, 5, 'qwen/qwen3-coder:free', 'Qwen: Qwen3 Coder 480B A35B (free)', 262000, 1, 0, 0, '2026-01-11 15:31:32'),
(37, 5, 'moonshotai/kimi-k2:free', 'MoonshotAI: Kimi K2 0711 (free)', 32768, 1, 0, 0, '2026-01-11 15:31:32'),
(38, 5, 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', 'Venice: Uncensored (free)', 32768, 1, 0, 0, '2026-01-11 15:31:32'),
(39, 5, 'google/gemma-3n-e2b-it:free', 'Google: Gemma 3n 2B (free)', 8192, 1, 0, 0, '2026-01-11 15:31:32'),
(40, 5, 'tngtech/deepseek-r1t2-chimera:free', 'TNG: DeepSeek R1T2 Chimera (free)', 163840, 1, 0, 0, '2026-01-11 15:31:32'),
(41, 5, 'deepseek/deepseek-r1-0528:free', 'DeepSeek: R1 0528 (free)', 163840, 1, 0, 0, '2026-01-11 15:31:33'),
(42, 5, 'google/gemma-3n-e4b-it:free', 'Google: Gemma 3n 4B (free)', 8192, 1, 0, 0, '2026-01-11 15:31:33'),
(43, 5, 'qwen/qwen3-4b:free', 'Qwen: Qwen3 4B (free)', 40960, 1, 0, 0, '2026-01-11 15:31:33'),
(44, 5, 'tngtech/deepseek-r1t-chimera:free', 'TNG: DeepSeek R1T Chimera (free)', 163840, 1, 0, 0, '2026-01-11 15:31:33'),
(45, 5, 'mistralai/mistral-small-3.1-24b-instruct:free', 'Mistral: Mistral Small 3.1 24B (free)', 128000, 1, 0, 0, '2026-01-11 15:31:33'),
(46, 5, 'google/gemma-3-4b-it:free', 'Google: Gemma 3 4B (free)', 32768, 1, 0, 0, '2026-01-11 15:31:33'),
(47, 5, 'google/gemma-3-12b-it:free', 'Google: Gemma 3 12B (free)', 32768, 1, 0, 0, '2026-01-11 15:31:33'),
(48, 5, 'google/gemma-3-27b-it:free', 'Google: Gemma 3 27B (free)', 131072, 1, 0, 0, '2026-01-11 15:31:33'),
(49, 5, 'google/gemini-2.0-flash-exp:free', 'Google: Gemini 2.0 Flash Experimental (free)', 1048576, 1, 0, 0, '2026-01-11 15:31:33'),
(50, 5, 'meta-llama/llama-3.3-70b-instruct:free', 'Meta: Llama 3.3 70B Instruct (free)', 131072, 1, 0, 0, '2026-01-11 15:31:34'),
(51, 5, 'meta-llama/llama-3.2-3b-instruct:free', 'Meta: Llama 3.2 3B Instruct (free)', 131072, 1, 0, 0, '2026-01-11 15:31:34'),
(52, 5, 'qwen/qwen-2.5-vl-7b-instruct:free', 'Qwen: Qwen2.5-VL 7B Instruct (free)', 32768, 1, 0, 0, '2026-01-11 15:31:34'),
(53, 5, 'nousresearch/hermes-3-llama-3.1-405b:free', 'Nous: Hermes 3 405B Instruct (free)', 131072, 1, 0, 0, '2026-01-11 15:31:34'),
(54, 5, 'meta-llama/llama-3.1-405b-instruct:free', 'Meta: Llama 3.1 405B Instruct (free)', 131072, 1, 0, 0, '2026-01-11 15:31:34');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `providers`
--

CREATE TABLE `providers` (
  `id` int(11) NOT NULL,
  `provider_id` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `priority` int(11) DEFAULT 0,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`)),
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `providers`
--

INSERT INTO `providers` (`id`, `provider_id`, `is_active`, `priority`, `config`, `created_at`) VALUES
(2, 'google-ai', 1, 12, NULL, '2026-01-05 19:30:05'),
(5, 'openrouter', 1, 10, NULL, '2026-01-05 21:23:06'),
(6, 'cerebras', 1, 1, NULL, '2026-01-05 21:23:09'),
(8, 'groq', 1, 0, NULL, '2026-01-11 17:54:22');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tools`
--

CREATE TABLE `tools` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `endpoint_url` varchar(500) NOT NULL,
  `http_method` enum('GET','POST','PUT','DELETE') DEFAULT 'GET',
  `headers_template` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`headers_template`)),
  `body_template` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`body_template`)),
  `query_params_template` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`query_params_template`)),
  `parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`parameters`)),
  `response_mapping` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`response_mapping`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `tools`
--

INSERT INTO `tools` (`id`, `name`, `description`, `endpoint_url`, `http_method`, `headers_template`, `body_template`, `query_params_template`, `parameters`, `response_mapping`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'get_user', 'Lấy thông tin người dùng theo ID. Trả về tên, email, địa chỉ và công ty của người dùng.', 'https://jsonplaceholder.typicode.com/users/{{user_id}}', 'GET', NULL, NULL, NULL, '{\"user_id\":{\"type\":\"number\",\"description\":\"ID của người dùng (1-10)\",\"required\":true}}', '{\"name\":\"$.name\",\"email\":\"$.email\",\"phone\":\"$.phone\",\"company\":\"$.company.name\",\"city\":\"$.address.city\"}', 1, '2026-01-05 19:46:58', '2026-01-05 19:46:58'),
(2, 'get_post', 'Lấy bài viết theo ID. Trả về tiêu đề và nội dung bài viết.', 'https://jsonplaceholder.typicode.com/posts/{{post_id}}', 'GET', NULL, NULL, NULL, '{\"post_id\":{\"type\":\"number\",\"description\":\"ID của bài viết (1-100)\",\"required\":true}}', '{\"title\":\"$.title\",\"body\":\"$.body\",\"userId\":\"$.userId\"}', 1, '2026-01-05 19:46:58', '2026-01-05 19:46:58'),
(3, 'get_user_posts', 'Lấy danh sách bài viết của một người dùng. Trả về tất cả bài viết của user đó.', 'https://jsonplaceholder.typicode.com/posts', 'GET', NULL, NULL, '{\"userId\":\"{{user_id}}\"}', '{\"user_id\":{\"type\":\"number\",\"description\":\"ID của người dùng (1-10)\",\"required\":true}}', NULL, 1, '2026-01-05 19:46:58', '2026-01-05 19:46:58'),
(4, 'create_post', 'Tạo bài viết mới. Cần truyền tiêu đề, nội dung và ID người dùng.', 'https://jsonplaceholder.typicode.com/posts', 'POST', '{\"Content-Type\":\"application/json\"}', '{\"title\":\"{{title}}\",\"body\":\"{{content}}\",\"userId\":\"{{user_id}}\"}', NULL, '{\"title\":{\"type\":\"string\",\"description\":\"Tiêu đề bài viết\",\"required\":true},\"content\":{\"type\":\"string\",\"description\":\"Nội dung bài viết\",\"required\":true},\"user_id\":{\"type\":\"number\",\"description\":\"ID người dùng tạo bài viết\",\"required\":true}}', '{\"id\":\"$.id\",\"title\":\"$.title\"}', 1, '2026-01-05 19:46:58', '2026-01-05 19:46:58'),
(5, 'get_comments', 'Lấy danh sách bình luận của một bài viết.', 'https://jsonplaceholder.typicode.com/posts/{{post_id}}/comments', 'GET', NULL, NULL, NULL, '{\"post_id\":{\"type\":\"number\",\"description\":\"ID của bài viết (1-100)\",\"required\":true}}', NULL, 1, '2026-01-05 19:46:58', '2026-01-05 19:46:58');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Chỉ mục cho bảng `api_keys`
--
ALTER TABLE `api_keys`
  ADD PRIMARY KEY (`id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `tool_id` (`tool_id`),
  ADD KEY `idx_api_keys_provider` (`key_type`,`provider_id`,`is_active`,`priority`),
  ADD KEY `idx_api_keys_tool` (`key_type`,`tool_id`,`is_active`,`priority`);

--
-- Chỉ mục cho bảng `chatbots`
--
ALTER TABLE `chatbots`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `model_id` (`model_id`),
  ADD KEY `idx_chatbots_slug` (`slug`),
  ADD KEY `idx_chatbots_api_key` (`api_key`);

--
-- Chỉ mục cho bảng `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `model_id` (`model_id`),
  ADD KEY `provider_id` (`provider_id`);

--
-- Chỉ mục cho bảng `chat_sessions`
--
ALTER TABLE `chat_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_key` (`session_key`);

--
-- Chỉ mục cho bảng `models`
--
ALTER TABLE `models`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_provider_model` (`provider_id`,`model_id`),
  ADD KEY `idx_models_priority` (`is_active`,`priority`);

--
-- Chỉ mục cho bảng `providers`
--
ALTER TABLE `providers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `provider_id` (`provider_id`);

--
-- Chỉ mục cho bảng `tools`
--
ALTER TABLE `tools`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `api_keys`
--
ALTER TABLE `api_keys`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `chatbots`
--
ALTER TABLE `chatbots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=135;

--
-- AUTO_INCREMENT cho bảng `chat_sessions`
--
ALTER TABLE `chat_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT cho bảng `models`
--
ALTER TABLE `models`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT cho bảng `providers`
--
ALTER TABLE `providers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `tools`
--
ALTER TABLE `tools`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `api_keys`
--
ALTER TABLE `api_keys`
  ADD CONSTRAINT `api_keys_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `api_keys_ibfk_2` FOREIGN KEY (`tool_id`) REFERENCES `tools` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `chatbots`
--
ALTER TABLE `chatbots`
  ADD CONSTRAINT `chatbots_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `chatbots_ibfk_2` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `chat_messages_ibfk_3` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `models`
--
ALTER TABLE `models`
  ADD CONSTRAINT `models_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
