# This file defines the SQLAlchemy models for the application's database. 
# It includes tables for Resource, Topic, User, Learner, TA, Teacher, Course, Activity, Enroll, Contribution, TAD, TAT, Module, Quiz, Question, and UserQuiz. 

from datetime import datetime, timezone
import flask_sqlalchemy
from sqlalchemy import Enum, Numeric
from init import app
from flask_mysqldb import MySQL

# ---- SQLAlchemy + MySQL configuration ----

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://otageri:784512963@localhost/navigated_learning'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

db: flask_sqlalchemy.SQLAlchemy = flask_sqlalchemy.SQLAlchemy(app)
mysql = MySQL(app)

from sqlalchemy import text

with app.app_context():
    print("=== SQLALCHEMY DB URI ===", app.config['SQLALCHEMY_DATABASE_URI'])
    try:
        result = db.session.execute(text("SELECT DATABASE(), @@hostname, @@port")).fetchone()
        print("=== ACTUAL DB CONNECTION ===")
        print("DATABASE():", result[0])
        print("@@hostname:", result[1])
        print("@@port:", result[2])
    except Exception as e:
        print("ERROR CHECKING DB CONNECTION:", e)



# -------------------- MODELS --------------------

class Resource(db.Model):
    __tablename__ = "resource"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(2048))
    description = db.Column(db.JSON)
    keywords = db.Column(db.JSON)
    polyline = db.Column(db.JSON)
    x_coordinate = db.Column(Numeric(20, 10))
    y_coordinate = db.Column(Numeric(20, 10))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))
    module_id = db.Column(db.Integer)
    submodule_id = db.Column(db.Integer)
    index = db.Column(db.Integer)
    type = db.Column(db.Integer)
    link = db.Column(db.String(2046))
    module = db.Column(db.String(2048))
    beta = db.Column(db.Integer)
    # embedding = db.Column(db.JSON)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'keywords': self.keywords,
            'polyline': self.polyline,
            'x': float(self.x_coordinate) if self.x_coordinate is not None else None,
            'y': float(self.y_coordinate) if self.y_coordinate is not None else None,
            'course_id': self.course_id,
            'module_id': self.module_id,
            'submodule_id': self.submodule_id,
            'index': self.index,
            'type': self.type,
            # 'embedding': self.embedding,
            'link': self.link,
            'module': self.module,
            'beta': self.beta,
        }


class Topic(db.Model):
    __tablename__ = "topic"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(250))
    description = db.Column(db.JSON)
    keywords = db.Column(db.JSON)
    polyline = db.Column(db.JSON)
    x_coordinate = db.Column(Numeric(20, 10))
    y_coordinate = db.Column(Numeric(20, 10))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))
    embedding = db.Column(db.JSON)
    module_id = db.Column(db.Integer, db.ForeignKey('module.id'))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'keywords': self.keywords,
            'polyline': self.polyline,
            'x_coordinate': float(self.x_coordinate) if self.x_coordinate is not None else None,
            'y_coordinate': float(self.y_coordinate) if self.y_coordinate is not None else None,
            'course_id': self.course_id,
            'module_id': self.module_id
            # 'embedding': self.embedding
        }


class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    registered_date = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    name = db.Column(db.String(250))
    username = db.Column(db.String(50))
    password = db.Column(db.String(50))
    teacher_id = db.Column(db.Integer, db.ForeignKey('teacher.id'), nullable=True)
    learner_id = db.Column(db.Integer, db.ForeignKey('learner.id'), nullable=True)
    ta_id = db.Column(db.Integer, db.ForeignKey('ta.id'), nullable=True)

    teacher = db.relationship("Teacher", backref="users_as_teacher", lazy=True)
    learner = db.relationship("Learner", backref="users_as_learner", lazy=True)
    ta = db.relationship("TA", backref="users_as_ta", lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'registered_date': self.registered_date.isoformat() if self.registered_date else None,
            'name': self.name,
            'username': self.username,
            'password': self.password,
            'teacher_id': self.teacher_id,
            'learner_id': self.learner_id,
            'ta_id': self.ta_id
        }


