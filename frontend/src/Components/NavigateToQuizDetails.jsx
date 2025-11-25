// The NavigateToQuizDetails component enables navigation to a quiz details page based on the user's quiz logs.
// It utilizes the useState hook to manage loading states and error handling. Upon clicking the "View Quiz Details" button, 
// the component initiates an API call to fetch the quiz logs for a specified user via the getResponseGet function. If the
// data is available, the user is redirected to the quiz details page using useNavigate. If there’s an error (e.g., no quiz data found),
// it displays an error message. The button is disabled with a loading state while the request is being processed, and styling is applied for visual clarity.
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getResponseGet } from "../lib/utils";

const NavigateToQuizDetails = ({ userId }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleNavigate = async () => {
        setLoading(true);
        setError(null); // Reset error on new click

        try {
            // Call API to fetch quiz logs for the user
            const response = await getResponseGet(`/fetch_quiz_log/${userId}`);
            if (!response.data || response.data.length === 0) {
                throw new Error("No quiz data found for this user.");
            }

            console.log("Quiz Data:", response.data);

            // Navigate to the quiz details page with userId only
            navigate(`/quiz/attempt/${userId}`);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <button
                    onClick={handleNavigate}
                    style={{
                        padding: "10px",
                        fontSize: "16px",
                        backgroundColor: "#1976d2",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginTop: "10px",
                    }}
                >
                    View Quiz Details
                </button>
            )}
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default NavigateToQuizDetails;
