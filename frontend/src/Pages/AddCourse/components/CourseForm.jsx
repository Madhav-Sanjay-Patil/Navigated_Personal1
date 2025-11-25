// The CourseForm component manages course creation by allowing users to input a course name and description,
// while also adding modules and topics. It tracks these inputs with state hooks and updates the parent 
// component through setFormData, ensuring the course, modules, and topics are properly managed and submitted.
import { Form, FloatingLabel } from 'react-bootstrap';
import '../css/CourseForm.css';
import { useEffect, useState } from 'react';
import AddModules from './AddModules';
import AddTopics from './AddTopics';
import { getWordCount } from '../../../lib/utils';

const CourseForm = ({ setFormData }) => {
    const [courseName, setCourseName] = useState("");
    const [courseDesc, setCourseDesc] = useState("");
    const [modules, setModules] = useState([]);
    const [topics, setTopics] = useState([]);

    useEffect(() => {
        setFormData({
            course: {
                name: courseName,
                description: courseDesc,
            },
            modules: modules,
            topics: topics,
        });
    }, [courseName, courseDesc, topics]);

    return (
        <div className='form'>
            <FloatingLabel label="Course Name">
                <Form.Control type='text' onChange={(e) => setCourseName(e.target.value)} placeholder='' />
            </FloatingLabel>
            <FloatingLabel className='mt-1' label={`Course Description (${getWordCount(courseDesc)}/50)`}>
                <Form.Control style={{ height: '150px' }} as='textarea' onChange={(e) => setCourseDesc(e.target.value)} placeholder='' />
            </FloatingLabel>
            <AddModules setModuleData={setModules} />
            <AddTopics modules={modules} setTopicsData={setTopics} />
        </div>
    );
}

export default CourseForm;
