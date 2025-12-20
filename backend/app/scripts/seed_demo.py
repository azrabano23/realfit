"""Seed demo data"""
from datetime import datetime, timezone, timedelta
import random
from app.database import SessionLocal
from app.models import User, Prompt, Post, Follow
from app.auth import get_password_hash

def seed_demo():
    db = SessionLocal()
    
    try:
        # Create demo users
        users = []
        for i in range(5):
            email = f"demo{i+1}@realfit.com"
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                user = User(
                    email=email,
                    password_hash=get_password_hash("demo123"),
                    display_name=f"Demo User {i+1}"
                )
                db.add(user)
                users.append(user)
            else:
                users.append(existing)
        
        db.commit()
        
        # Refresh users to get IDs
        for user in users:
            db.refresh(user)
        
        print(f"Created {len(users)} demo users")
        
        # Create today's prompts for each user
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        for user in users:
            # Create 1-2 random prompts for today
            num_prompts = random.randint(1, 2)
            for _ in range(num_prompts):
                # Random time between 8 AM and 10 PM
                hour = random.randint(8, 22)
                minute = random.randint(0, 59)
                prompt_time = today.replace(hour=hour, minute=minute)
                expires_time = prompt_time + timedelta(hours=2)
                
                # Check if prompt already exists
                existing = db.query(Prompt).filter(
                    Prompt.user_id == user.id,
                    Prompt.prompt_time_utc == prompt_time
                ).first()
                
                if not existing:
                    prompt = Prompt(
                        user_id=user.id,
                        prompt_time_utc=prompt_time,
                        expires_time_utc=expires_time
                    )
                    db.add(prompt)
        
        db.commit()
        print("Created prompts for today")
        
        # Create some sample posts (without videos)
        for i, user in enumerate(users[:3]):  # First 3 users post
            post = Post(
                user_id=user.id,
                post_type="WORKOUT_POST",
                caption=f"Just finished an amazing workout! 💪 #{i+1}"
            )
            db.add(post)
        
        db.commit()
        print("Created sample posts")
        
        # Create some follows
        if len(users) >= 2:
            follow1 = Follow(follower_id=users[0].id, following_id=users[1].id)
            follow2 = Follow(follower_id=users[1].id, following_id=users[0].id)
            db.add(follow1)
            db.add(follow2)
            db.commit()
            print("Created follow relationships")
        
        print("\n✅ Demo data seeded successfully!")
        print(f"\nLogin credentials:")
        for i, user in enumerate(users):
            print(f"  User {i+1}: {user.email} / demo123")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo()