class Learner(db.Model):
    __tablename__ = "learner"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    registered_date = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    name = db.Column(db.String(250))
    cgpa = db.Column(Numeric(20, 10))
    username = db.Column(db.String(50))
    password = db.Column(db.String(50))
    ta_id = db.Column(db.Integer, nullable=True)  # New field
    enrollments = db.relationship('Enroll', backref='learner', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'registered_date': self.registered_date.isoformat() if self.registered_date else None,
            'name': self.name,
            'cgpa': self.cgpa,
            'username': self.username,
            'password': self.password,
            # 'ta_id': self.ta_id
        }


class TA(db.Model):
    __tablename__ = "ta"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    registered_date = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    name = db.Column(db.String(250))
    username = db.Column(db.String(50))
    password = db.Column(db.String(50))
    teaches = db.relationship('TAT', backref='ta', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'registered_date': self.registered_date.isoformat() if self.registered_date else None,
            'name': self.name,
            'username': self.username,
            'password': self.password
        }


class Teacher(db.Model):
    __tablename__ = "teacher"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    registered_date = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    name = db.Column(db.String(250))
    username = db.Column(db.String(50))
    password = db.Column(db.String(50))

    def to_dict(self):
        return {
            'id': self.id,
            'registered_date': self.registered_date.isoformat() if self.registered_date else None,
            'name': self.name,
            'username': self.username,
            'password': self.password
        }


class Course(db.Model):
    __tablename__ = "course"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(250))
    description = db.Column(db.JSON)
    initial_position = db.Column(db.JSON)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teacher.id'))
    teacher_id_1 = db.Column(db.Integer, db.ForeignKey('teacher.id'))
    teacher_id_2 = db.Column(db.Integer, db.ForeignKey('teacher.id'))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'initial_position': self.initial_position,
            'teacher_id': self.teacher_id,
            'teacher_id_1': self.teacher_id_1,
            'teacher_id_2': self.teacher_id_2,
        }


class Description(db.Model):
    __tablename__ = "description"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    description = db.Column(db.Text, nullable=False)
    ta_id = db.Column(db.Integer, db.ForeignKey('ta.id'), nullable=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=True)

    ta = db.relationship('TA', backref='descriptions', lazy=True)
    course = db.relationship('Course', backref='descriptions', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'ta_id': self.ta_id,
            'course_id': self.course_id
        }


class ExitPoint(db.Model):
    __tablename__ = 'exit_point'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    description = db.Column(db.JSON, nullable=True)
    polyline = db.Column(db.Text, nullable=True)
    x = db.Column(db.Numeric(10, 6), nullable=True)
    y = db.Column(db.Numeric(10, 6), nullable=True)

    course = db.relationship('Course', backref=db.backref('exit_points', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'description': self.description,
            'polyline': self.polyline,
            'x': float(self.x) if self.x is not None else None,
            'y': float(self.y) if self.y is not None else None
        }


class Activity(db.Model):
    __tablename__ = "activity"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    time = db.Column(db.DateTime, default=datetime.utcnow)
    type_id = db.Column(db.Integer)
    type = db.Column(db.String(250))
    link = db.Column(db.String(250))
    name = db.Column(db.String(250))
    enroll_id = db.Column(db.Integer, db.ForeignKey('enroll.id'))
    resource_id = db.Column(db.Integer, db.ForeignKey('resource.id'))
    contribution_id = db.Column(db.Integer, db.ForeignKey('contribution.id'))
    x_coordinate = db.Column(Numeric(20, 10))
    y_coordinate = db.Column(Numeric(20, 10))

    def to_dict(self):
        return {
            'id': self.id,
            'time': self.time if self.time else None,
            'type_id': self.type_id,
            'enroll_id': self.enroll_id,
            'resource_id': self.resource_id,
            'link': self.link,
            'name': self.name,
            'type': self.type,
            'contribution_id': self.contribution_id,
            'x': float(self.x_coordinate) if self.x_coordinate is not None else None,
            'y': float(self.y_coordinate) if self.y_coordinate is not None else None,
        }


class Enroll(db.Model):
    __tablename__ = "enroll"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    learner_id = db.Column(db.Integer, db.ForeignKey('learner.id'))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))
    x_coordinate = db.Column(Numeric(20, 10))
    y_coordinate = db.Column(Numeric(20, 10))
    polyline = db.Column(db.JSON)
    accessible_resources = db.Column(db.JSON)
    ta_id = db.Column(db.Integer, db.ForeignKey('ta.id'))

    def to_dict(self):
        return {
            'id': self.id,
            'learner_id': self.learner_id,
            'course_id': self.course_id,
            'x_coordinate': self.x_coordinate,
            'y_coordinate': self.y_coordinate,
            'polyline': self.polyline,
            'accessible_resources': self.accessible_resources,
            'ta_id': self.ta_id
        }


