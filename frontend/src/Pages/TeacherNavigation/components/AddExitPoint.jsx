import { useEffect, useState } from "react";
import { Modal, Form, Button, Spinner } from "react-bootstrap"
import { getResponsePost, getWordCount } from "../../../lib/utils";

const AddExitPoint = ({ show, onHide, courseId, onSuccess }) => {
    const [desc, setDesc] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState("");

    const defaultValidState = {
        desc: true,
    };
    const [validState, setValidState] = useState(defaultValidState);
    
    useEffect(() => {
        setDesc("");
        setValidState(defaultValidState);
    }, [show]);

    function validate() {
        let newValidState = Object.create(defaultValidState);
        if (!desc || getWordCount(desc) < 20) {
            newValidState.desc = false;
        }
        setValidState(newValidState);
        return Object.values(newValidState).every((v) => v);
    }

    async function onSubmit() {
        if (!validate()) return;
        setIsSubmitting(true);
        setSubmitResult("Submitting...");
        const data = {
            course_id: courseId,
            description: desc,
        };
        try {
            const res = await getResponsePost("/teacher-exit-points", data);
            if (res.status === 200 || res.status === 201) {
                setSubmitResult("Exit point added successfully!");
                onSuccess();
                setTimeout(() => {
                    onHide();
                }, 600);
            }
        } catch (e) {
            setSubmitResult(`Failed to submit: ${e}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal show={show} onHide={onHide} backdrop={isSubmitting ? "static" : undefined}>
            <Modal.Header closeButton={!isSubmitting}>
                <Modal.Title className="w-100 d-flex justify-content-between">
                    Add Exit Point
                    {isSubmitting && <Spinner animation="border" variant="primary" />}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group>
                    <Form.Label>Exit Point Description</Form.Label>
                    <Form.Control 
                        onChange={(e) => {
                            setDesc(e.target.value);
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                        as={"textarea"}
                        rows={5}
                        isInvalid={!validState.desc}
                        readOnly={isSubmitting}
                    />
                    <Form.Control.Feedback type="invalid">
                        Description must be at least 20 words long.
                    </Form.Control.Feedback>
                </Form.Group>
                <span>
                    {submitResult}
                </span>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onSubmit} disabled={isSubmitting}>
                    Submit
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default AddExitPoint;