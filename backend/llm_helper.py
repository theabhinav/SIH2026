"""LLM helper: reads a prompt from stdin, returns the model's text on stdout.
Used by the Node/Express backend to reach OpenAI (ChatGPT) via the Emergent Universal Key."""
import sys
import os
import asyncio
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

from emergentintegrations.llm.chat import LlmChat, UserMessage

SYSTEM = ("You are a senior rural-business feasibility analyst for India. "
          "Always respond with STRICT, valid JSON only — no markdown, no code fences, no commentary.")


async def main():
    prompt = sys.stdin.read()
    if not prompt.strip():
        return
    key = os.environ.get('EMERGENT_LLM_KEY') or os.environ.get('OPENAI_API_KEY')
    if not key:
        return
    model = os.environ.get('OPENAI_MODEL', 'gpt-5.4')
    try:
        chat = LlmChat(api_key=key, session_id='feasibility', system_message=SYSTEM).with_model('openai', model)
        resp = await chat.send_message(UserMessage(text=prompt))
        sys.stdout.write(resp if isinstance(resp, str) else str(resp))
    except Exception as e:  # noqa
        sys.stderr.write(str(e))


if __name__ == '__main__':
    asyncio.run(main())
