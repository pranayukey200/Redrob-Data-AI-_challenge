"""
embeddings.py — Embedding generation and caching.

Uses sentence-transformers (local, no API calls).
Cache stored as numpy .npy files in ./cache/.
"""

from __future__ import annotations
import os
import json
import pickle
import numpy as np
from pathlib import Path
from typing import Iterator

CACHE_DIR = Path(__file__).parent.parent / "cache"
EMBEDDINGS_FILE = CACHE_DIR / "candidate_embeddings.npy"
CANDIDATE_IDS_FILE = CACHE_DIR / "candidate_ids.pkl"
JD_EMBEDDING_FILE = CACHE_DIR / "jd_embedding.npy"

MODEL_NAME = "all-MiniLM-L6-v2"


def get_model():
    """Lazy load the sentence-transformer model."""
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(MODEL_NAME)


def embed_texts(texts: list[str], model=None, batch_size: int = 256) -> np.ndarray:
    """Embed a list of texts. Returns shape (N, D) float32 array."""
    if model is None:
        model = get_model()
    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        normalize_embeddings=True,   # L2-normalize for cosine via dot product
        convert_to_numpy=True,
    )
    return embeddings.astype(np.float32)


def embed_jd(jd_text: str, model=None) -> np.ndarray:
    """Embed the JD role summary. Returns shape (D,) float32."""
    if model is None:
        model = get_model()
    emb = model.encode([jd_text], normalize_embeddings=True, convert_to_numpy=True)
    return emb[0].astype(np.float32)


def save_embeddings(embeddings: np.ndarray, candidate_ids: list[str]) -> None:
    CACHE_DIR.mkdir(exist_ok=True)
    np.save(EMBEDDINGS_FILE, embeddings)
    with open(CANDIDATE_IDS_FILE, "wb") as f:
        pickle.dump(candidate_ids, f)
    print(f"Saved embeddings: {embeddings.shape} → {EMBEDDINGS_FILE}")


def load_embeddings() -> tuple[np.ndarray, list[str]] | tuple[None, None]:
    """Load cached embeddings. Returns (embeddings, candidate_ids) or (None, None)."""
    if EMBEDDINGS_FILE.exists() and CANDIDATE_IDS_FILE.exists():
        embeddings = np.load(EMBEDDINGS_FILE)
        with open(CANDIDATE_IDS_FILE, "rb") as f:
            candidate_ids = pickle.load(f)
        return embeddings, candidate_ids
    return None, None


def save_jd_embedding(embedding: np.ndarray) -> None:
    CACHE_DIR.mkdir(exist_ok=True)
    np.save(JD_EMBEDDING_FILE, embedding)


def load_jd_embedding() -> np.ndarray | None:
    if JD_EMBEDDING_FILE.exists():
        return np.load(JD_EMBEDDING_FILE)
    return None


def cosine_similarities(jd_emb: np.ndarray, candidate_embs: np.ndarray) -> np.ndarray:
    """
    Dot product of pre-normalized vectors = cosine similarity.
    jd_emb: (D,) | candidate_embs: (N, D) → returns (N,)
    """
    return candidate_embs @ jd_emb
