# Docker Setup

## Quick Start

1. Copy và cấu hình environment:

```bash
cp .env.docker .env
```

2. Chỉnh sửa `.env` với các giá trị production:

```env
MYSQL_ROOT_PASSWORD=your-secure-password
ENCRYPTION_KEY=your-32-character-secret-key
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_API_URL=http://localhost:4000
```

3. Build và chạy:

```bash
docker-compose up -d --build
```

## Services

| Service          | Port | Description  |
| ---------------- | ---- | ------------ |
| MySQL            | 3306 | Database     |
| Database Service | 5000 | Database API |
| LLM Gateway      | 3000 | LLM routing  |
| Backend          | 4000 | Main API     |
| Frontend         | 3001 | Web UI       |

## Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild specific service
docker-compose up -d --build backend

# Reset database
docker-compose down -v
docker-compose up -d
```

## Production Notes

- Thay đổi tất cả passwords và secrets trong `.env`
- Sử dụng reverse proxy (nginx) cho HTTPS
- Cấu hình `NEXT_PUBLIC_API_URL` với domain thực
