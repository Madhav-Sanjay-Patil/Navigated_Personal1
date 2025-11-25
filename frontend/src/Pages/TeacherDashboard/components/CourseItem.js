// The CourseItem component displays a course as a card with a thumbnail, title, description, and professor. 
// If assign is false, it shows an "Assign" button which, upon clicking, opens an AssignCourse component to allow 
// the teacher to assign themselves to the course. Clicking the card navigates the teacher to the course view.
import Button from '@mui/material/Button';
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import courseBook from "../../UserDashboard/coursThumbnail.jpg";
import AssignCourse from "./AssignCourse";

const CourseItem = ({ data, assign, setRefresh,setCourseId }) => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const handleCourseView = () => {
    if (assign) {
      console.log("abt courseId",data);
        setCourseId(data.course_id);
        localStorage.setItem("currentCourseId", data.course_id);
      navigate("/t/course");
    }
  };

  const handleAssign = () => setShow(true);
  return (
    <div className="course-card" onClick={handleCourseView}>
      <div className="course-tumbnail">
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
        <div className="course-prof">{data.title}</div>
        {!assign && (
          <>
            <div className="course-action">
              <Button variant="contained" size="small" onClick={handleAssign}>
                Assign
              </Button>
            </div>
            <AssignCourse
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
