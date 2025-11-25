// The TeachCourse component, a popup, allows a TA to submit a description for teaching a specific course. 
// It takes course details and visibility states as props, using a textarea for input. Upon clicking "Send," 
// it posts the TA's ID, course ID, and description to the server before closing.
import React, { useState } from "react";
import Popup from "./Popup";
import { getResponseGet, getResponsePost } from "../../../lib/utils";
import { Button, Spinner } from "react-bootstrap";

let ta_id=localStorage.getItem("ta_id");
const TeachCourse = ({ course, show, setShow, setRefresh }) => {
  const [description, setDescription] = useState("");

  const submitDescription = async () => {
      const data = {
          ta_id: ta_id,
          course_id: course.course_id,
          description:description
      };
      let res=null;
      res = await getResponsePost("/ta-ch-description",
          data,{ 'Content-Type': 'application/json' }
      );
      console.log(course.course_id);
      // console.log(ta_id);
      console.log("Submitted Description: ", description);
      console.log(res);
      setShow(false);
  };

  return (
    <Popup show={show} setShow={setShow}>
      <>
        {show && (
          <div className="descriptionBody">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              style={{ width: "100%", height: "100px" }}
            />
            <Button
              className="submitButton"
              onClick={submitDescription}
            >
              Send
            </Button>
          </div>
        )}
      </>
    </Popup>
  );
};

export default TeachCourse;
