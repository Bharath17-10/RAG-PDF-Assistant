from langchain_community.vectorstores import FAISS

from utils.embeddings import get_embedding_model


def load_vector_store():

    embedding_model = get_embedding_model()

    vector_store = FAISS.load_local(
        "faiss_index",
        embedding_model,
        allow_dangerous_deserialization=True
    )

    return vector_store


def search_documents(question, k=3):

    vector_store = load_vector_store()

    documents = vector_store.similarity_search(question, k=5)

    return documents