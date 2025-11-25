// The useGetAllCourses hook fetches a list of recommended courses for a specific TA using their ID stored in local storage. 
// It manages the loading state and any potential errors during the API call using getResponseGet. The hook returns the 
// fetched courses, loading status, error object, and a function to manually trigger the data fetching.
import { useState, useEffect } from "react";
import { coursesData } from "../data.js";
import { getResponseGet } from "../../../lib/utils.js";
import axios from "axios";

const useGetAllCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const TAId = localStorage.getItem("ta_id");
  const [error, setError] = useState(null);

  // Function to fetch courses (can be called manually)
  const getAllTACourseData = async () => {
    setLoading(true);
    // setTimeout(setData(coursesData), 1000);
    const response = await getResponseGet(`/ta/recomCourses/${TAId}`);
    
    if (response?.data) {
      console.log("courses", response.data);
      setCourses(response.data);
    } else {
      console.error("Failed to fetch courses", response);
    }
    setLoading(false);
  };

  return { allCourses: courses, loading, error, getAllTACourseData };
};

export default useGetAllCourses;
