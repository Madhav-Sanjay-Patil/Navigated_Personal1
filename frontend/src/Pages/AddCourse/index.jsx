// This React component, AddCourse, renders a form for creating new courses with modules and topics. It manages form state, performs 
// client-side validation ensuring required fields and minimum word counts are met. Upon successful validation, it sends the course
// data to the server, displaying activity messages and handling potential errors in modals before redirecting to the dashboard
// on success or allowing the user to correct errors.
import { useState } from "react";
import CourseForm from "./components/CourseForm";
import './css/AddCourse.css';
import { Button, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getResponsePost } from "../../lib/utils";
import { getWordCount } from '../../lib/utils';

const AddCourse = () => {
    const navigate = useNavigate();
    const [closeModalVisible, setCloseModalVisible] = useState(false);
    const [formData, setFormData] = useState(null);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessages, setErrorMessages] = useState([]);

    const [activityModalVisible, setActivityModalVisible] = useState(false);
    const [activityMessages, setActivityMessages] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const validate = () => {
        let validated = true;
        let newErrorMessages = [];
        const addErrorMessage = (msg) => {
            newErrorMessages = [
                ...newErrorMessages,
                msg,
            ];
        };
        if (formData.course.name === '') {
            addErrorMessage("Course Name is required");
            validated = false;
        }
        const descWordCount = getWordCount(formData.course.description);
        if (descWordCount < 50) {
            addErrorMessage("Course Description must have at least 50 words");
            validated = false;
        }
        if (formData.modules.length === 0) {
            addErrorMessage("At least 1 module is required");
            validated = false;
        } else {
            for (let i = 0; i < formData.modules.length; i++) {
                const module = formData.modules[i];
                if (module.name.length === 0) {
                    addErrorMessage(`Module Name for Module #${i + 1} is required`);
                    validated = false;
                }
                if (formData.topics.filter((t) => t.moduleIdx == i).length === 0) {
                    addErrorMessage(`Module #${i + 1} must have at least 1 topic`);
                    validated = false;
                }
            }
        }
        if (formData.topics.length === 0) {
            addErrorMessage("At least 1 topic is required");
            validated = false;
        } else {
            for (let i = 0; i < formData.topics.length; i++) {
                const topic = formData.topics[i];
                if (topic.name.length === 0) {
                    addErrorMessage(`Topic Name for Topic #${i + 1} is required`);
                    validated = false;
                }
                if (topic.moduleIdx === -1) {
                    addErrorMessage(`Module for Topic #${i + 1} is required`);
                    validated = false;
                }
                if (getWordCount(topic.description) < 50) {
                    addErrorMessage(`Topic Description for Topic #${i + 1} must have at least 50 words`);
                    validated = false;
                }
            }
        }
        if (!validated) {
            setErrorMessages(newErrorMessages);
            setErrorModalVisible(true);
            return false;
        }
        return true;
    }

    const onSubmit = async () => {
        console.log(formData);
        if (!validate()) return;
        // send data to server
        setSubmitting(true);
        setActivityMessages([]);
        setActivityModalVisible(true);
        const currentTime = () => new Date()
            .toLocaleTimeString(
                'en-US',
                {
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                }
            );
        var messages = [];
        try {
            const res = await getResponsePost('/courses', {
                name: formData.course.name,
                description: formData.course.description,
                topic_count: formData.topics.length,
            });
            if (res.status !== 201) {
                throw new Error("Failed course creation: " + (res.data?.error ?? "Server error"));
            }
            messages = [...messages, currentTime() + ' - New course created'];
            setActivityMessages(messages);
            const courseId = res.data.id;
            const moduleIds = {};
            for (let i = 0; i < formData.modules.length; i++) {
                const module = formData.modules[i];
                const resModule = await getResponsePost('/add-module', {
                    course_id: courseId,
                    name: module.name,
                });
                if (resModule.status !== 201) {
                    throw new Error(`Failed adding module "${module.name}": ` + (res.data?.error ?? "Server error"));
                }
                messages = [...messages, currentTime() + ` - Module "${module.name}" added to course`];
                setActivityMessages(messages);
                const moduleId = resModule.data.id;
                moduleIds[i] = moduleId;
            }
            messages = [...messages, currentTime() + ` - Mapping topics`];
            setActivityMessages(messages);
            const topicsData = {
                course_id: courseId,
                topics: formData.topics.map((t) => ({
                    name: t.name,
                    module_id: moduleIds[t.moduleIdx],
                    description: t.description,
                })),
            };
            console.log(topicsData);
            const resTopics = await getResponsePost('/new-course-topics', topicsData);
            if (resTopics.status !== 201) {
                throw new Error("Failed topic mapping: " + (res.data?.error ?? "Server error"));
            }
            messages = [...messages, currentTime() + ' - Topics mapping created', 'New course creation complete!'];
            setSuccess(true);
        } catch (e) {
            messages = [...messages, currentTime() + ' - ' + e.toString()];
        } finally {
            setActivityMessages(messages);
            setSubmitting(false);
        }
    }

    return (
        <div className="add-course">
            <div className="navbar">
                Add Course
            </div>

            <CourseForm setFormData={setFormData} />

            <div className="footer">
                <Button variant='danger' onClick={() => setCloseModalVisible(true)}>
                    Cancel
                </Button>
                <div style={{ flexGrow: 1 }}></div>
                <Button variant='success' onClick={onSubmit}>
                    Submit
                </Button>
            </div>

            <Modal show={closeModalVisible} onHide={() => setCloseModalVisible(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Discard Changes?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    If you go back now, all your changes will be lost!<br></br>
                    Are you sure you want to proceed?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={() => navigate("/dashboard")}>
                        Discard Changes
                    </Button>
                    <Button variant="primary" onClick={() => setCloseModalVisible(false)}>
                        Continue Editing
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={errorModalVisible} onHide={() => setErrorModalVisible(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Let's try that again...</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Please verify that the following is rectified:
                    <ul>
                        {errorMessages.map((m) => (
                            <li>{m}</li>
                        ))}
                    </ul>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setErrorModalVisible(false)}>
                        I understand
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={activityModalVisible} backdrop='static'>
                <Modal.Header>
                    <Modal.Title className="w-100 d-flex justify-content-between">
                        Submitting...
                        {submitting && <Spinner animation="border" variant="success" />}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Please wait while the new course and topics data is being sent to the server. <br></br>
                    {activityMessages.map((m) => (
                        <>{m} <br></br></>
                    ))}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant={success ? "success" : "primary"} disabled={submitting}
                        onClick={() => {
                            if (success) navigate("/dashboard");
                            else setActivityModalVisible(false);
                        }}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default AddCourse;