class SummaryCoordinates(db.Model):
    __tablename__ = 'summary_coordinates'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    enroll_id = db.Column(db.Integer, db.ForeignKey('enroll.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)

    # NEW: this summary is for a specific topic of that course
    topic_id = db.Column(db.Integer, db.ForeignKey('topic.id'), nullable=True)

    summary = db.Column(db.JSON)
    polyline = db.Column(db.String(1024))
    x_coordinate = db.Column(db.Numeric(10, 6))
    y_coordinate = db.Column(db.Numeric(10, 6))

    # cluster assignment (unchanged)
    cluster_id = db.Column(db.Integer, db.ForeignKey('summary_cluster.id'), nullable=True)

    # relationships
    topic = db.relationship('Topic', backref=db.backref('summaries', lazy=True))
    cluster = db.relationship('SummaryCluster', backref=db.backref('summaries', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'enroll_id': self.enroll_id,
            'course_id': self.course_id,
            'topic_id': self.topic_id,
            'summary': self.summary,
            'polyline': self.polyline,
            'x': float(self.x_coordinate) if self.x_coordinate is not None else None,
            'y': float(self.y_coordinate) if self.y_coordinate is not None else None,
            'cluster_id': self.cluster_id,
        }




class Contribution(db.Model):
    __tablename__ = "contribution"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    enroll_id = db.Column(db.Integer, db.ForeignKey('enroll.id'))
    submitted_on = db.Column(db.DateTime, default=datetime.utcnow)
    contribution_content = db.Column(db.TEXT)
    description = db.Column(db.JSON)
    prev_polyline = db.Column(db.JSON)
    polyline = db.Column(db.JSON)
    x_coordinate = db.Column(Numeric(20, 10))
    y_coordinate = db.Column(Numeric(20, 10))
    contribution_polyline = db.Column(db.JSON)
    grade = db.Column(Numeric(20, 10), nullable=True)
    is_graded = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'enroll_id': self.enroll_id,
            'submitted_on': self.submitted_on.isoformat() if self.submitted_on else None,
            'contribution_content': self.contribution_content,
            'description': self.description,
            'prev_polyline': self.prev_polyline,
            'polyline': self.polyline,
            'x_coordinate': float(self.x_coordinate) if self.x_coordinate else None,
            'y_coordinate': float(self.y_coordinate) if self.y_coordinate else None,
            'contribution_polyline': self.contribution_polyline,
            'grade': self.grade,
            'is_graded': self.is_graded,
        }


class TAD(db.Model):
    __tablename__ = "tad"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ta_id = db.Column(db.Integer, db.ForeignKey('ta.id', ondelete="CASCADE", onupdate="CASCADE"))
    description = db.Column(db.JSON)
    keywords = db.Column(db.JSON)
    polyline = db.Column(db.JSON)
    x_coordinate = db.Column(Numeric(20, 10))
    y_coordinate = db.Column(Numeric(20, 10))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id', ondelete="CASCADE", onupdate="CASCADE"))
    embedding = db.Column(db.JSON)

    def to_dict(self):
        return {
            'id': self.id,
            'ta_id': self.ta_id,
            'description': self.description,
            'keywords': self.keywords,
            'polyline': self.polyline,
            'x_coordinate': float(self.x_coordinate) if self.x_coordinate else None,
            'y_coordinate': float(self.y_coordinate) if self.y_coordinate else None,
            'course_id': self.course_id,
            'embedding': self.embedding
        }


class TAT(db.Model):
    __tablename__ = "tat"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ta_id = db.Column(db.Integer, db.ForeignKey('ta.id', ondelete="CASCADE", onupdate="CASCADE"))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id', ondelete="CASCADE", onupdate="CASCADE"))
    x_coordinate = db.Column(Numeric(20, 10))
    y_coordinate = db.Column(Numeric(20, 10))
    polyline = db.Column(db.JSON)

    def to_dict(self):
        return {
            'id': self.id,
            'ta_id': self.ta_id,
            'course_id': self.course_id,
            'x_coordinate': float(self.x_coordinate) if self.x_coordinate else None,
            'y_coordinate': float(self.y_coordinate) if self.y_coordinate else None,
            'polyline': self.polyline
        }


class Module(db.Model):
    __tablename__ = "module"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(250))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id', ondelete="CASCADE", onupdate="CASCADE"))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'course_id': self.course_id
        }


