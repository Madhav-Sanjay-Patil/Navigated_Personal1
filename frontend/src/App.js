// Main component managing authentication and routing for different user roles (learner, teacher, TA).
import React, { useState } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    NavLink,
    Navigate,
    Link,
} from "react-router-dom";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import "./App.css";
import Dashboard from "./Components/Dashboard";
import UserDashboard from "./Pages/UserDashboard";
import SummaryExamples from "./Components/SummaryExamples";
import PolylinesList from "./Components/PolylinesList";
import Quiz from "./Components/Quiz";
import CreateQuiz from "./Components/CreateQuiz";
import TADashboard from "./Pages/TADashboard";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import TeacherDashboard from "./Pages/TeacherDashboard";
import TeacherNavigation from "./Pages/TeacherNavigation";
import TANavigation from "./Pages/TANavigation";

import Page404 from "./Pages/Page404";
import AddCourse from "./Pages/AddCourse";
import QuizDetails from "./Components/QuizDetails";
import ParentComponent from "./Components/ParentComponent";
import Simulator from "./Pages/Simulator";

library.add(faLocationCrosshairs);

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [courseId, setCourseId] = useState(0);
    const [enrolledPolylines, setEnrolledPolylines] = useState([]);
    const [topicData, setTopicData] = useState([]);
    const [enrolledLearner, setEnrolledLearner] = useState({
        accessible_resources: [1, 2, 3, 4],
        course_id: 1,
        learner_id: 1,
        learner_name: "Gururaj",
    });

    return (
        <Router>
            <div className="app">
                {!isLoggedIn && (
                    <div className="auth-card">
                        <div className="auth-nav">
                            <NavLink
                                to="/"
                                className={({ isActive }) => (isActive ? "active" : "")}
                            >
                                Sign In
                            </NavLink>
                            <NavLink
                                to="/signup"
                                className={({ isActive }) => (isActive ? "active" : "")}
                            >
                                Sign Up
                            </NavLink>
                        </div>
                        <Routes>
                            <Route
                                path="/"
                                element={<Login setIsLoggedIn={setIsLoggedIn} />}
                            />
                            <Route
                                path="/signup"
                                element={<Signup setIsLoggedIn={setIsLoggedIn} />}
                            />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </div>
                )}
                {isLoggedIn && (
                    <Routes>
                        {/* common routes */}
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                        <Route
                            path="/dashboard"
                            element={<UserDashboard setCourseId={setCourseId} setIsLoggedIn={setIsLoggedIn} />}
                        />
                        <Route path="/polylines-list" element={<PolylinesList topicData={topicData} />} />
                        <Route path="/quiz" element={<Quiz />} />
                        <Route path="/create-quiz" element={<CreateQuiz />} />
                        <Route path="/quiz/attempt/:userId" element={<QuizDetails />} />
                        <Route path="/add-course" element={<AddCourse />} />
                        <Route path="/simulator" element={<Simulator />} />

                        
                        {/* learner routes */}
                        <Route
                            path="/course"
                            element={
                                <Dashboard
                                    setIsLoggedIn={setIsLoggedIn}
                                    courseId={courseId}
                                    setCourseId={setCourseId}
                                    topicData={topicData}
                                    setTopicData={setTopicData}
                                    setEnrolledPolylines={setEnrolledPolylines}
                                />
                            }
                        />
                        <Route path="/summary-examples" element={<SummaryExamples />} />
                        <Route
                            path="/learner-activity"
                            element={<ParentComponent enrolledLearner={enrolledLearner} />}
                        />
                        
                        
                        {/* teacher routes */}
                        <Route
                            path="/t/course"
                            element={
                                <TeacherNavigation
                                    setIsLoggedIn={setIsLoggedIn}
                                    courseId={courseId}
                                    setCourseId={setCourseId}
                                    topicData={topicData}
                                    setTopicData={setTopicData}
                                    setEnrolledPolylines={setEnrolledPolylines}
                                />
                            }
                        />


                        {/* ta routes */}
                        <Route
                            path="/TA/course"
                            element={
                                <TANavigation
                                    setIsLoggedIn={setIsLoggedIn}
                                    courseId={courseId}
                                    setCourseId={setCourseId}
                                    topicData={topicData}
                                    setTopicData={setTopicData}
                                    setEnrolledPolylines={setEnrolledPolylines}
                                />
                            }
                        />
                        <Route path="/ta-activity" element={<ParentComponent enrolledLearner={enrolledLearner} />} />

                        
                        {/* 404 */}
                        <Route path="*" element={<Page404 />} />
                    </Routes>
                )}
            </div>
        </Router>
    );
}

export default App;
