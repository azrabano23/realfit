from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class PostType(str, enum.Enum):
    REALFIT_MOMENT = "REALFIT_MOMENT"
    WORKOUT_POST = "WORKOUT_POST"


class ReactionType(str, enum.Enum):
    LIKE = "LIKE"
    FIRE = "FIRE"
    STRONG = "STRONG"


class AnalysisStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    posts = relationship("Post", back_populates="user")
    prompts = relationship("Prompt", back_populates="user")
    reactions = relationship("Reaction", back_populates="user")
    followers = relationship("Follow", foreign_keys="Follow.following_id", back_populates="following")
    following = relationship("Follow", foreign_keys="Follow.follower_id", back_populates="follower")


class Prompt(Base):
    __tablename__ = "prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prompt_time_utc = Column(DateTime(timezone=True), nullable=False)
    expires_time_utc = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="prompts")
    posts = relationship("Post", back_populates="prompt")


class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_type = Column(Enum(PostType), nullable=False)
    caption = Column(Text, nullable=True)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="posts")
    prompt = relationship("Prompt", back_populates="posts")
    reactions = relationship("Reaction", back_populates="post", cascade="all, delete-orphan")
    media = relationship("Media", back_populates="post", cascade="all, delete-orphan")
    analysis = relationship("Analysis", back_populates="post", uselist=False, cascade="all, delete-orphan")


class Reaction(Base):
    __tablename__ = "reactions"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(ReactionType), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    post = relationship("Post", back_populates="reactions")
    user = relationship("User", back_populates="reactions")


class Follow(Base):
    __tablename__ = "follows"
    
    follower_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    following_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following = relationship("User", foreign_keys=[following_id], back_populates="followers")


class Media(Base):
    __tablename__ = "media"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    object_key = Column(String, nullable=False, unique=True)
    content_type = Column(String, nullable=False)
    duration_s = Column(Integer, nullable=True)
    fps = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    post = relationship("Post", back_populates="media")


class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, unique=True)
    status = Column(Enum(AnalysisStatus), nullable=False, default=AnalysisStatus.PENDING)
    exercise_type = Column(String, nullable=True)
    results_json = Column(JSON, nullable=True)
    model_version = Column(String, nullable=True, default="mediapipe_v1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    post = relationship("Post", back_populates="analysis")


