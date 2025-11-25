import React, { useEffect, useState } from "react";
import useGetRecomCourses from "./hooks/useGetRecomCourses";
import UserInfo from "./components/UserInfo";
import CoursesList from "./components/CoursesList";
import "./css/userDashboard.css";
import useGetEnrolledCourses from "./hooks/useGetEnrolledCourses";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const UserDashboard = ({ setCourseId, setIsLoggedIn }) => {
    const navigate = useNavigate();
    const { data, loading: enrollLoading, getEnrollCourseData } = useGetEnrolledCourses();
    const { allCourses, loading: allLoading, getAllCourseData } = useGetRecomCourses();
    const [refresh, setRefresh] = useState(true);

    useEffect(() => {
        if (refresh) {
            getAllCourseData();
            getEnrollCourseData();
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
                <Button title="Add Course" onClick={() => { navigate("/add-course") }}>
                    <span style={{ fontSize: 'large' }}>+</span> Course
                </Button>
            </UserInfo>
            <CoursesList
                title={"Your Courses"}
                data={data}
                enroll={true}
                loading={enrollLoading}
                setRefresh={setRefresh}
                setCourseId={setCourseId}
            />
            <CoursesList
                title={"Recommended Courses"}
                data={allCourses}
                enroll={false}
                loading={allLoading}
                setRefresh={setRefresh}
            />
        </div>
    );
};

export default UserDashboard;
