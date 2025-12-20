"""Main pipeline orchestrator"""
import os
import sys
import tempfile
import boto3
from botocore.config import Config
from typing import Dict, Any
from ml.pose_extractor import PoseExtractor
from ml.rep_counter import RepCounter
from ml.form_metrics import FormMetrics
from ml.scoring import FormScorer

# Try to get settings from backend, fallback to env vars
try:
    sys.path.insert(0, '/app')
    from app.config import settings
    MINIO_ENDPOINT = settings.MINIO_ENDPOINT
    MINIO_ACCESS_KEY = settings.MINIO_ACCESS_KEY
    MINIO_SECRET_KEY = settings.MINIO_SECRET_KEY
    MINIO_BUCKET = settings.MINIO_BUCKET
    MINIO_USE_SSL = settings.MINIO_USE_SSL
except:
    import os
    MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'localhost:9000')
    MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
    MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'minioadmin')
    MINIO_BUCKET = os.getenv('MINIO_BUCKET', 'realfit-videos')
    MINIO_USE_SSL = os.getenv('MINIO_USE_SSL', 'false').lower() == 'true'


def get_s3_client():
    """Get S3-compatible client"""
    config = Config(
        signature_version='s3v4',
        s3={'addressing_style': 'path'}
    )
    
    endpoint_url = f"http://{MINIO_ENDPOINT}"
    if MINIO_USE_SSL:
        endpoint_url = f"https://{MINIO_ENDPOINT}"
    
    return boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
        config=config
    )


def analyze_video_pipeline(
    object_key: str,
    exercise_type: str,
    fps: float = 30.0
) -> Dict[str, Any]:
    """
    Main analysis pipeline:
    1. Download video from S3/MinIO
    2. Extract pose landmarks
    3. Count reps
    4. Calculate form metrics
    5. Detect issues
    6. Calculate score
    """
    # Initialize components
    pose_extractor = PoseExtractor()
    rep_counter = RepCounter(pose_extractor)
    form_metrics = FormMetrics(pose_extractor)
    scorer = FormScorer(form_metrics)
    
    # Download video
    s3_client = get_s3_client()
    temp_video = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
    temp_video_path = temp_video.name
    temp_video.close()
    
    try:
        s3_client.download_file(MINIO_BUCKET, object_key, temp_video_path)
        
        # Extract landmarks
        landmarks_list = pose_extractor.extract_from_video(temp_video_path)
        
        if not landmarks_list or all(l is None for l in landmarks_list):
            raise ValueError("No pose landmarks detected in video")
        
        # Smooth landmarks
        smoothed_landmarks = pose_extractor.smooth_landmarks(landmarks_list, alpha=0.7)
        
        # Count reps
        if exercise_type == "squat":
            rep_count, rep_times = rep_counter.count_reps_squat(smoothed_landmarks, fps)
        elif exercise_type == "deadlift":
            rep_count, rep_times = rep_counter.count_reps_deadlift(smoothed_landmarks, fps)
        elif exercise_type == "bench":
            rep_count, rep_times = rep_counter.count_reps_bench(smoothed_landmarks, fps)
        elif exercise_type == "overhead_press":
            rep_count, rep_times = rep_counter.count_reps_overhead_press(smoothed_landmarks, fps)
        else:
            rep_count, rep_times = rep_counter.count_reps_unknown(smoothed_landmarks, fps)
        
        # Calculate metrics
        if exercise_type == "squat":
            metrics = form_metrics.calculate_squat_metrics(smoothed_landmarks)
        else:
            metrics = form_metrics.calculate_generic_metrics(smoothed_landmarks)
        
        # Add tempo estimate
        if rep_count > 0 and len(rep_times) > 1:
            total_time = rep_times[-1] - rep_times[0]
            tempo = total_time / rep_count if rep_count > 1 else 0
            metrics['tempo_estimate'] = tempo
        else:
            metrics['tempo_estimate'] = None
        
        # Detect issues
        issues = form_metrics.detect_issues(smoothed_landmarks, exercise_type, metrics, fps)
        
        # Calculate form score
        form_score = scorer.calculate_score(exercise_type, metrics, issues)
        
        # Build results
        results = {
            'rep_count': rep_count if rep_count > 0 else None,
            'form_score': form_score,
            'key_metrics': metrics,
            'issues': issues
        }
        
        return results
        
    finally:
        # Cleanup
        if os.path.exists(temp_video_path):
            os.unlink(temp_video_path)

