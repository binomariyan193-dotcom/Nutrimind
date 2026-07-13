from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.presentation.api.dependencies.auth import get_current_user
from app.presentation.api.dependencies.database import get_db
from app.presentation.schemas.chat import ChatRequest, ChatResponse
from app.application.services.ai_chat import AIChatService

router = APIRouter(prefix="/chat", tags=["AI Chat"])

@router.post("/ask", response_model=ChatResponse)
async def ask_ai_assistant(
    request: ChatRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Takes a user's question, appends their health profile context, and gets an answer from Gemini.
    """
    answer = AIChatService.ask_question(db=db, user_id=str(current_user.id), question=request.message)
    return ChatResponse(response=answer)
