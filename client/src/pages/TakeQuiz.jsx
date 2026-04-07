import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Box, Button, TextField, 
  Radio, RadioGroup, FormControlLabel, FormControl, CircularProgress, Alert
} from '@mui/material';

const TakeQuiz = () => {
  const { id: courseId, quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Password State
  const [isLocked, setIsLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Quiz State
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetch the quiz details (without correct answers!)
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${courseId}/quizzes/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.message || 'Failed to load quiz');
        
        setQuiz(data);
        if (data.requiresPassword) setIsLocked(true);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [courseId, quizId]);

  const handleUnlock = async () => {
    try {
      const token = localStorage.getItem('token');
      // Verify password with backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${courseId}/quizzes/${quizId}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: passwordInput })
      });

      if (response.ok) {
        setIsLocked(false);
        setPasswordError('');
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
    } catch (err) {
      setPasswordError('Server error checking password.');
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${courseId}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers })
      });

      const data = await response.json();
      if (response.ok) {
        setResults(data); // e.g., { score: 80, total: 100 }
      } else {
        setError(data.message || 'Failed to submit quiz.');
      }
    } catch (err) {
      setError('An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Container sx={{ py: 5, textAlign: 'center' }}><CircularProgress /></Container>;
  if (error) return <Container sx={{ py: 5 }}><Alert severity="error">{error}</Alert></Container>;

  // --- PASSWORD SCREEN ---
  if (isLocked) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h4" mb={2}>🔒 Restricted Access</Typography>
          <Typography color="textSecondary" mb={4}>Your instructor has password-protected this assessment.</Typography>
          <TextField 
            fullWidth type="password" label="Enter Quiz Password" 
            value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
            error={!!passwordError} helperText={passwordError} sx={{ mb: 3 }}
          />
          <Button variant="contained" color="primary" size="large" onClick={handleUnlock} fullWidth>
            Unlock Quiz
          </Button>
        </Paper>
      </Container>
    );
  }

  // --- RESULTS SCREEN ---
  if (results) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h3" color="success.main" gutterBottom>Quiz Submitted!</Typography>
          <Typography variant="h5">Your Score: {results.score} / {results.total}</Typography>
          <Typography color="textSecondary" mt={2}>
            {results.message || "Long answer questions are pending manual grading by your instructor."}
          </Typography>
          <Button variant="outlined" sx={{ mt: 4 }} onClick={() => navigate(`/courses/${courseId}`)}>
            Back to Course
          </Button>
        </Paper>
      </Container>
    );
  }

  // --- QUIZ TAKING SCREEN ---
  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 4, bgcolor: '#f4f7f6' }}>
        <Typography variant="h4" fontWeight="bold" color="primary">{quiz.title}</Typography>
        <Typography variant="body1" color="textSecondary" mt={1}>{quiz.description}</Typography>
      </Paper>

      {quiz.questions?.map((q, index) => (
        <Paper key={q.id} elevation={1} sx={{ p: 4, mb: 3, borderRadius: 2, borderLeft: '4px solid #3498db' }}>
          <Typography variant="h6" mb={2}>
            {index + 1}. {q.text}
          </Typography>

          {q.type === 'MCQ' && (
            <FormControl component="fieldset">
              <RadioGroup 
                value={answers[q.id] || ''} 
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              >
                {q.options.map((opt, oIndex) => (
                  <FormControlLabel 
                    key={oIndex} value={oIndex.toString()} 
                    control={<Radio />} label={opt} 
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {q.type === 'SHORT' && (
            <TextField 
              fullWidth variant="outlined" placeholder="Type your short answer here..."
              value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            />
          )}

          {q.type === 'LONG' && (
            <TextField 
              fullWidth multiline rows={4} variant="outlined" placeholder="Type your detailed response here..."
              value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            />
          )}
        </Paper>
      ))}

      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button variant="text" onClick={() => navigate(`/courses/${courseId}`)}>Cancel</Button>
        <Button variant="contained" color="success" size="large" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <CircularProgress size={24} /> : 'Submit Assessment'}
        </Button>
      </Box>
    </Container>
  );
};

export default TakeQuiz;