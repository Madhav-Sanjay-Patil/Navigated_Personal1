import pandas as pd
from dbModels import TA, Contribution, Course, Learner, Question, Quiz, Resource, Teacher, Topic, User, db, Enroll
from init import app
from model_library import apply_preprocessing, create_topic_embeddings, create_topic_polylines, pushResourcesToDB, push_topics_to_db, create_resource_embeddings, create_resource_polylines, create_keywords_list, rad_plot_axes, rad_plot_poly, get_cord_from_polyline,create_beta_polyline,pushQuizToResourceInDB,create_summary_embeddings
from flask import jsonify
from datetime import datetime, timezone
from itertools import chain
from utils import get_highline_of_polylines, convert_to_lists, get_lowline_of_polylines, calculate_centroid, nearest_seven, calculate_distance
from collections import defaultdict
import gc
import numpy as np
from sqlalchemy import or_

def update_position(summary, enrollId):
    print(summary, enrollId)
    enroll: Enroll = Enroll.query.get(enrollId)
    if not enroll:
        raise IndexError
    (all_keywords_list, all_weight_list) = create_keywords_list([summary],5)
    learner_embeddings = create_resource_embeddings(all_keywords_list)
    topicembedding = db.session.query(
        Topic.embedding).filter_by(course_id=enroll.course_id).all()
    if not topicembedding:
        raise IndexError()

    learner_polylines = create_resource_polylines(
        topicembedding, learner_embeddings, 0)
    original_summary_list = convert_to_lists(learner_polylines[0])
    summary_polyline = [item for sublist in original_summary_list for item in (
        sublist if isinstance(sublist, list) else [sublist])]
    resources: list[Resource] = Resource.query.filter_by(
        course_id=enroll.course_id).all()
    polylines = enroll.polyline
    new_polylines = get_highline_of_polylines(
        [learner_polylines[0], polylines])
    original_list = convert_to_lists(new_polylines)
    new_polylines_list = [item for sublist in original_list for item in (
        sublist if isinstance(sublist, list) else [sublist])]

    feature_length = len(learner_polylines[0])
    (tlen, theta) = rad_plot_axes(feature_length, 1, 1)
    centroid_list = rad_plot_poly(
        feature_length, [new_polylines_list], tlen, theta)
    print(f'centroid list is {centroid_list}')
    enroll.x_coordinate = centroid_list[0][0]
    enroll.y_coordinate = centroid_list[0][1]
    enroll.polyline = new_polylines_list
    enroll.accessible_resources = list(set(enroll.accessible_resources).union(set(
        nearest_seven(enroll.polyline, [[res.id, res.polyline] for res in resources]))))
    for resource in resources:
        if resource.x_coordinate<enroll.x_coordinate and resource.y_coordinate<enroll.y_coordinate :
            if resource.id not in enroll.accessible_resources:
                enroll.accessible_resources.append(resource.id)
    db.session.commit()
    new_contribution = Contribution(
        enroll_id=enrollId,
        submitted_on=datetime.now(timezone.utc),
        description={"summary": True},
        contribution_content=summary,
        prev_polyline=polylines,
        polyline=new_polylines_list,
        x_coordinate=centroid_list[0][0],
        y_coordinate=centroid_list[0][1],
        contribution_polyline=summary_polyline,
        grade=1,
    )
    db.session.add(new_contribution)
    db.session.commit()
    new_contribution_id=new_contribution.id
    return centroid_list[0],new_contribution_id

def update_summary_grade(contributionId, grade):
    print(f'given grade is {grade}')
    contribution: Contribution = Contribution.query.get(contributionId)
    contribution.grade = grade
    
    if grade is not None and float(grade) >= 0:
        contribution.is_graded = True
    
    db.session.commit()

    enrollId = contribution.enroll_id
    enroll: Enroll = Enroll.query.get(enrollId)
    resources: list[Resource] = Resource.query.filter_by(course_id=enroll.course_id).all()
    all_contributions: list[Contribution] = Contribution.query.filter_by(enroll_id=enrollId).all()

    newpolyline = all_contributions[0].prev_polyline
    for contribution in all_contributions:
        contribution.prev_polyline = newpolyline
        actual_contribution_polyline = [x * float(contribution.grade) for x in contribution.contribution_polyline]
        contribution.polyline = get_highline_of_polylines([newpolyline, actual_contribution_polyline])
        
        feature_length = len(contribution.polyline)
        (tlen, theta) = rad_plot_axes(feature_length, 1, 1)
        centroid_list = rad_plot_poly(feature_length, [contribution.polyline], tlen, theta)
        print(f'centroid list is {centroid_list}')
        contribution.x_coordinate = centroid_list[0][0]
        contribution.y_coordinate = centroid_list[0][1]
        db.session.commit()
        newpolyline = contribution.polyline

    feature_length = len(newpolyline)
    (tlen, theta) = rad_plot_axes(feature_length, 1, 1)
    centroid_list = rad_plot_poly(feature_length, [newpolyline], tlen, theta)
    print(f'centroid list is {centroid_list}')
    enroll.x_coordinate = centroid_list[0][0]
    enroll.y_coordinate = centroid_list[0][1]
    enroll.polyline = newpolyline

    for resource in resources:
        if resource.x_coordinate < enroll.x_coordinate and resource.y_coordinate < enroll.y_coordinate:
            if resource.id not in enroll.accessible_resources:
                enroll.accessible_resources.append(resource.id)

    enroll.accessible_resources = [
        res_id for res_id in enroll.accessible_resources
        if any(resource.id == res_id and resource.x_coordinate < enroll.x_coordinate
               and resource.y_coordinate < enroll.y_coordinate for resource in resources)
    ]
    enroll.accessible_resources = list(set(enroll.accessible_resources).union(set(
        nearest_seven(enroll.polyline, [[res.id, res.polyline] for res in resources]))))

    db.session.commit()



