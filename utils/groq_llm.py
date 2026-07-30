import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def generate_answer(context, question):

    messages = [
        {
            "role": "system",
            "content": (
                "You are a helpful AI assistant that answers questions ONLY using "
                "the provided PDF context.\n\n"
                "Rules:\n"
                "1. Give clear and natural answers.\n"
                "2. Do NOT say 'according to the context' or 'it is mentioned'.\n"
                "3. If the answer is not in the context, reply exactly:\n"
                "'I couldn't find that information in the uploaded PDF.'\n"
                "4. Do not make up information."
            ),
        },
        {
            "role": "user",
            "content": f"""
Context:
{context}

Question:
{question}
""",
        },
    ]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.2,
        max_tokens=512,
    )

    return response.choices[0].message.content