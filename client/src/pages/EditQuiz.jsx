import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import {
  Box, Container, TextField, Button, Typography, Paper, IconButton, 
  CircularProgress, Alert, Card, MenuItem, Select, FormControl, 
  InputLabel, Radio, FormControlLabel, Switch
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const EditQuiz = () => {
  const navigate = useNavigate();
  // We need both the courseId and the quizId from the URL
  const { id: courseId, quizId } = useParams(); 
  
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [error, setError] = useState(null);

  const validationSchema = Yup.object().shape({
    title: Yup.string().required('Quiz title is required'),
    description: Yup.string(),
    requiresPassword: Yup.boolean(),
    password: Yup.string().when('requiresPassword', {
      is: true,
      then: (schema) => schema.required('A password is required if protection is enabled.'),
      otherwise: (schema) => schema.nullable(),
    }),
    questions: Yup.array().of(
      Yup.object({
        text: Yup.string().required('Question text is required'),
        type: Yup.string().required('Question type is required')
      })
    ).min(1, 'You must add at least one question.')
  });

  // Fetch the existing quiz data when the page loads
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem('token');
        // Make sure you have this GET route on your backend!
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${courseId}/quizzes/${quizId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch quiz data');

        const data = await response.json();

        // Format the data for Formik
        setInitialValues({
          title: data.title || '',
          description: data.description || '',
          requiresPassword: data.requiresPassword || false,
          password: data.password || '',
          questions: data.questions?.length > 0 ? data.questions : [
            { text: '', type: 'MCQ', options: ['', ''], correctAnswer: '0' }
          ]
        });
      } catch (err) {
        console.error(err);
        setError("Could not load the quiz. It may have been deleted.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [courseId, quizId]);

  // AI Generator Function
  const handleAIGenerate = async (setFieldValue, currentQuestions) => {
    setGeneratingAI(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${courseId}/generate-ai-quiz`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ count: aiCount }),
      });

      if (!response.ok) throw new Error('Failed to generate questions.');

      const data = await response.json();
      
      const existingQs = (currentQuestions.length === 1 && currentQuestions[0].text === '') 
        ? [] 
        : currentQuestions;

      setFieldValue('questions', [...existingQs, ...data.aiQuestions]);
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    setError(null);
    const token = localStorage.getItem('token');
    
    try {
      // Notice this is a PUT request to update the specific quiz
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${courseId}/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        navigate(`/course/edit/${courseId}`);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update quiz.');
      }
    } catch (err) {
      setError('An error occurred while communicating with the server.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Container sx={{ py: 5 }}><CircularProgress /></Container>;
  if (!initialValues) return <Container sx={{ py: 5 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Button 
        component={Link} 
        to={`/course/edit/${courseId}`} 
        startIcon={<ArrowBackIcon />} 
        sx={{ mb: 3 }}
      >
        Back to Course Editor
      </Button>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Edit Assessment
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize // CRITICAL: Allows Formik to update when initialValues load
        >
          {({ values, handleChange, setFieldValue, errors, touched }) => (
            <Form>
              {/* QUIZ SETTINGS */}
              <Box sx={{ mb: 4, p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="h6" color="primary" gutterBottom>1. Quiz Settings</Typography>
                
                <TextField
                  fullWidth label="Quiz Title" name="title" margin="normal"
                  value={values.title} onChange={handleChange} sx={{ bgcolor: 'white' }}
                  error={touched.title && !!errors.title} helperText={touched.title && errors.title}
                />
                
                <TextField
                  fullWidth multiline rows={2} label="Instructions" name="description" margin="normal"
                  value={values.description} onChange={handleChange} sx={{ bgcolor: 'white' }}
                />

                <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'white' }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={values.requiresPassword} 
                        onChange={(e) => setFieldValue('requiresPassword', e.target.checked)} 
                        color="secondary"
                      />
                    }
                    label="Enable Password Protection"
                  />
                  
                  {values.requiresPassword && (
                    <TextField
                      fullWidth size="small" label="Access Password" name="password" margin="dense"
                      value={values.password} onChange={handleChange} sx={{ mt: 2 }}
                      error={touched.password && !!errors.password} helperText={touched.password && errors.password}
                    />
                  )}
                </Box>
              </Box>

              {/* AI GENERATOR BOX */}
              <Box sx={{ mb: 4, p: 3, bgcolor: '#e3f2fd', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <AutoAwesomeIcon color="primary" />
                  <Typography variant="h6" color="primary">AI Assistant</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1 }}>
                  Generate more questions automatically.
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <TextField
                    type="number" label="Questions" size="small"
                    value={aiCount} onChange={(e) => setAiCount(e.target.value)}
                    inputProps={{ min: 1, max: 20 }} sx={{ width: 100, bgcolor: 'white' }}
                  />
                  <Button
                    variant="contained" color="primary" disabled={generatingAI}
                    onClick={() => handleAIGenerate(setFieldValue, values.questions)}
                  >
                    {generatingAI ? <CircularProgress size={24} color="inherit" /> : 'Generate'}
                  </Button>
                </Box>
              </Box>

              {/* QUESTION BUILDER */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" color="primary" gutterBottom>2. Edit Questions</Typography>
                
                <FieldArray name="questions">
                  {({ push, remove }) => (
                    <Box>
                      {values.questions.map((question, qIndex) => (
                        <Card key={qIndex} variant="outlined" sx={{ p: 3, mb: 3 }}>
                          <Box display="flex" justifyContent="space-between" mb={2}>
                            <Typography fontWeight="bold">Question {qIndex + 1}</Typography>
                            {values.questions.length > 1 && (
                              <IconButton color="error" size="small" onClick={() => remove(qIndex)}>
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>

                          <Box display="flex" gap={2} mb={2}>
                            <TextField
                              fullWidth label="Question Text" name={`questions.${qIndex}.text`}
                              value={question.text} onChange={handleChange}
                              error={touched.questions?.[qIndex]?.text && !!errors.questions?.[qIndex]?.text}
                              helperText={touched.questions?.[qIndex]?.text && errors.questions?.[qIndex]?.text}
                            />
                            <FormControl sx={{ minWidth: 200 }}>
                              <InputLabel>Type</InputLabel>
                              <Select
                                name={`questions.${qIndex}.type`} value={question.type} 
                                onChange={handleChange} label="Type"
                              >
                                <MenuItem value="MCQ">Multiple Choice</MenuItem>
                                <MenuItem value="SHORT">Short Answer</MenuItem>
                                <MenuItem value="LONG">Long Answer</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>

                          {/* MCQ Logic */}
                          {question.type === 'MCQ' && (
                            <FieldArray name={`questions.${qIndex}.options`}>
                              {({ push: pushOpt, remove: removeOpt }) => (
                                <Box sx={{ mt: 2, pl: 2, bgcolor: '#fafafa', p: 2 }}>
                                  <Typography variant="caption" color="textSecondary">Select radio button to mark correct answer</Typography>
                                  {(question.options || []).map((opt, oIndex) => (
                                    <Box key={oIndex} display="flex" alignItems="center" gap={1} mb={1}>
                                      <Radio 
                                        checked={question.correctAnswer === oIndex.toString()}
                                        onChange={() => setFieldValue(`questions.${qIndex}.correctAnswer`, oIndex.toString())}
                                        value={oIndex.toString()}
                                      />
                                      <TextField
                                        size="small" fullWidth placeholder={`Option ${oIndex + 1}`}
                                        name={`questions.${qIndex}.options.${oIndex}`}
                                        value={question.options[oIndex]} onChange={handleChange}
                                      />
                                      <IconButton size="small" color="error" onClick={() => removeOpt(oIndex)}><DeleteIcon fontSize="small"/></IconButton>
                                    </Box>
                                  ))}
                                  <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => pushOpt('')}>Add Option</Button>
                                </Box>
                              )}
                            </FieldArray>
                          )}

                          {/* Short Answer Logic */}
                          {question.type === 'SHORT' && (
                            <TextField
                              fullWidth size="small" label="Correct Answer (Exact Match)"
                              name={`questions.${qIndex}.correctAnswer`}
                              value={question.correctAnswer || ''} onChange={handleChange} sx={{ mt: 2, bgcolor: '#fafafa' }}
                            />
                          )}
                        </Card>
                      ))}

                      <Button 
                        variant="outlined" color="primary" startIcon={<AddCircleOutlineIcon />} 
                        onClick={() => push({ text: '', type: 'MCQ', options: ['', ''], correctAnswer: '0' })}
                        sx={{ borderStyle: 'dashed', py: 1.5 }} fullWidth
                      >
                        Add Another Question
                      </Button>
                    </Box>
                  )}
                </FieldArray>
              </Box>

              <Button type="submit" variant="contained" color="success" size="large" fullWidth disabled={saving}>
                {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
              </Button>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

export default EditQuiz;