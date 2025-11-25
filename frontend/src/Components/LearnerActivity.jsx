// LearnerActivity component visualizes the learner's journey with a timeline of activities:
// - It tracks and displays learner activities, distinguishing between 'resource' and 'contribution' types.
// - The timeline allows the learner to interact with resources and contributions by navigating through clickable items.
// - The component dynamically updates the learner's journey path upon clicking activities, storing and displaying the learner's position along with activity history.
// - The timeline includes buttons with icons (MenuBook for resources, Publish for contributions) and clickable links for external resources or quizzes.
// - The component integrates with the "ViewEditContribution" component for editing contributions and "NavigateToQuizDetails" for navigating to quiz details.
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import TimelineDot from "@mui/lab/TimelineDot";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PublishIcon from "@mui/icons-material/Publish";
import StarIcon from "@mui/icons-material/Star";
import Typography from "@mui/material/Typography";
import TourComponent from "./TourComponent";
import Button from "@mui/material/Button";
import ViewEditContribution from "../Pages/TeacherNavigation/components/ViewEditContribution";
import NavigateToQuizDetails from "./NavigateToQuizDetails";

const LearnerActivity = ({
    activitiesState,
    setLearnerAtResourcePos,
    learnerPosState,
    enrollId,
}) => {

    const navigate = useNavigate(); // Initialize useNavigate
    console.log("this is activitiesState", activitiesState[0]);
    // console.log("these are the activitiesState", activitiesState);


    const [open, setOpen] = useState(false);
    const [contributionId, setContributionId] = useState(null);
    const [clickedIndexes, setClickedIndexes] = useState([]);
    const [journeyPath, setJourneyPath] = useState([]);
    const [journeyData, setJourneyData] = useState([]);

    const handleContributionOpen = async (data) => {
        if (data.type !== "summary") return;
        setOpen(true);
        setContributionId(data.contribution_id);
    };

    useEffect(() => {
        if (!open) {
            setContributionId(null);
        }
    }, [open]);

    const handleClick = async (activity) => {
        if (activity.type === "resource") {
            setLearnerAtResourcePos([activity.x, activity.y]);
        } else {
            learnerPosState[1]([activity.x, activity.y]);
        }
    };

    const handleResourceClick = (activity, index) => {
        // Check if the clicked index is already included
        if (!clickedIndexes.includes(index)) {
            setClickedIndexes(prevIndexes => [...prevIndexes, index]);
        }
        // Create coordinates based on activities up to the clicked index
        const coordinates = [
            { x: 0.1, y: 0.1 }, // Starting point
            ...activitiesState[0].slice(0, index + 1).map((activity) => ({
                x: activity.x,
                y: activity.y,
            })),
        ];
        // Add learner position to the journey path
        const learnerPos = JSON.parse(localStorage.getItem("learnerPos"));
        const learnerPosX = learnerPos[0];
        const learnerPosY = learnerPos[1];
        coordinates.push({ x: learnerPosX, y: learnerPosY }); // Include learner position
        // Set the journey path to the new unique coordinates
        setJourneyPath(coordinates);
        const updatedJourneyPath = coordinates.map((point, idx) => ({
            id: idx,
            x: point.x,
            y: point.y,
            roundedX: point.x.toFixed(3),
            roundedY: point.y.toFixed(3),
        }));
        // Update local storage and state
        localStorage.setItem("updatedJourneyPath", JSON.stringify(updatedJourneyPath));
        localStorage.setItem("clickButton", true);
        console.log("this is updatedJourneyPath in LearnerActivity", updatedJourneyPath);
        // console.log("button clicked", localStorage.getItem("clickButton"));
        // console.log("this is updatedJourneyPath in LearnerActivity", localStorage.getItem("updatedJourneyPath"));
        // console.log("setShowJourney", localStorage.getItem("clickButton"));

        setJourneyData(updatedJourneyPath);
    };

    const handleLinkClick = (link) => {
        if (!isNaN(link)) {
            // If the link is an integer, navigate to /quiz/$quizid
            navigate(`/quiz`);
        }
    };


    return (
        <div className="learnerActivityBody">
            <h3 style={{ textAlign: "center" }}>My Learning Map</h3>
            <div style={{ alignContent: "center", height: "600px" }}>
                <TourComponent />
                <Timeline position="right">
                    <TimelineItem>
                        <TimelineOppositeContent
                            sx={{ m: "auto 0" }}
                            align="right"
                            variant="body2"
                            color="text.secondary"
                        >
                            Start
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                            <TimelineDot>
                                <StarIcon />
                            </TimelineDot>
                            <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent sx={{ py: "12px", px: 2 }}>
                            <Typography variant="h6" component="span">
                                Beginning of Activities
                            </Typography>
                        </TimelineContent>
                    </TimelineItem>

                    {activitiesState[0].map((activity, index) => (
                        <TimelineItem key={index}>
                            <TimelineOppositeContent
                                sx={{ m: "auto 0" }}
                                align="right"
                                variant="body2"
                                color="text.secondary"
                            >
                                {new Date(activity.time).toLocaleString("en-IN", {
                                    weekday: "short",
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    timeZone: "Asia/Kolkata",
                                    timeZoneName: "short",
                                })}
                            </TimelineOppositeContent>
                            <TimelineSeparator>
                                <TimelineConnector />
                                <TimelineDot onClick={() => handleContributionOpen(activity)}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleResourceClick(activity, index)}
                                    >
                                        {activity.type === "resource" ? (
                                            <MenuBookIcon />
                                        ) : (
                                            <PublishIcon />
                                        )}
                                    </Button>
                                </TimelineDot>
                                <TimelineConnector />
                            </TimelineSeparator>
                            <TimelineContent sx={{ py: "12px", px: 2 }}>
                                <Typography
                                    onClick={() => handleClick(activity)}
                                    variant="h6"
                                    component="span"
                                    className="clickable-text"
                                >
                                    {activity.name.slice(0, 50)}
                                </Typography>
                                <Typography>
                                    {activity.type === "resource" ? "Resource" : "Contribution"}
                                </Typography>

                                <Typography>
                                    {activity.name.slice(0, 4) !== "Quiz" && (
                                        <a
                                        href={activity.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {activity.link}
                                    </a>
                                    )}
                                </Typography>

                                {activity.name.slice(0, 4) === "Quiz" && (
                                    <NavigateToQuizDetails userId={enrollId || "hfj"} />
                                )}
                            </TimelineContent>
                        </TimelineItem>
                    ))}
                </Timeline>
            </div>

            <div style={{ width: "100%", height: "300px", marginTop: "20px" }}>

            </div>

            <ViewEditContribution open={open} setOpen={setOpen} id={contributionId} canEdit={false} />
        </div>
    );
};

export default LearnerActivity;

