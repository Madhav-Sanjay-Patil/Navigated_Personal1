// The Popup component conditionally renders an overlay with content. When show is true, it displays a div with a close 
// button (XButton) and renders its children within. When show is false, it renders an empty Fragment, effectively hiding the popup.
import React, { Fragment } from "react";
import { XButton } from "../../../Components/Dashboard";

const Popup = ({ show, setShow, children }) => {
    return (
        show ?
            (<div className="popup-overlay">
                <div className="popup-content">
                    <XButton onClick={() => setShow(false)} />
                    {children}
                </div>
            </div>) : (
                <Fragment />
            )
    );
};

export default Popup;
