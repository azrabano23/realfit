"""Scheduler to create daily prompts for users"""
from datetime import datetime, timezone, timedelta
import random
from app.database import SessionLocal
from app.models import User, Prompt

def create_daily_prompts():
    """Create 1-2 random prompts for each user for today"""
    db = SessionLocal()
    
    try:
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today + timedelta(days=1)
        
        # Get all users
        users = db.query(User).all()
        
        for user in users:
            # Check if prompts already exist for today
            existing_prompts = db.query(Prompt).filter(
                Prompt.user_id == user.id,
                Prompt.prompt_time_utc >= today,
                Prompt.prompt_time_utc < today_end
            ).count()
            
            if existing_prompts > 0:
                continue  # Already has prompts for today
            
            # Create 1-2 random prompts
            num_prompts = random.randint(1, 2)
            for _ in range(num_prompts):
                # Random time between 8 AM and 10 PM
                hour = random.randint(8, 22)
                minute = random.randint(0, 59)
                prompt_time = today.replace(hour=hour, minute=minute)
                expires_time = prompt_time + timedelta(hours=2)
                
                prompt = Prompt(
                    user_id=user.id,
                    prompt_time_utc=prompt_time,
                    expires_time_utc=expires_time
                )
                db.add(prompt)
        
        db.commit()
        print(f"Created daily prompts for {len(users)} users")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating prompts: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_daily_prompts()


