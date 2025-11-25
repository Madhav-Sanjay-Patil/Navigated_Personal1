// The AddResource component likely provides a form for TAs to add new learning resources. It would handle user input for resource details like name 
// and link. Upon submission, it would send this data to the server to create a new resource, potentially updating the activity timeline for
// associated learners.
import { useEffect, useState } from "react";
import { Form, Modal, Button, Placeholder } from "react-bootstrap";
import { getResponseGet, getResponsePost } from "../../../lib/utils";
import CustomFileInput from "../../../Components/CustomFileInput";

const AddResource = ({ show, onHide, courseId, onSuccess }) => {
    const [resName, setResName] = useState(null);
    const [topics, setTopics] = useState([]);
    const [topicIdx, setTopicIdx] = useState(null);
    const [allResTypes, setAllResTypes] = useState([]);
    const [resType, setResType] = useState(null);
    const [ytLink, setYtLink] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);

    const defaultValidationObject = {
        name: false,
        topic: false,
        type: false,
        ytlink: false,
        pdf: false,
    };
    const [isInvalid, setIsInvalid] = useState(defaultValidationObject);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            const response = await getResponseGet(`/topics/${courseId}`);
            setTopics(response.data ?? []);
            const typesRes = await getResponseGet("/resource-types");
            setAllResTypes(typesRes.data ?? []);
        }
        loadData();
    }, []);

    useEffect(() => {
        setResName(null);
        setTopicIdx(null);
        setResType(null);
        setYtLink(null);
        setPdfFile(null);
        setIsInvalid(defaultValidationObject);
    }, [show]);

    const isYtRes = () => allResTypes.find((t) => String(t.name).toLowerCase().includes("youtube")).type === resType;
    const isPdfRes = () => allResTypes.find((t) => String(t.name).toLowerCase().includes("pdf")).type === resType;

    const validate = () => {
        let newIsInvalid = isInvalid;
        if (resName === null || resName === '') newIsInvalid = { ...newIsInvalid, name: true };
        if (topicIdx === null) newIsInvalid = { ...newIsInvalid, topic: true };
        if (resType === null) newIsInvalid = { ...newIsInvalid, type: true };
        else {
            if (isYtRes() && (ytLink === null || !isValidYtUrl(ytLink))) newIsInvalid = { ...newIsInvalid, ytlink: true };
            if (isPdfRes() && (pdfFile === null || !isValidPdf(pdfFile))) newIsInvalid = { ...newIsInvalid, pdf: true };
        }
        if (Object.values(newIsInvalid).some(v => v === true)) {
            setIsInvalid(newIsInvalid);
            return false;
        }
        return true;
    }

    const onSubmit = async () => {
        if (!validate()) return;
        setIsSubmitting(true);
        setSubmitMessage("Mapping Resource...");
        let res = null;
        if (isPdfRes()) {
            const formData = new FormData();
            formData.append("name", resName);
            formData.append("course_id", courseId);
            formData.append("module_id", topics[topicIdx].id);
            formData.append("type", resType);
            formData.append("module", topics[topicIdx].name);
            formData.append("pdf_file", pdfFile);
            res = await getResponsePost("/upload-pdf-resource",
                formData, { "Content-Type": "multipart/form-data" }
            );
        } else if (isYtRes()) {
            const data = {
                name: resName,
                course_id: courseId,
                module_id: topics[topicIdx].id,
                type: resType,
                link: ytLink,
                module: topics[topicIdx].name,
            };
            res = await getResponsePost("/new-resources-topics",
                data, { 'Content-Type': 'application/json' }
            );
        }
        if (res && res.status === 201) {
            setSubmitMessage("Resource Mapped Successfully!");
            onSuccess();
            setTimeout(() => {
                onHide();
            }, 1000);
        } else {
            console.log(res);
            // setSubmitMessage("Error: " + res.data.error);
        }
        setIsSubmitting(false);
    }

    const isValidYtUrl = (string) => {
        if (!string) return false;
        try {
            const url = new URL(string);
            const hostname = url.hostname;
            const pathname = url.pathname;
            const searchParams = new URLSearchParams(url.search);
            console.log(hostname);
            if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
                if (hostname.includes("youtube.com")) {
                    // Check for /watch, /embed, /v paths or query parameters
                    return pathname.startsWith("/watch") || pathname.startsWith("/embed") || pathname.startsWith("/v") || searchParams.has("v");
                } else if (hostname.includes("youtu.be")) {
                    return true; // youtu.be is always valid
                }
            }
            return false; // Not a YouTube URL
        } catch (err) {
            return false; // Invalid URL
        }
    };

    const isValidPdf = (file) => {
        if (!file) return false;
        // Check file extension
        const hasValidExtension = file.name.toLowerCase().endsWith('.pdf');
        // Check MIME type
        const hasValidMimeType = file.type === 'application/pdf';
        // Check file size
        const MAX_SIZE_BYTES = 30 * 1024 * 1024; // 30MB in bytes
        const hasValidSize = file.size <= MAX_SIZE_BYTES;
        return hasValidExtension && hasValidMimeType && hasValidSize;
    }

    const ResourceInput = () => {
        if (resType === null) return <></>;
        if (isYtRes()) {
            return (
                <Form.Group controlId="youtube-link">
                    <Form.Label>Youtube URL</Form.Label>
                    <Form.Control onChange={(e) => {
                        setYtLink(e.target.value);
                        setIsInvalid({ ...isInvalid, ytlink: !isValidYtUrl(e.target.value) });
                    }} isInvalid={isInvalid.ytlink} value={ytLink}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }} />
                    <Form.Control.Feedback type="invalid">
                        Please provide a valid YouTube video URL.
                    </Form.Control.Feedback>
                </Form.Group>
            );
        } else if (isPdfRes()) {
            return (
                <Form.Group controlId="pdf-file-upload">
                    <Form.Label>PDF File</Form.Label>
                    <CustomFileInput
                        onChange={(e) => {
                            const file = e.target.files[0];
                            setPdfFile(file);
                            setIsInvalid({ ...isInvalid, pdf: !isValidPdf(file) });
                        }}
                        isInvalid={isInvalid.pdf}
                        accept=".pdf"
                        label={pdfFile ? pdfFile.name : "Select PDF file"}
                        invalidFeedback="Please provide a valid PDF file (max. size 30MB)"
                    />
                </Form.Group>
            );
        }
        return <Placeholder />;
    }

    return (
        <Modal show={show} onHide={onHide} backdrop={isSubmitting ? "static" : undefined}>
            <Modal.Header closeButton={!isSubmitting}>
                <Modal.Title>Add Resource</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group>
                    <Form.Label>Resource Name</Form.Label>
                    <Form.Control onChange={(e) => {
                        setResName(e.target.value);
                        if (e.target.value.length > 0) setIsInvalid({ ...isInvalid, name: false });
                    }} isInvalid={isInvalid.name}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }} />
                    <Form.Control.Feedback type="invalid">
                        Please provide a resource name.
                    </Form.Control.Feedback>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Topic</Form.Label>
                    <Form.Select onChange={(e) => {
                        setTopicIdx(e.target.value);
                        setIsInvalid({ ...isInvalid, topic: false });
                    }} isInvalid={isInvalid.topic}>
                        <option hidden>Choose Topic</option>
                        {topics.map((data, idx) => (
                            <option key={idx} value={idx}>{data.name}</option>
                        ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                        Please choose a topic.
                    </Form.Control.Feedback>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Resource Type</Form.Label>
                    <Form.Select onChange={(e) => {
                        setResType(e.target.value);
                        setIsInvalid({ ...isInvalid, type: false });
                    }} isInvalid={isInvalid.type}>
                        <option hidden>Choose Type</option>
                        {allResTypes.map((data, idx) => (
                            <option key={idx} value={data.type}>{data.name}</option>
                        ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                        Please choose a resource type.
                    </Form.Control.Feedback>
                </Form.Group>
                <ResourceInput />
                {submitMessage &&
                    <span className="mt-2">{submitMessage}</span>
                }
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onSubmit} disabled={isSubmitting}>
                    Submit
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default AddResource;
