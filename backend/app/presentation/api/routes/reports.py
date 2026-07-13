from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.presentation.api.dependencies.auth import get_current_user
from app.presentation.api.dependencies.database import get_db
from app.application.services.report_engine import ReportEngineService

router = APIRouter(prefix="/reports", tags=["PDF Reports"])

@router.get("/download")
async def download_pdf_report(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates and returns a downloadable PDF health report.
    """
    try:
        pdf_buffer = ReportEngineService.generate_pdf_report(db=db, user_id=str(current_user.id))
        
        headers = {
            'Content-Disposition': 'attachment; filename="NutriMind_Weekly_Report.pdf"'
        }
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]), 
            media_type="application/pdf", 
            headers=headers
        )
    except Exception as e:
        print(f"Report generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")
