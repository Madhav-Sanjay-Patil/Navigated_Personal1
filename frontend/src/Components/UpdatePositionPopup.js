// The UpdatePositionPopup component allows users to update the position of a resource on a map. It triggers a confirmation prompt after
// shifting the resource, making an API call to validate and update the new position. A loading spinner is displayed during the process,
// and status updates are shown to the user.
import React, { Fragment, useEffect, useState } from "react";
import { getResponsePost } from "../lib/utils";
import { XButton } from "./Dashboard";
import { Button, Spinner } from "react-bootstrap";

const UpdatePositionPopup = ({
    open,
    setOpen,
    newPos,
    oldPos,
    updatePosition,
    data,
    xScale,
    yScale,
    setRefresh,
}) => {
    const [loading, setLoading] = useState(false);
    const [actualNew, setActualNew] = useState(null);
    const handleShiftResource = async () => {
        // make request
        // if not accepted set to old pos
        // update to latest pos
        console.log(data);
        // return
        setLoading(true);
        const response1 = await getResponsePost("suitableResourcePosition", {
            pos: [xScale.invert(newPos.x), yScale.invert(newPos.y)],
            resource_id: data.id,
        });
        // setActualNew(response1.data);
        console.log(response1);
        setActualNew(response1.data);
        setLoading(false);
    };

    const confirmPosition = async (accept) => {
        console.log(actualNew);
        // return
        const response2 = await getResponsePost("changeResourcePosition", {
            pos: actualNew,
            resource_id: data.id,
        });

        console.log(response2);
        if (response2 && response2.status === 200) {
            // update to latest position
            //   updatePosition(newPos)
            alert("Updation done successfully");
            setRefresh(true);
        } else {
            // update to old position
            //   updatePosition(oldPos)
            alert("Failed to update");
        }
        handleClose();
    };

    const handleClose = () => {
        setOpen(false);
        setActualNew(null);
        // reset olf position
        // updatePosition(oldPos)
    };
    useEffect(() => {
        if (open) {
            console.log("popup", open);
        }
    }, [open]);

    return open ? (
        <div className="popup-overlay">
            <div className="popup-content">
                <XButton onClick={handleClose} />

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
                                Please wait while updating the position
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ color: "white", padding: "10px 0" }}>
                            {data && (
                                <div>
                                    <span>Resource Index : {data.index}</span>
                                    <br />
                                    <span>Resource Title : {data.name}</span>
                                    <br />
                                </div>
                            )}

                            {actualNew ? (
                                <div>
                                    <span>{`You Selected X: ${xScale.invert(
                                        newPos.x
                                    )} , Y: ${yScale.invert(newPos.y)}.`}</span>
                                    <br />
                                    <span>
                                        {`Close possible coordinates are X:${actualNew[0]} , Y: ${actualNew[1]}.`}
                                    </span>
                                    <br />
                                    <span>Would You like to Update the position?</span>
                                </div>
                            ) : (
                                <div>
                                    Do you want to Update the position to X:
                                    {xScale.invert(newPos.x)} , Y:
                                    {yScale.invert(newPos.y)}
                                </div>
                            )}
                        </div>
                        <div>
                            <Button
                                onClick={() =>
                                    actualNew ? confirmPosition(true) : handleShiftResource()
                                }
                            >
                                Confirm
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    ) : (
        <Fragment />
    );
};

export default UpdatePositionPopup;
