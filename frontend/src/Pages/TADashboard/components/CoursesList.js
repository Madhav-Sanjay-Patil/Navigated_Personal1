// The CoursesList component displays a scrollable horizontal list of courses, using CourseItem to render each one. 
// It handles pagination with "previous" and "next" buttons, updating the displayed slice of the data array. 
// It shows a loading state with LoadingCourse components and a "No Courses Available" message when the data array is empty, 
// adapting the message based on the teach prop.
import React, { Fragment, useEffect, useState } from "react";
import CourseItem from "./CourseItem";
import LoadingCourse from "./LoadingCourse";
import { IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const CoursesList = ({ title, data = [], teach, loading, setRefresh, setCourseId }) => {
  const [currentItems, setCurrentItems] = useState({ start: 0, end: 3 });

  const updatePrev = () =>
    setCurrentItems((prev) => ({
      start: Math.max(prev.start - 1, 0),
      end: Math.max(prev.end - 1, Math.min(3, data.length - 1)),
    }));

  const updateNext = () =>
    setCurrentItems((prev) => ({
      start: Math.min(prev.start + 1, Math.max(0, data.length - 3)),
      end: Math.min(prev.end + 1, data.length - 1),
    }));

  useEffect(() => {
    setCurrentItems({ start: 0, end: Math.min(3, (data?.length || 0) - 1) });
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
            disabled={currentItems.end >= (data?.length || 0) - 1}
            onClick={updateNext}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
      <div className="course-list-items">
        {loading ? (
          [1, 2, 3, 4].map((item) => <LoadingCourse key={item} />)
        ) : data?.length > 0 ? (
          data
            .slice(currentItems.start, currentItems.end + 1)
            .map((item, i) => (
              <CourseItem
                key={item.id || i} // Ensures unique keys
                data={item}
                teach={teach}
                setRefresh={setRefresh}
                setCourseId={setCourseId}
              />
            ))
        ) : (
          <div className="no-data">
            {teach ? "No Courses Available for Teaching" : "No Courses Available"}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesList;
