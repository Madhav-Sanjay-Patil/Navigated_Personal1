// The Activity component displays a learner's learning journey as a timeline. It fetches and visualizes activities,
// showing the time and type (resource or contribution). TAs can click on activities to view summaries and resources. 
// Clicking the timeline elements also updates the visualized learning path on the map.
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
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TourComponent from "../../../Components/TourComponent";
import { useEffect, useState } from "react";
import ViewEditContribution from "./ViewEditContribution";
import { getResponseGet } from "../../../lib/utils";

const Activity = ({ activitiesState, setLearnersRefresh }) => {
    const allEnrolledLearners = JSON.parse(localStorage.getItem("allEnrolledLearners"));
    // console.log("enrolled learners in Activity.jsx", allEnrolledLearners);

    const [currentID, setCurrentID] = useState(null);
    const [currentLearner, setCurrentLearner] = useState(null);

    useEffect(() => {
        if (!allEnrolledLearners || !activitiesState[0]) return;

        const enrolledLearnerActivities = allEnrolledLearners.reduce((acc, learner) => {
            if (!learner.enroll_id) return acc;
            acc[learner.enroll_id] = activitiesState[0].filter(activity => activity.enroll_id === learner.enroll_id);
            return acc;
        }, {});

        const enrolledLearnerIDs = Object.keys(enrolledLearnerActivities)
            .filter(enroll_id => enrolledLearnerActivities[enroll_id].length > 0)
            .map(id => parseInt(id, 10));

        if (enrolledLearnerIDs.length > 0) {
            const selectedLearner = allEnrolledLearners.find(learner => learner.enroll_id === enrolledLearnerIDs[0]);

            // Only update state if it's actually different
            if (!currentLearner || currentLearner.enroll_id !== selectedLearner.enroll_id) {
                setCurrentLearner(selectedLearner);
                setCurrentID(enrolledLearnerIDs[0]);
                localStorage.setItem("currentLearner", JSON.stringify(selectedLearner));
                // localStorage.setItem("currentLearner", selectedLearner);
                console.log("Set the current Learner: ", selectedLearner);
            }
        }
    }, [activitiesState, allEnrolledLearners, currentLearner]); // Add `currentLearner` to dependencies


    const loadEnrolledPolylines = async (currentID) => {
        const response = await getResponseGet(`enrolledPolylines/${currentID}`);
        if (response?.data) {
            // console.log("Enrolled Polylines", response.data);
            // setEnrolledPolylines(response.data);
            console.log("Set the polylines here!!")
            localStorage.setItem("enrolledPolylines", JSON.stringify(response.data));
            console.log(localStorage.getItem("enrolledPolylines"));
        } else {
            console.error("Failed to fetch enrolled polylines", response);
        }
    };

    useEffect(() => {
        if (currentID) {
            loadEnrolledPolylines(currentID);
            console.log("The Polylines of current Learner:", localStorage.getItem("enrolledPolylines"));
        }
    }, [currentID]);  // Now runs whenever `currentID` updates


    const [open, setOpen] = useState(false);
    const [contributionId, setContributionId] = useState(null);

    const [clickedIndexes, setClickedIndexes] = useState([]);
    const [journeyPath, setJourneyPath] = useState([]);
    const [journeyData, setJourneyData] = useState([]);

    const handleContributionOpen = async (data) => {
        console.log(data);
        if (data.type !== "summary") return;
        setOpen(true);
        setContributionId(data.contribution_id);
    };

    const handleResourceClick = (activity, index) => {
        if (!clickedIndexes.includes(index)) {
            setClickedIndexes(prevIndexes => [...prevIndexes, index]);
        }
        const coordinates = [
            { x: 0.1, y: 0.1 }, // Starting point
            ...activitiesState[0].slice(0, index + 1).map(activity => ({
                x: activity.x,
                y: activity.y,
            })),
        ];

        const enrolledLearnerID = currentID;
        console.log("All enrolled learners in LearnerActivity", allEnrolledLearners);
        console.log("current learner.enroll_id is:", enrolledLearnerID);

        const learnerPos = [currentLearner.x_coordinate, currentLearner.y_coordinate];
        console.log("learnerPos in LearnerActivity", learnerPos);

        if (learnerPos && Array.isArray(learnerPos) && learnerPos.length >= 2) {
            const learnerPosX = learnerPos[0];
            const learnerPosY = learnerPos[1];
            coordinates.push({ x: learnerPosX, y: learnerPosY }); // Include learner position
            setJourneyPath(coordinates);
        } else {
            console.warn("learnerPos is missing or invalid in localStorage");
        }
        const updatedJourneyPath = coordinates.map((point, idx) => ({
            id: idx,
            x: point.x,
            y: point.y,
            roundedX: point.x.toFixed(3),
            roundedY: point.y.toFixed(3),
        }));
        localStorage.setItem("updatedJourneyPath", JSON.stringify(updatedJourneyPath));
        localStorage.setItem("clickButton", true);
        console.log("this is updatedJourneyPath in LearnerActivity", updatedJourneyPath);
        setJourneyData(updatedJourneyPath);
    };



    useEffect(() => {
        if (!open) {
            setContributionId(null);
        }
    }, [open]);

    return (
        <div className="learnerActivityBody">
            <h3 style={{ textAlign: "center" }}>Learning Journey</h3>
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
                            <TimelineContent
                                sx={{ py: "12px", px: 2 }}
                                onClick={() => handleContributionOpen(activity)}
                            >
                                <Typography variant="h6" component="span">
                                    {activity.name.slice(0, 50)}
                                </Typography>
                                <Typography>
                                    <a
                                        href={activity.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {activity.link}
                                    </a>
                                </Typography>
                            </TimelineContent>
                        </TimelineItem>
                    ))}
                </Timeline>
            </div>
            <ViewEditContribution
                open={open}
                setOpen={setOpen}
                id={contributionId}
                setLearnersRefresh={setLearnersRefresh}
                canEdit={true}
            />
        </div>
    );
};

export default Activity;
