import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import LearnerActivity from "./LearnerActivity";
import LearnerMap from "./LearnerMap";
import LearnerSummary from "./LearnerSummary";
import LetterAvatar from "./LetterAvatar";
import { Info, ZoomIn, ZoomOut, Arrows } from "react-flaticons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Popup from "../Pages/UserDashboard/components/Popup";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router-dom";
import { ButtonGroup, Button, Dropdown, DropdownButton } from "react-bootstrap";
import { getResponseGet } from "../lib/utils";
import PolylineChart from "./PolylineChart";

export const containerStyle = {
  width: "100%",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "white",
  boxSizing: "border-box",
};

export const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

export const completeHeaderStyle = {
  padding: "10px 10px",
  borderBottom: "1px solid #ccc",
  backgroundColor: "rgb(225, 225, 225)",
};

export const titleSectionStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "60%",
};

export const dropdownSectionStyle = {
  marginTop: "10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
};

export const colStyleLeft = {
  flex: "1 1 70%",
  boxSizing: "border-box",
  padding: "10px",
  minWidth: "300px",
};


export const colStyleRight = {
  flex: "1 1 30%",
  boxSizing: "border-box",
  padding: "10px",
  minWidth: "300px",
};

export const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

export const XButton = ({ onClick }) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      className={`button-close ${clicked ? "clicked" : ""}`}
      onClick={handleClick}
      aria-label="Close"
    ></button>
  );
};

export const CustomPopup = ({ show, setShowSummary, children }) => {
  const navigate = useNavigate();
  if (!show) return null;

  const handleInfoClick = () => {
    navigate("/summary-examples");
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <XButton onClick={() => setShowSummary(false)} />
        <Tooltip title="Click here to find more info" arrow>
          <Info
            onClick={handleInfoClick}
            className="info-button"
            color="#BB86FC"
            size="32px"
          />
        </Tooltip>

        {children}
      </div>
    </div>
  );
};

