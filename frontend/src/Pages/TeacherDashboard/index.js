// The TeacherDashboard component displays a teacher's assigned courses and a list of unassigned courses.
// It utilizes custom hooks to fetch this data and presents it using the CoursesList component. 
// Teachers can navigate to their courses and also see and assign themselves to unassigned courses. An "Add Course" button is also available.
import React, { useEffect, useState } from "react";
import useGetTeacherCourses from "./hooks/useGetTeacherCourses";
import useGetUnassignedCourses from "./hooks/useGetUnassignedCourses";
import UserInfo from "../UserDashboard/components/UserInfo";
import CoursesList from "./components/CoursesList";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const TeacherDashboard = ({ setCourseId, setIsLoggedIn }) => {
    const navigate = useNavigate();
    const {
        teacherCourses,
        loading: teacherCourseLoading,
        getTeacherCourseData,
    } = useGetTeacherCourses();
    const {
        unassignedCourses,
        loading: unassignedLoading,
        getUnassignedCourseData,
    } = useGetUnassignedCourses();
    const [refresh, setRefresh] = useState(true);

    useEffect(() => {
        if (refresh && localStorage.getItem("teacher_id")) {
            getTeacherCourseData();
            getUnassignedCourseData();
            setRefresh(false);
        }
    }, [refresh]);

    return (
        <div
            style={{
                width: "100%",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "white",
                boxSizing: "border-box",
            }}
        >
            <UserInfo setIsLoggedIn={setIsLoggedIn}>
                <Button title="Add Course" onClick={() => { navigate("/t/add-course") }}>
                    <span style={{ fontSize: 'large' }}>+</span> Course
                </Button>
            </UserInfo>
            <CoursesList
                title={"Your Courses"}
                data={teacherCourses}
                assign={true}
                loading={teacherCourseLoading}
                setRefresh={setRefresh}
                setCourseId={setCourseId}
            />
            <CoursesList
                title={"Unassigned Courses"}
                data={unassignedCourses}
                assign={false}
                loading={unassignedLoading}
                setRefresh={setRefresh}
            />
        </div>
    );
};

export default TeacherDashboard;
