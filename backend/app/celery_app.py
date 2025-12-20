from celery import Celery
from app.config import settings

celery_app = Celery(
    "realfit",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="analyze_video")
def analyze_video_task(post_id: int, object_key: str, exercise_type: str):
    """Celery task to analyze video"""
    import sys
    import os
    
    # Add ml directory to path (mounted at /ml in docker)
    ml_path = '/ml'
    if os.path.exists(ml_path):
        sys.path.insert(0, ml_path)
    
    from ml.runner import analyze_video_pipeline
    from app.database import SessionLocal
    from app.models import Analysis, AnalysisStatus
    
    db = SessionLocal()
    analysis = None
    try:
        # Update status to processing
        analysis = db.query(Analysis).filter(Analysis.post_id == post_id).first()
        if analysis:
            analysis.status = AnalysisStatus.PROCESSING
            db.commit()
        
        # Run analysis
        results = analyze_video_pipeline(
            object_key=object_key,
            exercise_type=exercise_type
        )
        
        # Update analysis with results
        if analysis:
            analysis.status = AnalysisStatus.COMPLETE
            analysis.results_json = results
            db.commit()
        
        return {"status": "success", "post_id": post_id}
    except Exception as e:
        # Mark as failed
        if analysis:
            analysis.status = AnalysisStatus.FAILED
            db.commit()
        raise e
    finally:
        db.close()
