
import React, { useEffect, useState } from "react";
import useGetAllCourses from "./hooks/useGetAllCourses";
import UserInfo from "./components/UserInfo";
import CoursesList from "./components/CoursesList";
// import "./css/taDashboard.css";
import useGetAssignedCourses from "./hooks/useGetAssignedCourses";

const TADashboard = ({ setCourseId, setIsLoggedIn }) => {
  const {
    data,
    loading: assignedLoading,
    getAssignedCourseData,
  } = useGetAssignedCourses(localStorage.getItem("ta_id")); //make sure to pass TA  ID.
  const { allCourses, loading: allLoading, getAllTACourseData } = useGetAllCourses();
  const [refresh, setRefresh] = useState(true);

  useEffect(() => {
    if (refresh) {
      getAllTACourseData();
      getAssignedCourseData();
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
      <UserInfo setIsLoggedIn={setIsLoggedIn} />
      <CoursesList
        title={"Assigned Courses"}
        data={data}
        teach={true}
        enroll={false}
        loading={assignedLoading}
        setRefresh={setRefresh}
        setCourseId={setCourseId}
      />
      <CoursesList
        title={"Available Courses"}
        data={allCourses}
        enroll={false}
        loading={allLoading}
        setRefresh={setRefresh}
      />
      {/* <CoursesList
        title={"Available Courses"}
        data={allCourses}
        enroll={false}
        loading={allLoading}
        setRefresh={setRefresh}
      /> */}
    </div>
  );
};

export default TADashboard;