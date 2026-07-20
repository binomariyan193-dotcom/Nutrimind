import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.presentation.api.dependencies.database import engine

def alter():
    print("Altering profiles table...")
    queries = [
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_goal_hit_date DATE;",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;"
    ]
    
    with engine.begin() as conn:
        for q in queries:
            try:
                conn.execute(text(q))
                print(f"Executed: {q}")
            except Exception as e:
                print(f"Error executing {q}: {e}")
                
    print("Done.")

if __name__ == "__main__":
    alter()
