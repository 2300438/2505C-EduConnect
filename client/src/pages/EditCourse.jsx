import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import {
  Box, Container, TextField, Button, Typography, Paper, IconButton,
  CircularProgress, Alert, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const EditCourse = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [initialValues, setInitialValues] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [viewingQuiz, setViewingQuiz] = useState(null);

  // Tab Management (Defaults to 'grades' if sent from CoursePage)
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'content');

  const [trainingId, setTrainingId] = useState(null);
  const [aiMessage, setAiMessage] = useState(null);

  // Gradebook State
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // NEW: Roster State for managing/removing approved students
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  // Fetch Grades
  useEffect(() => {
    if (activeTab === 'grades') {
      const fetchGrades = async () => {
        setLoadingGrades(true);
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${id}/grades`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) setGrades(await res.json());
        } catch (err) {
          console.error("Failed to fetch grades", err);
        } finally {
          setLoadingGrades(false);
        }
      };
      fetchGrades();
    }
  }, [activeTab, id]);

  // NEW: Fetch Enrollments for Roster Tab
  useEffect(() => {
    if (activeTab === 'roster') {
      const fetchRoster = async () => {
        setEnrollmentsLoading(true);
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${id}/all-enrollments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            // Edit Page Roster ONLY cares about currently enrolled (approved) students
            setEnrollments(data.filter(e => e.status === 'approved'));
          }
        } catch (err) {
          console.error("Failed to fetch roster", err);
        } finally {
          setEnrollmentsLoading(false);
        }
      };
      fetchRoster();
    }
  }, [activeTab, id]);

  const handleDeleteGrade = async (submissionId) => {
    if (!window.confirm("Are you sure you want to delete this student's result? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/submissions/${submissionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setGrades(prevGrades => prevGrades.filter(g => g.id !== submissionId));
      } else {
        alert("Failed to delete result.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // NEW: Handle Removing Student
  const handleRemoveStudent = async (enrollmentId) => {
    if (!window.confirm("Are you sure you want to permanently remove this student from the course?")) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/enrollments/${enrollmentId}/remove`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      } else {
        alert("Failed to remove student.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const validationSchema = Yup.object({
    title: Yup.string().required('Course title is required'),
    description: Yup.string().min(10, 'Description must be at least 10 characters').required('Description is required'),
    topics: Yup.array().of(
      Yup.object({
        title: Yup.string().required('Topic title required'),
        subtopics: Yup.array().of(
          Yup.object({ title: Yup.string().required('Lesson title required') })
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
        if (!response.ok) throw new Error(data.message || 'Failed to load course');

        setInitialValues({
          title: data.title || '',
          description: data.description || '',
          topics: (data.topics || []).map((topic) => ({
            id: topic.id,
            title: topic.title || '',
            subtopics: (topic.subtopics || []).map((sub) => ({
              id: sub.id, title: sub.title || '', existingfileUrl: sub.fileUrl || '', is_ai_trained: sub.is_ai_trained || false, videoFile: null,
            }))
          })),
          quizzes: data.quizzes || [],
          discussions: data.discussions || []
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

  const handleTrainAI = async (subtopicId, fileUrl, setFieldValue, tIndex, sIndex) => {
    if (!fileUrl) { setAiMessage({ type: 'error', text: 'Save uploaded file first.' }); return; }
    setTrainingId(subtopicId);
    setAiMessage(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ contentId: subtopicId, blobUrl: fileUrl, contentType: fileUrl.split('.').pop() })
      });
      const data = await response.json();
      if (data.success) {
        setFieldValue(`topics.${tIndex}.subtopics.${sIndex}.is_ai_trained`, true);
        setAiMessage({ type: 'success', text: `AI Tutor has successfully learned from the lesson file!` });
      } else {
        setAiMessage({ type: 'error', text: "Failed to train AI: " + data.message });
      }
    } catch (error) {
      setAiMessage({ type: 'error', text: "Connection error while training the AI." });
    } finally {
      setTrainingId(null);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) { setError('You are not logged in.'); setSaving(false); return; }

    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('quizzesData', JSON.stringify(values.quizzes || []));
      formData.append('discussionsData', JSON.stringify(values.discussions || []));

      const topicsData = [];
      values.topics.forEach((topic, tIndex) => {
        const topicData = { id: topic.id, title: topic.title, subtopics: [] };
        if (topic.subtopics) {
          topic.subtopics.forEach((sub, sIndex) => {
            if (sub.videoFile) formData.append(`file_${tIndex}_${sIndex}`, sub.videoFile);
            topicData.subtopics.push({ id: sub.id, title: sub.title, existingfileUrl: sub.existingfileUrl || '' });
          });
        }
        topicsData.push(topicData);
      });
      formData.append('topicsData', JSON.stringify(topicsData));

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${id}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });

      if (response.ok) navigate(`/courses/${id}`);
      else {
        const text = await response.text();
        setError('Failed to update course: ' + text);
      }
    } catch (err) {
      setError('An error occurred while updating the course.');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) return <Container maxWidth="md" sx={{ py: 5 }}><Typography>Loading course...</Typography></Container>;
  if (!initialValues) return <Container maxWidth="md" sx={{ py: 5 }}><Alert severity="error">{error || 'Course not found.'}</Alert></Container>;

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Edit Course ✏️</Typography>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {aiMessage && <Alert severity={aiMessage.type} sx={{ mb: 3 }} onClose={() => setAiMessage(null)}>{aiMessage.text}</Alert>}

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
          {({ values, handleChange, setFieldValue, errors, touched }) => (
            <Form>
              <Box sx={{ mb: 4 }}>
                <TextField fullWidth label="Course Title" name="title" variant="outlined" margin="normal" value={values.title} onChange={handleChange} error={touched.title && !!errors.title} helperText={touched.title && errors.title} />
                <TextField fullWidth multiline rows={3} label="Course Description" name="description" variant="outlined" margin="normal" value={values.description} onChange={handleChange} error={touched.description && !!errors.description} helperText={touched.description && errors.description} />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 4, borderBottom: '2px solid #ecf0f1', pb: 1 }}>
                {['content', 'quizzes', 'discussions', 'grades', 'roster'].map((tab) => (
                  <Button
                    key={tab} onClick={() => setActiveTab(tab)}
                    sx={{
                      fontWeight: 'bold', color: activeTab === tab ? '#1976d2' : '#7f8c8d',
                      borderBottom: activeTab === tab ? '3px solid #1976d2' : '3px solid transparent',
                      borderRadius: 0, px: 3, textTransform: 'capitalize'
                    }}
                  >
                    {tab === 'content' && '📚 Content'}
                    {tab === 'quizzes' && '📝 Quizzes'}
                    {tab === 'discussions' && '💬 Discussions'}
                    {tab === 'grades' && '📊 Gradebook'}
                    {tab === 'roster' && '👥 Roster'}
                  </Button>
                ))}
              </Box>

              {activeTab === 'content' && (
                <FieldArray name="topics">
                  {({ push: pushTopic, remove: removeTopic }) => (
                    <Box>
                      {(values.topics || []).map((topic, tIndex) => (
                        <Card key={topic.id || tIndex} variant="outlined" sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" color="primary">Topic #{tIndex + 1}</Typography>
                            {values.topics.length > 1 && <IconButton color="error" onClick={() => removeTopic(tIndex)}><DeleteIcon /></IconButton>}
                          </Box>
                          <TextField fullWidth label="Topic Title" name={`topics.${tIndex}.title`} value={topic.title} onChange={handleChange} sx={{ mb: 3, bgcolor: 'white' }} error={touched.topics?.[tIndex]?.title && Boolean(errors.topics?.[tIndex]?.title)} helperText={touched.topics?.[tIndex]?.title && errors.topics?.[tIndex]?.title} />
                          <Typography variant="subtitle2" sx={{ ml: 2, mb: 1, fontWeight: 'bold' }}>Subtopics & Files</Typography>
                          <FieldArray name={`topics.${tIndex}.subtopics`}>
                            {({ push: pushSub, remove: removeSub }) => (
                              <Box sx={{ ml: 4 }}>
                                {(topic.subtopics || []).map((sub, sIndex) => (
                                  <Box key={sub.id || sIndex} sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'white' }}>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'start', flexWrap: 'wrap' }}>
                                      <TextField label="Subtopic Title" name={`topics.${tIndex}.subtopics.${sIndex}.title`} value={sub.title} onChange={handleChange} size="small" sx={{ flex: 1, minWidth: '200px' }} error={touched.topics?.[tIndex]?.subtopics?.[sIndex]?.title && Boolean(errors.topics?.[tIndex]?.subtopics?.[sIndex]?.title)} helperText={touched.topics?.[tIndex]?.subtopics?.[sIndex]?.title && errors.topics?.[tIndex]?.subtopics?.[sIndex]?.title} />
                                      <Button variant="outlined" component="label" startIcon={<VideoCallIcon />} color={sub.videoFile ? 'success' : 'primary'}>
                                        {sub.videoFile ? 'New File Selected' : sub.existingfileUrl ? 'Replace File' : 'Upload File'}
                                        <input type="file" hidden accept="video/*,.pdf,.doc,.docx,.ppt,.pptx" onChange={(e) => setFieldValue(`topics.${tIndex}.subtopics.${sIndex}.videoFile`, e.target.files[0])} />
                                      </Button>
                                      {sub.existingfileUrl && (
                                        <Button variant="contained" size="small" startIcon={<SmartToyIcon />} color={sub.is_ai_trained ? "success" : "secondary"} disabled={sub.is_ai_trained || trainingId === sub.id} onClick={() => handleTrainAI(sub.id, sub.existingfileUrl, setFieldValue, tIndex, sIndex)}>
                                          {trainingId === sub.id ? "AI Reading..." : sub.is_ai_trained ? "AI Trained" : "Add to AI"}
                                        </Button>
                                      )}
                                      {topic.subtopics.length > 1 && <IconButton onClick={() => removeSub(sIndex)} size="small" color="error"><DeleteIcon /></IconButton>}
                                    </Box>
                                    {sub.existingfileUrl && !sub.videoFile && (
                                      <Box sx={{ mt: 1 }}><a href={sub.existingfileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#1976d2' }}>View currently uploaded file</a></Box>
                                    )}
                                  </Box>
                                ))}
                                <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => pushSub({ title: '', existingfileUrl: '', videoFile: null, is_ai_trained: false })}>Add Subtopic</Button>
                              </Box>
                            )}
                          </FieldArray>
                        </Card>
                      ))}
                      <Button variant="outlined" fullWidth startIcon={<AddCircleOutlineIcon />} onClick={() => pushTopic({ title: '', subtopics: [] })} sx={{ py: 1.5, borderStyle: 'dashed' }}>Add New Topic</Button>
                    </Box>
                  )}
                </FieldArray>
              )}

              {activeTab === 'quizzes' && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">Course Assessments</Typography>
                    <Button variant="contained" color="secondary" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate(`/course/${id}/quizzes/new`)}>Create New Quiz</Button>
                  </Box>
                  {(!values.quizzes || values.quizzes.length === 0) ? (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}><Typography color="textSecondary">No quizzes have been created for this course yet.</Typography></Paper>
                  ) : (
                    <Box display="grid" gap={2}>
                      {values.quizzes.map((quiz, qIndex) => (
                        <Card key={quiz.id || qIndex} variant="outlined" sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="h6" color="primary" onClick={() => setViewingQuiz(quiz)} sx={{ cursor: 'pointer', textDecoration: 'underline', display: 'inline-block', '&:hover': { color: '#0d47a1' } }} title="Click to preview quiz">
                              {quiz.title} 👁️
                            </Typography>
                            <Typography variant="body2" color="textSecondary">{quiz.questions?.length || 0} Questions {quiz.requiresPassword ? ' • 🔒 Password Protected' : ' • 🔓 Open Access'}</Typography>
                          </Box>
                          <Box>
                            <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => navigate(`/course/${id}/quizzes/edit/${quiz.id}`)}>Edit</Button>
                            <IconButton color="error" size="small" onClick={() => { if (window.confirm('Are you sure you want to delete this quiz?')) console.log("Delete quiz ID:", quiz.id); }}><DeleteIcon /></IconButton>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {activeTab === 'discussions' && (
                <FieldArray name="discussions">
                  {({ push: pushDisc, remove: removeDisc }) => (
                    <Box>
                      {values.discussions.length === 0 && <Typography color="textSecondary" sx={{ mb: 2 }}>No discussions added yet.</Typography>}
                      {(values.discussions || []).map((disc, dIndex) => (
                        <Card key={disc.id || dIndex} variant="outlined" sx={{ p: 3, mb: 4, bgcolor: '#f4fff8', borderColor: '#a5d6a7' }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" color="success.main">Discussion Board #{dIndex + 1}</Typography>
                            <IconButton color="error" onClick={() => removeDisc(dIndex)}><DeleteIcon /></IconButton>
                          </Box>
                          <TextField fullWidth label="Discussion Topic" name={`discussions.${dIndex}.title`} value={disc.title} onChange={handleChange} sx={{ mb: 3, bgcolor: 'white' }} error={touched.discussions?.[dIndex]?.title && Boolean(errors.discussions?.[dIndex]?.title)} helperText={touched.discussions?.[dIndex]?.title && errors.discussions?.[dIndex]?.title} />
                          <TextField fullWidth multiline rows={3} label="Discussion Prompt" name={`discussions.${dIndex}.prompt`} value={disc.prompt || ''} onChange={handleChange} sx={{ bgcolor: 'white' }} />
                        </Card>
                      ))}
                      <Button variant="outlined" color="success" fullWidth startIcon={<AddCircleOutlineIcon />} onClick={() => pushDisc({ title: '', prompt: '' })} sx={{ py: 1.5, borderStyle: 'dashed' }}>Add New Discussion Board</Button>
                    </Box>
                  )}
                </FieldArray>
              )}

              {activeTab === 'grades' && (
                <Box>
                  <Typography variant="h6" mb={3} color="primary">Student Performance</Typography>
                  {loadingGrades ? (
                    <Box textAlign="center" py={4}><CircularProgress /></Box>
                  ) : grades.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}><Typography color="textSecondary">No students have taken any quizzes yet.</Typography></Paper>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead sx={{ bgcolor: '#f4f7f6' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Quiz Title</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Total Score</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {grades.map((row) => (
                            <TableRow key={row.id} hover>
                              <TableCell>
                                <Typography fontWeight="500">{row.student?.fullName}</Typography>
                                <Typography variant="caption" color="textSecondary">{row.student?.email}</Typography>
                              </TableCell>
                              <TableCell>{row.quiz?.title}</TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color={((row.autoScore || 0) + (row.manualScore || 0)) >= 50 ? 'success.main' : 'error.main'}>
                                  {(row.autoScore || 0) + (row.manualScore || 0)}%
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                {row.needsManualGrading ? <Chip label="Needs Grading" color="warning" size="small" /> : <Chip label="Graded" color="success" size="small" />}
                              </TableCell>
                              <TableCell align="center">
                                <IconButton color="error" size="small" onClick={() => handleDeleteGrade(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* NEW TAB 5: ROSTER */}
              {activeTab === 'roster' && (
                <Box>
                  <Typography variant="h6" mb={3} color="primary">Manage Course Roster</Typography>
                  {enrollmentsLoading ? (
                    <Box textAlign="center" py={4}><CircularProgress /></Box>
                  ) : enrollments.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                      <Typography color="textSecondary">No approved students to manage.</Typography>
                    </Paper>
                  ) : (
                    <Box display="grid" gap={2}>
                      {enrollments.map(req => (
                        <Card key={req.id} variant="outlined" sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="h6">{req.user?.fullName}</Typography>
                            <Typography color="textSecondary" variant="body2">{req.user?.email}</Typography>
                          </Box>
                          <Button variant="outlined" color="error" onClick={() => handleRemoveStudent(req.id)}>
                            Remove Student
                          </Button>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {/* SAVE BUTTON (Hidden on read-only tabs) */}
              {activeTab !== 'grades' && activeTab !== 'roster' && (
                <Box sx={{ mt: 5, display: 'flex', gap: 2 }}>
                  <Button type="submit" variant="contained" color="success" size="large" disabled={saving}>
                    {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Course'}
                  </Button>
                  <Button variant="text" onClick={() => navigate(`/courses/${id}`)}>Cancel</Button>
                </Box>
              )}
            </Form>
          )}
        </Formik>
      </Paper>

      {/* QUIZ PREVIEW MODAL */}
      {viewingQuiz && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginTop: 0, color: '#2c3e50' }}>{viewingQuiz.title} Preview</h2>
            {viewingQuiz.description && <p style={{ color: '#7f8c8d' }}>{viewingQuiz.description}</p>}
            <hr style={{ margin: '20px 0', borderTop: '1px solid #ecf0f1' }} />
            {viewingQuiz.questions?.map((q, i) => (
              <div key={i} style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <strong style={{ fontSize: '1.1rem', color: '#34495e' }}>Q{i + 1}: {q.text}</strong>
                {q.type === 'MCQ' && (
                  <ul style={{ listStyleType: 'none', paddingLeft: 0, marginTop: '12px' }}>
                    {q.options?.map((opt, oIdx) => {
                      const isCorrect = q.correctAnswer === String(oIdx);
                      return (
                        <li key={oIdx} style={{ padding: '8px 12px', marginBottom: '6px', borderRadius: '4px', backgroundColor: isCorrect ? '#e8f8f5' : '#fff', border: isCorrect ? '1px solid #2ecc71' : '1px solid #e0e0e0', color: isCorrect ? '#27ae60' : '#2c3e50', fontWeight: isCorrect ? 'bold' : 'normal' }}>
                          {opt} {isCorrect && ' ✓ (Correct)'}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {q.type === 'SHORT' && <p style={{ marginTop: '10px', color: '#27ae60', fontWeight: 'bold' }}>Correct Answer: {q.correctAnswer}</p>}
              </div>
            ))}
            <div style={{ textAlign: 'right', marginTop: '30px' }}><button onClick={() => setViewingQuiz(null)} style={{ padding: '10px 24px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Close Preview</button></div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default EditCourse;