def update_position_resource(enrollId, resourceId):

    enroll: Enroll = Enroll.query.get(enrollId)
    if not enroll:
        raise IndexError
    resource: Resource = Resource.query.get(resourceId)
    resources: list[Resource] = Resource.query.filter_by(
        course_id=enroll.course_id).all()

    # result_list = [x + 0.1 * y for x, y in zip(enroll.polyline, resource.polyline)]

    result = np.array(enroll.polyline) + 0.01 * np.array(resource.polyline)
    result_list = result.tolist()

    new_polylines_list=result_list

    feature_length = len(new_polylines_list)
    (tlen, theta) = rad_plot_axes(feature_length, 1, 1)
    centroid_list = rad_plot_poly(
        feature_length, [new_polylines_list], tlen, theta)
    print(f'centroid list is {centroid_list}')
    enroll.x_coordinate = centroid_list[0][0]
    enroll.y_coordinate = centroid_list[0][1]
    enroll.polyline = new_polylines_list
    enroll.accessible_resources=list(enroll.accessible_resources)
    for resource in resources:
        if resource.x_coordinate<enroll.x_coordinate and resource.y_coordinate<enroll.y_coordinate :
            if resource.id not in enroll.accessible_resources:
                enroll.accessible_resources.append(resource.id)
    db.session.commit()


    return centroid_list[0]

def get_suitable_position(initial_pos,resourceId):
    resource: Resource =Resource.query.get(resourceId)
    polyline=resource.polyline
    positions_array=[]
    for beta in range(0,50):
        beta_polyline=create_beta_polyline(polyline,beta)
        feature_length = len(beta_polyline)
        (tlen, theta) = rad_plot_axes(feature_length, 1, 1)
        centroid_list = rad_plot_poly(
        feature_length, [beta_polyline], tlen, theta)
        print(f'coordinates is {centroid_list}')
        x=centroid_list[0][0]
        y=centroid_list[0][1]
        new_pos=[x,y]
        positions_array.append(new_pos)

    closest_position = None
    min_distance = float('inf')

    for position in positions_array:
        distance = calculate_distance(initial_pos, position)
        if distance < min_distance:
            min_distance = distance
            closest_position = position

    return closest_position

def change_resource_position(pos, resourceId):
    resource: Resource = Resource.query.get(resourceId)
    if resource:
        resource.x_coordinate = pos[0]
        resource.y_coordinate = pos[1]
        db.session.commit()
    else:
        print(f"Resource with ID {resourceId} not found.")

def update_by_quiz(enrollId, courseId, to_consider, question_polylines, position_scaler = 1):

    print('JUST A CHECK....LOL')
    print(f'Enroll ID: {enrollId}, Course ID: {courseId}, To Consider: {to_consider}')

    # Fetch the learner's current polyline from the Enroll table
    enroll: Enroll = Enroll.query.get(enrollId)
    if not enroll:
        raise IndexError("Enroll record not found")

    learner_polylines = enroll.polyline or []  # Initialize as an empty list if None
    print(f"Current learner polyline: {learner_polylines}")

    # Ensure learner_polylines is a valid list
    if not isinstance(learner_polylines, list):
        raise ValueError("Invalid learner polylines")

    # Validate to_consider and question_polylines
    if not to_consider or not question_polylines:
        raise ValueError("Invalid input: 'to_consider' or 'question_polylines' is empty")

    if len(to_consider) != len(question_polylines):
        raise ValueError("Mismatch between 'to_consider' and 'question_polylines' lengths")

    # Filter out question polylines based on the 'to_consider' list (True values only)
    filtered_polylines = [
        question_polylines[i] for i in range(len(to_consider)) if to_consider[i]
    ]

    if not filtered_polylines:
        print("No valid question polylines to consider")
        return learner_polylines  # No updates if nothing is considered

    # Create a highline of the learner's existing polyline and each filtered question polyline
    new_polylines = learner_polylines
    for polyline in filtered_polylines:
        new_polylines = get_highline_of_polylines([new_polylines, polyline])
        print(f'Updated polyline with question: {new_polylines}')

    # Convert and flatten the new polylines
    new_polylines_list = flatten_list(new_polylines)

    if not new_polylines_list or not isinstance(new_polylines_list, list):
        raise ValueError("Invalid new polylines list")

    # Calculate the updated centroid
    feature_length = len(new_polylines_list)
    (tlen, theta) = rad_plot_axes(feature_length, 1, 1)
    centroid_list = rad_plot_poly(feature_length, [new_polylines_list], tlen, theta)

    if not centroid_list or not isinstance(centroid_list, list) or len(centroid_list) == 0:
        raise ValueError("Invalid centroid list")

    print(f'Updated centroid: {centroid_list}')

    # Save the updated polyline and coordinates in the database
    enroll.x_coordinate = centroid_list[0][0]
    enroll.y_coordinate = centroid_list[0][1]
    enroll.polyline = new_polylines_list
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error saving to database: {e}")
        raise

    # Create a new contribution entry for the quiz update
    try:
        new_contribution = Contribution(
            enroll_id=enrollId,
            submitted_on=datetime.now(timezone.utc),
            description={"quiz_update": True},  # Make sure the model supports dict/json
            contribution_content="Quiz Update",
            prev_polyline=learner_polylines,
            polyline=new_polylines_list,
            x_coordinate=centroid_list[0][0],
            y_coordinate=centroid_list[0][1],
        )
        db.session.add(new_contribution)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error creating contribution: {e}")
        raise
    except e:
        print(e)
        raise

    return centroid_list[0] * position_scaler

