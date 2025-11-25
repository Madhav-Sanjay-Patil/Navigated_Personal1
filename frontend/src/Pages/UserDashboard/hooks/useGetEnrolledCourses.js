// The useGetEnrolledCourses hook fetches the list of courses a user is enrolled in. It uses useState to manage the course data
// and a loading state, initialized to empty and false, respectively. The getEnrollCourseData function makes an API call 
// using the user ID and updates the state with the fetched data or an error message. The hook returns the data, loading status, and the fetch function.
import React, { useEffect, useState } from "react";
import { coursesData } from "../data.js";
import { getResponseGet } from "../../../lib/utils.js";

export default function useGetEnrolledCourses() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem("id");
  const getEnrollCourseData = async () => {
    setLoading(true);
    const response = await getResponseGet(`enrolledCourses/${userId}`);
    if (response?.data) {
      console.log("Enrolled courses", response.data);
      setData(response.data);
    } else {
      console.error("Failed to fetch enrolled courses", response);
    }
    setLoading(false);
  };
  return { data, loading, getEnrollCourseData };
}
