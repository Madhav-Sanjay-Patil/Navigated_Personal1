// The AddSummary React component, used within the TA Dashboard, displays a popup allowing Teaching Assistants to add a summary for a 
// specific course. It utilizes a textarea for input and a button to submit the description. Upon submission, it sends the 
// TA's ID, course ID, and the entered description to the server using a POST request and then closes the popup.

import React, { useState } from "react";
import Popup from "./Popup";
import { getResponseGet, getResponsePost } from "../../../lib/utils";
import { Button, Spinner } from "react-bootstrap";

let ta_id=localStorage.getItem("ta_id");

const AddSummary = ({ course, show, setShow, setRefresh }) => {
  const [description, setDescription] = useState("");

  const submitDescription = async () => {
      const data = {
          ta_id: ta_id,
          course_id: course.id,
          description:description
      };
      let res=null;
      res = await getResponsePost("/ta-gi-summary",
          data,{ 'Content-Type': 'application/json' }
      );
      console.log("^^^^^^^^^^^^^^idi ra course_id^^^^^^^^^^^^", course.id);
      console.log("^^^^^^^^^^^^^^idi ra ta_id^^^^^^^^^^^^^^",ta_id);
      console.log("^^^^^^^^^^^^^^Submitted Description^^^^^: ", description);
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

export default AddSummary;