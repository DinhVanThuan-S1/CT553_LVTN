"""
AI Client — OpenRouter (OpenAI-compatible API)
Model: nvidia/nemotron-3-super-120b-a12b:free
"""
from openai import OpenAI
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_BASE_URL

client = OpenAI(
    base_url=OPENROUTER_BASE_URL,
    api_key=OPENROUTER_API_KEY,
    default_headers={
        "HTTP-Referer": "http://localhost:5173",
        "X-OpenRouter-Title": "EduPath AI",
    },
)


def generate_text(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    """Non-streaming — dùng cho roadmap, jobs (trả JSON)"""
    response = client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=4096,
    )
    return response.choices[0].message.content or ""


def generate_stream(system_prompt: str, messages: list, temperature: float = 0.7):
    """Streaming — dùng cho chatbot (trả từng chunk)"""
    full_messages = [{"role": "system", "content": system_prompt}] + messages

    stream = client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=full_messages,
        temperature=temperature,
        max_tokens=2048,
        stream=True,
    )

    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
