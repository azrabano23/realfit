# Quick Start Guide

## Step 1: Install Docker Desktop

Docker Desktop is currently downloading. Once the download completes:

1. Open the DMG file
2. Drag Docker to your Applications folder
3. Open Docker Desktop from Applications
4. Wait for Docker to start (whale icon in menu bar should show "Docker Desktop is running")

## Step 2: Start the Application

Once Docker is running, execute these commands in order:

```bash
# Navigate to project directory
cd /Users/azrabano/realfit

# Start all services (PostgreSQL, Redis, MinIO, Backend, Celery)
docker compose up -d

# Wait 30-60 seconds for services to be healthy, then run migrations
docker compose exec backend alembic upgrade head

# Initialize MinIO bucket for video storage
docker compose exec backend python -m app.scripts.init_minio

# Seed demo data (creates 5 demo users with prompts)
docker compose exec backend python -m app.scripts.seed_demo
```

## Step 3: Start Frontend

In a new terminal:

```bash
cd /Users/azrabano/realfit/frontend
npm install  # (already done)
npm run dev
```

## Step 4: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin`

## Demo Login Credentials

After seeding, you can login with any of these:
- `demo1@realfit.com` / `demo123`
- `demo2@realfit.com` / `demo123`
- `demo3@realfit.com` / `demo123`
- `demo4@realfit.com` / `demo123`
- `demo5@realfit.com` / `demo123`

## Troubleshooting

**Docker not starting?**
- Make sure Docker Desktop is fully launched (check menu bar)
- Try: `docker ps` to verify Docker is working

**Port already in use?**
- Stop services using ports 3000, 8000, 5432, 6379, 9000, or 9001
- Or modify ports in `docker-compose.yml`

**Database errors?**
- Wait longer for PostgreSQL to start (can take 1-2 minutes)
- Check logs: `docker compose logs postgres`

**Frontend not connecting to backend?**
- Make sure backend is running: `docker compose ps`
- Check backend logs: `docker compose logs backend`


