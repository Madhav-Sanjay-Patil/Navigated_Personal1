// LearnerSummary.jsx

import React, { useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { getResponsePost, getResponseGet } from "../lib/utils";
import Spinner from "react-bootstrap/Spinner";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

const LearnerSummary = ({
  activitiesState,
  learnerPosState,
  showSummary,
  setShowSummary,
  setOpen,
  setPrevPos,
  enrollId,
  setSummary,
  summary,
  learnerId,
  setEnrolledLearner,
  courseId,
  topicId, // 🔹 NEW: topic-wise summary
}) => {
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  const countWords = (text) => {
    return text.trim().split(/\s+/).length;
  };

  const handleCloseAlert = (event, reason) => {
    if (reason === "clickaway") return;
    setAlertOpen(false);
  };

  const updatePosition = async () => {
    const wordCount = countWords(summary);

    // Check if word count is greater than 100
    if (wordCount < 100) {
      setAlertOpen(true);
      return;
    }

    if (!topicId) {
      console.error("Missing topicId for topic-wise summary clustering");
      setAlertOpen(true);
      return;
    }

    setLoading(true);

    try {
      // 🔹 SINGLE BACKEND CALL: /api/summary
      const payload = {
        enroll_id: enrollId,
        course_id: courseId,
        topic_id: topicId,
        summary_text: summary,
      };

      console.log("Calling /api/summary with:", payload);

      const summaryResponse = await getResponsePost("/api/summary", payload);

      if (!summaryResponse?.data) {
        console.error("No data returned from /api/summary");
        setLoading(false);
        return;
      }

      const {
        new_position,
        cluster_id,
        cluster_keywords = [],
        contribution_id = null, // if backend adds it; otherwise null
      } = summaryResponse.data;

      if (!new_position || new_position.x == null || new_position.y == null) {
        console.error("Invalid new_position:", new_position);
        setLoading(false);
        return;
      }

      const newPositions = [Number(new_position.x), Number(new_position.y)];

      // 🔹 Update learner position state
      console.log(
        "Updating position from",
        learnerPosState[0],
        "to",
        newPositions
      );
      setPrevPos(learnerPosState[0]);
      learnerPosState[1](newPositions);

      // 🔹 Refresh enrolled learner data (gets latest x,y and possibly cluster)
      const response2 = await getResponseGet(
        `enrolledLearner/${learnerId}/${courseId}`
      );

      if (response2?.data) {
        setEnrolledLearner(response2.data);
        learnerPosState[1]([
          Number(response2.data.x_coordinate),
          Number(response2.data.y_coordinate),
        ]);
      } else {
        console.error("Failed to fetch enrolled learner data", response2);
      }

      // 🔹 Log activity in local state
      setSummary(summary);
      activitiesState[1]((activities) => [
        ...activities,
        {
          type: "summary",
          name: summary,
          time: Date(),
          contribution_id: contribution_id,
          cluster_id: cluster_id,
          cluster_keywords: cluster_keywords,
          x: newPositions[0],
          y: newPositions[1],
          topic_id: topicId,
        },
      ]);

      // 🔹 Persist activity to backend
      const activityData = {
        type: "summary",
        name: summary.slice(0, 50),
        time: new Date().toISOString().slice(0, 19).replace("T", " "),
        link: null,
        enroll_id: enrollId,
        contribution_id: contribution_id,
        cluster_id: cluster_id,
        cluster_keywords: cluster_keywords,
        x_coordinate: newPositions[0],
        y_coordinate: newPositions[1],
        topic_id: topicId,
      };

      console.log("Activity data:", activityData);
      const response1 = await getResponsePost("/activities", activityData);
      console.log("Activity logged:", response1);

      console.log("Position updated successfully:", newPositions);
      console.log("Cluster ID:", cluster_id);

      setLoading(false);
      setSummary("");
      setShowSummary(false);
      setOpen(true);
    } catch (error) {
      console.error("Error in updatePosition:", error);
      setLoading(false);
    }
  };

  return (
    <>
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
      >
        <Alert
          onClose={handleCloseAlert}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Summary should contain at least 100 words and a valid topic.
        </Alert>
      </Snackbar>

      {showSummary && (
        <div className="learnerSummaryBody">
          {loading ? (
            <div className="center">
              <Spinner animation="border" style={{ color: "blueviolet" }} />
              <p style={{ marginTop: "13px" }}>
                Please wait while we update your position
              </p>
            </div>
          ) : (
            <>
              <InputGroup className="mb-3 titleText">
                <InputGroup.Text>Title</InputGroup.Text>
                <Form.Control
                  as="textarea"
                  aria-label="With textarea"
                  placeholder="Enter the title"
                />
              </InputGroup>
              <InputGroup className="mb-3 summaryText">
                <InputGroup.Text>Summary</InputGroup.Text>
                <Form.Control
                  as="textarea"
                  placeholder="Enter the summary (minimum 100 words)"
                  aria-label="With textarea"
                  value={summary}
                  maxLength={1500}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </InputGroup>

              <Button
                className="summarySubmitButton"
                onClick={updatePosition}
                disabled={loading}
              >
                Update My Position
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default LearnerSummary;
