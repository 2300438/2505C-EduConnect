import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Card
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import SmartToyIcon from '@mui/icons-material/SmartToy'; // Added icon for AI button

const EditCourse = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [initialValues, setInitialValues] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // State to track which file is currently being processed by the AI
  const [trainingId, setTrainingId] = useState(null); 
  // State for AI training messages
  const [aiMessage, setAiMessage] = useState(null);

  const validationSchema = Yup.object({
    title: Yup.string().required('Course title is required'),
    description: Yup.string()
      .min(10, 'Description must be at least 10 characters')
      .required('Description is required'),
    topics: Yup.array().of(
      Yup.object({
        title: Yup.string().required('Topic title required'),
        subtopics: Yup.array().of(
          Yup.object({
            title: Yup.string().required('Lesson title required'),
          })
        ).nullable()
      })
    ).nullable()
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setPageLoading(true);
        setError(null);

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load course');
        }

        setInitialValues({
          title: data.title || '',
          description: data.description || '',
          topics: (data.topics || []).map((topic) => ({
            id: topic.id,
            title: topic.title || '',
            subtopics: (topic.subtopics || []).map((sub) => ({
              id: sub.id,
              title: sub.title || '',
              existingfileUrl: sub.fileUrl || '',
              // Add a field to track if this specific subtopic has been trained
              is_ai_trained: sub.is_ai_trained || false, 
              videoFile: null,
            }))
          }))
        });
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load course.');
      } finally {
        setPageLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  // Handle the manual AI Training trigger
  const handleTrainAI = async (subtopicId, fileUrl, setFieldValue, tIndex, sIndex) => {
    if (!fileUrl) {
      setAiMessage({ type: 'error', text: 'You must save the uploaded file before training the AI.' });
      return;
    }

    setTrainingId(subtopicId);
    setAiMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/extract`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          contentId: subtopicId, 
          blobUrl: fileUrl, 
          // We pass a generic type here, your backend should detect if it's pdf/pptx based on URL or headers
          contentType: fileUrl.split('.').pop() 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the Formik state so the button changes to "Trained"
        setFieldValue(`topics.${tIndex}.subtopics.${sIndex}.is_ai_trained`, true);
        setAiMessage({ type: 'success', text: `AI Tutor has successfully learned from the lesson file!` });
      } else {
        setAiMessage({ type: 'error', text: "Failed to train AI: " + data.message });
      }
    } catch (error) {
      console.error("Training error:", error);
      setAiMessage({ type: 'error', text: "Connection error while training the AI." });
    } finally {
      setTrainingId(null);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    setError(null);

    const token = localStorage.getItem('token');

    if (!token) {
      setError('You are not logged in. Please log in again.');
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);

      const topicsData = [];

      values.topics.forEach((topic, tIndex) => {
        const topicData = {
          id: topic.id,
          title: topic.title,
          subtopics: [],
        };

        if (topic.subtopics) {
          topic.subtopics.forEach((sub, sIndex) => {
            if (sub.videoFile) {
              formData.append(`file_${tIndex}_${sIndex}`, sub.videoFile);
            }

            topicData.subtopics.push({
              id: sub.id,
              title: sub.title,
              existingfileUrl: sub.existingfileUrl || '',
            });
          });
        }

        topicsData.push(topicData);
      });

      formData.append('topicsData', JSON.stringify(topicsData));

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await response.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }

      if (response.ok) {
        navigate(`/courses/${id}`);
      } else {
        setError(data.errors?.join(', ') || data.message || 'Failed to update course.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while updating the course.');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Typography>Loading course...</Typography>
      </Container>
    );
  }

  if (!initialValues) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Alert severity="error">{error || 'Course not found.'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Edit Course ✏️
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {aiMessage && (
          <Alert severity={aiMessage.type} sx={{ mb: 3 }} onClose={() => setAiMessage(null)}>
            {aiMessage.text}
          </Alert>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, handleChange, setFieldValue, errors, touched }) => (
            <Form>
              <Box sx={{ mb: 4 }}>
                <TextField
                  fullWidth
                  label="Course Title"
                  name="title"
                  variant="outlined"
                  margin="normal"
                  value={values.title}
                  onChange={handleChange}
                  error={touched.title && !!errors.title}
                  helperText={touched.title && errors.title}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Course Description"
                  name="description"
                  variant="outlined"
                  margin="normal"
                  value={values.description}
                  onChange={handleChange}
                  error={touched.description && !!errors.description}
                  helperText={touched.description && errors.description}
                />
              </Box>

              <Divider sx={{ mb: 4 }} />

              <FieldArray name="topics">
                {({ push: pushTopic, remove: removeTopic }) => (
                  <Box>
                    {(values.topics || []).map((topic, tIndex) => (
                      <Card key={topic.id || tIndex} variant="outlined" sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" color="primary">
                            Topic #{tIndex + 1}
                          </Typography>
                          {values.topics.length > 1 && (
                            <IconButton color="error" onClick={() => removeTopic(tIndex)}>
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>

                        <TextField
                          fullWidth
                          label="Topic Title"
                          name={`topics.${tIndex}.title`}
                          value={topic.title}
                          onChange={handleChange}
                          sx={{ mb: 3, bgcolor: 'white' }}
                          error={touched.topics?.[tIndex]?.title && Boolean(errors.topics?.[tIndex]?.title)}
                          helperText={touched.topics?.[tIndex]?.title && errors.topics?.[tIndex]?.title}
                        />

                        <Typography variant="subtitle2" sx={{ ml: 2, mb: 1, fontWeight: 'bold' }}>
                          Subtopics & Files
                        </Typography>

                        <FieldArray name={`topics.${tIndex}.subtopics`}>
                          {({ push: pushSub, remove: removeSub }) => (
                            <Box sx={{ ml: 4 }}>
                              {(topic.subtopics || []).map((sub, sIndex) => (
                                <Box
                                  key={sub.id || sIndex}
                                  sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'white' }}
                                >
                                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'start', flexWrap: 'wrap' }}>
                                    <TextField
                                      label="Subtopic Title"
                                      name={`topics.${tIndex}.subtopics.${sIndex}.title`}
                                      value={sub.title}
                                      onChange={handleChange}
                                      size="small"
                                      sx={{ flex: 1, minWidth: '200px' }}
                                      error={
                                        touched.topics?.[tIndex]?.subtopics?.[sIndex]?.title &&
                                        Boolean(errors.topics?.[tIndex]?.subtopics?.[sIndex]?.title)
                                      }
                                      helperText={
                                        touched.topics?.[tIndex]?.subtopics?.[sIndex]?.title &&
                                        errors.topics?.[tIndex]?.subtopics?.[sIndex]?.title
                                      }
                                    />

                                    <Button
                                      variant="outlined"
                                      component="label"
                                      startIcon={<VideoCallIcon />}
                                      color={sub.videoFile ? 'success' : 'primary'}
                                      sx={{ whiteSpace: 'nowrap' }}
                                    >
                                      {sub.videoFile
                                        ? 'New File Selected'
                                        : sub.existingfileUrl
                                          ? 'Replace File'
                                          : 'Upload File'}
                                      <input
                                        type="file"
                                        hidden
                                        accept="video/*,.pdf,.doc,.docx,.ppt,.pptx"
                                        onChange={(e) =>
                                          setFieldValue(
                                            `topics.${tIndex}.subtopics.${sIndex}.videoFile`,
                                            e.target.files[0]
                                          )
                                        }
                                      />
                                    </Button>

                                    {/* --- NEW: THE TRAIN AI BUTTON --- */}
                                    {sub.existingfileUrl && (
                                      <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<SmartToyIcon />}
                                        color={sub.is_ai_trained ? "success" : "secondary"}
                                        disabled={sub.is_ai_trained || trainingId === sub.id}
                                        onClick={() => handleTrainAI(sub.id, sub.existingfileUrl, setFieldValue, tIndex, sIndex)}
                                        sx={{ whiteSpace: 'nowrap' }}
                                      >
                                        {trainingId === sub.id 
                                          ? "AI is Reading..." 
                                          : sub.is_ai_trained 
                                            ? "AI Trained" 
                                            : "Add to AI Tutor"}
                                      </Button>
                                    )}

                                    {topic.subtopics.length > 1 && (
                                      <IconButton onClick={() => removeSub(sIndex)} size="small" color="error">
                                        <DeleteIcon />
                                      </IconButton>
                                    )}
                                  </Box>

                                  {sub.existingfileUrl && !sub.videoFile && (
                                    <Box sx={{ mt: 1 }}>
                                      <a
                                        href={sub.existingfileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ fontSize: '14px', color: '#1976d2' }}
                                      >
                                        View currently uploaded file
                                      </a>
                                    </Box>
                                  )}
                                </Box>
                              ))}

                              <Button
                                size="small"
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={() =>
                                  pushSub({
                                    title: '',
                                    existingfileUrl: '',
                                    videoFile: null,
                                    is_ai_trained: false
                                  })
                                }
                              >
                                Add Subtopic
                              </Button>
                            </Box>
                          )}
                        </FieldArray>
                      </Card>
                    ))}

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={() =>
                        pushTopic({
                          title: '',
                          subtopics: [],
                        })
                      }
                      sx={{ py: 1.5, borderStyle: 'dashed' }}
                    >
                      Add New Topic
                    </Button>
                  </Box>
                )}
              </FieldArray>

              <Box sx={{ mt: 5, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  size="large"
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>

                <Button variant="text" onClick={() => navigate(`/courses/${id}`)}>
                  Cancel
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

export default EditCourse;