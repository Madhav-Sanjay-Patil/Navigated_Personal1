// Component that displays a list of quizzes and navigates to the quiz details page on click.
import React from "react";
import { useNavigate } from "react-router-dom";

function QuizList({ quizzes }) {
    const navigate = useNavigate();

    const handleQuizClick = (quizId) => {
        navigate(`/quiz/${quizId}`);
    };

    return (
        <div>
            {quizzes.map((quiz) => (
                <div key={quiz.id} onClick={() => handleQuizClick(quiz.id)}>
                    {quiz.title}
                </div>
            ))}
        </div>
    );
}

export default QuizList;
