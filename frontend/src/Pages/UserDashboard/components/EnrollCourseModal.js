// The EnrollCourseModal component provides a modal for users to enroll in a course. It allows choosing an enrollment 
// mode (learner, teacher, or TA), and for TAs, it includes a text area for a description. Upon confirmation, 
// it sends an API request to enroll the user and triggers a page refresh. It displays a loading spinner 
// during the enrollment process and disables the confirm button based on the selected mode and input fields.
import React, { useState } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { getResponsePost, syncUserIds } from "../../../lib/utils";

const EnrollCourseModal = ({ course, show, setShow, setRefresh }) => {
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem("id");
  const learnerId = localStorage.getItem("learner_id");
  const teacherId = localStorage.getItem("teacher_id");
  const taId = localStorage.getItem("ta_id");
  const [enrolmentMode, setEnrolmentMode] = useState("");
  const [taDescription, setTaDescription] = useState("");

  const enrollCourse = async () => {
    setLoading(true);
    let response = null;
    if (enrolmentMode === 'learner') {
      response = await getResponsePost("/enrolls", {
        course_id: course.course_id,
        user_id: userId,
        learner_id: learnerId,
      });
    } else if (enrolmentMode === 'teacher') {
      response = await getResponsePost("teacher/courses/assign", {
        course_id: course.course_id,
        user_id: userId,
        teacher_id: teacherId,
      });
    } else {
      response = await getResponsePost("/ta-ch-description", {
        course_id: course.course_id,
        user_id: userId,
        ta_id: taId,
        description: taDescription,
      });
    }
    await syncUserIds();
    setLoading(false);

    if (response) {
      console.log(response);
      setRefresh(true);
    }
    setShow(false);
  };

  return (
    <Modal
      show={show}
      onHide={() => setShow(false)}
      backdrop={loading ? "static" : undefined}
    >
      <Modal.Header>
        <Modal.Title className="w-100 d-flex justify-content-between">
          Enroll for Course
          {loading && <Spinner animation="grow" variant="primary" />}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Enrolling for course <em>{course.course_name}</em>...<br />
        Choose enrolment mode: <br />
        <Form.Check
          type="radio"
          name="enrolmentMode"
          id="enrol-mode-learner"
          value="learner"
          checked={enrolmentMode === 'learner'}
          onChange={(e) => { setEnrolmentMode(e.target.value) }}
          label={<label htmlFor="enrol-mode-learner">Learner</label>}
        />
        <Form.Check
          type="radio"
          name="enrolmentMode"
          id="enrol-mode-teacher"
          value="teacher"
          checked={enrolmentMode === 'teacher'}
          onChange={(e) => { setEnrolmentMode(e.target.value) }}
          label={<label htmlFor="enrol-mode-teacher">Teacher</label>}
        />
        <Form.Check
          type="radio"
          name="enrolmentMode"
          id="enrol-mode-ta"
          value="ta"
          checked={enrolmentMode === 'ta'}
          onChange={(e) => { setEnrolmentMode(e.target.value) }}
          label={<label htmlFor="enrol-mode-ta">Teaching Assistant</label>}
        />
        {enrolmentMode === 'ta' &&
          <>
            <Form.Label>Please provide a summary of your expertise in this course:</Form.Label>
            <Form.Control
              onChange={(e) => { setTaDescription(e.target.value) }}
              as="textarea"
              rows={5}
            />
          </>
        }
      </Modal.Body>
      <Modal.Footer>
        <Button
          title="Confirm"
          onClick={enrollCourse}
          disabled={
            enrolmentMode === ''
            || loading
            || (enrolmentMode === 'ta' && taDescription === '')
          }
        >
          {
            loading
              ? "Submitting..."
              : "Confirm"
          }
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EnrollCourseModal;
