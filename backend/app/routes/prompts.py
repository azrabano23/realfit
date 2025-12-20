from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timezone
from app.database import get_db
from app.models import User, Prompt, Post
from app.schemas import PromptResponse
from app.auth import get_current_user
from typing import List

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("/today", response_model=List[PromptResponse])
async def get_today_prompts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Get prompts for today
    prompts = db.query(Prompt).filter(
        and_(
            Prompt.user_id == current_user.id,
            Prompt.prompt_time_utc >= today_start,
            Prompt.prompt_time_utc <= today_end
        )
    ).order_by(Prompt.prompt_time_utc.asc()).all()
    
    # Check if user has posted for each prompt
    result = []
    for prompt in prompts:
        has_posted = db.query(Post).filter(
            Post.prompt_id == prompt.id,
            Post.user_id == current_user.id
        ).first() is not None
        
        result.append(PromptResponse(
            id=prompt.id,
            prompt_time_utc=prompt.prompt_time_utc,
            expires_time_utc=prompt.expires_time_utc,
            has_posted=has_posted
        ))
    
    return result


@router.post("/mark-seen")
async def mark_prompt_seen(
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Optional endpoint - just returns success for now
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.user_id == current_user.id
    ).first()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    return {"status": "success", "message": "Prompt marked as seen"}


