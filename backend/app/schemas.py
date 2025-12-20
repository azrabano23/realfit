from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models import PostType, ReactionType, AnalysisStatus


# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    display_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


# User Schemas
class UserBase(BaseModel):
    email: str
    display_name: str


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    model_config = {"from_attributes": True}


class UserProfile(UserResponse):
    follower_count: Optional[int] = 0
    following_count: Optional[int] = 0
    post_count: Optional[int] = 0


class UserUpdate(BaseModel):
    display_name: Optional[str] = None


# Prompt Schemas
class PromptResponse(BaseModel):
    id: int
    prompt_time_utc: datetime
    expires_time_utc: datetime
    has_posted: bool
    
    model_config = {"from_attributes": True}


# Post Schemas
class PostBase(BaseModel):
    post_type: PostType
    caption: Optional[str] = None


class PostCreate(PostBase):
    prompt_id: Optional[int] = None


class PostResponse(PostBase):
    id: int
    user_id: int
    prompt_id: Optional[int]
    created_at: datetime
    user: UserResponse
    reaction_count: int = 0
    user_reaction: Optional[ReactionType] = None
    
    model_config = {"from_attributes": True}


class PostDetail(PostResponse):
    media: List["MediaResponse"] = []
    analysis: Optional["AnalysisResponse"] = None


# Reaction Schemas
class ReactionCreate(BaseModel):
    type: ReactionType


class ReactionResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    type: ReactionType
    created_at: datetime
    
    model_config = {"from_attributes": True}


# Media Schemas
class MediaResponse(BaseModel):
    id: int
    post_id: int
    object_key: str
    content_type: str
    duration_s: Optional[int]
    fps: Optional[int]
    created_at: datetime
    
    model_config = {"from_attributes": True}


# Upload Schemas
class PresignResponse(BaseModel):
    presigned_url: str
    object_key: str
    expires_in: int


class AttachVideoRequest(BaseModel):
    object_key: str
    duration_s: Optional[int] = None
    fps: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


# Analysis Schemas
class AnalysisEnqueueRequest(BaseModel):
    post_id: int
    exercise_type: str  # squat, deadlift, bench, overhead_press, unknown


class AnalysisEnqueueResponse(BaseModel):
    job_id: str
    post_id: int
    status: AnalysisStatus


class AnalysisIssue(BaseModel):
    severity: str  # low, med, high
    message: str
    timestamp_s: Optional[float] = None


class AnalysisResults(BaseModel):
    rep_count: Optional[int] = None
    form_score: int  # 0-100
    key_metrics: Dict[str, Any]
    issues: List[AnalysisIssue]


class AnalysisResponse(BaseModel):
    id: int
    post_id: int
    status: AnalysisStatus
    exercise_type: Optional[str]
    results_json: Optional[AnalysisResults]
    model_version: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    model_config = {"from_attributes": True}


# Feed
class FeedResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int = 1
    page_size: int = 20

