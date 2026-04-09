"""
AI Client — OpenRouter (OpenAI-compatible API)
Multi-model + Multi-key: mỗi model dùng API key riêng
Fallback: thử model còn lại nếu model chính fail
"""
from openai import OpenAI
from config import (
    OPENROUTER_BASE_URL,
    CHAT_MODEL, CHAT_API_KEY,
    ANALYSIS_MODEL, ANALYSIS_API_KEY,
)
import httpx

DEFAULT_HEADERS = {
    "HTTP-Referer": "http://localhost:5173",
    "X-OpenRouter-Title": "EduPath AI",
}


def _make_client(api_key: str, timeout: float = 180.0) -> OpenAI:
    """Tao OpenAI client voi key va timeout cu the."""
    return OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=api_key,
        http_client=httpx.Client(timeout=httpx.Timeout(timeout, connect=15.0)),
        default_headers=DEFAULT_HEADERS,
    )


# Pre-build clients
_analysis_client = _make_client(ANALYSIS_API_KEY, timeout=180.0)
_chat_client = _make_client(CHAT_API_KEY, timeout=120.0)


def generate_text(system_prompt: str, user_prompt: str, temperature: float = 0.7, model: str = None) -> str:
    """Non-streaming - dung cho roadmap, jobs (tra JSON).
    Mac dinh dung ANALYSIS_MODEL + ANALYSIS_API_KEY.
    Fallback sang CHAT_MODEL neu analysis fail.
    """
    # Thu analysis model truoc, sau do chat model
    attempts = [
        (_analysis_client, model or ANALYSIS_MODEL),
        (_chat_client, CHAT_MODEL),
    ]

    last_error = None
    for client, m in attempts:
        try:
            response = client.chat.completions.create(
                model=m,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=3000,
            )
            result = response.choices[0].message.content or ""
            if result.strip():
                print(f"[OK] generate_text OK: {m}")
                return result
        except Exception as e:
            print(f"[WARN] Model {m} failed: {e}")
            last_error = e
            continue

    raise last_error or Exception("All models failed")


def generate_stream(system_prompt: str, messages: list, temperature: float = 0.7, model: str = None):
    """Streaming - dung cho chatbot (tra tung chunk).
    Mac dinh dung CHAT_MODEL + CHAT_API_KEY (nhanh).
    Fallback sang ANALYSIS_MODEL neu chat fail.
    """
    target_model = model or CHAT_MODEL
    full_messages = [{"role": "system", "content": system_prompt}] + messages

    # Primary: chat model
    client = _make_client(CHAT_API_KEY, timeout=120.0)

    try:
        stream = client.chat.completions.create(
            model=target_model,
            messages=full_messages,
            temperature=temperature,
            max_tokens=1024,
            stream=True,
        )
        print(f"[OK] generate_stream started: {target_model}")
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        print(f"[WARN] Chat {target_model} failed: {e}, trying analysis model...")
        # Fallback: analysis model (key khac, model khac)
        fallback = _make_client(ANALYSIS_API_KEY, timeout=120.0)
        stream = fallback.chat.completions.create(
            model=ANALYSIS_MODEL,
            messages=full_messages,
            temperature=temperature,
            max_tokens=1024,
            stream=True,
        )
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
