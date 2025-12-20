from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Post, Follow
from app.schemas import UserProfile, UserUpdate
from app.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=UserProfile)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get stats
    follower_count = db.query(func.count(Follow.follower_id)).filter(
        Follow.following_id == user_id
    ).scalar() or 0
    
    following_count = db.query(func.count(Follow.following_id)).filter(
        Follow.follower_id == user_id
    ).scalar() or 0
    
    post_count = db.query(func.count(Post.id)).filter(
        Post.user_id == user_id
    ).scalar() or 0
    
    return UserProfile(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        created_at=user.created_at,
        follower_count=follower_count,
        following_count=following_count,
        post_count=post_count
    )


@router.patch("/me", response_model=UserProfile)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.display_name is not None:
        current_user.display_name = user_update.display_name
    
    db.commit()
    db.refresh(current_user)
    
    # Get stats
    follower_count = db.query(func.count(Follow.follower_id)).filter(
        Follow.following_id == current_user.id
    ).scalar() or 0
    
    following_count = db.query(func.count(Follow.following_id)).filter(
        Follow.follower_id == current_user.id
    ).scalar() or 0
    
    post_count = db.query(func.count(Post.id)).filter(
        Post.user_id == current_user.id
    ).scalar() or 0
    
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        created_at=current_user.created_at,
        follower_count=follower_count,
        following_count=following_count,
        post_count=post_count
    )