const Dashboard = ({
  setIsLoggedIn,
  courseId,
  setCourseId,
  topicData,
  setTopicData,
  setEnrolledPolylines,
}) => {
  const activitiesState = useState([]);
  const [showSummary, setShowSummmary] = useState(false);
  const [show, setShow] = useState(false);
  const [target, setTarget] = useState(null);
  const ref = useRef(null);
  const userId = localStorage.getItem("id");
  const learnerId = localStorage.getItem("learner_id");

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [enrolledLearner, setEnrolledLearner] = useState({});
  const [course, setCourse] = useState({});
  const [enrolledLearnersByCourse, setEnrolledLearnersByCourse] = useState([]);
  const [moduleData, setModuleData] = useState([]);

  // 🔹 NEW: which topic's summary is being written
  const [selectedTopicId, setSelectedTopicId] = useState(null);

  const enrollPolyline = enrolledLearner?.polyline;
  const [open, setOpen] = useState(false);
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const [showPoly, setShowPoly] = useState(false);
  const [summary, setSummary] = useState("");

  const learnerPosState = useState([]);
  const [learnerAtResourcePos, setLearnerAtResourcePos] = useState([]);
  const [prevPos, setPrevPos] = useState(null);

  const [openPoly, setOpenPoly] = useState(false);

  const navigate = useNavigate();

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
    if (response?.data) {
      setTopicData(response.data);
      console.log("this is the topics data", response.data);

      // 🔹 If no topic has been selected yet, default to the first topic
      if (!selectedTopicId && response.data.length > 0) {
        setSelectedTopicId(response.data[0].id);
      }
    }
  };

  const loadEnrollData = async (learnerId) => {
    console.log("fetching enroll data");
    const response = await getResponseGet(
      `enrolledLearner/${learnerId}/${courseId}`
    );
    if (response?.data) {
      console.log("this is enrolled learner", response.data);
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

  const loadEnrolledCourses = async () => {
    const response = await getResponseGet(`enrolledCourses/${userId}`);
    if (response?.data) {
      setEnrolledCourses(response.data);
    } else {
      console.error("Failed to fetch enrolled courses", response);
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

  const loadEnrolledPolylines = async () => {
    const enrollId = enrolledLearner?.enroll_id;
    const response = await getResponseGet(`enrolledPolylines/${enrollId}`);
    if (response?.data) {
      console.log("Enrolled Polylines", response.data);
      setEnrolledPolylines(response.data);
      localStorage.setItem("enrolledPolylines", JSON.stringify(response.data));
    } else {
      console.error("Failed to fetch enrolled polylines", response);
    }
  };

  const loadActivityData = async () => {
    const enrollId = enrolledLearner?.enroll_id;
    const response = await getResponseGet(`activities/${enrollId}`);
    if (response?.data) {
      console.log("Loaded Activities", response.data);
      activitiesState[1](response.data);
    } else {
      console.error("Failed to fetch activities data", response);
    }
  };

  useEffect(() => {
    if (enrolledLearner.enroll_id) {
      console.log("updating after enrollId is set");
      loadActivityData();
      loadEnrolledPolylines();
    }
  }, [enrolledLearner]);

  const handleSummaryClose = () => {
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

  // 🔹 Helper: current topic label
  const selectedTopic =
    topicData && selectedTopicId
      ? topicData.find((t) => t.id === selectedTopicId)
      : null;
  const selectedTopicLabel = selectedTopic
    ? selectedTopic.name
    : "Select topic";

  return (
    <>
      <div style={containerStyle}>
        <div style={completeHeaderStyle}>
          <div className="header" style={headerStyle}>
            <Button
              onClick={() => {
                navigate("/dashboard");
              }}
            >
              <i className="fa fa-chevron-left"></i>
            </Button>

            <div style={titleSectionStyle}>
              <h1>{course?.name} </h1>
            </div>

            <div style={{ flexGrow: 1 }}></div>

            <div>
              <LetterAvatar setIsLoggedIn={setIsLoggedIn} />
              <h6>{localStorage.getItem("name")}</h6>
            </div>
          </div>
          <span style={{ fontSize: "12px" }} id="description" className="">
            {course?.description}
          </span>
        </div>

        <div style={{ display: "flex" }}>
          <div id="learner-map" style={colStyleLeft}>
            <LearnerMap
              activitiesState={activitiesState}
              learnerPosState={learnerPosState}
              svgRef={svgRef}
              zoomRef={zoomRef}
              enrollId={enrolledLearner?.enroll_id}
              enrolledLearner={enrolledLearner}
              setEnrolledLearner={setEnrolledLearner}
              enrolledLearnersByCourse={enrolledLearnersByCourse}
              courseId={courseId}
              learnerAtResourcePos={learnerAtResourcePos}
              setLearnerAtResourcePos={setLearnerAtResourcePos}
            />
          </div>

          <div style={dropdownSectionStyle}>
            {enrolledCourses && (
              <DropdownButton id="enrolled-courses" title="Enrolled Courses">
                {enrolledCourses.map((course) => (
                  <Dropdown.Item
                    key={course.course_id}
                    onClick={() => handleCourseClick(course.course_id)}
                  >
                    <i className="fa fa-book"></i>
                    {"  " + course.course_name}
                  </Dropdown.Item>
                ))}
                <Dropdown.Item
                  key="Enroll new Course"
                  onClick={() => {
                    navigate("/dashboard");
                  }}
                >
                  <i className="fa fa-plus-square"></i>
                  {"  Enroll New Course "}
                </Dropdown.Item>
              </DropdownButton>
            )}

            <br />

            {/* 🔹 Topic selector for summary */}
            {topicData && topicData.length > 0 && (
              <>
                <span style={{ fontSize: "12px", marginBottom: "4px" }}>
                  Select topic to summarise:
                </span>
                <DropdownButton
                  id="topic-selector"
                  title={selectedTopicLabel}
                  size="sm"
                  style={{ marginBottom: "8px" }}
                >
                  {topicData.map((topic) => (
                    <Dropdown.Item
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                    >
                      {topic.name}
                    </Dropdown.Item>
                  ))}
                </DropdownButton>
              </>
            )}

            <Button
              id="summarise-learning"
              onClick={() => setShowSummmary((curr) => !curr)}
            >
              {!showSummary && "Summarise My Learning"}
              {showSummary && "Hide my summary"}
            </Button>

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
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: theme.palette.grey[500],
                })}
              >
                <CloseIcon />
              </IconButton>
              <DialogContent>
                {
                  <PolylineChart
                    polyline={enrollPolyline}
                    topicData={topicData}
                    setEnrolledLearner={setEnrolledLearner}
                  />
                }
              </DialogContent>
            </BootstrapDialog>

            <CustomPopup
              show={showSummary}
              setShowSummary={setShowSummmary}
              onClose={handleSummaryClose}
            >
              <div style={{ width: "100%" }}>
                <LearnerSummary
                  setShowSummary={setShowSummmary}
                  showSummary={showSummary}
                  activitiesState={activitiesState}
                  learnerPosState={learnerPosState}
                  setOpen={setOpen}
                  setPrevPos={setPrevPos}
                  enrollId={enrolledLearner?.enroll_id}
                  summary={summary}
                  setSummary={setSummary}
                  learnerId={learnerId}
                  setEnrolledLearner={setEnrolledLearner}
                  courseId={courseId}
                  // 🔹 Pass the topic id down
                  topicId={selectedTopicId}
                />
              </div>
            </CustomPopup>

            <Popup show={showPoly} setShow={setShowPoly}>
              <PolylineChart polyline={enrollPolyline} />
            </Popup>

            <Snackbar
              open={open}
              autoHideDuration={6000}
              onClose={handleCloseAlert}
            >
              <Alert
                onClose={handleCloseAlert}
                severity="success"
                variant="filled"
                sx={{ width: "100%" }}
              >
                {learnerPosState[0] &&
                  learnerPosState[0].length > 0 &&
                  prevPos &&
                  prevPos.length > 0 &&
                  (prevPos
                    ? `Your position got updated from ${prevPos[0].toFixed(
                        3
                      )}, ${prevPos[1].toFixed(
                        3
                      )} to ${learnerPosState[0][0].toFixed(
                        3
                      )}, ${learnerPosState[0][1].toFixed(3)}`
                    : `Your position is now at ${learnerPosState[0][0].toFixed(
                        3
                      )}, ${learnerPosState[0][1].toFixed(3)}`)}
              </Alert>
            </Snackbar>

            <Button onClick={() => navigate("/polylines-list")}>
              Polylines List
            </Button>
          </div>

          <div id="learning-journey" style={colStyleRight}>
            <LearnerActivity
              activitiesState={activitiesState}
              setLearnerAtResourcePos={setLearnerAtResourcePos}
              learnerPosState={learnerPosState}
              enrollId={enrolledLearner?.enroll_id}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
