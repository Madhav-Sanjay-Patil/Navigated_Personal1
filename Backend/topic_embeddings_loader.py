# topic_embeddings_loader.py

import json
import numpy as np
from sentence_transformers import SentenceTransformer

from dbModels import db, Topic  # adjust import if models is in a package


_topic_model = SentenceTransformer('bert-base-nli-mean-tokens')

# cache: {course_id: [np.array(...) ...]}
topic_embeddings_by_course = {}


def _description_to_text(description, name_fallback=None) -> str:
    """
    Convert Topic.description (JSON / text) to string.
    If you store {"text": "..."} we take that; else fallback to str/json.
    """
    if description is None or description == "":
        return name_fallback or ""

    # If plain string
    if isinstance(description, str):
        return description

    # If dict/list from JSON column
    if isinstance(description, dict):
        if "text" in description:
            return description["text"]
        return json.dumps(description)

    if isinstance(description, list):
        return " ".join(str(x) for x in description)

    try:
        return json.dumps(description)
    except TypeError:
        return str(description)


def _get_cos_sim(a, b) -> float:
    a = np.array(a)
    b = np.array(b)
    dot_product = float(np.dot(a, b))
    norm_a = float(np.linalg.norm(a))
    norm_b = float(np.linalg.norm(b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)


def compute_topic_embeddings_for_course(course_id: int, commit: bool = True):
    """
    For given course_id:
    - fetch Topic rows
    - compute SentenceTransformer embeddings from description/name
    - store in Topic.embedding (JSON)
    - return (embeddings_list, topics_list)
    """
    topics = (
        Topic.query
        .filter_by(course_id=course_id)
        .order_by(Topic.id.asc())
        .all()
    )

    if not topics:
        return [], []

    texts = [
        _description_to_text(t.description, name_fallback=t.name)
        for t in topics
    ]

    emb_array = _topic_model.encode(texts, convert_to_tensor=False)
    embeddings = []

    for topic, emb_vec in zip(topics, emb_array):
        vec = np.array(emb_vec, dtype=float)
        embeddings.append(vec)
        topic.embedding = vec.tolist()

    if commit:
        db.session.commit()

    return embeddings, topics


def compute_topic_polylines_for_course(course_id: int, commit: bool = True):
    """
    Build topic-topic similarity polylines like create_topic_polylines:
    For each topic i, polyline[i] = [{x: j, y: scaled_cos_sim(i,j)}, ...]
    Store in Topic.polyline JSON column.
    """
    embeddings, topics = compute_topic_embeddings_for_course(course_id, commit=False)
    if not embeddings:
        return [], [], []

    num_topics = len(topics)

    for i in range(num_topics):
        polyline = []
        for j in range(num_topics):
            if i == j:
                cos_sim_scaled = 1.0
            else:
                cos_sim = _get_cos_sim(embeddings[i], embeddings[j])
                cos_sim_scaled = (cos_sim + 1.0) / 2.0
            polyline.append({"x": j, "y": float(cos_sim_scaled)})

        topics[i].polyline = polyline

    if commit:
        db.session.commit()

    polylines = [t.polyline for t in topics]
    return polylines, topics, embeddings


def init_topic_embeddings_cache():
    """
    Build topic_embeddings_by_course for all courses that have topics.
    Call this once at app startup inside app.app_context().
    """
    global topic_embeddings_by_course
    topic_embeddings_by_course = {}

    course_ids = [
        cid for (cid,) in db.session.query(Topic.course_id).distinct().all()
        if cid is not None
    ]

    for course_id in course_ids:
        embeddings, _ = compute_topic_embeddings_for_course(course_id, commit=True)
        topic_embeddings_by_course[course_id] = embeddings


def get_topic_embeddings(course_id: int):
    """
    Get list of numpy arrays for given course_id.
    Lazy load if not present in cache.
    """
    global topic_embeddings_by_course

    if course_id in topic_embeddings_by_course:
        return topic_embeddings_by_course[course_id]

    embeddings, _ = compute_topic_embeddings_for_course(course_id, commit=True)
    topic_embeddings_by_course[course_id] = embeddings
    return embeddings
