// The useGetRecomCourses hook fetches a list of recommended courses for a specific user. It maintains the courses in 
// the allCourses state and tracks the data fetching status with the loading state. The getAllCourseData function 
// performs the API call using the user ID and updates the allCourses state with the response or logs an error. 
// The hook returns the courses, loading status, and the fetch function.
import React, { useEffect, useState } from "react";
import { coursesData } from "../data.js";
import { getResponseGet } from "../../../lib/utils.js";

export default function useGetRecomCourses() {
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem("id");
  const getAllCourseData = async () => {
    setLoading(true);
    const response = await getResponseGet(`recomCourses/${userId}`);
    if (response?.data) {
      console.log("courses", response.data);
      setAllCourses(response.data);
    } else {
      console.error("Failed to fetch courses", response);
    }
    setLoading(false);
  };
  return { allCourses, loading, getAllCourseData };
}
