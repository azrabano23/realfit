# RealFit - AI-Powered Social Fitness App

RealFit is a BeReal-style social fitness app that provides AI-powered form analysis through daily random workout prompts. The app uses advanced computer vision (MediaPipe Pose) to analyze workout videos and provide real-time feedback.

## 🎯 Features

- **AI Pose Detection**: Real-time pose estimation using MediaPipe Pose (33 keypoints)
- **Form Analysis**: Automatic rep counting, form scoring, and issue detection
- **BeReal-Style Prompts**: 1-2 random daily workout prompts
- **Social Feed**: Share workouts and connect with the fitness community
- **CV Demo**: Interactive visualization of pose detection algorithm

## 🏗️ Architecture

### Backend
- **FastAPI** (Python) - RESTful API
- **PostgreSQL** - Database (SQLite for local dev)
- **SQLAlchemy** - ORM
- **Celery + Redis** - Async video processing
- **MinIO** - S3-compatible object storage
- **JWT** - Authentication

### Frontend
- **Next.js 14** (TypeScript) - React framework
- **Tailwind CSS** - Styling
- **Axios** - API client

### ML Pipeline
- **MediaPipe Pose** - Pose estimation
- **OpenCV** - Video I/O
- **NumPy/Scipy** - Signal processing
- Modular architecture for easy model upgrades

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or use SQLite for local dev)
- Redis (optional, for Celery)

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="sqlite:///./realfit.db"
export JWT_SECRET_KEY="dev-secret-key"
export MINIO_ENDPOINT="localhost:9000"
export MINIO_ACCESS_KEY="minioadmin"
export MINIO_SECRET_KEY="minioadmin"
export MINIO_BUCKET="realfit-videos"

# Initialize database
python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"

# Run server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Using Docker (Recommended)

```bash
# Start all services
docker compose up -d

# Run migrations
docker compose exec backend alembic upgrade head

# Initialize MinIO
docker compose exec backend python -m app.scripts.init_minio

# Seed demo data
docker compose exec backend python -m app.scripts.seed_demo
```

## 📁 Project Structure

```
realfit/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── main.py      # FastAPI app
│   │   ├── models.py    # SQLAlchemy models
│   │   ├── schemas.py   # Pydantic schemas
│   │   ├── routes/      # API endpoints
│   │   └── celery_app.py
│   └── alembic/         # Database migrations
├── frontend/            # Next.js application
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   └── lib/             # Utilities
├── ml/                  # ML pipeline
│   ├── pose_extractor.py
│   ├── rep_counter.py
│   ├── form_metrics.py
│   ├── scoring.py
│   └── runner.py
└── docker-compose.yml
```

## 🔬 Computer Vision Algorithm

The ML pipeline consists of:

1. **Pose Extraction** (`pose_extractor.py`)
   - MediaPipe Pose detection
   - 33 landmark keypoints
   - Exponential smoothing (α=0.7)
   - Handles occlusion

2. **Rep Counting** (`rep_counter.py`)
   - Joint angle trajectory analysis
   - Peak detection using scipy.signal
   - Exercise-specific algorithms
   - Minimum rep distance: 1 second

3. **Form Metrics** (`form_metrics.py`)
   - Squat depth ratio
   - Knee valgus detection
   - Torso lean measurement
   - Center of mass stability

4. **Scoring** (`scoring.py`)
   - Base score: 100 points
   - Issue-based deductions
   - Exercise-specific penalties

## 📡 API Endpoints

### Auth
- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `GET /me` - Get current user

### Posts
- `POST /posts` - Create post
- `GET /feed` - Get feed
- `GET /posts/:id` - Get post details
- `POST /posts/:id/react` - Add reaction

### Prompts
- `GET /prompts/today` - Get today's prompts

### Upload & Analysis
- `POST /uploads/presign` - Get presigned upload URL
- `POST /posts/:id/attach-video` - Attach video to post
- `POST /analysis/enqueue` - Enqueue analysis job
- `GET /analysis/:post_id` - Get analysis results

## 🎨 Frontend Pages

- `/` - CV Demo (main page)
- `/app` - App dashboard (requires auth)
- `/app/demo` - CV visualization demo
- `/app/posts/:id` - Post detail with analysis

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# ML tests
cd ml
pytest
```

## 🔧 Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - Database connection string
- `JWT_SECRET_KEY` - JWT signing key
- `MINIO_ENDPOINT` - MinIO/S3 endpoint
- `CELERY_BROKER_URL` - Redis URL for Celery

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Contact

For questions or support, please open an issue on GitHub.
