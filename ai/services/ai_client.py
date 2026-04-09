"""
AI Client — OpenRouter (OpenAI-compatible API)
Multi-model: chọn model theo tính năng (chat nhanh vs phân tích sâu)
Fallback: tự động chuyển model khi bị rate limit
"""
from openai import OpenAI
from config import (
    OPENROUTER_API_KEY, OPENROUTER_BASE_URL,
    CHAT_MODEL, ANALYSIS_MODEL, FALLBACK_MODEL,
)
import httpx

# Client chung với timeout phù hợp
_http_client = httpx.Client(timeout=httpx.Timeout(180.0, connect=15.0))

client = OpenAI(
    base_url=OPENROUTER_BASE_URL,
    api_key=OPENROUTER_API_KEY,
    http_client=_http_client,
    default_headers={
        "HTTP-Referer": "http://localhost:5173",
        "X-OpenRouter-Title": "EduPath AI",
    },
)


def generate_text(system_prompt: str, user_prompt: str, temperature: float = 0.7, model: str = None) -> str:
    """Non-streaming — dùng cho roadmap, jobs (trả JSON).
    Tự động fallback nếu model chính bị lỗi.
    """
    target_model = model or ANALYSIS_MODEL
    models_to_try = [target_model]
    if target_model != FALLBACK_MODEL:
        models_to_try.append(FALLBACK_MODEL)

    last_error = None
    for m in models_to_try:
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
                print(f"✅ generate_text success with model: {m}")
                return result
        except Exception as e:
            print(f"⚠️ Model {m} failed: {e}")
            last_error = e
            continue

    raise last_error or Exception("All models failed")


def generate_stream(system_prompt: str, messages: list, temperature: float = 0.7, model: str = None):
    """Streaming — dùng cho chatbot (trả từng chunk).
    Dùng chat model (nhỏ, nhanh) mặc định.
    """
    target_model = model or CHAT_MODEL
    full_messages = [{"role": "system", "content": system_prompt}] + messages

    # Client riêng cho streaming
    stream_http = httpx.Client(timeout=httpx.Timeout(120.0, connect=15.0))
    stream_client = OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=OPENROUTER_API_KEY,
        http_client=stream_http,
        default_headers={
            "HTTP-Referer": "http://localhost:5173",
            "X-OpenRouter-Title": "EduPath AI",
        },
    )

    try:
        stream = stream_client.chat.completions.create(
            model=target_model,
            messages=full_messages,
            temperature=temperature,
            max_tokens=1024,
            stream=True,
        )
        print(f"✅ generate_stream started with model: {target_model}")
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        print(f"⚠️ Chat model {target_model} failed: {e}, trying fallback...")
        # Fallback
        stream_fallback = stream_client.chat.completions.create(
            model=FALLBACK_MODEL,
            messages=full_messages,
            temperature=temperature,
            max_tokens=1024,
            stream=True,
        )
        for chunk in stream_fallback:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
