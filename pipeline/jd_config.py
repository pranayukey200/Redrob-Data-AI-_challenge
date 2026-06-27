"""
Parsed Job Description for IntelliRank.

This is the single JD for the Redrob hackathon challenge:
Senior AI Engineer — Redrob AI (Pune/Noida, 5-9 years).

Hardcoded here so rank.py can run fully offline without any LLM API calls.
"""

JD_RAW_TEXT = """
Job Description: Senior AI Engineer — Founding Team
Company: Redrob AI (Series A AI-native talent intelligence platform)
Location: Pune/Noida, India (Hybrid) | Open to relocation candidates from Tier-1 Indian cities
Employment Type: Full-time
Experience Required: 5–9 years

Role: Own the intelligence layer — ranking, retrieval, and matching systems.
First 90 days: audit BM25 baseline, ship v2 ranking with embeddings + hybrid retrieval,
set up eval infrastructure (NDCG, MRR, MAP, A/B testing).

Must-have skills:
- Production experience with embeddings-based retrieval systems (sentence-transformers, BGE, E5, OpenAI embeddings)
- Production experience with vector databases (FAISS, Pinecone, Weaviate, Qdrant, Milvus, Elasticsearch, OpenSearch)
- Strong Python
- Ranking evaluation frameworks (NDCG, MRR, MAP, offline-to-online correlation, A/B testing)
- NLP / Information Retrieval background

Nice-to-have:
- LLM fine-tuning (LoRA, QLoRA, PEFT, Hugging Face)
- Learning-to-rank (XGBoost, LightGBM)
- HR-tech / recruiting tech / marketplace product experience
- Distributed systems / large-scale inference
- Open-source contributions in AI/ML

Explicit disqualifiers:
- Pure research/academic roles without production deployment
- Only consulting firm experience (TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini, HCL)
- Primary expertise in computer vision, speech, or robotics (not NLP/IR)
- No production code in 18+ months
- LangChain-only "AI experience" under 12 months

Location: Prefer India. Specifically Pune, Noida, Hyderabad, Mumbai, Delhi NCR, Bangalore.
Notice period: Prefer <30 days; can buy out up to 30 days.
Ideal profile: 6-8 years, 4-5 in applied ML at product companies, shipped end-to-end ranking/search/recommendation.
"""

# Structured parsed form (used by scorer.py)
JD = {
    "jd_id": "senior_ai_engineer_redrob",
    "title": "Senior AI Engineer",
    "company": "Redrob AI",
    "seniority_level": "senior",
    "min_experience_years": 5.0,
    "max_experience_years": 9.0,
    "ideal_experience_years": 7.0,   # center of 5-9, tilted toward 6-8

    # Must-have skill clusters — candidate needs coverage in most of these
    "must_have_skill_clusters": {
        "embeddings_retrieval": [
            "sentence-transformers", "sentence transformers", "embeddings", "dense retrieval",
            "semantic search", "vector search", "semantic similarity", "text embeddings",
            "bge", "e5", "openai embeddings", "ada", "embedding model", "bi-encoder",
            "cross-encoder", "colbert", "dpr", "dense passage retrieval", "retrieval",
        ],
        "vector_db": [
            "faiss", "pinecone", "weaviate", "qdrant", "milvus", "opensearch",
            "elasticsearch", "vector database", "vector db", "vector store", "annoy",
            "approximate nearest neighbor", "ann", "hnsw", "ivf", "pgvector",
        ],
        "python": [
            "python", "pytorch", "tensorflow", "keras", "numpy", "pandas", "scikit-learn",
            "sklearn", "flask", "fastapi", "django",
        ],
        "ranking_evaluation": [
            "ndcg", "mrr", "map", "ranking", "information retrieval", "ir", "search ranking",
            "learning to rank", "ltr", "a/b testing", "recall@k", "precision@k",
            "relevance evaluation", "ranking systems", "retrieval evaluation",
        ],
        "nlp_ir": [
            "nlp", "natural language processing", "text classification", "named entity recognition",
            "ner", "bert", "transformers", "hugging face", "huggingface", "llm", "language model",
            "question answering", "information extraction", "text mining", "tokenization",
            "bm25", "tf-idf", "tfidf", "hybrid search", "sparse retrieval", "lexical search",
            "spacy", "nltk", "gensim",
        ],
    },

    # Nice-to-have skills
    "nice_to_have_skills": [
        "lora", "qlora", "peft", "fine-tuning", "fine tuning", "finetuning",
        "rag", "retrieval augmented generation", "retrieval-augmented",
        "xgboost", "lightgbm", "catboost", "gradient boosting",
        "spark", "distributed", "kafka", "ray", "dask",
        "open source", "github", "mlflow", "wandb", "kubeflow", "airflow",
        "recommender", "recommendation system", "collaborative filtering",
        "reranking", "reranker", "cross-encoder",
    ],

    # Skills that suggest wrong domain (per JD's explicit disqualifier)
    "wrong_domain_skills": [
        "computer vision", "image classification", "object detection", "cnn",
        "convolutional", "yolo", "resnet", "imagenet", "image segmentation",
        "speech recognition", "asr", "tts", "text-to-speech", "wav2vec",
        "robotics", "ros", "slam", "autonomous",
    ],

    # Preferred locations (India)
    "preferred_locations": {
        "tier1": ["pune", "noida", "hyderabad", "mumbai", "delhi", "bangalore", "bengaluru", "gurgaon", "gurugram", "ncr"],
        "india": True,
    },

    # Consulting firms to penalize (all-consulting background)
    "consulting_firms": [
        "tcs", "tata consultancy", "infosys", "wipro", "accenture", "cognizant",
        "capgemini", "hcl", "tech mahindra", "hexaware", "mphasis", "l&t infotech",
        "ltimindtree", "mindtree", "ntt data",
    ],

    # Title patterns that indicate AI/ML relevance
    "ai_ml_titles": [
        "ml engineer", "machine learning engineer", "ai engineer", "nlp engineer",
        "data scientist", "applied scientist", "research scientist", "ai researcher",
        "senior ai", "senior ml", "senior data scientist", "principal ml",
        "staff ml", "staff engineer ml", "ai specialist", "applied ml",
        "search engineer", "ranking engineer", "recommendation", "computer vision",
    ],

    # Title patterns that indicate definitely NOT a fit
    "non_ai_titles": [
        "hr manager", "sales executive", "mechanical engineer", "civil engineer",
        "accountant", "content writer", "graphic designer", "marketing manager",
        "operations manager", "customer support", "business analyst", "project manager",
        "procurement", "supply chain", "finance", "legal", "ui designer",
    ],

    # Industry context
    "preferred_industries": [
        "ai", "ml", "software", "fintech", "saas", "edtech", "healthtech",
        "e-commerce", "adtech", "gaming", "startup", "product", "tech",
    ],

    # Weight config (default)
    "weights": {
        "skill": 0.35,
        "career": 0.30,
        "semantic": 0.20,
        "behavioral": 0.15,
    }
}
