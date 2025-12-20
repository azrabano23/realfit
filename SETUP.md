# RealFit Setup Instructions

## Prerequisites

You need Docker Desktop installed to run this application. Here are the options:

### Option 1: Install Docker Desktop (Recommended)

**macOS:**
```bash
# Install via Homebrew
brew install --cask docker

# Or download from: https://www.docker.com/products/docker-desktop/
```

After installation:
1. Open Docker Desktop
2. Wait for it to start (whale icon in menu bar)
3. Then run the commands below

### Option 2: Install Services Locally

If you prefer not to use Docker, you'll need to install:
- PostgreSQL 15+
- Redis 7+
- MinIO (or use AWS S3)

Then update the `.env` file with local connection strings.

## Quick Start (with Docker)

Once Docker is installed and running:

```bash
# 1. Start all services
docker compose up -d

# 2. Wait for services to be healthy (30-60 seconds), then run migrations
docker compose exec backend alembic upgrade head

# 3. Initialize MinIO bucket
docker compose exec backend python -m app.scripts.init_minio

# 4. Seed demo data
docker compose exec backend python -m app.scripts.seed_demo

# 5. Start frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## Demo Credentials

After seeding, you can login with:
- Email: `demo1@realfit.com` through `demo5@realfit.com`
- Password: `demo123`

## Troubleshooting

### Docker not running
Make sure Docker Desktop is started and the whale icon shows "Docker Desktop is running"

### Port conflicts
If ports 3000, 8000, 5432, 6379, 9000, or 9001 are in use, stop those services or modify `docker-compose.yml`

### Database connection errors
Wait a bit longer for PostgreSQL to fully start, then retry migrations


