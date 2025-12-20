from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from datetime import timedelta
import uuid
from app.database import get_db
from app.models import Post, Media, User
from app.schemas import PresignResponse, AttachVideoRequest, MediaResponse
from app.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/uploads", tags=["uploads"])


def get_s3_client():
    """Get S3-compatible client (MinIO)"""
    config = Config(
        signature_version='s3v4',
        s3={
            'addressing_style': 'path'
        }
    )
    
    endpoint_url = f"http://{settings.MINIO_ENDPOINT}"
    if settings.MINIO_USE_SSL:
        endpoint_url = f"https://{settings.MINIO_ENDPOINT}"
    
    return boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=config
    )


@router.post("/presign", response_model=PresignResponse)
async def get_presigned_url(
    current_user: User = Depends(get_current_user)
):
    """Generate presigned URL for video upload"""
    s3_client = get_s3_client()
    
    # Generate unique object key
    object_key = f"videos/{current_user.id}/{uuid.uuid4()}.mp4"
    
    try:
        # Generate presigned URL (valid for 1 hour)
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': settings.MINIO_BUCKET,
                'Key': object_key,
                'ContentType': 'video/mp4'
            },
            ExpiresIn=3600
        )
        
        return PresignResponse(
            presigned_url=presigned_url,
            object_key=object_key,
            expires_in=3600
        )
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate presigned URL: {str(e)}"
        )


@router.post("/posts/{post_id}/attach-video", response_model=MediaResponse)
async def attach_video(
    post_id: int,
    video_data: AttachVideoRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Attach uploaded video to a post"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to attach video to this post"
        )
    
    # Create media record
    media = Media(
        post_id=post_id,
        object_key=video_data.object_key,
        content_type="video/mp4",
        duration_s=video_data.duration_s,
        fps=video_data.fps
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    
    return media

