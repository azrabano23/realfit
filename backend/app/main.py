from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, users, posts, prompts, uploads, analysis, follows
from app.config import settings

app = FastAPI(
    title="RealFit API",
    description="AI-Powered Social Fitness App API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(prompts.router)
app.include_router(uploads.router)
app.include_router(analysis.router)
app.include_router(follows.router)


@app.get("/")
async def root():
    return {"message": "RealFit API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


