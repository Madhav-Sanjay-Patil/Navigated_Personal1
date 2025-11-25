// The ParentComponent serves as a container for the LearnerActivity component. 
// It defines a sample enrolledLearner object with properties like accessible_resources, course_id, learner_id, and 
// learner_name (representing a learner's details) and passes this object as a prop to the LearnerActivity component
// for further use. This setup allows LearnerActivity to access and display or manipulate the learner's data dynamically,
// making it a reusable structure for handling and rendering learner-specific information in a modular fashion.
import React from "react";
import LearnerActivity from "./LearnerActivity"; // Import the LearnerActivity component
const ParentComponent = () => {
    // Create a sample enrolledLearner object (replace with your actual data)
    const enrolledLearner = {
        accessible_resources: [1, 2, 3, 4],
        course_id: 1,
        learner_id: 1,
        learner_name: "Gururaj",
        // Add any other relevant properties here...
    };
    // Pass the enrolledLearner object as a prop to LearnerActivity
    return <LearnerActivity enrolledLearner={enrolledLearner} />;
};
export default ParentComponent;
