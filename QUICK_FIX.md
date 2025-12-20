# Quick Fix: Registration Failed

## The Problem
The backend server is not running, so the frontend can't connect to register users.

## Solution Options

### Option 1: Use Docker (Recommended if installed)

```bash
# Start all services
docker compose up -d

# Wait 30 seconds, then run migrations
docker compose exec backend alembic upgrade head

# Initialize MinIO
docker compose exec backend python -m app.scripts.init_minio

# Seed demo data
docker compose exec backend python -m app.scripts.seed_demo
```

### Option 2: Run Backend Locally (Quick Test)

**Prerequisites:**
- PostgreSQL running locally (or use Docker just for postgres)
- Python 3.11+

**Steps:**

1. **Start PostgreSQL** (if using Docker):
```bash
docker run -d --name realfit-postgres \
  -e POSTGRES_USER=realfit \
  -e POSTGRES_PASSWORD=realfit_dev \
  -e POSTGRES_DB=realfit \
  -p 5432:5432 \
  postgres:15-alpine
```

2. **Start Redis** (if using Docker):
```bash
docker run -d --name realfit-redis -p 6379:6379 redis:7-alpine
```

3. **Start Backend:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://realfit:realfit_dev@localhost:5432/realfit"
export REDIS_URL="redis://localhost:6379/0"
export JWT_SECRET_KEY="dev-secret-key"

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

4. **Test Registration:**
- Go to http://localhost:3000/register
- Try registering again

### Option 3: Use Demo Mode (Skip Registration)

If you just want to see the app, use the demo credentials after seeding:

- Email: `demo1@realfit.com`
- Password: `demo123`

## Verify Backend is Running

```bash
curl http://localhost:8000/health
```

Should return: `{"status":"healthy"}`

## Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for error messages
- **Network tab**: See if requests to `localhost:8000` are failing

Common errors:
- `ECONNREFUSED` = Backend not running
- `CORS error` = Backend CORS config issue
- `404` = Wrong endpoint URL

## Still Having Issues?

1. Check backend logs for errors
2. Verify PostgreSQL is accessible
3. Check port 8000 is not in use: `lsof -i :8000`
4. Try accessing API docs: http://localhost:8000/docs