# Helper function to flatten lists (handles deeply nested lists)
def flatten_list(lst):
    flat_list = []
    for item in lst:
        if isinstance(item, list):
            flat_list.extend(flatten_list(item))
        else:
            flat_list.append(item)
    return flat_list

def get_highline_of_polylines(polylines):
    if not polylines or len(polylines) == 0:
        raise ValueError("Polyline list is empty")

    # Ensure all polylines are of the same length
    polyline_length = len(polylines[0])
    if any(len(polyline) != polyline_length for polyline in polylines):
        raise ValueError("Polylines are of different lengths")

    return [max(polylines[i][j] for i in range(len(polylines))) for j in range(polyline_length)]

# Genearting the default data for the db
def generate_data():
    # add learners
    learner1 = add_learner("Gururaj", 4.0, "guru", "guru")
    learner2 = add_learner("Pavani", 4.0, "pavani", "pavani")
    print("Created Learners")
    # add courses
    course1=add_course("Discrete Mathematics",
                  "Discrete mathematics is the study of mathematical structures that are discrete in the sense that they assume only distinct, separate values, rather than in a range of values. The subject enables the students to formulate problems precisely, solve the problems, apply formal proof techniques and explain their reasoning clearly.")
    course2=add_course("Foundations of cryptography ","The course provides the basic paradigm and principles of modern cryptography. The focus of this course will be on definitions and constructions of various cryptographic objects. We will try to understand what security properties are desirable in such objects, how to formally define these properties, and how to design objects that satisfy the definitions.")
    print("Created Courses")

    # Add resources
    topics1 = pd.read_excel(
        r'DM/DM_topics.xlsx')
    resource_keylist_1 = pd.read_excel(
        r'DM/DM_Resource_Keywords.xlsx')
    topics2 = pd.read_excel(
        r'DM/Foundation of Cryptography_Topics.xlsx')
    resource_keylist_2 = pd.read_excel(
        r'DM/FOC_keywords_list.xlsx')
    add_resources(course1.get("id"),topics1,resource_keylist_1)
    add_resources(course2.get("id"),topics2,resource_keylist_2)
    print("Added Resources")

    # Enroll courses
    enroll1=add_enroll(learner1.get("id"),course1.get("id"))
    enroll2=add_enroll(learner2.get("id"),course2.get("id"))
    enroll3=add_enroll(learner1.get("id"),course2.get("id"))

    print("Added Ernrollments")


    # Adding a quiz and questions
    quiz_adder(quiz_file = 'DM/quizes.xlsx', questions_file = 'DM/questions.xlsx', position_scaler = 1)


    print("Added Quiz and Questions")


def add_course(name, description, polylines=[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]):
    new_course = Course(
        name=name,
        description=description,
        initial_position=get_lowline_of_polylines(polylines)
    )
    with app.app_context():
        db.session.add(new_course)
        db.session.commit()
        course_dict = new_course.to_dict()
        return course_dict

def add_user(name, username, password):
    new_user = User(
        name=name,
        username=username,
        password=password,
        teacher_id=None,
        learner_id=None,
        ta_id=None,
    )
    with app.app_context():
        db.session.add(new_user)
        db.session.commit()
        return new_user.to_dict()

def add_learner(name, cgpa, username, password, ta_id=None):
    new_learner = Learner(
        name=name,
        cgpa=cgpa,
        username=username,
        password=password,
        ta_id=ta_id  # Explicitly set ta_id (None for normal learners)
    )
    with app.app_context():
        db.session.add(new_learner)
        db.session.commit()
        return new_learner.to_dict()

def add_learner_from_user(user_id):
    with app.app_context():
        user = User.query.get(user_id)
        new_learner = Learner(
            name=user.name,
            cgpa=4.0,
            username=user.username,
            password=user.password,
            ta_id=user.ta_id
        )
        db.session.add(new_learner)
        db.session.commit()
        user.learner_id = new_learner.id
        db.session.commit()
        return new_learner.to_dict()

def add_learner_ta(name, cgpa, username, password, ta_id):
    new_learner_ta = Learner(
        name=name,
        cgpa=cgpa,
        username=username,
        password=password,
        ta_id=ta_id  # Assign the TA ID
    )
    with app.app_context():
        db.session.add(new_learner_ta)
        db.session.commit()
        return new_learner_ta.to_dict()

# @profile
def add_enroll(learner_id, course_id):
    with app.app_context():
        first_module_courses = Resource.query.filter_by(course_id=course_id, module_id=1)
        polylines = []
        resource_id_polyline = []
        for course_temp in first_module_courses:
            beta_polyline=create_beta_polyline(course_temp.polyline,course_temp.beta)
            polylines.append(beta_polyline)
            resource_id_polyline.append([course_temp.id, beta_polyline])

        lowline = get_lowline_of_polylines(polylines)
        print(f' lowline is {lowline}')

        feature_length = len(lowline)
        (tlen, theta) = rad_plot_axes(feature_length, 1, 1)
        centroid_list = rad_plot_poly(
            feature_length, [lowline], tlen, theta)
        print(f'centroid list is {centroid_list}')
        x_coordinate = centroid_list[0][0]
        y_coordinate = centroid_list[0][1]
        print(f'x is {x_coordinate} y is {y_coordinate}')

        new_enroll = Enroll(
            learner_id=learner_id,
            course_id=course_id,
            x_coordinate=float(x_coordinate),
            y_coordinate=float(y_coordinate),
            polyline=lowline,
            accessible_resources=nearest_seven(lowline, resource_id_polyline),
            ta_id=None
        )

        db.session.add(new_enroll)
        db.session.commit()

        enroll_dict = new_enroll.to_dict()
        return enroll_dict

    with app.app_context():
        db.session.add(new_enroll)
        db.session.commit()
        enroll_dict = new_enroll.to_dict()
        return enroll_dict

