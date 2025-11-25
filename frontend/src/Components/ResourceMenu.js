// The ResourceMenu component displays a context menu for managing resources, with different options for teachers and learners, 
// such as viewing, changing position, or accessing resource details. It also navigates to a quiz page based on resource type.
import React from "react";
import { useNavigate } from "react-router-dom";
import { getResponseGet } from "../lib/utils";
import { baseURL } from "../lib/axios";

const ResourceMenu = ({
    rType,
    data,
    menuPosition,
    handleClose,
    handleActivateUpdate,
    handleDeactivateUpdate,
    handleView,
    isWithinCoverage,
    inverseScale,
}) => {
    const handleChangePosition = () => {
        handleActivateUpdate(data);
        alert("Please click on to the location to update the position");
        handleClose();
    };
    const navigate = useNavigate(); // Initialize useNavigate hook


    const handleMenuClose = () => {
        handleDeactivateUpdate();
        handleClose();
    };

    const handleViewResource = async () => {
        // open link also
        const userType = localStorage.getItem("type");
        // if(userType==="LEARNER" && isWithinCoverage){
        //     handleView();
        // }
        // ||(userType==="LEARNER" && isWithinCoverage)
        if (userType === "TEACHER") {
            if (data.type === 0) {
                // for PDFs
                window.open(baseURL + data.link, "_blank", "noopener,noreferrer");
            } else if (data.link && data.type === 1) {
                window.open(data.link, "_blank", "noopener,noreferrer");
            } else if (data.type === 2) {
                // // alert("show quiz here");
                // sessionStorage.setItem("enrollId", enrollId); // Default score is 0
                // sessionStorage.setItem("courseId", courseId); // Default is an empty array
                // sessionStorage.setItem("quizTitle", data.name); // Set quiz completion to false initially*/
                const quiz_id = parseInt(data.link, 10);
                sessionStorage.setItem("quizId", quiz_id);
                sessionStorage.setItem('aType', 2);

                // Fetch quiz questions data
                const response = await getResponseGet(
                    `/quiz_questions/${quiz_id}`
                );
                const quizData = response?.data;

                // Navigate to the quiz route and pass only serializable data (no functions)
                navigate("/quiz", { state: { quizData } });
            }
        }
    };

    const tMenu = [
        {
            label: "About Resource",
            action: () => alert("Show popup about the details of the resource"),
        },
        {
            label: "Open Resource",
            action: handleViewResource,
        },
        {
            label: "Change Position",
            action: handleChangePosition,
        },
    ];
    const lMenu = [
        {
            label: "About Resource",
            action: () => alert("Show popup about the details of the resource"),
        },
        {
            label: "Open Resource",
            action: handleViewResource,
        },
    ];

    return (
        <>
            {menuPosition && (
                <foreignObject
                    x={menuPosition.x}
                    y={menuPosition.y}
                    //   width={150}
                    //   height={120}
                    width={200 * inverseScale}
                    height={160 * inverseScale}
                >
                    <div
                        style={{
                            // display: "inline-block",
                            background: "white",
                            border: `${1 * inverseScale}px solid black`,
                            borderRadius: `${8 * inverseScale}px`,
                            boxShadow: `0px ${4 * inverseScale}px ${8 * inverseScale}px rgba(0, 0, 0, 0.1)`,
                            padding: `${7 * inverseScale}px`,
                            color: "blue",
                            zIndex: 7000, // Ensuring it appears on top
                            fontFamily: "Arial, sans-serif",
                            // maxWidth: "200px", // Optional maximum width
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: `${5 * inverseScale}px`,
                                right: `${7 * inverseScale}px`,
                                cursor: "pointer",
                                fontWeight: "bold",
                                color: "#333",
                                fontSize: `${24 * inverseScale}px`,
                            }}
                            onClick={handleMenuClose} // Close action
                        >
                            &times;
                        </div>
                        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                            {localStorage.getItem("type") === "TEACHER"
                                ? tMenu.map((item, index) => (
                                    <li
                                        key={index}
                                        onClick={item.action}
                                        style={{
                                            padding: `${8 * inverseScale}px ${12 * inverseScale}px`,
                                            cursor: "pointer",
                                            color: "#333",
                                            borderBottom: `${1 * inverseScale}px solid #ddd`,
                                            transition: "background-color 0.2s ease",
                                            // fontSize: "12px",
                                            textDecoration: "none",
                                            fontSize: `${15 * inverseScale}px`,
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor = "#f5f5f5")
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor = "transparent")
                                        }
                                    >
                                        {item.label}
                                    </li>
                                ))
                                : lMenu.map((item, index) => (
                                    <li
                                        key={index}
                                        onClick={item.action}
                                        style={{
                                            padding: `${8 * inverseScale}px ${12 * inverseScale}px`,
                                            cursor: "pointer",
                                            color: "#333",
                                            borderBottom: `${1 * inverseScale}px solid #ddd`,
                                            transition: "background-color 0.2s ease",
                                            fontSize: `${15 * inverseScale}px`,
                                            textDecoration: "none",
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor = "#f5f5f5")
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor = "transparent")
                                        }
                                    >
                                        {item.label}
                                    </li>
                                ))}
                        </ul>
                    </div>
                </foreignObject>
            )}
        </>
    );
};

export default ResourceMenu;
