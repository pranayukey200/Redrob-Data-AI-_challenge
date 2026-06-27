"""
tfidf_semantic.py — TF-IDF based semantic similarity (offline fallback).

Builds a TF-IDF index over all candidate profile texts and scores
candidates against the JD query. Works fully offline — no model downloads.

This is the primary semantic engine when sentence-transformers model
is not available (network-blocked environments).
"""

from __future__ import annotations
import pickle
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

CACHE_DIR = Path(__file__).parent.parent / "cache"
TFIDF_VECTORIZER_FILE = CACHE_DIR / "tfidf_vectorizer.pkl"
TFIDF_MATRIX_FILE = CACHE_DIR / "tfidf_matrix.pkl"
TFIDF_IDS_FILE = CACHE_DIR / "tfidf_ids.pkl"


# JD query text — concatenate all key signals for TF-IDF matching
JD_QUERY = """
Senior AI Engineer artificial intelligence machine learning NLP natural language processing
information retrieval embeddings semantic search vector database FAISS Pinecone Weaviate
Qdrant Milvus Elasticsearch OpenSearch sentence transformers BGE E5 dense retrieval
retrieval augmented generation RAG ranking NDCG MRR MAP evaluation Python PyTorch
production deployment search ranking recommendation system LLM fine-tuning LoRA PEFT
hugging face transformers BERT text classification named entity recognition
hybrid search BM25 sparse retrieval applied ML data scientist engineer
product company startup Series A founding team 5 9 years experience
"""


def build_tfidf_index(
    candidate_ids: list[str],
    profile_texts: list[str],
) -> tuple:
    """Build TF-IDF index from candidate texts. Returns (vectorizer, matrix)."""
    print(f"Building TF-IDF index on {len(profile_texts):,} candidates...")

    vectorizer = TfidfVectorizer(
        max_features=50_000,
        ngram_range=(1, 2),       # unigrams + bigrams for "vector search", "sentence transformers"
        min_df=2,                  # ignore terms appearing in only 1 doc
        max_df=0.95,               # ignore near-universal terms
        sublinear_tf=True,         # log(1+tf) — dampens high-freq terms
        strip_accents="unicode",
        analyzer="word",
    )

    matrix = vectorizer.fit_transform(profile_texts)
    print(f"TF-IDF matrix shape: {matrix.shape}")
    return vectorizer, matrix


def save_tfidf(
    vectorizer,
    matrix,
    candidate_ids: list[str],
) -> None:
    CACHE_DIR.mkdir(exist_ok=True)
    with open(TFIDF_VECTORIZER_FILE, "wb") as f:
        pickle.dump(vectorizer, f)
    with open(TFIDF_MATRIX_FILE, "wb") as f:
        pickle.dump(matrix, f)
    with open(TFIDF_IDS_FILE, "wb") as f:
        pickle.dump(candidate_ids, f)
    print(f"Saved TF-IDF index to {CACHE_DIR}")


def load_tfidf() -> tuple | tuple[None, None, None]:
    """Load cached TF-IDF index. Returns (vectorizer, matrix, ids) or Nones."""
    if (
        TFIDF_VECTORIZER_FILE.exists()
        and TFIDF_MATRIX_FILE.exists()
        and TFIDF_IDS_FILE.exists()
    ):
        with open(TFIDF_VECTORIZER_FILE, "rb") as f:
            vectorizer = pickle.load(f)
        with open(TFIDF_MATRIX_FILE, "rb") as f:
            matrix = pickle.load(f)
        with open(TFIDF_IDS_FILE, "rb") as f:
            ids = pickle.load(f)
        return vectorizer, matrix, ids
    return None, None, None


def score_candidates(
    vectorizer,
    matrix,
    candidate_ids: list[str],
    jd_query: str = JD_QUERY,
) -> dict[str, float]:
    """Score all candidates against the JD query. Returns {candidate_id: score_0_to_1}."""
    jd_vec = vectorizer.transform([jd_query])
    sims = cosine_similarity(jd_vec, matrix).flatten()  # shape (N,)

    # Normalize to 0-1 range (cosine similarity of TF-IDF is already 0-1)
    return dict(zip(candidate_ids, sims.tolist()))
