# routes_clusters.py
from flask import Blueprint, jsonify, request
from dbModels import db, SummaryCluster, SummaryCoordinates, Enroll, Learner, User, Course, Topic
# adjust imports above to match your dbModels names

clusters_bp = Blueprint("clusters_bp", __name__)

@clusters_bp.route("/summary-clusters/<int:course_id>/<int:topic_id>", methods=["GET"])
def get_summary_clusters(course_id, topic_id):
    """
    Return clusters for given course+topic:
    {
      "clusters": [
        {
          "cluster_index": 0,
          "centroid_x": 0.123,
          "centroid_y": 0.456,
          "top_keywords": ["kw1","kw2",...],
          "learners": [
              {"enroll_id": 57, "learner_id": 35, "learner_name": "Alice", "x_coordinate": 0.12, "y_coordinate": 0.34},
              ...
          ]
        }, ...
      ]
    }
    """
    # fetch cluster rows
    clusters = (
        SummaryCluster.query
        .filter_by(course_id=course_id, topic_id=topic_id)
        .order_by(SummaryCluster.cluster_index)
        .all()
    )

    # early exit if none
    if not clusters:
        return jsonify({"clusters": []})

    out = []
    for cl in clusters:
        # top_keywords stored as json/text — ensure we return array
        top_keywords = cl.top_keywords if getattr(cl, "top_keywords", None) is not None else []

        # find learners assigned to this cluster (using primary key id)
        sc_rows = (
            SummaryCoordinates.query
            .filter_by(course_id=course_id, topic_id=topic_id, cluster_id=cl.id)
            .all()
        )

        learners = []
        for sc in sc_rows:
            enroll_id = sc.enroll_id
            # try to fetch learner name
            enroll = Enroll.query.filter_by(id=enroll_id).first()
            if enroll:
                # depending on your schema enroll may have learner_id or user relation
                learner = None
                if hasattr(enroll, "learner_id"):
                    learner = Learner.query.filter_by(id=enroll.learner_id).first()
                elif hasattr(enroll, "user_id"):
                    learner = User.query.filter_by(id=enroll.user_id).first()

                learner_name = None
                learner_id = None
                if learner:
                    learner_name = getattr(learner, "name", None) or getattr(learner, "learner_name", None)
                    learner_id = getattr(learner, "id", None)

                learners.append({
                    "enroll_id": enroll_id,
                    "learner_id": learner_id,
                    "learner_name": learner_name or f"enroll:{enroll_id}",
                    "x_coordinate": float(sc.x_coordinate) if sc.x_coordinate is not None else None,
                    "y_coordinate": float(sc.y_coordinate) if sc.y_coordinate is not None else None,
                })
            else:
                # fallback if enroll not found
                learners.append({
                    "enroll_id": enroll_id,
                    "learner_name": f"enroll:{enroll_id}",
                    "x_coordinate": float(sc.x_coordinate) if sc.x_coordinate is not None else None,
                    "y_coordinate": float(sc.y_coordinate) if sc.y_coordinate is not None else None,
                })

        out.append({
            "cluster_index": cl.cluster_index,
            "centroid_x": float(cl.centroid_x) if getattr(cl, "centroid_x", None) is not None else None,
            "centroid_y": float(cl.centroid_y) if getattr(cl, "centroid_y", None) is not None else None,
            "top_keywords": top_keywords if isinstance(top_keywords, list) else (top_keywords or []),
            "learners": learners
        })

    return jsonify({"clusters": out})