class Quiz(db.Model):
    __tablename__ = "quiz"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    total_questions = db.Column(db.Integer, nullable=False)
    questions = db.relationship('Question', backref='quiz', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'total_questions': self.total_questions
        }


class Question(db.Model):
    __tablename__ = "question"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.String(255))
    option_b = db.Column(db.String(255))
    option_c = db.Column(db.String(255))
    option_d = db.Column(db.String(255))
    correct_answer = db.Column(db.String(1), nullable=False)
    polyline = db.Column(db.JSON)

    def to_dict(self):
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'question_text': self.question_text,
            'option_a': self.option_a,
            'option_b': self.option_b,
            'option_c': self.option_c,
            'option_d': self.option_d,
            'correct_answer': self.correct_answer
        }


class UserQuiz(db.Model):
    __tablename__ = "user_quiz"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    score = db.Column(db.Numeric(5, 2))
    status = db.Column(Enum('completed', 'in-progress', name='quiz_status'), nullable=False)
    attempt_date = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'quiz_id': self.quiz_id,
            'score': self.score,
            'status': self.status,
            'attempt_date': self.attempt_date.isoformat() if self.attempt_date else None
        }
# models.py (add near other models)

class SummaryCluster(db.Model):
    __tablename__ = "summary_cluster"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)

    # NEW: clusters are per topic inside a course
    topic_id = db.Column(db.Integer, db.ForeignKey('topic.id'), nullable=True)

    cluster_index = db.Column(db.Integer, nullable=False)  # KMeans label: 0,1,2,...
    centroid_x = db.Column(db.Numeric(10, 6), nullable=True)
    centroid_y = db.Column(db.Numeric(10, 6), nullable=True)
    top_keywords = db.Column(db.JSON, nullable=True)

    course = db.relationship('Course', backref=db.backref('summary_clusters', lazy=True))
    topic = db.relationship('Topic', backref=db.backref('summary_clusters', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'topic_id': self.topic_id,
            'cluster_index': self.cluster_index,
            'centroid_x': float(self.centroid_x) if self.centroid_x is not None else None,
            'centroid_y': float(self.centroid_y) if self.centroid_y is not None else None,
            'top_keywords': self.top_keywords or [],
        }


# IMPORTANT: we are NOT calling db.create_all() here,
# because your tables already exist in MySQL and are managed separately.
