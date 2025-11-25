# This Flask backend manages user authentication (signup/login), course enrollment, teacher/TA assignment, 
# and provides course/learner data. It handles requests for course details, module/topic information, learner positions,
# and quiz interactions (submission, fetching questions/logs, recording attempts, creation).
# Data is often fetched from or updated in the database based on user actions and IDs.
import datetime
from utils import is_valid_id
from dbModels import User, db, Course, Question, UserQuiz
from init import app, DBcreated
import pandas as pd
from flask import make_response,jsonify, request
from repository import add_learner_from_user, add_teacher_from_user, create_Course, update_position, login,signup,teacher_course,teacher_course_unassigned,assign_teacher_course,unassign_teacher_course, learner_course_enrolled,generate_data,learner_course_unenrolled,enrolled_learner_data,enrolled_learners_by_course,calculate_all_module_centroids,add_enroll,update_by_quiz,learner_polyline_enrolled,get_suitable_position,change_resource_position,update_position_resource,update_summary_grade, quiz_adder_from_json,ta_course,ta_course_teached,ta_course_unteached, user_enrolled_courses, user_recom_courses
from datetime import datetime, timedelta,timezone
from flask import Flask, Blueprint, request, jsonify
import json
import numpy as np
from dbModels import db, Enroll, SummaryCoordinates, SummaryCluster
from learning_summary_core import summary_to_coordinates, cluster_summaries, extract_keywords_for_text
from topic_embeddings_loader import get_topic_embeddings
import modelsRoutes # to expose routes
from routes_summary import summary_bp
from cli_backfill import backfill_topics

# Register blueprint(s)
app.register_blueprint(summary_bp)

# Register CLI command(s)
app.cli.add_command(backfill_topics)

# Read data from Excel file
excel_file = 'DM_Resource_Plot.xlsx'
df = pd.read_excel(excel_file)
excel_file = 'DM_learner_plot.xlsx'
df_learner = pd.read_excel(excel_file)


# Assuming your Excel file has columns 'x', 'y', and 'video_url'
scatterplot_data = df[['index', 'name', 'x', 'y', 'video_url', 'module','module_id','submodule_id']].to_dict(orient='records')

# Convert the scatterplot_data into a DataFrame
df_scatter = pd.DataFrame(scatterplot_data)

# Group by 'module_id' and calculate the mean of 'x' and 'y'
module_data_df = df_scatter.groupby('module_id').agg({'x': 'mean', 'y': 'mean','module': 'first' }).reset_index()

# Convert the result to a list of dictionaries with 'module_id', 'x', and 'y'
module_data = module_data_df.to_dict(orient='records')
topic_data_df=pd.read_excel('DM/DM_topics.xlsx')
topic_data=topic_data_df[['name','description']].to_dict(orient='records')


learner_data = df_learner[['index', 'resource_name', 'x', 'y', 'description']].to_dict(orient='records')

if DBcreated:
    # print("creating the course")
    # create_Course("Discreate Mathematics",
    #               "this is the description of DM", None, None)
    print("Generating Data")
    generate_data()


@app.route('/ids/<int:user_id>')
def get_ids(user_id):
    with app.app_context():
        user = User.query.get(user_id)
        return ({
            'learner_id': user.learner_id,
            'teacher_id': user.teacher_id,
            'ta_id': user.ta_id,
        })

@app.route('/data')
def get_data():
    # print(cursor, dir(cursor))
    # print(scatterplot_data)
    return jsonify(scatterplot_data)



@app.route('/moduleData/<int:id>')
def get_module_data(id):
    # print(module_data)
    moudle=calculate_all_module_centroids(id)
    # print(f'moudle is {moudle}')
    # print(module_data)
    return jsonify(moudle)

@app.route('/topicData')
def get_topic_data():
    # print(topic_data)
    return jsonify(topic_data)


@app.route('/new_positions')
def get_new_data():
    return jsonify(learner_data)


@app.route("/signup", methods=['POST'])
def signup_user():
    data = request.get_json()
    name = data["name"]
    username = data["username"]
    password = data["password"]
    print("user signup: ", name, password, username)

    user = signup(name, username, password)
    if user:
        return jsonify(user), 201
    else:
        return jsonify({"msg":"Error Creating user"}), 400

