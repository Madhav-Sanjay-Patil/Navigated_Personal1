// The QuizDetails component fetches and displays quiz data for a specific user, including quiz scores, completion dates, and IDs,
// while handling loading states and error messages. It also allows navigation back to the user's learning journey.

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Card, CardContent, Typography } from "@mui/material";
import { getResponseGet } from "../lib/utils";
import "./QuizDetails.css"; // Import CSS file

const QuizDetails = () => {
  const { userId } = useParams();
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const response = await getResponseGet(`/fetch_quiz_log/${userId}`);
        if (!response.data || response.data.length === 0) {
          throw new Error("No quiz data found.");
        }

        setQuizData(response.data);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [userId]);

  if (loading) {
    return <div className="quiz-container">Loading...</div>;
  }

  return (
    <div className="quiz-container">
      <Typography variant="h4" className="quiz-title">
        Quiz Details
      </Typography>

      {quizData.length === 0 ? (
        <Typography>No quiz data found!</Typography>
      ) : (
        quizData.map((quiz, index) => (
          <Card key={index} className="quiz-card">
            <CardContent>
              <Typography className="quiz-info">
                <strong>ID:</strong> {quiz.id || "N/A"}
              </Typography>
              <Typography className="quiz-info">
                <strong>Quiz ID</strong> {quiz.quiz_id}
              </Typography>
              {/* <Typography className="quiz-info">
                <strong>User ID:</strong> {userId}
              </Typography> */}
              <Typography className="quiz-info">
                <strong>Score:</strong> {quiz.score}
              </Typography>
              <Typography className="quiz-info">
                <strong>Completion Date:</strong>{" "}
                {new Date(quiz.completion_date).toLocaleString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  timeZone: "Asia/Kolkata",
                })}
              </Typography>
            </CardContent>
          </Card>
        ))
      )}

      <Button
        className="quiz-button"
        variant="contained"
        onClick={() => window.history.back()}
      >
        Back to My Learning Journey
      </Button>
    </div>
  );
};

export default QuizDetails;
