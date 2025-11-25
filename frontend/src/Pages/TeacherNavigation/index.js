// The TeacherNavigation component renders the teacher's view, displaying a map of learners and resources via the TeacherMap. 
// It fetches and manages course-specific data, including enrolled learners, modules, and topics. The component also handles 
// displaying learner activity, showing/hiding a learner's polyline, and provides options to add new resources and quizzes to the course.
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
import TeacherMap from "./components/TeacherMap";
import { getResponseGet } from "../../lib/utils";
import Activity from "./components/Activity";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import AddResource from "./components/AddResource";
import DialogTitle from '@mui/material/DialogTitle';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import DialogContent from '@mui/material/DialogContent';
// import PolylineChart from "./PolylineChart";
import PolylineChart from "../../Components/PolylineChart";
import { local } from "d3";
import AddExitPoint from "./components/AddExitPoint";

const TeacherNavigation = ({
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

    const [showSummary, setShowSummmary] = useState(false);
    const [show, setShow] = useState(false);
    const [target, setTarget] = useState(null);
    const ref = useRef(null);
    const learnerId = localStorage.getItem("learner_id");
    var resetMap = [false];
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    // const [enrolledPolylines, setEnrolledPolylines] = useState([]);
    const [enrolledLearner, setEnrolledLearner] = useState({});
    const [course, setCourse] = useState({});
    const [enrolledLearnersByCourse, setEnrolledLearnersByCourse] = useState({});
    const [moduleData, setModuleData] = useState([]);
    const [enrollId, setEnrollId] = useState(null);
    const [enrollPolyline, setEnrollPolyline] = useState([]);

    // console.log("enrollId is ", JSON.parse(localStorage.getItem("currentLearner"))?.enroll_id);
    console.log("enrolledLearner: ", enrolledLearner);
    // console.log("currentLearner in index.js is : ", JSON.parse(localStorage.getItem("currentLearner")));
    const currLearner = JSON.parse(localStorage.getItem("currentLearner"));
    console.log("currLearner.polyline: ", currLearner?.polyline);


    console.log("enrollPolyLine of enrolled learner", currLearner?.polyline);

    const [open, setOpen] = useState(false);
    const svgRef = useRef(null);
    const zoomRef = useRef(null);
    const [showPoly, setShowPoly] = useState(false);
    const [summary, setSummary] = useState("");

    const learnerPosState = useState([]);
    const [prevPos, setPrevPos] = useState(null);

    const [openPoly, setOpenPoly] = useState(false);
    const [learnersRefresh, setLearnersRefresh] = useState(false);

    const [addResVisible, setAddResVisible] = useState(false);
    const [addExitVisible, setAddExitVisible] = useState(false);
    const [resNeedReload, setResNeedReload] = useState(false);

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
            // console.log("this is the module data", response.data);
        }
    };
    const loadTopicData = async (courseId) => {
        const response = await getResponseGet(`/topics/${courseId}`);
        if (response) {
            setTopicData(response.data);
            // console.log("this is the topics data", response.data);
        }
    };

    const loadEnrollData = async (learnerId) => {
        const response = await getResponseGet(
            `enrolledLearner/${learnerId}/${courseId}`
        ); // add course id afterwards
        if (response?.data) {
            setEnrolledLearner(response.data);
            setEnrollPolyline(currLearner?.polyline);
            // console.log("Enrolled Learner", enrolledLearner);
            // Update learner position state with the new coordinates if they exist
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
        ); // add course id afterwards
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
            // console.log("Enrolled courses", response.data);
            setEnrolledCourses(response.data);
        } else {
            console.error("Failed to fetch enrolled courses", response);
        }
    };
    const loadEnrolledPolylines = async (id) => {
        if (!id) {
            console.log("id not found");
            return; // Prevent API call if enrollId is undefined
        }
        const response = await getResponseGet(`enrolledPolylines/${id}`);
        if (response?.data) {
            setEnrolledPolylines(response.data);
            setEnrollPolyline(currLearner?.polyline); // Also update local polyline state
        } else {
            console.error("Could not load learner polyline!", response);
        }
    };

    const loadCourse = async (courseId) => {
        const response = await getResponseGet(`course/${courseId}`);
        if (response?.data) {
            // console.log("course is", response.data);
            setCourse(response.data);
        } else {
            console.error("Failed to fetch the course", response);
        }
    };

    const loadActivityData = async (enrollId) => {
        const response = await getResponseGet(`activities/${enrollId}`);
        if (response?.data) {
            // console.log("Loaded Activities", response.data);
            activitiesState[1](response.data);
        } else {
            console.error("Failed to fetch activities data", response);
        }
    };
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
    // const enrollId =enrolledLearner.enroll_id;
    // console.log("enrollid is ", enrollId);
    // console.log("plyline is ", enrollPolyline);
    // console.log("polyline is ",currLearner?.polyline);
    useEffect(() => {
        if (enrollId) {
            // loadActivityData(enrollId);
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
                    <Button onClick={() => {
                        setAddResVisible(true);
                    }}>
                        Add Resource
                    </Button>
                    <Button onClick={() => {
                        setAddExitVisible(true);
                    }}>
                        Add Exit Point
                    </Button>
                    <Button onClick={() => {
                        sessionStorage.setItem('course_id', courseId);
                        navigate("/create-quiz"); // Navigate to /create-quiz
                    }}>
                        Add New Quiz
                    </Button>

                </div>
                <div style={{ display: "flex" }}>
                    <div id="learner-map" style={colStyleLeft}>
                        {/* Learner map */}
                        <TeacherMap
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
                                    {currLearner?.polyline
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
                    </div>
                </div>
                <AddResource
                    show={addResVisible}
                    onHide={() => setAddResVisible(false)}
                    courseId={courseId}
                    onSuccess={() => setResNeedReload(true)}
                />
                <AddExitPoint
                    show={addExitVisible}
                    onHide={() => setAddExitVisible(false)}
                    courseId={courseId}
                    onSuccess={() => setResNeedReload(true)}
                />
            </div>
        </>
    );
};

export default TeacherNavigation;