# @profile
def add_resources(course_id,topics: pd.DataFrame, resource_keylist: pd.DataFrame):
    print("this is the new course id", course_id)
    # topics = pd.read_excel(
    #     r'DM/DM_topics.xlsx')
    apply_preprocessing(topics)
    topicembedding = create_topic_embeddings(topics)
    topic_polylines = create_topic_polylines(topics, topicembedding)
    print("Done")
    push_topics_to_db(topics, topicembedding, topic_polylines, course_id)
    # resource_keylist = pd.read_excel(
    #     r'DM/DM_Resource_Keywords.xlsx')
    # Free memory after pushing topics to DB
    gc.collect()
    apply_preprocessing(resource_keylist)
    resource_embeddings = create_resource_embeddings(
        resource_keylist['tokens'])
    # Free memory after creating resource embeddings
    gc.collect()
    resource_polylines = create_resource_polylines(
        topicembedding, resource_embeddings,0)
    print(resource_polylines[0])
    print(resource_keylist.columns)
    pushResourcesToDB(resource_keylist, resource_embeddings,
                      resource_polylines, course_id)
    # Free memory after pushing resources to DB
    del topicembedding, topic_polylines
    del resource_embeddings, resource_polylines
    gc.collect()


def create_Course(name, description, topics: pd.DataFrame, resource_keylist: pd.DataFrame):
    print("this si the new course id", course_id)
    topics = pd.read_excel(
        r'DM/DM_topics.xlsx')
    apply_preprocessing(topics)
    topicembedding = create_topic_embeddings(topics)
    topic_polylines = create_topic_polylines(topics, topicembedding)
    print("Done")

    resource_keylist = pd.read_excel(
        r'DM/DM_Resource_Keywords.xlsx')
    apply_preprocessing(resource_keylist)
    resource_embeddings = create_resource_embeddings(
        resource_keylist['tokens'])
    resource_polylines = create_resource_polylines(
        topicembedding, resource_embeddings, 8)
    print(resource_polylines[0])

    new_course = Course(
        name=name,
        description=description,
        initial_position=get_lowline_of_polylines(resource_polylines)
    )
    with app.app_context():
        db.session.add(new_course)
        db.session.commit()
        new_learner = Learner(
            name="Gururaj",
            cgpa=4.0,
            username="guru",
            password="guru"
        )
        db.session.add(new_learner)
        db.session.commit()
        new_enroll = Enroll(
            learner_id=1,
            course_id=1,
            x_coordinate=0.1,
            y_coordinate=0.1,
            polyline=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        db.session.add(new_enroll)
        db.session.commit()
        course_id = new_course.id
        print(new_course.to_dict())

    push_topics_to_db(topics, topicembedding, topic_polylines, course_id)
    pushResourcesToDB(resource_keylist, resource_embeddings,
                      resource_polylines, course_id)
    # new_polylines = []
    # for single_file in all_polylines:
    #     temp = [ max([single_file[i][j]['y'] for j in range(len(single_file[i]))]) for i in range(len(single_file))]
    #     new_polylines.append(temp)
    # breakpoint()

def add_TA(name, username, password):
    try:
        new_ta = TA(
            name=name,
            username=username,
            password=password
        )
        with app.app_context():
            db.session.add(new_ta)
            db.session.commit()
            print(f"Added TA: {new_ta.name}")
            ta_dict = new_ta.to_dict()
            return ta_dict
    except Exception as e:
        print(f"Error adding TA: {e}")
        db.session.rollback()  # Rollback in case of error

def add_ta_from_user(user_id):
    with app.app_context():
        user = User.query.get(user_id)
        new_ta = TA(
            name=user.name,
            username=user.username,
            password=user.password
        )
        db.session.add(new_ta)
        db.session.commit()
        ta_dict = new_ta.to_dict()
        print(f"newly added ta id: {new_ta.id}")
        user.ta_id = new_ta.id
        db.session.commit()
        return ta_dict



# signup User


def signup(name, username, password):
    user = add_user(name, username, password)
    return user 


def login(username, password):
    user = User.query.filter_by(username=username, password=password).first()

    if not user:
        print("User not present")
        return None

    data = user.to_dict()
    print("loggin in user:", data)

    return data


# teacher related

# create teacher
def add_teacher(user_id, name, username, password):
    with app.app_context():
        new_teacher = Teacher(
            name=name,
            username=username,
            password=password
        )
        db.session.add(new_teacher)
        db.session.commit()
        teacher_dict = new_teacher.to_dict()
        user = User.query.get(user_id)
        print(f"newly added teacher id: {new_teacher.id}")
        user.teacher_id = new_teacher.id
        db.session.commit()
        return teacher_dict

def add_teacher_from_user(user_id):
    with app.app_context():
        user = User.query.get(user_id)
        new_teacher = Teacher(
            name=user.name,
            username=user.username,
            password=user.password
        )
        db.session.add(new_teacher)
        db.session.commit()
        teacher_dict = new_teacher.to_dict()
        print(f"newly added teacher id: {new_teacher.id}")
        user.teacher_id = new_teacher.id
        db.session.commit()
        return teacher_dict

def teacher_course(id):
    teacher = Teacher.query.get(id)
    if not teacher:
        return jsonify({"error": "Teacher not found"}), 404

    assigned_courses = []
    courses=Course.query.filter(or_(
                Course.teacher_id == id,
                Course.teacher_id_1 == id,
                Course.teacher_id_2 == id
            )).all()
    for course in courses:

        assigned_courses.append({
            'course_id': course.id,
            'course_name': course.name,
            'course_description': course.description
        })

    return jsonify(assigned_courses)

def assign_teacher_course(teacher_id, course_id):
    with app.app_context():
        course = Course.query.get(course_id)
        if course :
            if course.teacher_id is None:
                course.teacher_id = teacher_id
            elif course.teacher_id_1 is None:
                course.teacher_id_1 = teacher_id
            elif course.teacher_id_2 is None:
                course.teacher_id_2 = teacher_id
            db.session.commit()
            course_dict = course.to_dict()
            return course_dict

def unassign_teacher_course(teacher_id, course_id):
    with app.app_context():
        course = Course.query.filter(Course.course_id == course_id,or_(
                Course.teacher_id == teacher_id,
                Course.teacher_id_1 == teacher_id,
                Course.teacher_id_2 == teacher_id
            )
        ).first()
        if course :
            if course.teacher_id == teacher_id:
                course.teacher_id = None
            elif course.teacher_id_1 == teacher_id:
                course.teacher_id_1 = None
            elif course.teacher_id_2 == teacher_id:
                course.teacher_id_2 = None
            db.session.commit()
            course_dict = course.to_dict()
            return course_dict

def teacher_course_unassigned(id):

    unassigned_courses = []
    courses=courses = Course.query.filter(or_(
        Course.teacher_id.is_(None),
        Course.teacher_id_1.is_(None),
        Course.teacher_id_2.is_(None)
    )).all()
    for course in courses:
        if course.teacher_id != id and course.teacher_id_1 != id and course.teacher_id_2 != id:
            unassigned_courses.append({
                'course_id': course.id,
                'course_name': course.name,
                'course_description': course.description
            })

    return jsonify(unassigned_courses)

#ta_related
def ta_course(id):
    ta_courses = []
    courses = Course.query.filter(or_(
        Course.ta_id == id,
        Course.ta_id_1 == id,
        Course.ta_id_2 == id
    )).all()

    for course in courses:
        ta_courses.append({
            'course_id': course.id,
            'course_name': course.name,
            'course_description': course.description
        })

    return jsonify(ta_courses)

def ta_course_unassigned(id):
    unassigned_courses = []
    courses = Course.query.filter(or_(
        Course.ta_id.is_(None),
        Course.ta_id_1.is_(None),
        Course.ta_id_2.is_(None)
    )).all()

    for course in courses:
        if course.ta_id != id and course.ta_id_1 != id and course.ta_id_2 != id:
            unassigned_courses.append({
                'course_id': course.id,
                'course_name': course.name,
                'course_description': course.description
            })

    return jsonify(unassigned_courses)


def user_enrolled_courses(userId: int):
    user = User.query.get(userId)
    enrolled_courses = []
    ta_course_ids = []
    if user.ta_id:
        ta=TA.query.get(user.ta_id)
        for teaches in ta.teaches:
            course = Course.query.get(teaches.course_id)
            if course:
                ta_course_ids.append(course.id)
                enrolled_courses.append({
                    'role': 'ta',
                    'course_id': course.id,
                    'course_name': course.name,
                    'course_description': course.description
                })
    if user.learner_id:
        learner = Learner.query.get(user.learner_id)
        for enrollment in learner.enrollments:
            course = Course.query.get(enrollment.course_id)
            if course and not course.id in ta_course_ids:
                enrolled_courses.append({
                    'role': 'learner',
                    'course_id': course.id,
                    'course_name': course.name,
                    'course_description': course.description
                })
    if user.teacher_id:
        courses=Course.query.filter(or_(
                    Course.teacher_id == user.teacher_id,
                    Course.teacher_id_1 == user.teacher_id,
                    Course.teacher_id_2 == user.teacher_id
                )).all()
        for course in courses:
            enrolled_courses.append({
                'role': 'teacher',
                'course_id': course.id,
                'course_name': course.name,
                'course_description': course.description
            })
    return jsonify(enrolled_courses)

# # learner related

def learner_course_enrolled(id):
    learner = Learner.query.get(id)
    if not learner:
        return jsonify({"error": "Learner not found"}), 404

    enrolled_courses = []
    for enrollment in learner.enrollments:
        course = Course.query.get(enrollment.course_id)
        if course:
            enrolled_courses.append({
                'course_id': course.id,
                'course_name': course.name,
                'course_description': course.description
            })

    return jsonify(enrolled_courses)

def ta_course_teached(id):
    ta=TA.query.get(id)
    if not ta:
        return jsonify({"error":"ta not found"}),404
    teached_course=[]
    for teaches in ta.teaches:
        course = Course.query.get(teaches.course_id)
        if course:
            teached_course.append({
                'course_id': course.id,
                'course_name': course.name,
                'course_description': course.description
            })
    return jsonify(teached_course)

def learner_polyline_enrolled(id):
    # Get the first contribution for the given enroll_id
    first_contribution = Contribution.query.filter_by(enroll_id=id).order_by(Contribution.id.asc()).first()

    # Get all polylines (excluding the first one since we handle it separately)
    polylines = Contribution.query.with_entities(Contribution.polyline).filter_by(enroll_id=id).order_by(Contribution.id.asc()).all()

    # Initialize the result list with the first contribution's prev_polyline
    polyline_list = [first_contribution.prev_polyline] if first_contribution else []

    # Add all other polylines
    polyline_list += [polyline[0] for polyline in polylines]

    return jsonify(polyline_list)


def enrolled_learner_data(id, id2):
    enroll = Enroll.query.filter_by(learner_id=id, course_id=id2).first()
    
    if not enroll:
        return jsonify({"error": "enroll not found"}), 404

    learner_name = enroll.learner.name if enroll.learner else "Unknown"
    
    print(enroll.x_coordinate, enroll.y_coordinate)

    return {
        "x_coordinate": float(enroll.x_coordinate),
        "y_coordinate": float(enroll.y_coordinate),
        "enroll_id": enroll.id,
        "polyline": enroll.polyline,
        "learner_name": learner_name,
        "accessible_resources": enroll.accessible_resources,
        "learner_id": enroll.learner_id,
        "course_id": enroll.course_id,
        "ta_id": enroll.ta_id  # 🔹 Added ta_id here
    }



def calculate_all_module_centroids(id):
    # Fetch all resources from the database
    resources = Resource.query.filter_by(course_id=id)

    # Dictionary to group resources by module_id and module name
    module_polylines = defaultdict(lambda: {"polylines": [], "module": None})

    # Group polylines by module_id and capture module name
    for resource in resources:
        if resource.polyline:  # Only add resources with polylines
            beta_scaled_polyline = create_beta_polyline(resource.polyline, resource.beta)
            module_polylines[resource.module_id]["polylines"].append(beta_scaled_polyline)
            module_polylines[resource.module_id]["module"] = resource.module

    # Create a list of objects (dictionaries) containing module_id, module name, and polyline
    module_data_list = []
    for module_id, module_data in module_polylines.items():
        polylines = module_data["polylines"]
        module = module_data["module"]
        if polylines:  # Only calculate if there are polylines
            centroid = calculate_centroid(polylines)
            feature_length = len(centroid)
            (tlen, theta) = rad_plot_axes(feature_length, 1, 1)
            centroid_list = rad_plot_poly(
                feature_length, [centroid], tlen, theta)
            print(f'centroid list is {centroid_list}')
            x_coordinate = centroid_list[0][0]
            y_coordinate = centroid_list[0][1]
            print(f'module x is {x_coordinate} module y is {y_coordinate}')
        else:
            centroid = None
            x_coordinate = 0
            y_coordinate = 0

        # Append each module's data as a dictionary to the list
        module_data_list.append({
            "module_id": module_id,
            "module": module,
            "x": float(x_coordinate),
            "y": float(y_coordinate),
        })

    return module_data_list


def enrolled_learners_by_course(course_id):
    # Query all enrollments for the given course
    enrollments = Enroll.query.filter_by(course_id=course_id).all()

    if not enrollments:
        return jsonify({"error": "enrollments not found"}), 404

    # Prepare a list to hold enrollment details
    enroll_data = []

    for enroll in enrollments:
        # Extract the learner's name from the relationship
        learner_name = enroll.learner.name if enroll.learner else "Unknown"

        # Add each enroll's details to the list
        enroll_data.append({
            "x_coordinate": float(enroll.x_coordinate),
            "y_coordinate": float(enroll.y_coordinate),
            "enroll_id": enroll.id,
            "polyline": enroll.polyline,
            "learner_name": learner_name,
            "ta_id": enroll.ta_id
        })

    # Return the list of enrollments
    return jsonify(enroll_data)


def user_recom_courses(user_id: int):
    user = User.query.get(user_id)
    enrolled_course_ids = []
    if user.learner_id:
        print("learner id found")
        learner = Learner.query.get(user.learner_id)
        for enrollment in learner.enrollments:
            enrolled_course_ids.append(enrollment.course_id)
    if user.teacher_id:
        print("teacher id found")
        courses=Course.query.filter(or_(
                Course.teacher_id == user.teacher_id,
                Course.teacher_id_1 == user.teacher_id,
                Course.teacher_id_2 == user.teacher_id
            )).all()
        for course in courses:
            enrolled_course_ids.append(course.id)
    if user.ta_id:
        print("ta id found")
        ta=TA.query.get(user.ta_id)
        for teaches in ta.teaches:
            enrolled_course_ids.append(teaches.course_id)
    recom_courses = Course.query.filter(Course.id.notin_(enrolled_course_ids)).all()
    data = []
    for c in recom_courses:
        data.append({
            'course_id': c.id,
            'course_name': c.name,
            'course_description': c.description,
        })
    return jsonify(data)


def learner_course_unenrolled(id):
    learner = Learner.query.get(id)
    if not learner:
        return jsonify({"error": "Learner not found"}), 404

    unenrolled_courses = []
    enrolled_course_ids = []

    for enrollment in learner.enrollments:
        course = Course.query.get(enrollment.course_id)
        if course:
            enrolled_course_ids.append(course.id)

    result = Course.query.filter(Course.id.notin_(enrolled_course_ids)).all()

    for course in result:
        if course:
            unenrolled_courses.append({
                'course_id': course.id,
                'course_name': course.name,
                'course_description': course.description
            })
    return jsonify(unenrolled_courses)

def ta_course_unteached(id):
    ta=TA.query.get(id)
    if not ta:
        return jsonify({"error": "ta not found"}), 404
    unteached_courses=[]
    teached_course_id=[]
    for teaches in ta.teaches:
        course = Course.query.get(teaches.course_id)
        if course:
            teached_course_id.append(course.id)
    result = Course.query.filter(Course.id.notin_(teached_course_id)).all()
    for course in result:
        if course:
            unteached_courses.append({
                'course_id': course.id,
                'course_name': course.name,
                'course_description': course.description
            })
    return jsonify(unteached_courses)


# Function to generate a polyline and coordinates for a quiz question

# @profile
def generate_question_polyline(quiz_id, question_text, course_id):
    # Step 1: Extract keywords from the question text
    (keywords_list, weight_list) = create_keywords_list([question_text])

    # Step 2: Create embeddings for the question keywords
    question_embeddings = create_resource_embeddings(keywords_list)
    # Free memory after creating question embeddings
    del keywords_list, weight_list  # If not needed further
    gc.collect()
    # Step 3: Fetch topic embeddings for the course
    with app.app_context():
        topic_embedding = db.session.query(
            Topic.embedding).filter_by(course_id=course_id).all()
        if not topic_embedding:
            raise IndexError("No topic embeddings found for the course.")
    # Free memory after fetching topic embeddings
    gc.collect()
    # Step 4: Create polylines by comparing question embeddings with course/topic embeddings
    question_polylines = create_resource_polylines(
        topic_embedding, question_embeddings, 0)

    # Free memory after creating polylines
    del topic_embedding, question_embeddings  # If not needed further
    gc.collect()
    # Step 5: Generate centroid coordinates for the question
    feature_length = len(question_polylines[0])
    (tlen, theta) = rad_plot_axes(feature_length, 1, 1)
    centroid_list = rad_plot_poly(
        feature_length, [question_polylines[0]], tlen, theta)

    # Step 6: Flatten the polyline list (assuming it's a list of lists)
    flat_polyline = [item for sublist in question_polylines[0] for item in sublist]

    # Ensure the polyline has exactly 12 elements, pad or truncate if necessary
    flat_polyline = (flat_polyline[:12] + [0] * (12 - len(flat_polyline))) if len(flat_polyline) < 12 else flat_polyline[:12]

    # Return the polyline and coordinates
    return {
        "polyline": flat_polyline,
        "x_coordinate": centroid_list[0][0],
        "y_coordinate": centroid_list[0][1]
    }



# Function to add a new quiz
def add_quiz(title, description, total_questions):
    new_quiz = Quiz(
        title=title,
        description=description,
        total_questions=total_questions
    )
    with app.app_context():
        db.session.add(new_quiz)
        db.session.commit()
        quiz_dict = new_quiz.to_dict()
    return quiz_dict['id']

# Function to add a question to a quiz with polyline and coordinate generation


def add_question(quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, course_id):
    # Generate polyline and coordinates for the question
    polyline_data = generate_question_polyline(
        quiz_id, question_text, course_id)

    # Add the question to the database
    new_question = Question(
        quiz_id=quiz_id,
        question_text=question_text,
        option_a=option_a,
        option_b=option_b,
        option_c=option_c,
        option_d=option_d,
        correct_answer=correct_answer,
        polyline=polyline_data["polyline"],
    )
    # print(f'Qn : x = {polyline_data['x_coordinate']}, y = {polyline_data['y_coordinate']}')
    # (0.373174196, 0.373522988) = (x, y) for Quiz

    with app.app_context():
        db.session.add(new_question)
        db.session.commit()
        new_quiz_dict = new_question.to_dict()
    return new_quiz_dict
# @profile
def quiz_adder(quiz_file, questions_file, position_scaler = 1):
    # Read the quiz and questions Excel sheets
    quiz_df = pd.read_excel(quiz_file)
    questions_df = pd.read_excel(questions_file)

    # Loop through each quiz entry in the quiz_df
    for _, quiz_row in quiz_df.iterrows():
        # Add the quiz
        quiz_id = add_quiz(
            title=quiz_row['title'],
            description=quiz_row['description'],
            total_questions=quiz_row['total_questions']
        )

        # Get course_id from the quiz file
        course_id = quiz_row['course_id']

        # Initialize a list to store all question polylines for the current quiz
        all_question_polylines = []

        # Loop through the related questions and add them
        related_questions = questions_df[questions_df['quiz_id'] == quiz_row['quiz_id']]
        for _, question_row in related_questions.iterrows():
            # Generate polyline and coordinates for each question
            polyline_data = generate_question_polyline(
                quiz_id,
                question_row['question_description'],
                course_id
            )

            # Append the question polyline to the list
            all_question_polylines.append(polyline_data['polyline'])

            # Add the question to the quiz
            add_question(
                quiz_id,
                question_row['question_description'],
                f"A) {question_row['option_a']}",
                f"B) {question_row['option_b']}",
                f"C) {question_row['option_c']}",
                f"D) {question_row['option_d']}",
                question_row['correct_answer'],
                course_id
            )

        # Compute the quiz_polyline as the average of all question polylines
        quiz_polyline, x_coord, y_coord = compute_agg_polyline_quiz(all_question_polylines)

        print(f'>>>>>>>>>>>>>>>>>>>>>>>>> x: {x_coord}, y: {y_coord} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<')


        # Safely handle missing 'keywords' by checking if the key exists
        keywords = quiz_row['keywords'] if 'keywords' in quiz_row else ''

        # Call pushQuizToResourceInDB with the appropriate parameters
        pushQuizToResourceInDB(
            name=quiz_row['title'],
            description=quiz_row['description'],
            keywords=keywords,  # Use the default empty string if 'keywords' is not present
            polyline=quiz_polyline,
            x_coordinate = x_coord*position_scaler, #0.3875119968,  # Hardcoded x_coordinate as mentioned
            y_coordinate = y_coord*position_scaler, #0.3596312118,  # Hardcoded y_coordinate as mentioned
            course_id=course_id,
            module_id=quiz_row['module_id'],  # Assuming the quiz row has 'module_id'
            submodule_id=quiz_row['submodule_id'],  # Assuming the quiz row has 'submodule_id'
            module=quiz_row['module'],  # Assuming the quiz row has 'module'
            index=quiz_row['index'],  # Assuming the quiz row has 'index'
            link=quiz_row['quiz_id'],  # Assuming the quiz row has 'link'
            beta=0,
            type=2
        )

        # Print or save the quiz_polyline (optionally store it in the DB if needed)
        print(f'Quiz Polyline for quiz_id {quiz_id}: {quiz_polyline}')


def compute_agg_polyline_quiz(polylines):
    """
    Computes the aggregate polyline (highline) of all polylines for a quiz.
    Each polyline is expected to be a list of length 12.
    """

    if len(polylines) == 0:
        return [0] * 12  # Return a default polyline if no polylines are found

    quiz_polyline = get_highline_of_polylines(polylines)

    # Convert and flatten the new polyline
    new_polyline_list = flatten_list(quiz_polyline)

    if not new_polyline_list or not isinstance(new_polyline_list, list):
        raise ValueError("Invalid new polylines list")

    # Calculate the updated centroid
    feature_length = len(new_polyline_list)
    (tlen, theta) = rad_plot_axes(feature_length, 1, 1)
    centroid_list = rad_plot_poly(feature_length, [new_polyline_list], tlen, theta)


    # Use the get_highline_of_polylines function to compute the highline
    return quiz_polyline, centroid_list[0][0], centroid_list[0][1]

def compute_average_polyline(polylines):
    """
    Computes the element-wise average of all polylines.
    Each polyline is expected to be a list of length 12.
    """
    num_polylines = len(polylines)
    if num_polylines == 0:
        return [0] * 12  # Return a default polyline if no polylines are found

    # Initialize a list of zeros for accumulating the sum of each element
    avg_polyline = [0] * 12

    # Sum each element across all polylines
    for polyline in polylines:
        for i in range(12):
            avg_polyline[i] += polyline[i]

    # Compute the average by dividing by the number of polylines
    avg_polyline = [x / num_polylines for x in avg_polyline]

    return avg_polyline

def quiz_adder_from_json(data, position_scaler=1):
    """
    Adds a quiz and its related questions from a JSON payload.

    Args:
        data (dict): JSON payload containing quiz and question data.
        position_scaler (float): Multiplier for position scaling (default is 1).
    """
    try:
        quiz_entry = data

        # Add the quiz and retrieve its ID
        quiz_id = add_quiz(
            title=quiz_entry['title'],
            description=quiz_entry['description'],
            total_questions=quiz_entry['total_questions']
        )

        # Get course_id and related metadata
        course_id = quiz_entry['course_id']
        module_id = quiz_entry['module_id']
        submodule_id = quiz_entry['submodule_id']
        index = quiz_entry['index']
        keywords = quiz_entry.get('keywords', '')

        # Initialize a list to store all question polylines for the current quiz
        all_question_polylines = []

        # Add related questions for this quiz
        for question in quiz_entry.get('questions', []):
            # Generate polyline and coordinates for each question
            polyline_data = generate_question_polyline(
                quiz_id,
                question['question_description'],
                course_id
            )

            # Append the question polyline to the list
            all_question_polylines.append(polyline_data['polyline'])

            # Add the question to the quiz
            add_question(
                quiz_id=quiz_id,
                question_text=question['question_description'],
                option_a=f"A) {question['option_a']}",
                option_b=f"B) {question['option_b']}",
                option_c=f"C) {question['option_c']}",
                option_d=f"D) {question['option_d']}",
                correct_answer=question['correct_answer'],
                course_id=course_id
            )

        # Compute the quiz_polyline as the average of all question polylines
        quiz_polyline, x_coord, y_coord = compute_agg_polyline_quiz(all_question_polylines)

        # Add quiz to the resource database
        pushQuizToResourceInDB(
            name=quiz_entry['title'],
            description=quiz_entry['description'],
            keywords=keywords,
            polyline=quiz_polyline,
            x_coordinate=x_coord * position_scaler,
            y_coordinate=y_coord * position_scaler,
            course_id=course_id,
            module_id=module_id,
            submodule_id=submodule_id,
            module=quiz_entry['module'],
            index=index,
            link=quiz_id,  # Use the dynamically generated quiz_id
            beta=quiz_entry['difficulty'],
            type=2
        )

        # Debug logs
        print(f"Quiz Polyline for quiz_id {quiz_id}: {quiz_polyline}")
        print(f">>>>>>>>>>>>>>>>>>>>>>> x: {x_coord}, y: {y_coord} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")

    except Exception as e:
        print(f"Error adding quiz from JSON: {str(e)}")

    return x_coord, y_coord