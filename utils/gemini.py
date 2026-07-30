import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(
    api_key=os.getenv("GOOGLE_API_KEY")
)

model = genai.GenerativeModel("gemini-2.0-flash")


def generate_answer(context, question):

    prompt = f"""
You are an AI assistant.

Answer ONLY from the context below.

If the answer is not found, reply:
"I couldn't find that information in the uploaded PDF."

Context:
{context}

Question:
{question}

Answer:
"""

    response = model.generate_content(prompt)

    return response.text