@app.route("/login", methods=['POST'])
def login_user():
    data = request.get_json()
    username = data["username"]
    password = data["password"]
    print("user login request:", username, password)

    user = login(username, password)
    response = make_response(jsonify(user)) 
    if user:
        response.status_code = 200
    else:
        response.status_code = 401
    
    return response

# teacher related urls
@app.route("/teacher/courses/<int:id>", methods=['GET'])
def get_teacher_course(id):
    return teacher_course(id)

@app.route("/teacher/courses/unassigned/<int:id>", methods=['GET'])
def get_teacher_course_unassigned(id):
    return teacher_course_unassigned(id)

@app.route("/teacher/courses/assign", methods=['POST'])
def assign_teacher():
    data = request.get_json()
    user_id = data["user_id"]
    teacher_id = data["teacher_id"]
    course_id = data["course_id"]
    print(f"user_id: {user_id}, teacher_id: {teacher_id}, course_id: {course_id}")
    if not is_valid_id(teacher_id):
        print("adding new teacher...")
        teacher_id = add_teacher_from_user(user_id)["id"]
    if teacher_id and course_id:
        result = assign_teacher_course(teacher_id, course_id)
        response = make_response(jsonify(result))
        if result:
            response.status_code = 200
        else :
            response.status_code = 500
    else:
        response = make_response(None)
        response.status_code = 400
    return response

@app.route("/teacher/courses/unassign", methods=['POST'])
def unassign_teacher():
    data = request.get_json()
    teacher_id = data["teacher_id"]
    course_id = data["course_id"]
    print(teacher_id,course_id)
    if teacher_id and course_id :
        result = unassign_teacher_course(teacher_id, course_id)
    return jsonify(result), 200 if result else jsonify(result), 400

@app.route("/enrolledCourses/<int:id>", methods=['GET'])
def get_enrolled_course(id):
    """returns list of enrolled courses by user along with role for each course"""
    return user_enrolled_courses(id)

@app.route("/taTeachedCourses/<int:id>",methods=['GET'])
def get_teached_course(id):
    return ta_course_teached(id)


@app.route("/enrolledLearner/<int:id>/<int:id2>", methods=['GET'])
def get_enrolled_learner(id,id2):
    return enrolled_learner_data(id,id2)

@app.route("/enrolledLearnersByCourse/<int:id>", methods=['GET'])
def get_enrolled_learners(id):
    return enrolled_learners_by_course(id)

@app.route("/recomCourses/<int:id>", methods=['GET'])
def get_recom_course(id):
    """returns list of enrollable courses by user"""
    return user_recom_courses(id)

@app.route("/ta/recomCourses/<int:id>",methods=['GET'])
def get_ta_recom_course(id):
    return ta_course_unteached(id)

@app.route("/enrolledPolylines/<int:id>", methods=['GET'])
def get_enrolled_polyline(id):
    return learner_polyline_enrolled(id)

@app.route("/submitsummary", methods=['POST'])
def get_new_postion():
    data = request.get_json()
    summary = data["summary"]
    enrollId = data["enroll_id"]
    pos,contribution_id = update_position(summary, enrollId)
    return jsonify({"position": pos, "contribution_id": contribution_id}), 200

@app.route("/changeSummaryGrade", methods=['POST'])
def get_new_learner_postion():
    data = request.get_json()
    contributionId = data["contribution_id"]
    grade = data["grade"]
    pos = update_summary_grade(contributionId,grade)
    return jsonify(pos), 200

@app.route("/watchResource", methods=['POST'])
def get_updated_postion():
    data = request.get_json()
    enrollId = data["enroll_id"]
    resourceId = data["resource_id"]
    pos = update_position_resource(enrollId,resourceId)
    return jsonify(pos), 200

@app.route("/suitableResourcePosition", methods=['POST'])
def suitable_postion():
    data = request.get_json()
    initial_pos = data["pos"]
    resourceId = data["resource_id"]
    pos = get_suitable_position(initial_pos,resourceId)
    return jsonify(pos), 200

