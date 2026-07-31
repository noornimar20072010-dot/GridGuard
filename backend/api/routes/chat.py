"""Chat endpoint for operator questions about the grid.

Provides a POST /chat route that accepts a natural-language question and
optional transformer context, returning an AI-generated answer based on
live grid data.
"""

from pydantic import BaseModel

from fastapi import APIRouter

from services.chat_assistant import answer_question

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    """Request body for a chat question."""

    question: str
    transformer_id: str | None = None


class ChatResponse(BaseModel):
    """Response body for a chat answer."""

    answer: str


@router.post("")
def chat(request: ChatRequest) -> ChatResponse:
    """Answer an operator's question about the grid.

    Accepts a natural-language question and gathers live transformer data
    to provide context for answering. Optionally scopes the context to a
    specific transformer.

    Args:
        request: ChatRequest containing the question and optional transformer_id

    Returns:
        ChatResponse with the assistant's answer
    """
    answer = answer_question(request.question, request.transformer_id)
    return ChatResponse(answer=answer)
