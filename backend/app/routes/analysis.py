from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Post, Analysis, User
from app.schemas import (
    AnalysisEnqueueRequest, AnalysisEnqueueResponse, AnalysisResponse
)
from app.auth import get_current_user
from app.celery_app import analyze_video_task
from app.models import AnalysisStatus
from typing import Optional

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/enqueue", response_model=AnalysisEnqueueResponse)
async def enqueue_analysis(
    analysis_request: AnalysisEnqueueRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enqueue video analysis job"""
    post_id = analysis_request.post_id
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to analyze this post"
        )
    
    # Check if post has video
    if not post.media:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post has no video attached"
        )
    
    # Get or create analysis record
    analysis = db.query(Analysis).filter(Analysis.post_id == post_id).first()
    if not analysis:
        analysis = Analysis(
            post_id=post_id,
            status=AnalysisStatus.PENDING,
            exercise_type=analysis_request.exercise_type
        )
        db.add(analysis)
    else:
        analysis.status = AnalysisStatus.PENDING
        analysis.exercise_type = analysis_request.exercise_type
    
    db.commit()
    db.refresh(analysis)
    
    # Get video object key
    video_media = post.media[0]  # Assume first media is video
    
    # Enqueue Celery task
    task = analyze_video_task.delay(
        post_id=post_id,
        object_key=video_media.object_key,
        exercise_type=analysis_request.exercise_type
    )
    
    return AnalysisEnqueueResponse(
        job_id=task.id,
        post_id=post_id,
        status=analysis.status
    )


@router.get("/{post_id}", response_model=AnalysisResponse)
async def get_analysis(
    post_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analysis results for a post"""
    analysis = db.query(Analysis).filter(Analysis.post_id == post_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    return analysis

