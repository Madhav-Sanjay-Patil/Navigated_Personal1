// The CoursesList component displays a scrollable horizontal list of courses. It receives a title and course data, 
// using CourseItem to render each course. Navigation arrows allow users to view the next or previous set of courses.
// It also handles loading states and displays a message if no courses are available
import React, { Fragment, useEffect, useState } from "react";
import CourseItem from "./CourseItem";
import IconButton from '@mui/material/IconButton';
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LoadingCourse from "../../UserDashboard/components/LoadingCourse";

const CoursesList = ({
    title,
    data,
    assign,
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
                                assign={assign}
                                setRefresh={setRefresh}
                                setCourseId={setCourseId}
                            />
                        ) : (
                            <Fragment />
                        )
                    )
                ) : assign ? (
                    <div className="no-data">Please Assign the courses to view here.</div>
                ) : (
                    <div className="no-data">No Courses available to Assign.</div>
                )}
            </div>
        </div>
    );
};

export default CoursesList;
