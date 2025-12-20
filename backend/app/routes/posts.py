from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.database import get_db
from app.models import User, Post, Reaction, Follow, Media, Analysis
from app.schemas import (
    PostCreate, PostResponse, PostDetail, ReactionCreate, ReactionResponse,
    FeedResponse
)
from app.auth import get_current_user
from typing import Optional

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = Post(
        user_id=current_user.id,
        post_type=post_data.post_type,
        caption=post_data.caption,
        prompt_id=post_data.prompt_id
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    
    # Get reaction count
    reaction_count = db.query(func.count(Reaction.id)).filter(
        Reaction.post_id == post.id
    ).scalar() or 0
    
    return PostResponse(
        id=post.id,
        user_id=post.user_id,
        post_type=post.post_type,
        caption=post.caption,
        prompt_id=post.prompt_id,
        created_at=post.created_at,
        user=current_user,
        reaction_count=reaction_count,
        user_reaction=None
    )


@router.get("/{post_id}", response_model=PostDetail)
async def get_post(
    post_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Get user
    user = db.query(User).filter(User.id == post.user_id).first()
    
    # Get reaction count
    reaction_count = db.query(func.count(Reaction.id)).filter(
        Reaction.post_id == post.id
    ).scalar() or 0
    
    # Get user reaction if authenticated
    user_reaction = None
    if current_user:
        reaction = db.query(Reaction).filter(
            Reaction.post_id == post_id,
            Reaction.user_id == current_user.id
        ).first()
        if reaction:
            user_reaction = reaction.type
    
    # Get media
    media_list = db.query(Media).filter(Media.post_id == post_id).all()
    
    # Get analysis
    analysis = db.query(Analysis).filter(Analysis.post_id == post_id).first()
    
    return PostDetail(
        id=post.id,
        user_id=post.user_id,
        post_type=post.post_type,
        caption=post.caption,
        prompt_id=post.prompt_id,
        created_at=post.created_at,
        user=user,
        reaction_count=reaction_count,
        user_reaction=user_reaction,
        media=[MediaResponse.model_validate(m) for m in media_list],
        analysis=AnalysisResponse.model_validate(analysis) if analysis else None
    )


@router.post("/{post_id}/react", response_model=ReactionResponse)
async def react_to_post(
    post_id: int,
    reaction_data: ReactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if reaction exists
    existing = db.query(Reaction).filter(
        Reaction.post_id == post_id,
        Reaction.user_id == current_user.id
    ).first()
    
    if existing:
        # Update existing reaction
        existing.type = reaction_data.type
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new reaction
        reaction = Reaction(
            post_id=post_id,
            user_id=current_user.id,
            type=reaction_data.type
        )
        db.add(reaction)
        db.commit()
        db.refresh(reaction)
        return reaction


@router.get("/feed", response_model=FeedResponse)
async def get_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # MVP: Get all posts, ordered by created_at desc
    # In production, filter by followed users + public posts
    offset = (page - 1) * page_size
    
    query = db.query(Post)
    total = query.count()
    posts = query.order_by(Post.created_at.desc()).offset(offset).limit(page_size).all()
    
    # Build response with user and reaction data
    post_responses = []
    for post in posts:
        user = db.query(User).filter(User.id == post.user_id).first()
        reaction_count = db.query(func.count(Reaction.id)).filter(
            Reaction.post_id == post.id
        ).scalar() or 0
        
        user_reaction = None
        if current_user:
            reaction = db.query(Reaction).filter(
                Reaction.post_id == post.id,
                Reaction.user_id == current_user.id
            ).first()
            if reaction:
                user_reaction = reaction.type
        
        post_responses.append(PostResponse(
            id=post.id,
            user_id=post.user_id,
            post_type=post.post_type,
            caption=post.caption,
            prompt_id=post.prompt_id,
            created_at=post.created_at,
            user=user,
            reaction_count=reaction_count,
            user_reaction=user_reaction
        ))
    
    return FeedResponse(
        posts=post_responses,
        total=total,
        page=page,
        page_size=page_size
    )

