// The CourseItem component displays a course as a card with a thumbnail, title, and description.
// If the user is enrolled, clicking navigates them to the course page, setting the user type in local storage. 
// If not enrolled, an "Enroll" button triggers a modal for course enrollment. A badge indicates the user's role in the course if applicable.
import { Button } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import courseBook from "../coursThumbnail.jpg";
import EnrollCourseModal from "./EnrollCourseModal";
import { Badge } from "react-bootstrap";

const CourseItem = ({ data, enroll, setRefresh, setCourseId }) => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const handleCourseView = () => {
    if (enroll) {
      console.log("abt courseId", data);
      setCourseId(data.course_id);
      localStorage.setItem("currentCourseId", data.course_id);
      if (data.role) {
        const role = data.role;
        localStorage.setItem("type", role.toUpperCase());
        if (role === 'teacher') navigate("/t/course"); 
        else if (role ==='ta') navigate("/TA/course");
        else navigate("/course");
        return;
      }
      navigate("/course");
    }
  };

  const RoleBadge = () => {
    const role = data.role.toUpperCase();
    const bg = role === 'TEACHER' ? "success" : (
      role === 'LEARNER' ? "primary" : "warning"
    );
    return (
      <Badge
        bg={bg}
        style={{ position: 'absolute', right: 0, fontSize: 'large' }}
      >
        {role}
      </Badge>
    );
  }

  const handleEnroll = () => setShow(true);
  return (
    <div className="course-card" onClick={handleCourseView}>
      <div className="course-thumbnail">
        {data.role && <RoleBadge />}
        <img
          src={courseBook}
          width="100%"
          height={180}
          alt={""}
          style={{ borderTopLeftRadius: "7px", borderTopRightRadius: "7px" }}
        />
      </div>
      <div className="course-details">
        <div className="course-title">{data.course_name}</div>
        <div className="course-desc">{data.course_description}</div>
        {!enroll && (
          <>
            <div className="course-action">
              <Button variant="contained" size="small" onClick={handleEnroll}>
                Enroll
              </Button>
            </div>
            <EnrollCourseModal
              course={data}
              show={show}
              setShow={setShow}
              setRefresh={setRefresh}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CourseItem;
