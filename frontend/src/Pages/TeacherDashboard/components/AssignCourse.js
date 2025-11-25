// The AssignCourse component presents a confirmation popup to teachers for assigning themselves to a selected course. 
// It displays the course name and includes a "Confirm" button that triggers an API call to assign the course to the teacher. 
// A loading spinner is shown during the assignment process.
import React, { useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { getResponsePost } from "../../../lib/utils";
import Popup from "../../UserDashboard/components/Popup";

const AssignCourse = ({ course, show, setShow, setRefresh }) => {
  const [loading, setLoading] = useState(false);
  const teacherId = localStorage.getItem("teacher_id");

  const assignCourse = async () => {
    setLoading(true);
    const response = await getResponsePost("teacher/courses/assign", {
      course_id: course.course_id,
      teacher_id: teacherId,
    });
    setLoading(false);

    if (response) {
      console.log(response);
      setRefresh(true);
    }
    setShow(false);
  };
  return (
    <Popup show={show} setShow={setShow}>
      <>
        {show && (
          <div className="learnerSummaryBody">
            {loading ? (
              <>
                <div className="center">
                  <Spinner animation="border" style={{ color: "blueviolet" }} />
                  <p
                    style={{
                      marginTop: "13px",
                      color: "#fff",
                      fontSize: "20px",
                    }}
                  >
                    Please wait while assigning to the course
                  </p>
                </div>
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <p
                  style={{ marginTop: "13px", color: "#fff", fontSize: "20px" }}
                >
                  Please Confirm for assigning to the course "
                  {course.course_name}"
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "100%",
                  }}
                >
                  <Button
                    className="summarySubmitButton"
                    onClick={assignCourse}
                    disabled={loading}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </>
    </Popup>
  );
};

export default AssignCourse;
