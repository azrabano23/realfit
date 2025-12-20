"""Initialize MinIO bucket"""
import boto3
from botocore.config import Config
from app.config import settings

def init_bucket():
    """Create bucket if it doesn't exist"""
    config = Config(
        signature_version='s3v4',
        s3={'addressing_style': 'path'}
    )
    
    endpoint_url = f"http://{settings.MINIO_ENDPOINT}"
    if settings.MINIO_USE_SSL:
        endpoint_url = f"https://{settings.MINIO_ENDPOINT}"
    
    s3_client = boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=config
    )
    
    try:
        s3_client.head_bucket(Bucket=settings.MINIO_BUCKET)
        print(f"Bucket {settings.MINIO_BUCKET} already exists")
    except:
        s3_client.create_bucket(Bucket=settings.MINIO_BUCKET)
        print(f"Created bucket {settings.MINIO_BUCKET}")
    
    # Set public read policy for videos (optional, adjust as needed)
    print(f"Bucket {settings.MINIO_BUCKET} is ready")

if __name__ == "__main__":
    init_bucket()


