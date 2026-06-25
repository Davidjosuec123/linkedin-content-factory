from groq import Groq
from config import settings


client = Groq(api_key=settings.groq_api_key)


def call_llm(
    system_prompt: str,
    user_input: str,
    temperature: float = 0.2,
    max_tokens: int = 1500,
) -> str:
    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()
