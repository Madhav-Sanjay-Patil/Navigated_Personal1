// The useGetAssignedCourses hook fetches courses assigned to a specific TA, identified by their ID from local storage. 
// It uses getResponseGet to make the API call to /taTeachedCourses/${taId}. The hook manages loading state and returns 
// the fetched course data and the loading status, along with the function to fetch the data.
import React, { useEffect, useState } from "react";
import { coursesData } from "../data.js";
import { getResponseGet } from "../../../lib/utils.js";

export default function useGetAssignedCourses() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const taId = localStorage.getItem("ta_id");
  const getAssignedCourseData = async () => {
    setLoading(true);
    console.log(taId);
    // setTimeout(setData(coursesData), 1000);
    // const response = await getResponseGet(`/ta/courses/${taId}`);
    const response = await getResponseGet(`/taTeachedCourses/${taId}`);

    console.log(response,">.........")

    
    if (response?.data) {
      console.log("Enrolled courses", response.data);
      setData(response.data);
    } else {
      console.error("Failed to fetch enrolled courses", response);
    }
   
    setLoading(false);
  };

  return { data, loading, getAssignedCourseData };
}
