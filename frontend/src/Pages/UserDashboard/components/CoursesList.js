// The CoursesList component displays a scrollable horizontal list of courses. It receives course data, a title, and flags
// for enrollment status and loading. Users can navigate through the list using previous and next buttons. While loading, 
// it shows placeholders; otherwise, it renders CourseItem components or a "no data" message if the list is empty.
import React, { Fragment, useEffect, useState } from "react";
import CourseItem from "./CourseItem";
import LoadingCourse from "./LoadingCourse";
import { IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const CoursesList = ({
  title,
  data,
  enroll,
  loading,
  setRefresh,
  setCourseId,
}) => {
  const [currentItems, setCurrentItems] = useState({
    start: 0,
    end: 3,
  });

  const updatePrev = () =>
    setCurrentItems((prev) => {
      return { ...prev, start: prev.start - 1, end: prev.end - 1 };
    });
  const updateNext = () =>
    setCurrentItems((prev) => {
      return { ...prev, start: prev.start + 1, end: prev.end + 1 };
    });

  useEffect(() => {
    setCurrentItems({ start: 0, end: data ? Math.min(3, data.length - 1) : 3 });
  }, [data]);
  return (
    <div className="course-list-section">
      <div className="course-list-heading">
        <div className="course-list-title">{title}</div>
        <div className="course-list-actions">
          <IconButton
            style={{ backgroundColor: "#fff" }}
            disabled={currentItems.start === 0}
            onClick={updatePrev}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <IconButton
            style={{ backgroundColor: "#fff" }}
            disabled={currentItems.end === data.length - 1}
            onClick={updateNext}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
      <div className="course-list-items">
        {loading ? (
          [1, 2, 3, 4].map((item) => <LoadingCourse />)
        ) : data.length > 0 ? (
          data.map((item, i) =>
            i >= currentItems.start && i <= currentItems.end ? (
              <CourseItem
                key={i}
                data={item}
                enroll={enroll}
                setRefresh={setRefresh}
                setCourseId={setCourseId}
              />
            ) : (
              <Fragment />
            )
          )
        ) : enroll ? (
          <div className="no-data">No Enrolled Courses Available</div>
        ) : (
          <div className="no-data">No Courses Available</div>
        )}
      </div>
    </div>
  );
};

export default CoursesList;
