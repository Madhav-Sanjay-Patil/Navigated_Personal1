import React, { Fragment } from "react";
import { XButton } from "../../../Components/Dashboard";

const Popup = ({ show, setShow, children }) => {
  return (
    show?
(    <div className="popup-overlay">
      <div className="popup-content">
        <XButton onClick={() => setShow(false)} />
        {children}
      </div>
    </div>):(
        <Fragment/>
    )
  );
};

export default Popup;
