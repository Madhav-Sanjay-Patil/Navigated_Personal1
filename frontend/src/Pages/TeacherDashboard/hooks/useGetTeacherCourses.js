// The useGetTeacherCourses hook fetches courses assigned to a specific teacher using their ID from local storage.
// It manages the loading state and returns the fetched teacherCourses data and the loading status.
// The getTeacherCourseData function triggers the API call.
import React, { useState } from "react";
import { getResponseGet } from "../../../lib/utils.js";

export default function useGetTeacherCourses() {
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const teacherId = localStorage.getItem("teacher_id");
  const getTeacherCourseData = async () => {
    setLoading(true);
    // setTimeout(setData(coursesData), 1000);
    const response = await getResponseGet(`teacher/courses/${teacherId}`);
    
    if (response?.data) {
      console.log("courses", response.data);
      setTeacherCourses(response.data);
    } else {
      console.error("Failed to fetch courses", response);
    }
    setLoading(false);
  };

  return { teacherCourses, loading, getTeacherCourseData };
}
