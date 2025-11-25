# routes_summary.py

from flask import Blueprint, request, jsonify
import json
import numpy as np
from flask import Blueprint, request, jsonify
from sqlalchemy import func

from dbModels import (
    db,
    SummaryCluster,
    SummaryCoordinates,
    Enroll,
    Learner,
)


from dbModels import db, Enroll, SummaryCoordinates, SummaryCluster, Topic
from learning_summary_core import (
    summary_to_coordinates,
    cluster_summaries,
    extract_keywords_for_text,
)
from topic_embeddings_loader import get_topic_embeddings

summary_bp = Blueprint("summary_bp", __name__)


@summary_bp.route("/api/summary", methods=["POST"])
def submit_learning_summary():
    data = request.get_json() or {}

    enroll_id = data.get("enroll_id")
    course_id = data.get("course_id")
    topic_id = data.get("topic_id")
    summary_text = data.get("summary_text", "")

    # ---- basic validation ----
    if not enroll_id or not course_id or not topic_id or not summary_text:
        return jsonify({"error": "Missing enroll_id, course_id, topic_id or summary_text"}), 400

    enroll = Enroll.query.get(enroll_id)
    if not enroll:
        return jsonify({"error": "Invalid enroll_id"}), 400

    # Optional: sanity check that this topic belongs to this course
    topic = Topic.query.get(topic_id)
    if not topic or topic.course_id != course_id:
        return jsonify({"error": "topic_id does not belong to given course_id"}), 400

    # ---- load topic embeddings for this course (unchanged logic) ----
    topic_embeddings = get_topic_embeddings(course_id)
    if not topic_embeddings:
        return jsonify({"error": "No topics/embeddings for this course"}), 400

    # ---- summary -> polyline + coordinates ----
    polyline_dicts, x, y = summary_to_coordinates(
        summary_text,
        topic_embeddings=topic_embeddings,
        num_keywords=10,
        beta=15.0,
    )
    polyline_json = json.dumps(polyline_dicts)

    # create summary row
    sc = SummaryCoordinates(
        enroll_id=enroll_id,
        course_id=course_id,
        topic_id=topic_id,
        summary=summary_text,
        polyline=polyline_json,
        x_coordinate=x,
        y_coordinate=y,
    )
    db.session.add(sc)

    # update learner's “current position” if you want course-level view
    enroll.x_coordinate = x
    enroll.y_coordinate = y
    enroll.polyline = polyline_json

    db.session.flush()  # so sc.id is available

    # ---- recompute clusters for this (course, topic) ----

    # only summaries for this course + topic
    all_summaries = SummaryCoordinates.query.filter_by(
        course_id=course_id,
        topic_id=topic_id,
    ).all()

    if len(all_summaries) == 0:
        # should not happen, we just added one
        db.session.commit()
        return jsonify({
            "summary_id": sc.id,
            "new_position": {"x": float(x), "y": float(y)},
            "polyline": polyline_dicts,
            "cluster_id": None,
            "cluster_keywords": [],
        })

    # prepare polyline arrays and per-summary keywords
    poly_arrays = []
    keywords_per_summary = []

    for row in all_summaries:
        pl = json.loads(row.polyline) if row.polyline else []
        arr = np.array([p["y"] for p in pl], dtype=float)
        poly_arrays.append(arr)

        kws, _ = extract_keywords_for_text(row.summary, num_keywords=10)
        keywords_per_summary.append(kws)

    # cluster_summaries: same as before, but now applied per-topic
    labels, top_keywords = cluster_summaries(poly_arrays, keywords_per_summary)

    # delete old clusters only for this course+topic
    SummaryCluster.query.filter_by(course_id=course_id, topic_id=topic_id).delete()
    db.session.flush()

    from collections import defaultdict
    cluster_points = defaultdict(list)

    for row, lab in zip(all_summaries, labels):
        if row.x_coordinate is not None and row.y_coordinate is not None:
            cluster_points[int(lab)].append(
                (float(row.x_coordinate), float(row.y_coordinate))
            )

    clusters_by_index = {}
    for lab, pts in cluster_points.items():
        if not pts:
            continue
        cx = sum(p[0] for p in pts) / len(pts)
        cy = sum(p[1] for p in pts) / len(pts)
        cluster = SummaryCluster(
            course_id=course_id,
            topic_id=topic_id,             # 🔴 NEW: per-topic
            cluster_index=int(lab),
            centroid_x=cx,
            centroid_y=cy,
            top_keywords=top_keywords.get(lab, []),
        )
        db.session.add(cluster)
        db.session.flush()
        clusters_by_index[lab] = cluster

    # assign cluster_id to each summary
    for row, lab in zip(all_summaries, labels):
        cluster_obj = clusters_by_index.get(int(lab))
        if cluster_obj:
            row.cluster_id = cluster_obj.id

    db.session.commit()

    # current summary's cluster:
    current_label = int(labels[-1]) if len(labels) else None
    current_cluster = clusters_by_index.get(current_label)
    current_keywords = current_cluster.top_keywords if current_cluster else []

    return jsonify({
        "summary_id": sc.id,
        "new_position": {"x": float(x), "y": float(y)},
        "polyline": polyline_dicts,
        "cluster_id": sc.cluster_id,
        "cluster_keywords": current_keywords,
        "course_id": course_id,
        "topic_id": topic_id,
    })
@summary_bp.route("/summary-clusters/<int:course_id>/<int:topic_id>", methods=["GET"])
def get_summary_clusters(course_id, topic_id):
    """
    Returns per-cluster:
    - cluster_id (cluster_index)
    - centroid_x, centroid_y
    - top_keywords (list)
    - learners in that cluster (enroll_id, learner_id, learner_name)
    """

    # 1) All cluster rows for this course + topic
    clusters = (
        SummaryCluster.query
        .filter_by(course_id=course_id, topic_id=topic_id)
        .all()
    )

    # 2) All summary_coordinates joined with enroll + learner for this topic
    rows = (
        db.session.query(SummaryCoordinates, Enroll, Learner)
        .join(Enroll, SummaryCoordinates.enroll_id == Enroll.id)
        .join(Learner, Enroll.learner_id == Learner.id)
        .filter(
            SummaryCoordinates.course_id == course_id,
            SummaryCoordinates.topic_id == topic_id,
            SummaryCoordinates.cluster_id.isnot(None)
        )
        .all()
    )

    # 3) Group learners by cluster_id
    learners_by_cluster = {}
    for sc, enroll, learner in rows:
        cid = sc.cluster_id
        learners_by_cluster.setdefault(cid, []).append({
            "enroll_id": enroll.id,
            "learner_id": learner.id,
            "learner_name": learner.name,
        })

    # 4) Build response list
    cluster_list = []
    for c in clusters:
        cid = c.cluster_index  # we used cluster_index in summary_cluster
        raw_keywords = c.top_keywords

        # top_keywords column is JSON / text; normalize to Python list
        if isinstance(raw_keywords, str):
            try:
                top_keywords = json.loads(raw_keywords)
            except Exception:
                top_keywords = []
        else:
            top_keywords = raw_keywords or []

        cluster_list.append({
            "cluster_id": cid,
            "centroid_x": float(c.centroid_x) if c.centroid_x is not None else None,
            "centroid_y": float(c.centroid_y) if c.centroid_y is not None else None,
            "top_keywords": top_keywords,
            "learners": learners_by_cluster.get(cid, []),
        })

    return jsonify({
        "course_id": course_id,
        "topic_id": topic_id,
        "clusters": cluster_list,
    })
