"""
AI Client — OpenRouter
1 API key, chon model trong request.
Chat dung model nhanh, analysis dung model manh.
"""
from openai import OpenAI
from config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, CHAT_MODEL, ANALYSIS_MODEL
import httpx

DEFAULT_HEADERS = {
    "HTTP-Referer": "http://localhost:5173",
    "X-OpenRouter-Title": "EduPath AI",
}

# 1 client duy nhat
client = OpenAI(
    base_url=OPENROUTER_BASE_URL,
    api_key=OPENROUTER_API_KEY,
    http_client=httpx.Client(timeout=httpx.Timeout(180.0, connect=15.0)),
    default_headers=DEFAULT_HEADERS,
)


def generate_text(system_prompt: str, user_prompt: str, temperature: float = 0.7, model: str = None) -> str:
    """Non-streaming cho roadmap/jobs. Fallback: analysis -> chat model."""
    models_to_try = [model or ANALYSIS_MODEL, CHAT_MODEL]
    # Bo trung lap
    seen = set()
    models_to_try = [m for m in models_to_try if m not in seen and not seen.add(m)]

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
                print(f"[OK] generate_text: {m}")
                return result
        except Exception as e:
            print(f"[WARN] Model {m} failed: {e}")
            last_error = e
            continue

    raise last_error or Exception("All models failed")


def generate_stream(system_prompt: str, messages: list, temperature: float = 0.7, model: str = None):
    """Streaming cho chatbot. Dung chat model (nhanh)."""
    target_model = model or CHAT_MODEL
    full_messages = [{"role": "system", "content": system_prompt}] + messages

    try:
        stream = client.chat.completions.create(
            model=target_model,
            messages=full_messages,
            temperature=temperature,
            max_tokens=800,  # Giảm từ 1024 → TTFT nhanh hơn
            stream=True,
        )
        print(f"[OK] generate_stream: {target_model}")
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        print(f"[WARN] {target_model} failed: {e}, trying {ANALYSIS_MODEL}...")
        stream = client.chat.completions.create(
            model=ANALYSIS_MODEL,
            messages=full_messages,
            temperature=temperature,
            max_tokens=1024,
            stream=True,
        )
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
