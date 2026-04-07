import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { 
  Box, Container, TextField, Button, Typography, Paper, 
  IconButton, Divider, CircularProgress, Alert, Card 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VideoCallIcon from '@mui/icons-material/VideoCall';

const NewCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initialValues = {
    title: '',
    description: '',
    topics: [
      {
        title: '',
        subtopics: [] // <-- Starts with an empty array
      }
    ]
  };

  const validationSchema = Yup.object({
    title: Yup.string().required('Course title is required'),
    description: Yup.string().required('Description is required'),
    topics: Yup.array().of(
      Yup.object({
        title: Yup.string().required('Topic title required'),
        // 1. THIS IS THE FIX: Subtopics array is no longer required. 
        subtopics: Yup.array().of(
          Yup.object({
            title: Yup.string().required('Lesson title required'),
            videoFile: Yup.mixed().nullable() 
          })
        ).nullable() 
      })
    )
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const formData = new FormData();

      formData.append("title", values.title);
      formData.append("description", values.description);

      const topicsData = [];

      values.topics.forEach((topic, tIndex) => {
        const topicData = {
          title: topic.title,
          subtopics: [],
        };

        // Added a check here just in case subtopics is undefined
        if (topic.subtopics) {
          topic.subtopics.forEach((sub, sIndex) => {
            if (sub.videoFile) {
              formData.append(`file_${tIndex}_${sIndex}`, sub.videoFile);
            }

            topicData.subtopics.push({
              title: sub.title,
            });
          });
        }

        topicsData.push(topicData);
      });

      formData.append("topicsData", JSON.stringify(topicsData));

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/instructor-dashboard");
      } else {
        setError(data.message || "Failed to save the course.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Check your connection and file sizes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Create New Course 📚
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, setFieldValue, errors, touched }) => (
            <Form>
              <Box sx={{ mb: 4 }}>
                <TextField
                  fullWidth label="Course Title" name="title"
                  variant="outlined" margin="normal"
                  value={values.title} onChange={handleChange}
                  error={touched.title && !!errors.title}
                  helperText={touched.title && errors.title}
                />
                <TextField
                  fullWidth multiline rows={2} label="Course Description"
                  name="description" variant="outlined" margin="normal"
                  value={values.description} onChange={handleChange}
                  error={touched.description && !!errors.description}
                  helperText={touched.description && errors.description}
                />
              </Box>

              <Divider sx={{ mb: 4 }} />

              <FieldArray name="topics">
                {({ push: pushTopic, remove: removeTopic }) => (
                  <Box>
                    {(values.topics || []).map((topic, tIndex) => (
                      <Card key={tIndex} variant="outlined" sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" color="primary">Topic #{tIndex + 1}</Typography>
                          {values.topics.length > 1 && (
                            <IconButton color="error" onClick={() => removeTopic(tIndex)}>
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>

                        <TextField
                          fullWidth label="Topic Title (e.g. Introduction to React)"
                          name={`topics.${tIndex}.title`}
                          value={topic.title} onChange={handleChange}
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
                                <Box key={sIndex} sx={{ display: 'flex', gap: 2, alignItems: 'start', mb: 2 }}>
                                  <TextField
                                    label="Subtopic Title"
                                    name={`topics.${tIndex}.subtopics.${sIndex}.title`}
                                    value={sub.title} onChange={handleChange}
                                    size="small" sx={{ flex: 1, bgcolor: 'white' }}
                                    error={touched.topics?.[tIndex]?.subtopics?.[sIndex]?.title && Boolean(errors.topics?.[tIndex]?.subtopics?.[sIndex]?.title)}
                                    helperText={touched.topics?.[tIndex]?.subtopics?.[sIndex]?.title && errors.topics?.[tIndex]?.subtopics?.[sIndex]?.title}
                                  />
                                  
                                  <Button
                                    variant="outlined" component="label"
                                    startIcon={<VideoCallIcon />}
                                    color={sub.videoFile ? "success" : "primary"}
                                  >
                                    {sub.videoFile ? "File Added" : "Upload Lesson File"}
                                    <input
                                      type="file" hidden accept="video/*, .pdf, .doc, .docx, .ppt, .pptx"
                                      onChange={(e) => setFieldValue(`topics.${tIndex}.subtopics.${sIndex}.videoFile`, e.target.files[0])}
                                    />
                                  </Button>

                                  {topic.subtopics.length > 1 && (
                                    <IconButton onClick={() => removeSub(sIndex)} size="small">
                                      <DeleteIcon />
                                    </IconButton>
                                  )}
                                </Box>
                              ))}
                              
                              <Button 
                                size="small" startIcon={<AddCircleOutlineIcon />}
                                onClick={() => pushSub({ title: '', videoFile: null })}
                              >
                                Add Subtopic
                              </Button>
                            </Box>
                          )}
                        </FieldArray>
                      </Card>
                    ))}

                    <Button
                      variant="outlined" fullWidth
                      startIcon={<AddCircleOutlineIcon />}
                      // 2. THIS IS THE FIX: New topics now push an empty subtopics array
                      onClick={() => pushTopic({ title: '', subtopics: [] })}
                      sx={{ py: 1.5, borderStyle: 'dashed' }}
                    >
                      Add New Topic
                    </Button>
                  </Box>
                )}
              </FieldArray>

              <Box sx={{ mt: 5, display: 'flex', gap: 2 }}>
                <Button 
                  type="submit" variant="contained" color="success" 
                  size="large" disabled={loading}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Publish Course'}
                </Button>
                <Button variant="text" onClick={() => navigate(-1)}>
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

export default NewCourse;