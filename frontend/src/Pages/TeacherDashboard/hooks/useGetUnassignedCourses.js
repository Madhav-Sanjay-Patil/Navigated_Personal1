// The useGetUnassignedCourses hook fetches courses that are not yet assigned to any teacher. 
// It uses the teacher's ID (though seemingly not directly used in the API call shown) and manages a loading state. 
// It returns the unassignedCourses data and the loading status, with getUnassignedCourseData initiating the fetch.
import React, { useState } from "react";
import { getResponseGet } from "../../../lib/utils.js";

export default function useGetUnassignedCourses() {
  const [unassignedCourses, setUnassignedrCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const teacherId = localStorage.getItem("teacher_id");
  const getUnassignedCourseData = async () => {
    setLoading(true);
    // setTimeout(setData(coursesData), 1000);
    const response = await getResponseGet(`teacher/courses/unassigned/${teacherId}`);
    // const response=null
    if (response?.data) {
      console.log("courses", response.data);
      setUnassignedrCourses(response.data);
    } else {
      console.error("Failed to fetch courses", response);
    }
    setLoading(false);
  };

  return { unassignedCourses, loading, getUnassignedCourseData };
}
