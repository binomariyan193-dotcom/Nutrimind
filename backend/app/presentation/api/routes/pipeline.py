from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.presentation.api.dependencies.auth import get_current_user
from app.presentation.api.dependencies.database import get_db
from app.infrastructure.database.models import User
from app.presentation.schemas.pipeline import PipelineResponse
from app.application.services.ml_pipeline import MLPipeline

router = APIRouter(prefix="/pipeline", tags=["ML Pipeline"])

@router.post("/process_meal", response_model=PipelineResponse)
async def process_meal(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes the entire end-to-end ML Pipeline for meal analysis:
    1. Image Preprocessing (Optimization & Compression)
    2. Food Detection (Gemini AI Vision)
    3. Nutrition Mapping (USDA API)
    4. Feature Engineering
    5. Health Scoring
    6. Database Persistence
    """
    
    # Ensure user exists in our DB
    db_user = db.query(User).filter(User.id == current_user.id).first()
    if not db_user:
        db_user = User(id=current_user.id, email=current_user.email)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    try:
        # Run the full orchestrator pipeline
        result = await MLPipeline.process_meal_image(file=file, user_id=str(db_user.id), db=db)
        return result
        
    except HTTPException as e:
        # Re-raise known API exceptions
        raise e
    except Exception as e:
        print(f"Pipeline error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")
