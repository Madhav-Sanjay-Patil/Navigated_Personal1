// The Quiz component manages a quiz session by rendering questions, handling user answers, and tracking the score.
// It includes features like navigation through questions, checking correctness, displaying the score, and submitting results, 
// while dynamically adjusting based on quiz type (aType).
import React, { useState } from 'react';
import { Button, Card, CardContent, Typography, RadioGroup, Radio, FormControlLabel, Stepper, Step, StepLabel, Grid } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

import { getResponsePost } from "../lib/utils";

const Quiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const quizData = location.state?.quizData || [];
  //console.log(quizData)
  //const quizTitle = location.state?.name || "Quiz";  // Access quiz title from state
  const quizTitle = sessionStorage.getItem('quizTitle');
  const quizDesc = sessionStorage.getItem('quizDesc');
  const quizId = sessionStorage.getItem("quizId");
  const enrollId = sessionStorage.getItem('enrollId');
  const courseId = sessionStorage.getItem('courseId');
  const aType = sessionStorage.getItem('aType');

  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(new Array(quizData.length).fill(false));  // Boolean array to track correct answers
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [totalScore, setTotalScore] = useState(0);  // For tracking the total score
  const [isCorrectList, setIsCorrectList] = useState([]);  // To store if each question is correct

  // Handle answer selection
  const handleAnswerChange = (event, questionId) => {
    setAnswers({ ...answers, [questionId]: event.target.value });
  };

  // Clear the selected choice
  const clearChoice = (questionId) => {
    setAnswers({ ...answers, [questionId]: '' });
  };

  // Handle next question
  const handleNext = () => {
    if (activeStep === quizData.length - 1) {
      checkCorrectAnswers();
      setQuizCompleted(true);
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  // Handle previous question
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Check correct answers after quiz finishes
  const checkCorrectAnswers = () => {

    const reverseAnswerMap = {
      'A': 'option_a',
      'B': 'option_b',
      'C': 'option_c',
      'D': 'option_d'
    };

    const newCorrectArray = quizData.map((question) => {
      const userAnswer = answers[question.id];
      return userAnswer === reverseAnswerMap[question.correct_answer];  // Check if user's answer is correct
    });

    setIsAnswerCorrect(newCorrectArray);
    setIsCorrectList(newCorrectArray);

    // Calculate total score as the percentage of correct answers
    const correctCount = newCorrectArray.filter(Boolean).length;

    console.log(newCorrectArray);
    
    const score = (correctCount / quizData.length) * 100;  // Score as percentage
    setTotalScore(score);
  };

  const handleEndQuiz = async () => {

    // if()
    alert(`Quiz completed! Score: ${totalScore}%`);

    // Extract the polylines and the correctness of each answer
    const polylines = quizData.map(question => question.polyline);
    const to_consider = isCorrectList; // Assuming isCorrectList stores correctness

    // Prepare the data to send to the backend for updating position
    const dataToSend = {
      enroll_id: enrollId,      // Use the appropriate enroll ID
      course_id: courseId,      // Use the appropriate course ID
      to_consider: to_consider, // Array indicating correctness of each answer
      question_polyline: polylines // Array of polylines for each question
    };

    try {
      // Submit the quiz results to update the learner's position
      const response = await getResponsePost("/submitquiz", dataToSend);
      //const result = await response.json();
      //console.log('Position updated:', result);


      // After successful submission, register the quiz attempt
      const registrationData = {
        user_id: enrollId,          // Provide the user ID
        quiz_id: quizId,          // Provide the quiz ID
        score: totalScore,        // Total score of the quiz
        status: 'completed',      // Status can be 'completed' or 'incomplete' as needed
        attempt_date: new Date().toISOString() // Current date and time
      };

      const registerResponse = await getResponsePost("/record_quiz_attempt", registrationData);
      //const registerResult = await registerResponse.json();
      //console.log('Quiz attempt registered:', registerResult);

    } catch (error) {
      console.error('Error handling quiz submission and registration:', error);
    }

    // Navigate back to the previous page
    navigate('/course');
  };



  // Handle palette question selection
  const handleQuestionSelect = (index) => {
    setActiveStep(index);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', display: 'flex' }}>
      {/* Question Palette */}
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <div style={{ borderRight: '1px solid #ccc', paddingRight: '20px' }}>
            <Typography variant="h6">Question Palette</Typography>
            {quizData.map((_, index) => (
              <Button
                key={index}
                variant="contained"
                color={answers[quizData[index].id] ? 'primary' : 'secondary'} // Different color for answered/unanswered
                onClick={() => handleQuestionSelect(index)}
                style={{ margin: '5px', width: '100%' }}
              >
                Q{index + 1} {answers[quizData[index].id] ? '✓' : ''}
              </Button>
            ))}
          </div>
        </Grid>

        {/* Quiz Questions */}
        <Grid item xs={9}>
          <div style={{ padding: '0 20px' }}>
            {/* Quiz Title */}
            <Typography variant="h2" component="h1" style={{ marginBottom: '20px' }}>
              {quizTitle}
            </Typography>
            <Typography variant="h5" component="h1" style={{ marginBottom: '20px' }}>
              {quizDesc}
            </Typography>

            <Stepper activeStep={activeStep} alternativeLabel>
              {quizData.map((_, index) => (
                <Step key={index}>
                  <StepLabel>Question {index + 1}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {!quizCompleted ? (
              <Card style={{ marginTop: '20px', padding: '20px' }}>
                <CardContent>
                  <Typography variant="h5" component="h2">
                    {quizData[activeStep]?.question_text}
                  </Typography>
                  <RadioGroup
                    value={answers[quizData[activeStep]?.id] || ''}
                    onChange={(event) => handleAnswerChange(event, quizData[activeStep]?.id)}
                  >
                    {['option_a', 'option_b', 'option_c', 'option_d'].map((optionKey) => (
                      <FormControlLabel key={optionKey} value={optionKey} control={<Radio />} label={quizData[activeStep]?.[optionKey]} />
                    ))}
                  </RadioGroup>

                  {aType === '2' && (
                    <Typography variant="body1" style={{ marginTop: '20px', color: 'green' }}>
                      Correct Answer: {quizData[activeStep]?.[`option_${quizData[activeStep]?.correct_answer.toLowerCase()}`]}
                    </Typography>
                  )}

                  {/* <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate('/t/course')} // Replace with the actual route for the teacher's map or course
                    style={{
                      backgroundColor: '#3F51B5',
                      color: '#fff',
                      padding: '10px 20px',
                      fontWeight: 'bold',
                      textTransform: 'none',
                    }}
                  >
                    Go Home
                  </Button>  */}

                </CardContent>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                  <Button disabled={activeStep === 0} onClick={handleBack}>
                    Back
                  </Button>
                  <Button variant="contained" color="secondary" onClick={() => clearChoice(quizData[activeStep]?.id)}>
                    Clear Choice
                  </Button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    {/* Only show this button if aType is '2' */}
                    {aType === '2' && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/t/course')}  // Replace with the actual route for the teacher's map or course
                        style={{ marginRight: '10px' }}
                      >
                        Close Quiz
                      </Button>
                    )}

                    {/* Conditionally render the "End Quiz" button */}
                    {aType !== '2' && (
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleEndQuiz}
                        style={{ marginTop: '20px' }}
                      >
                        End Quiz
                      </Button>
                    )}

                    </div>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={activeStep === quizData.length - 1 ? () => {
                        checkCorrectAnswers(); // Execute this function to evaluate answers
                        setQuizCompleted(true)} : handleNext}
                      disabled={aType === '2' && activeStep === quizData.length - 1} // Disable if it's the last step and aType is 2
                    >
                      {activeStep === quizData.length - 1 && aType === '2'
                        ? 'Next'
                        : activeStep === quizData.length - 1
                        ? 'Finish Quiz'
                        : 'Next'}
                    </Button>
                    </div>
                    </Card>
                    ) : quizCompleted ? (
                      <Card style={{ marginTop: '20px', padding: '20px' }}>
                        <CardContent>
                          <Typography variant="h5" component="h2">
                            Quiz Completed!
                          </Typography>
                          <Typography variant="body1">
                            Score: {totalScore}% {/* Show total score */}
                          </Typography>
                          <Typography variant="body1">
                            Correct Answers: {isAnswerCorrect.filter(Boolean).length}/{quizData.length}
                          </Typography>
                          <Button
                            variant="contained"
                            color="secondary"
                            style={{ marginTop: '20px' }}
                            onClick={() => {
                              handleEndQuiz(); // Call handleEndQuiz
                            }}
                          >
                            Go Home
                          </Button>
                        </CardContent>
                      </Card>
                    ) : null}

          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default Quiz;
