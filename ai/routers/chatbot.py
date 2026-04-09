"""
Router — Chatbot AI (SSE Streaming)
POST /ai/chat
Backend gửi: { message, history, contextData }
Trả về: SSE stream text/event-stream
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json

from services.ai_client import generate_stream
from prompts.chatbot_prompt import CHATBOT_SYSTEM_PROMPT, build_chat_context

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[list[ChatMessage]] = []
    contextData: Optional[dict] = None


@router.post("/chat")
async def chat(body: ChatRequest):
    try:
        # Build system prompt với context DB
        context_str = build_chat_context(body.contextData or {})
        system_prompt = CHATBOT_SYSTEM_PROMPT + context_str

        # Build messages history cho OpenRouter
        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in (body.history or [])
        ]
        messages.append({"role": "user", "content": body.message})

        def event_stream():
            try:
                for chunk in generate_stream(
                    system_prompt=system_prompt,
                    messages=messages,
                    temperature=0.8,
                ):
                    # SSE format: "data: <text>\n\n"
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
