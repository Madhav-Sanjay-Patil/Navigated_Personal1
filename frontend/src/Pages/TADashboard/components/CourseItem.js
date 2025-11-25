// The CourseItem component displays individual course information within a card format, including a thumbnail, title, description,
// and professor. If the teach prop is false, it renders a "Teach" button which, when clicked, opens the TeachCourse component 
// to handle teaching assignments for that specific course, identified by its data. Clicking the card navigates 
// to the TA course view if teach is true.
import { Button } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import courseBook from "../coursThumbnail.jpg";
import TeachCourse from "./TeachCourse";

const CourseItem = ({ data, teach, setRefresh, setCourseId }) => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const handleCourseView = () => {
    if (teach) {
      setCourseId(data.course_id);
      navigate("/TA/course");
    }
  };

  const handleTeach = () =>{ 
    setShow(true)
  };
  
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
        {!teach && (
          <>
            <div className="course-action">
              <Button variant="contained" size="small" onClick={handleTeach}>
                Teach
              </Button>
            </div>
            <TeachCourse
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