@app.route("/changeResourcePosition", methods=['POST'])
def change_postion():
    data = request.get_json()
    pos = data["pos"]
    resourceId = data["resource_id"]
    change_resource_position(pos,resourceId)
    return jsonify({}), 200

@app.route("/submitquiz", methods=['POST'])
def update_by_quiz_route():
    data = request.get_json()
    enrollId = data["enroll_id"]
    courseId = data["course_id"]
    to_consider = data["to_consider"]  # Boolean array indicating which questions to consider
    question_polyline = data["question_polyline"]  # Array of polylines for each question

    # Call the update_by_quiz function
    pos = update_by_quiz(enrollId, courseId, to_consider, question_polyline, position_scaler = 1)

    return jsonify(pos), 200

@app.route('/quiz_questions/<int:quiz_id>', methods=['GET'])
def get_quiz_questions(quiz_id):
    questions = Question.query.filter_by(quiz_id=quiz_id).all()

    questions_data = []
    for question in questions:
        questions_data.append({
            'id': question.id,
            'quiz_id': question.quiz_id,
            'question_text': question.question_text,
            'option_a': question.option_a,
            'option_b': question.option_b,
            'option_c': question.option_c,
            'option_d': question.option_d,
            'correct_answer': question.correct_answer,
            'polyline': question.polyline
        })

    return jsonify(questions_data), 200

@app.route('/fetch_quiz_log/<int:user_id>', methods=['GET'])
def fetch_quiz_log(user_id):
    user_quizzes = UserQuiz.query.filter_by(user_id=user_id).all()
    user_quiz_data = []

    for user_quiz in user_quizzes:
        user_quiz_data.append({
            'id': user_quiz.id,
            'quiz_id': user_quiz.quiz_id,
            'user_id': user_quiz.user_id,
            'score': user_quiz.score,
            'completion_date': user_quiz.attempt_date,
            # add any other necessary fields from the UserQuiz model
        })

    return jsonify(user_quiz_data), 200


@app.route('/record_quiz_attempt', methods=['POST'])
def record_quiz_attempt():
    try:
        data = request.get_json()
        attempt_date = None
        if 'attempt_date' in data:
            # Parse the 'attempt_date' as UTC and convert it to IST
            attempt_date_utc = datetime.fromisoformat(data['attempt_date'].replace("Z", "+00:00"))
            ist_timezone = timezone(timedelta(hours=5, minutes=30))
            attempt_date = attempt_date_utc.astimezone(ist_timezone)

        new_user_quiz = UserQuiz(
            user_id=data['user_id'],
            quiz_id=data['quiz_id'],
            score=data.get('score'),
            status=data['status'],
            attempt_date=attempt_date
        )

        db.session.add(new_user_quiz)
        db.session.commit()
        return jsonify(new_user_quiz.to_dict()), 201
    except Exception as e:
        print("Error in record_quiz_attempt:", e)
        return jsonify({"error": "Failed to record quiz attempt"}), 500

