// The PolylinesList component is responsible for rendering a list of polyline charts, displaying the learner's progression through 
// different stages of their learning journey. It fetches polyline data from localStorage and maps through the list to display 
// each polyline using the PolylineChart component. The data is dynamically displayed, with each polyline labeled to indicate 
// whether it's the initial polyline or after a particular contribution, making it clear how the learner's data evolves over time. 
// If no polyline data is found, a message is shown to the user indicating that no enrolled polylines exist. 
// The component also ensures that the local storage is cleaned up when the component is unmounted.
import React, { useEffect, useState } from "react";
import PolylineChart from "./PolylineChart";

const PolylinesList = ({ topicData }) => {
    const [localPolylines, setLocalPolylines] = useState([]);
    const enrolledPolylinesFromLS = JSON.parse(localStorage.getItem("enrolledPolylines")) || [];

    useEffect(() => {
        if (Array.isArray(enrolledPolylinesFromLS)) {
            setLocalPolylines(enrolledPolylinesFromLS);
        } else {
            setLocalPolylines([]);
        }

        return () => {
            localStorage.removeItem("enrolledPolylines");
            localStorage.removeItem("currentLearner");
        };
    }, []);

    const polylinesToRender = Array.isArray(localPolylines) && localPolylines.length > 0
        ? localPolylines
        : (Array.isArray(enrolledPolylinesFromLS) ? enrolledPolylinesFromLS : []);


    return (
        <div style={{ padding: "20px", backgroundColor: "#f5f5f5" }}>
            <h1 style={{ textAlign: "center", marginBottom: "30px" }}>My Learning Journey</h1>

            {polylinesToRender.length > 0 ? (
                polylinesToRender.map((polyline, index) => (
                    <div
                        key={index}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "40px",
                            gap: "20px",
                        }}
                    >
                        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
                            {index === 0 ? "Initial Polyline" : `After ${index} Contribution`}
                        </h2>
                        <PolylineChart polyline={Array.isArray(polyline) ? polyline : []} topicData={topicData} />
                    </div>
                ))
            ) : (
                <p style={{ textAlign: "center", fontSize: "18px", color: "#555" }}>
                    No enrolled polylines found.
                </p>
            )}
        </div>
    );
};

export default PolylinesList;
