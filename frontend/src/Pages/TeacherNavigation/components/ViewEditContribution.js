// The ViewEditContribution component displays a popup showing a learner's contribution summary. 
// If the TA has editing permissions, they can also view and update the grade for the contribution using a dropdown. 
// The component fetches contribution data on opening and updates the learner's position upon successful grading. 
// It handles loading states during data fetching and grade updates.
import React, { useEffect, useState } from "react";
import Popup from "../../UserDashboard/components/Popup";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { GRADES } from "./data";
import { getResponseGet, getResponsePost } from "../../../lib/utils";

const ViewEditContribution = ({ open, setOpen, id, setLearnersRefresh, canEdit }) => {
    const [loading, setLoading] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [formData, setFormData] = useState(null);
    const handleUpdateContribution = async () => {
        console.log(formData);
        setLoading(true);
        // make request
        const res = await getResponsePost("changeSummaryGrade", {
            contribution_id: formData.contribution_id,
            grade: formData.grade,
        });

        setLoading(false);
        setOpen(false);
        if (res.status === 200) {
            // refresh learners position
            setLearnersRefresh(true);
            alert("Contribution is graded");
        }
    };

    const getContributionData = async () => {
        setViewLoading(true);
        const res = await getResponseGet(`/contributions/view/${id}`);
        // get data based on contribution id and set response
        if (res.data) {
            const data = res.data;
            setFormData({
                contribution_id: data.id,
                summary: data.contribution_content,
                grade: Number(data.grade),
            });
        }
        setViewLoading(false);
    };
    useEffect(() => {
        if (open && id) {
            console.log(id);
            getContributionData();
        } else {
            setFormData(null);
        }
    }, [open, id]);

    return (
        <Popup show={open} setShow={setOpen}>
            <>
                {open && (
                    <div className="learnerSummaryBody">
                        {viewLoading ? (
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
                                        Please wait while loading the contribution
                                    </p>
                                </div>
                            </>
                        ) : loading ? (
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
                                        Please wait while updating the contribution grade
                                    </p>
                                </div>
                            </>
                        ) : canEdit ? (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    //   alignItems: "center",
                                    width: "100%",
                                }}
                                className="learnerSummaryBody"
                            >
                                <InputGroup className="mb-3 summaryText">
                                    <InputGroup.Text>Summary</InputGroup.Text>
                                    <Form.Control
                                        as="textarea"
                                        placeholder="Enter the summary or upload a pdf"
                                        aria-label="With textarea"
                                        value={formData?.summary}
                                        readOnly
                                    />
                                </InputGroup>
                                <InputGroup className="mb-3 gradeText">
                                    <InputGroup.Text>Grade</InputGroup.Text>
                                    <Form.Select
                                        value={formData?.grade}
                                        onChange={(e) =>
                                            setFormData((prev) => {
                                                return { ...prev, grade: Number(e.target.value) };
                                            })
                                        }
                                    >
                                        <option value={null} disabled>
                                            Select an option
                                        </option>
                                        {GRADES.map((item) => (
                                            <option value={item.value}>{item.label}</option>
                                        ))}
                                    </Form.Select>
                                </InputGroup>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        width: "100%",
                                    }}
                                >
                                    <Button
                                        className="summarySubmitButton"
                                        onClick={handleUpdateContribution}
                                        disabled={loading}
                                    >
                                        Update Grade
                                    </Button>
                                </div>
                            </div>
                        ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        color: "#fff",
                                        width: "100%",
                                        gap: "10px",
                                    }}
                                    className="learnerSummaryBody"
                                >
                                    <div style={{ fontWeight: "bold", fontSize: "22px" }}>
                                        Summary :
                                    </div>
                                    <div>{formData?.summary}</div>
                                    <div>
                                        <span style={{ fontWeight: "bold" }}>Grade : </span>
                                        {formData && formData.grade
                                            ? GRADES.find((item) => item.value === formData.grade)
                                                .label
                                            : "-"}
                                    </div>
                                </div>
                        )}
                    </div>
                )}
            </>
        </Popup>
    );
};

export default ViewEditContribution;