@app.route('/createquiz', methods=['POST'])
def create_quiz():
    """
    API endpoint to create a quiz and associated questions.
    """
    try:
        # Get JSON data from the request
        data = request.get_json()

        # Validate that data is not empty
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Use the imported function to process and add the quiz
        x, y = quiz_adder_from_json(data)

        # Return the success message along with the coordinates in a JSON response
        return jsonify({"message": "Quiz and questions added successfully!", "x": x, "y": y}), 201


    except Exception as e:
        # Log and return an error response
        print("Unexpected error in create_quiz:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/enrolls', methods=['POST'])
def create_enroll():
    data = request.get_json()
    user_id=data['user_id']
    learner_id=data['learner_id']
    course_id=data['course_id']
    if not is_valid_id(learner_id):
        learner_id = add_learner_from_user(user_id)['id']
    return add_enroll(learner_id, course_id)

@app.route('/coursename/<int:course_id>', methods=['GET'])
def get_course_name(course_id):
    """
    Fetches the name of a course by its ID.

    Args:
        course_id (int): ID of the course.

    Returns:
        JSON: A dictionary containing the course name or an error message.
    """
    course = Course.query.get(course_id)
    if course:
        return jsonify({'course_id': course.id, 'name': course.name})
    else:
        return jsonify({'error': 'Course not found'}), 404

# routes_summary.py



summary_bp = Blueprint("summary_bp", __name__)


@summary_bp.route("/api/summary", methods=["POST"])
def submit_learning_summary():
    """
    Body:
    {
      "enroll_id": <int>,
      "course_id": <int>,
      "summary_text": "<string>"
    }

    Response:
    {
      "summary_id": ...,
      "new_position": {"x": ..., "y": ...},
      "polyline": [...],
      "cluster_id": ...,
      "cluster_keywords": [...]
    }
    """
    data = request.get_json() or {}
    enroll_id = data.get("enroll_id")
    course_id = data.get("course_id")
    summary_text = data.get("summary_text", "")

    if not enroll_id or not course_id or not summary_text:
        return jsonify({"error": "Missing enroll_id, course_id or summary_text"}), 400

    enroll = Enroll.query.get(enroll_id)
    if not enroll:
        return jsonify({"error": "Invalid enroll_id"}), 400

    # ---- 1. Topic embeddings for this course ----
    topic_embeddings = get_topic_embeddings(course_id)
    if not topic_embeddings:
        return jsonify({"error": "No topics/embeddings for this course"}), 400

    # ---- 2. Summary -> polyline + (x,y) ----
    polyline_dicts, x, y = summary_to_coordinates(
        summary_text,
        topic_embeddings=topic_embeddings,
        num_keywords=10,
        beta=15.0
    )

    polyline_json = json.dumps(polyline_dicts)

    # ---- 3. Save SummaryCoordinates ----
    sc = SummaryCoordinates(
        enroll_id=enroll_id,
        course_id=course_id,
        summary=summary_text,   # JSON/text; you can wrap in dict if you prefer
        polyline=polyline_json,
        x_coordinate=x,
        y_coordinate=y
    )
    db.session.add(sc)

    # ---- 4. Update Enroll record ----
    enroll.x_coordinate = x
    enroll.y_coordinate = y
    enroll.polyline = polyline_json

    db.session.flush()  # ensure sc.id is available

    # ---- 5. Recompute clusters for this course ----
    all_summaries = SummaryCoordinates.query.filter_by(course_id=course_id).all()

    poly_arrays = []
    keywords_per_summary = []

    for row in all_summaries:
        pl = json.loads(row.polyline) if row.polyline else []
        arr = np.array([p["y"] for p in pl], dtype=float)
        poly_arrays.append(arr)

        kws, _ = extract_keywords_for_text(row.summary, num_keywords=10)
        keywords_per_summary.append(kws)

    labels, top_keywords = cluster_summaries(poly_arrays, keywords_per_summary)

    # ---- 6. Recreate SummaryCluster rows for this course ----
    SummaryCluster.query.filter_by(course_id=course_id).delete()
    db.session.flush()

    # Compute cluster centroids from (x,y) of each SummaryCoordinates
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
            cluster_index=int(lab),
            centroid_x=cx,
            centroid_y=cy,
            top_keywords=top_keywords.get(lab, [])
        )
        db.session.add(cluster)
        db.session.flush()
        clusters_by_index[lab] = cluster

    # ---- 7. Attach cluster_id to SummaryCoordinates ----
    for row, lab in zip(all_summaries, labels):
        cluster_obj = clusters_by_index.get(int(lab))
        if cluster_obj:
            row.cluster_id = cluster_obj.id

    db.session.commit()

    # label for current summary is the last label (since we appended last)
    current_label = int(labels[-1]) if len(labels) else None
    current_cluster = clusters_by_index.get(current_label)
    current_keywords = current_cluster.top_keywords if current_cluster else []

    return jsonify({
        "summary_id": sc.id,
        "new_position": {
            "x": float(x),
            "y": float(y),
        },
        "polyline": polyline_dicts,
        "cluster_id": sc.cluster_id,
        "cluster_keywords": current_keywords,
    })



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
