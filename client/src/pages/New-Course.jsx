import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { upload } from '@vercel/blob/client';
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

  // 1. Initial Values: Crucial for preventing the "Cannot read properties of undefined (reading 'map')" error
  const initialValues = {
    title: '',
    description: '',
    topics: [
      {
        title: '',
        subtopics: [{ title: '', videoFile: null }]
      }
    ]
  };

  // 2. Validation Schema
  const validationSchema = Yup.object({
    title: Yup.string().required('Course title is required'),
    description: Yup.string().required('Description is required'),
    topics: Yup.array().of(
      Yup.object({
        title: Yup.string().required('Topic title required'),
        subtopics: Yup.array().of(
          Yup.object({
            title: Yup.string().required('Lesson title required'),
            videoFile: Yup.mixed().required('A video is required')
          })
        )
      })
    )
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    try {
      // 3. Process Nested Uploads to Vercel Blob
      const processedTopics = await Promise.all(
        (values.topics || []).map(async (topic) => {
          const processedSubtopics = await Promise.all(
            (topic.subtopics || []).map(async (sub) => {
              // Upload video file to Vercel Blob
              const blob = await upload(sub.videoFile.name, sub.videoFile, {
                access: 'public',
                handleUploadUrl: '/api/upload', 
              });
              return { title: sub.title, videoUrl: blob.url };
            })
          );
          return { title: topic.title, subtopics: processedSubtopics };
        })
      );

      // 4. Send the data to your MySQL backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          topics: processedTopics
        }),
      });

      if (response.ok) {
        navigate('/instructor-dashboard');
      } else {
        const data = await response.json();
        setError(data.message || "Failed to save the course.");
      }
    } catch (err) {
      setError("An error occurred. Check your connection and file sizes.");
      console.error(err);
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
              {/* --- COURSE INFO --- */}
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
                />
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* --- TOPICS SECTION --- */}
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
                        />

                        {/* --- NESTED SUBTOPICS SECTION --- */}
                        <Typography variant="subtitle2" sx={{ ml: 2, mb: 1, fontWeight: 'bold' }}>
                          Subtopics & Videos
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
                                  />
                                  
                                  <Button
                                    variant="outlined" component="label"
                                    startIcon={<VideoCallIcon />}
                                    color={sub.videoFile ? "success" : "primary"}
                                  >
                                    {sub.videoFile ? "Video Added" : "Upload Video"}
                                    <input
                                      type="file" hidden accept="video/*"
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
                      onClick={() => pushTopic({ title: '', subtopics: [{ title: '', videoFile: null }] })}
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