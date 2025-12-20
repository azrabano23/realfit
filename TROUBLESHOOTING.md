# Troubleshooting Guide

## Registration Failed

If you're seeing "Registration failed", here are the most common causes:

### 1. Backend Not Running

**Check if backend is running:**
```bash
curl http://localhost:8000/health
```

**If not running, start it:**
```bash
# With Docker
docker compose up -d backend

# Or manually
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### 2. Database Not Initialized

**Run migrations:**
```bash
docker compose exec backend alembic upgrade head
```

### 3. CORS Issues

Make sure the backend CORS settings in `backend/app/main.py` include your frontend URL:
- `http://localhost:3000`
- `http://localhost:3001`

### 4. Network Connection

Check browser console (F12) for:
- `ECONNREFUSED` - Backend not running
- `CORS error` - CORS configuration issue
- `Network Error` - Connection problem

### 5. Validation Errors

Common validation issues:
- Email must be valid format
- Password must be at least 6 characters
- Display name required

### Quick Fix Checklist

1. ✅ Backend running on port 8000
2. ✅ Database migrations run
3. ✅ Frontend can reach backend (check Network tab)
4. ✅ No CORS errors in console
5. ✅ Valid email format
6. ✅ Password length >= 6

### Testing Backend Directly

```bash
# Test registration endpoint
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "display_name": "Test User"
  }'
```

If this works, the issue is in the frontend connection.


