import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('DATABASE_URL')
engine = create_engine(db_url)

with engine.connect() as conn:
    try:
        # Create bucket
        conn.execute(text("""
            INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
            VALUES ('meal_images', 'meal_images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/*']::text[])
            ON CONFLICT (id) DO UPDATE SET public = true;
        """))
        conn.commit()
        print('Bucket inserted successfully.')
        
        # We also need to add policies
        try:
            conn.execute(text("""
                CREATE POLICY "Allow public select" ON storage.objects FOR SELECT USING (bucket_id = 'meal_images');
            """))
            conn.commit()
            print('Select policy created.')
        except Exception as e:
            print("Select policy might already exist:", e)
            conn.rollback()

        try:
            conn.execute(text("""
                CREATE POLICY "Allow public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'meal_images');
            """))
            conn.commit()
            print('Insert policy created.')
        except Exception as e:
            print("Policy might already exist:", e)
            conn.rollback()
    except Exception as e:
        print(f'Error: {e}')
