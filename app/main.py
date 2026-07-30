from fastapi import FastAPI, Request, UploadFile, File
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import os
import shutil

from utils.pdf_reader import extract_text
from utils.chunker import create_chunks
from utils.embeddings import get_embedding_model
from utils.vector_store import create_vector_store
from utils.retriever import search_documents
from utils.groq_llm import generate_answer

# ---------------------------------------
# Create FastAPI App
# ---------------------------------------

app = FastAPI()

# ---------------------------------------
# Static Files
# ---------------------------------------

app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)

# ---------------------------------------
# Templates
# ---------------------------------------

templates = Jinja2Templates(directory="templates")

# ---------------------------------------
# Global FAISS Vector Store
# ---------------------------------------

vector_store = None

# ---------------------------------------
# Chat Request Model
# ---------------------------------------

class ChatRequest(BaseModel):
    question: str


# ---------------------------------------
# Home Page
# ---------------------------------------

@app.get("/")
async def home(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )


# ---------------------------------------
# Upload PDF
# ---------------------------------------

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    global vector_store

    # Create uploads folder
    upload_folder = "uploads"
    os.makedirs(upload_folder, exist_ok=True)

    # Save uploaded PDF
    file_path = os.path.join(upload_folder, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print("\n✅ PDF Saved Successfully")

    # -----------------------------------
    # Read PDF
    # -----------------------------------

    pdf_text = extract_text(file_path)

    print("\n========== PDF CONTENT ==========\n")
    print(pdf_text)
    print("\n=================================\n")

    # -----------------------------------
    # Create Chunks
    # -----------------------------------

    chunks = create_chunks(pdf_text)

    print(f"\n✅ Total Chunks Created: {len(chunks)}")

    # -----------------------------------
    # Load Embedding Model
    # -----------------------------------

    embedding_model = get_embedding_model()

    print("\n✅ Hugging Face Embedding Model Loaded")

    # -----------------------------------
    # Create FAISS Vector Store
    # -----------------------------------

    vector_store = create_vector_store(
        chunks,
        embedding_model
    )

    print("\n✅ FAISS Vector Store Created")

    # -----------------------------------
    # Save FAISS Database
    # -----------------------------------

    vector_store.save_local("faiss_index")

    print("\n✅ FAISS Database Saved Successfully")

    # -----------------------------------
    # Response
    # -----------------------------------

    return {
        "message": "PDF uploaded successfully!",
        "filename": file.filename,
        "chunks": len(chunks)
    }


# ---------------------------------------
# Chat API
# ---------------------------------------

@app.post("/chat")
async def chat(request: ChatRequest):

    global vector_store

    # Check if PDF has been uploaded
    if vector_store is None:
        return {
            "answer": "Please upload a PDF first."
        }

    print("\n========== USER QUESTION ==========\n")
    print(request.question)
    print("\n===================================\n")

    # -----------------------------------
    # Retrieve Similar Chunks
    # -----------------------------------

    documents = search_documents(
        request.question,
        k=3
    )

    context = ""

    print("\n========== RETRIEVED CHUNKS ==========\n")

    for index, doc in enumerate(documents, start=1):

        print(f"\nChunk {index}\n")
        print(doc.page_content)
        print("-" * 60)

        context += doc.page_content + "\n\n"

    # -----------------------------------
    # Generate Answer using Gemini
    # -----------------------------------

    answer = generate_answer(
        context=context,
        question=request.question
    )

    print("\n========== GEMINI ANSWER ==========\n")
    print(answer)
    print("\n===================================\n")

    # -----------------------------------
    # Return Response
    # -----------------------------------

    return {
        "answer": answer
    }