// The code handles the creation of a quiz, managing the quiz data (title, description, difficulty, etc.) and dynamically fetching module and submodule options based on the selected course. It validates the input to ensure all fields are filled before submitting the quiz. The handleQuizChange function updates quiz details, while addQuestion and removeQuestion allow for managing quiz questions. The handleModuleChange and handleSubmoduleChange update the module and submodule options accordingly. The form also includes a difficulty selector, with color-coded options for easy, intermediate, and hard levels. Finally, the quiz is submitted via an API call, with appropriate feedback and navigation based on success or failure.
import React, { useState, useEffect } from 'react';
import { Button, TextField, Card, CardContent, Typography, IconButton, MenuItem, Select, FormControl, InputLabel, CircularProgress, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { useNavigate } from 'react-router-dom';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

import { getResponsePost, getResponseGet } from "../lib/utils";

const CreateQuiz = () => {
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    module: '',
    module_id: '',
    submodule_id: '',
    course_id: '',
    index: '',
    questions: [],
    difficulty: '', // Added difficulty field
  });

  const [loading, setLoading] = useState(false);
  const [modNameModID, setModNameModID] = useState({});
  const [modIDSubModCount, setModIDSubModCount] = useState({});
  const [submoduleOptions, setSubmoduleOptions] = useState([]);

  useEffect(() => {
    const courseId = sessionStorage.getItem('course_id');
    const teacher_id = localStorage.getItem("teacher_id");
    // add check for checking enrolment as teacher for current course
    if (!courseId || !teacher_id) {
      alert("Course ID not found in sessionStorage");
      navigate("/");
      return;
    }

    const fetchMappings = async () => {
      try {
        const response = await getResponseGet(`/course_module_mappings/${courseId}`);
        const responseData = response.data;

        if (
          responseData.ModName_ModID && Object.keys(responseData.ModName_ModID).length > 0 &&
          responseData.ModID_SubModCount && Object.keys(responseData.ModID_SubModCount).length > 0
        ) {
          setModNameModID(responseData.ModName_ModID);
          setModIDSubModCount(responseData.ModID_SubModCount);
          setQuizData((prev) => ({
            ...prev,
            course_id: courseId,
          }));
        } else {
          console.warn("No data found in module mappings");
          setModNameModID({});
          setModIDSubModCount({});
        }
      } catch (error) {
        console.error("Error fetching module mappings:", error);
      }
    };

    fetchMappings();
  }, [navigate]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'green';
      case 'Intermediate':
        return 'blue';
      case 'Hard':
        return 'red';
      default:
        return 'gray'; // Default color
    }
  };

  const handleQuizChange = (e) => {
    const { name, value } = e.target;
    setQuizData({ ...quizData, [name]: value });
  };

  const handleDifficultyChange = (e) => {
    setQuizData({ ...quizData, difficulty: e.target.value });
  };

  const handleQuestionChange = (index, e) => {
    const { name, value } = e.target;
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [name]: value };
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  const addQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [
        ...quizData.questions,
        {
          question_description: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: '',
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    const updatedQuestions = quizData.questions.filter((_, i) => i !== index);
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  const handleModuleChange = (e) => {
    const moduleName = e.target.value; // Selected module name
    const moduleId = modNameModID[moduleName];
    const submoduleCount = modIDSubModCount[moduleId] || 0;

    const submoduleOptionsArray = Array.from({ length: submoduleCount }, (_, i) => i + 1);

    setQuizData({
      ...quizData,
      module: moduleName,
      module_id: moduleId,
      submodule_id: '', // Reset submodule_id when module changes
      index: Object.values(modIDSubModCount).reduce((sum, count) => sum + count, 0) + 1,
    });

    setSubmoduleOptions(submoduleOptionsArray);
  };

  const handleSubmoduleChange = (e) => {
    setQuizData({ ...quizData, submodule_id: e.target.value });
  };

  const handleSubmit = async () => {
    const missingFields = [];

    // Check for missing quiz details
    if (!quizData.title) missingFields.push('Title');
    if (!quizData.description) missingFields.push('Description');
    if (!quizData.difficulty) missingFields.push('Difficulty');
    if (!quizData.module) missingFields.push('Module');
    if (!quizData.submodule_id) missingFields.push('Submodule');

    if (missingFields.length > 0) {
      alert(`Please fill out the following fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate question details
    const invalidQuestions = quizData.questions.reduce((acc, question, index) => {
      const questionMissingFields = [];
      if (!question.question_description) questionMissingFields.push('Question Description');
      if (!question.option_a) questionMissingFields.push('Option A');
      if (!question.option_b) questionMissingFields.push('Option B');
      if (!question.option_c) questionMissingFields.push('Option C');
      if (!question.option_d) questionMissingFields.push('Option D');
      if (!question.correct_answer) questionMissingFields.push('Correct Answer');

      if (questionMissingFields.length > 0) {
        acc.push(`Question ${index + 1}: ${questionMissingFields.join(', ')}`);
      }
      return acc;
    }, []);

    if (invalidQuestions.length > 0) {
      alert(`Please complete the following question fields:\n${invalidQuestions.join('\n')}`);
      return;
    }

    if (quizData.questions.length == 0) {
      alert('Cannot submit empty quiz.');
      return;
    }

    try {
      setLoading(true);

      const transformedQuizData = {
        ...quizData,
        difficulty: { 'Easy': 0, 'Intermediate': 5, 'Hard': 8 }[quizData.difficulty], // Encode difficulty as beta value
        questions: quizData.questions.map((question) => ({
          ...question,
          correct_answer: {
            option_a: 'A',
            option_b: 'B',
            option_c: 'C',
            option_d: 'D',
          }[question.correct_answer] || question.correct_answer,
        })),
        total_questions: quizData.questions.length,
      };

      const response = await getResponsePost("/createquiz", transformedQuizData);

      // Assuming the response contains 'message', 'x', and 'y' in the format:
      // const response = await apiSubmitQuiz(formData);

      const { message, x, y } = response.data; // Adjust this based on your response structure

      // Truncate coordinates to 3 decimal places
      const xTruncated = parseFloat(x.toFixed(3));
      const yTruncated = parseFloat(y.toFixed(3));

      // Show an alert with the truncated coordinatesfwefw
      alert(`Quiz added at x, y = (${xTruncated}, ${yTruncated})`);

      // Store the coordinates in sessionStorage for the map component
      sessionStorage.setItem('quiz_create_status', 1);
      sessionStorage.setItem('quiz_x', xTruncated);
      sessionStorage.setItem('quiz_y', yTruncated);
      sessionStorage.setItem('quiz_index', quizData.index)

      // Navigate to the course page after a short delay
      setTimeout(() => {
        navigate('/t/course');
      }, 100); // Adjust timing as necessary
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('An error occurred. Redirecting to the home page.');

      setTimeout(() => {
        navigate('/t/course');
      }, 2000); // Adjust timing as necessary
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h4" component="h1" style={{ marginBottom: '20px' }}>
        {quizData.course_id == 1
          ? " Course: Discrete Mathematics - Create New Quiz"
          : quizData.course_id == 2
            ? " Course: Foundations of Cryptography - Create New Quiz"
            : `Course-Id: ${quizData.course_id} - Create New Quiz`}
      </Typography>


      <Card style={{ marginBottom: '20px', padding: '20px' }}>
        <CardContent>
          <Typography variant="h6">Quiz Details</Typography>
          <TextField
            label={<span>Title <span style={{ color: 'red' }}></span></span>}
            name="title"
            fullWidth margin="normal"
            value={quizData.title}
            onChange={handleQuizChange}
            required
          />
          <TextField
            label={<span>Description <span style={{ color: 'red' }}></span></span>}
            name="description"
            fullWidth margin="normal"
            value={quizData.description}
            onChange={handleQuizChange}
            required
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="module-label">Module</InputLabel>
            <Select
              labelId="module-label"
              name="module"
              value={quizData.module}
              onChange={handleModuleChange}
            >
              {Object.keys(modNameModID).map((module) => (
                <MenuItem key={module} value={module}>{module}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="submodule-label">Submodule</InputLabel>
            <Select
              labelId="submodule-label"
              name="submodule_id"
              value={quizData.submodule_id}
              onChange={handleSubmoduleChange}
            >
              {submoduleOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Radio Buttons for Difficulty */}
          <Typography variant="h6" style={{ marginTop: '20px' }}>Select Difficulty</Typography>
          <RadioGroup
            row
            name="difficulty"
            value={quizData.difficulty}
            onChange={handleDifficultyChange}
            required
          >
            <FormControlLabel
              value="Easy"
              control={<Radio />}
              label={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <QuestionMarkIcon style={{ color: getDifficultyColor('Easy'), marginRight: 8 }} />
                  Easy
                </div>
              }
            />
            <FormControlLabel
              value="Intermediate"
              control={<Radio />}
              label={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <QuestionMarkIcon style={{ color: getDifficultyColor('Intermediate'), marginRight: 8 }} />
                  Intermediate
                </div>
              }
            />
            <FormControlLabel
              value="Hard"
              control={<Radio />}
              label={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <QuestionMarkIcon style={{ color: getDifficultyColor('Hard'), marginRight: 8 }} />
                  Hard
                </div>
              }
            />
          </RadioGroup>

        </CardContent>
      </Card>

      {/* Add and remove question section */}


      {quizData.questions.map((question, index) => (
        <Card style={{ marginBottom: '20px', padding: '20px' }} key={index}>
          <CardContent>
            <Typography variant="h6">Question {index + 1}</Typography>
            <TextField
              label={<span>Question Description </span>}
              name="question_description"
              fullWidth
              margin="normal"
              value={question.question_description}
              onChange={(e) => handleQuestionChange(index, e)}
              required
            />
            <TextField
              label={<span>Option A </span>}
              name="option_a"
              fullWidth
              margin="normal"
              value={question.option_a}
              onChange={(e) => handleQuestionChange(index, e)}
              required
            />
            <TextField
              label={<span>Option B </span>}
              name="option_b"
              fullWidth
              margin="normal"
              value={question.option_b}
              onChange={(e) => handleQuestionChange(index, e)}
              required
            />
            <TextField
              label={<span>Option C </span>}
              name="option_c"
              fullWidth
              margin="normal"
              value={question.option_c}
              onChange={(e) => handleQuestionChange(index, e)}
              required
            />
            <TextField
              label={<span>Option D </span>}
              name="option_d"
              fullWidth
              margin="normal"
              value={question.option_d}
              onChange={(e) => handleQuestionChange(index, e)}
              required
            />

            <FormControl component="fieldset">
              <Typography variant="h6" style={{ marginTop: '10px' }}>Correct Answer</Typography>
              <RadioGroup row name="correct_answer" value={question.correct_answer} onChange={(e) => handleQuestionChange(index, e)}>
                <FormControlLabel value="A" control={<Radio />} label="Option A" />
                <FormControlLabel value="B" control={<Radio />} label="Option B" />
                <FormControlLabel value="C" control={<Radio />} label="Option C" />
                <FormControlLabel value="D" control={<Radio />} label="Option D" />
              </RadioGroup>
            </FormControl>
            <IconButton color="secondary" onClick={() => removeQuestion(index)}><RemoveCircleIcon /></IconButton>
          </CardContent>
        </Card>
      ))}

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={24} /> : null}
        >
          {loading ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <Button variant="contained" onClick={addQuestion} startIcon={<AddCircleIcon />}>Add Question</Button>
      </div>
    </div>

  );
};

export default CreateQuiz;
