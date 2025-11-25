// The code defines a CustomFileInput component in React, which is designed for file input with a custom button and validation. It uses React Bootstrap components like Form.Control, InputGroup, and Button to provide a user-friendly interface for file selection. The file input itself is hidden, and the "Browse" button triggers the file selection via fileInputRef. The component accepts props such as onChange, isInvalid, accept, label, and invalidFeedback to customize its behavior and display. If the file input is invalid, an error message is shown below the input field. The component is useful for managing file uploads in forms, particularly when dealing with PDFs.
import React, { useRef } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';

const CustomFileInput = ({
    onChange,
    isInvalid,
    accept = '.pdf',
    label = 'Choose file',
    invalidFeedback = 'Please choose a valid file',
    ...buttonProps
}) => {
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        console.log(file);
        onChange(e);
    };

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div>
            <InputGroup className="d-flex">
                <Form.Control
                    type="text"
                    value={label}
                    disabled
                    className={`mr-2 ${isInvalid ? 'is-invalid' : ''}`}
                    />
                <Button
                    variant="outline-secondary"
                    onClick={handleButtonClick}
                    {...buttonProps}
                >
                    Browse
                </Button>
            </InputGroup>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept={accept}
                style={{ display: 'none' }}
            />
            {isInvalid && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {invalidFeedback}
                </Form.Control.Feedback>
            )}
        </div>
    );
};

export default CustomFileInput;
