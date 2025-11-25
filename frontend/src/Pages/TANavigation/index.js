// The TANavigation component serves as the main interface for TAs within a specific course. It displays the course name and description,
// provides options to add resources and quizzes, and features a TAMap for visualizing learners and resources. It also shows a learner's
// activity feed and allows viewing their learning path (polyline).


import React, { useEffect, useRef, useState } from "react";
import {
    colStyleLeft,
    completeHeaderStyle,
    containerStyle,
    dropdownSectionStyle,
    headerStyle,
    titleSectionStyle,
    BootstrapDialog,
} from "../../Components/Dashboard";
import LetterAvatar from "../../Components/LetterAvatar";
import TAMap from "./components/TAMap"; // Reuse TAMap for TA
import { getResponseGet } from "../../lib/utils";
import Activity from "./components/Activity";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import AddResource from "./components/AddResource";
import DialogTitle from '@mui/material/DialogTitle';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import DialogContent from '@mui/material/DialogContent';
import PolylineChart from "../../Components/PolylineChart";
import TeachCourse from "../TADashboard/components/TeachCourse";
import AddSummary from "../TADashboard/components/AddSummary";

const TANavigation = ({
    setIsLoggedIn,
    courseId,
    setCourseId,
    topicData,
    setTopicData,
    setEnrolledPolylines,
    colStyleRight,
}) => {
    const navigate = useNavigate();
    const activitiesState = useState([]);

    const [summaries, setSummaries] = useState([]); //to display all summaries
    const [showSummaryList, setShowSummaryList] = useState(false);


    const [showSummary, setShowSummmary] = useState(false);
    const [show, setShow] = useState(false);
    const [target, setTarget] = useState(null);
    const ref = useRef(null);
    const learnerId = localStorage.getItem("learner_id");
    var resetMap = [false];
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [enrolledLearner, setEnrolledLearner] = useState({});
    const [course, setCourse] = useState({});
    const [enrolledLearnersByCourse, setEnrolledLearnersByCourse] = useState({});
    const [moduleData, setModuleData] = useState([]);

    var enrollId;
    var enrollPolyline;
    useEffect(() => {
        console.log("enrolledLearner updated:", enrolledLearner);
        enrollId = enrolledLearner?.enroll_id;
        enrollPolyline = enrolledLearner?.polyline;
    }, [enrolledLearner]);

    const [open, setOpen] = useState(false);
    // const [Show,setShow] = useState(false);
    const svgRef = useRef(null);
    const zoomRef = useRef(null);
    const [showPoly, setShowPoly] = useState(false);
    const [summary, setSummary] = useState("");

    const [showTeachCourse, setShowTeachCourse] = useState(false);

    const learnerPosState = useState([]);
    const [prevPos, setPrevPos] = useState(null);

    const [openPoly, setOpenPoly] = useState(false);
    const [learnersRefresh, setLearnersRefresh] = useState(false);

    const [addResVisible, setAddResVisible] = useState(false);
    const [resNeedReload, setResNeedReload] = useState(false);

    const currLearner = JSON.parse(localStorage.getItem("currentLearner"));

    console.log("currLearner.polyline: ", currLearner?.polyline);
    console.log("Ta_id is coming right ?", localStorage.getItem("ta_id"));

    const handleTeach = () =>{ 
        setShow(true)
    };

    const handleClickOpen = () => {
        setOpenPoly(true);
    };

    const handleClose = () => {
        setOpenPoly(false);
    };

    const handleCourseClick = (id) => {
        setCourseId(id);
        window.location.reload();
    };

    const loadModuleData = async (courseId) => {
        const response = await getResponseGet(`/moduleData/${courseId}`);
        if (response) {
            setModuleData(response.data);
        }
    };

    const loadTopicData = async (courseId) => {
        const response = await getResponseGet(`/topics/${courseId}`);
        if (response) {
            setTopicData(response.data);
        }
    };

    const loadEnrollData = async (learnerId) => {
        const response = await getResponseGet(
            `enrolledLearner/${learnerId}/${courseId}`
        );
        if (response?.data) {
            setEnrolledLearner(response.data);
            if (response.data.x_coordinate && response.data.y_coordinate) {
                learnerPosState[1]([
                    Number(response.data.x_coordinate),
                    Number(response.data.y_coordinate),
                ]);
            }
        } else {
            console.error("Failed to fetch enrolled learner data", response);
        }
    };

    const loadEnrollersBycourse = async (courseId) => {
        const response = await getResponseGet(
            `enrolledLearnersByCourse/${courseId}`
        );
        if (response?.data) {
            setEnrolledLearnersByCourse(response.data);
            console.log("All Enrolled Learners", response.data);
        } else {
            console.error("Failed to fetch enrolled learners", response);
        }
    };

    const loadEnrolledCourses = async (learnerId) => {
        const response = await getResponseGet(`enrolledCourses/${learnerId}`);
        if (response?.data) {
            setEnrolledCourses(response.data);
        } else {
            console.error("Failed to fetch enrolled courses", response);
        }
    };

    const loadEnrolledPolylines = async (enrollId) => {
        const response = await getResponseGet(`enrolledPolylines/${enrollId}`);
        if (response?.data) {
            setEnrolledPolylines(response.data);
        } else {
            console.error("Failed to fetch enrolled polylines", response);
        }
    };

    const loadCourse = async (courseId) => {
        const response = await getResponseGet(`course/${courseId}`);
        if (response?.data) {
            setCourse(response.data);
        } else {
            console.error("Failed to fetch the course", response);
        }
    };

    const loadActivityData = async (enrollId) => {
        const response = await getResponseGet(`activities/${enrollId}`);
        if (response?.data) {
            activitiesState[1](response.data);
        } else {
            console.error("Failed to fetch activities data", response);
        }
    };

    console.log("The user is",localStorage.getItem("type"));

    useEffect(() => {
        loadModuleData(courseId);
        loadTopicData(courseId);
        loadEnrollersBycourse(courseId);
        loadCourse(courseId);
    }, [courseId]);

    useEffect(() => {
        if (learnerId) {
            loadEnrolledCourses(learnerId);
            loadEnrollData(learnerId);
        }
    }, [learnerId]);

    useEffect(() => {
        if (enrollId) {
            loadEnrolledPolylines(enrollId);
        }
    }, [enrollId]);

    useEffect(() => {
        if (learnersRefresh) {
            loadEnrollersBycourse(courseId);
            setLearnersRefresh(false);
        }
    }, [learnersRefresh]);

    const handleSummaryClose = (event) => {
        setShowSummmary(false);
        setOpen(true);
    };

    const handleCloseAlert = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setOpen(false);
    };

    function handleSummaryClick(event) {
        setShowSummmary((curr) => !curr);
        setTarget(event.target);
    }

    const loadSummaries = async () => {
        const taId = localStorage.getItem("ta_id");
        const response = await getResponseGet(`summaries/${taId}/${courseId}`);
        if (response?.data) {
            setSummaries(response.data);
            setShowSummaryList(true);
        } else {
            console.error("Failed to fetch summaries", response);
        }
    };


    return (
        <>
            <div style={containerStyle}>
                <div style={completeHeaderStyle}>
                    <div className="header" style={headerStyle}>
                        <Button onClick={() => {
                            localStorage.removeItem("type");
                            navigate("/dashboard");
                        }}>
                            <i class="fa fa-chevron-left"></i>
                        </Button>

                        <div style={titleSectionStyle}>
                            <h1>{course.name} </h1>
                        </div>

                        <div style={{ flexGrow: 1 }} />

                        <div>
                            <LetterAvatar setIsLoggedIn={setIsLoggedIn} />
                            <h6>{localStorage.getItem("name")}</h6>
                        </div>
                    </div>
                    <span style={{ fontSize: "12px" }} id="description" className="">
                        {course.description}
                    </span>
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        padding: "8px",
                        gap: "8px",
                    }}
                >
                   
                    {localStorage.getItem("ta_id") && (
                        <>
                            <Button onClick={() => setShowTeachCourse(true)}>
                                Add Summary
                            </Button>
                            {/* <Button onClick={() => handleShowSummaryClick()}>
                                Summary List
                            </Button> */}
                            <Button onClick={loadSummaries}>
                                Summary List
                            </Button>

                            <AddSummary 
                                course={course} 
                                show={showTeachCourse} 
                                setShow={setShowTeachCourse} 
                                setRefresh={setLearnersRefresh} 
                            />

                            <Button onClick={() => setAddResVisible(true)}>
                                Add Resource
                            </Button>


                            <Button onClick={() => {
                                sessionStorage.setItem('course_id', courseId);
                                navigate("/create-quiz");
                            }}>
                                Add New Quiz
                            </Button>
                        </>
                    )}
                </div>
                <div style={{ display: "flex" }}>
                    <div id="learner-map" style={colStyleLeft}>
                        <TAMap
                            activitiesState={activitiesState}
                            learnerPosState={learnerPosState}
                            svgRef={svgRef}
                            zoomRef={zoomRef}
                            enrollId={enrollId}
                            enrolledLearnersByCourse={enrolledLearnersByCourse}
                            courseId={courseId}
                            needsReload={resNeedReload}
                        />
                    </div>

                    {(activitiesState[0].length > 0) && (
                        <div style={dropdownSectionStyle}>
                            <br />
                            <Button onClick={() => setOpenPoly((curr) => !curr)}>
                                See polyline
                            </Button>
                            <br />
                            <BootstrapDialog
                                onClose={handleClose}
                                aria-labelledby="customized-dialog-title"
                                open={openPoly}
                            >
                                <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                                    Learner Polyline
                                </DialogTitle>
                                <IconButton
                                    aria-label="close"
                                    onClick={handleClose}
                                    sx={(theme) => ({
                                        position: 'absolute',
                                        right: 8,
                                        top: 8,
                                        color: theme.palette.grey[500],
                                    })}
                                >
                                    <CloseIcon />
                                </IconButton>
                                <DialogContent>
                                    {enrollPolyline
                                        ? <PolylineChart polyline={enrollPolyline} topicData={topicData} />
                                        : <div>Could not load learner polyline!</div>
                                    }
                                </DialogContent>
                            </BootstrapDialog>
                            <br />
                            <Button onClick={() => navigate('/polylines-list')}>
                                Polylines List
                            </Button>
                        </div>
                    )}
                

                    <div id="learning-journey" style={colStyleRight}>
                        <Activity
                            activitiesState={activitiesState}
                            enrolledLearnersByCourse={enrolledLearnersByCourse}
                            setLearnersRefresh={setLearnersRefresh}
                        />

                        <BootstrapDialog
                            onClose={() => setShowSummaryList(false)}
                            open={showSummaryList}
                        >
                            <DialogTitle>
                                Summary List
                                <IconButton
                                    aria-label="close"
                                    onClick={() => setShowSummaryList(false)}
                                    sx={{ position: 'absolute', right: 8, top: 8 }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </DialogTitle>
                            <DialogContent dividers>
                                {summaries.length === 0 ? (
                                    <p>No summaries available.</p>
                                ) : (
                                    <ul>
                                        {summaries.map((summary) => (
                                            <li key={summary.id}>{summary.description}</li>
                                        ))}
                                    </ul>
                                )}
                            </DialogContent>
                        </BootstrapDialog>

                    </div>
                </div>
                <AddResource
                    show={addResVisible}
                    onHide={() => setAddResVisible(false)}
                    courseId={courseId}
                    onSuccess={() => setResNeedReload(true)}
                />
            </div>
        </>
    );
};

export default TANavigation;