import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.presentation.api.dependencies.database import engine
from app.infrastructure.database.models import Base

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Done.")
