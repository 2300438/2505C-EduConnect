import React, { useState } from 'react';
import { 
  Container, Typography, Box, Paper, TextField, Button, 
  Accordion, AccordionSummary, AccordionDetails, MenuItem, Alert, CircularProgress,
  Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; 

const SupportPage = () => {
  const { user } = useAuth(); 
  const [success, setSuccess] = useState(null);

  const faqs = [
    {
      category: "General & Enrollment",
      questions: [
        { q: "How do I join a course?", a: "Browse the 'All Courses' section, click on a course card, and hit 'Enroll'. If the course is private, you will remain in 'Pending' status until approved." },
        { q: "Why is my enrollment still pending?", a: "Instructors must manually approve student requests. You can check your status on your Dashboard." }
      ]
    },
    {
      category: "Quizzes & Grading",
      questions: [
        { q: "How do I access my past quiz results?", a: "Go to your course page and click on the 'Assessment' tab. Completed quizzes will show a 'View Past Result' button." },
        { q: "My essay hasn't been graded yet.", a: "Multiple-choice is instant, but 'LONG' answers require instructor review. You'll see your final score once they finish." }
      ]
    }
  ];

  const categories = [
    "Technical Issue",
    "Account/Login Help",
    "Course Content Error",
    "Quiz/Grading Issue",
    "Others"
  ];

  const validationSchema = Yup.object({
    fullName: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    category: Yup.string().required('Required'),
    subject: Yup.string().min(5, 'Subject too short').required('Required'),
    message: Yup.string().min(10, 'Please provide more detail').required('Required'),
  });

  const handleSubmit = async (values, { resetForm }) => {
    try {
      // Create a payload that includes userId if the user is authenticated
      const payload = {
        ...values,
        userId: user ? user.id : null
      };

      const res = await api.post('/support/submit', payload); 
      
      if (res.data.success) {
        setSuccess(res.data.message);
        // Reset only the fields the user typed manually
        resetForm({ 
          values: { 
            ...values, 
            category: '', 
            subject: '', 
            message: '' 
          } 
        });
      }
    } catch (err) {
      setSuccess("Error sending message. Please try again.");
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
          Support Center 🤝
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Search our FAQs or submit a ticket and we'll get back to you within 24 hours.
        </Typography>
      </Box>

      <Grid container spacing={5}>
        
        {/* LEFT SIDE: FAQs */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <HelpOutlineIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h5" fontWeight="bold">FAQs</Typography>
          </Box>

          {faqs.map((group, gIdx) => (
            <Box key={gIdx} sx={{ mb: 4 }}>
              <Typography variant="overline" sx={{ fontWeight: 'bold', color: '#1976d2', letterSpacing: 1 }}>
                {group.category}
              </Typography>
              {group.questions.map((item, qIdx) => (
                <Accordion key={qIdx} sx={{ mt: 1, boxShadow: 'none', border: '1px solid #e0e0e0', '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2" fontWeight="600">{item.q}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="textSecondary">{item.a}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ))}
        </Grid>

        {/* RIGHT SIDE: CONTACT FORM */}
        <Grid item xs={12} md={6}>
          <Paper elevation={4} sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0' }}>
            <Typography variant="h6" fontWeight="bold" mb={1}>Submit a Ticket</Typography>
            <Typography variant="caption" color="textSecondary" display="block" mb={3}>
              Need more help? Our analysts are ready to assist.
            </Typography>
            
            {success && (
              <Alert 
                severity={success.includes("success") ? "success" : "error"} 
                sx={{ mb: 3 }}
                onClose={() => setSuccess(null)}
              >
                {success}
              </Alert>
            )}

            <Formik
              initialValues={{ 
                fullName: user?.fullName || '', 
                email: user?.email || '', 
                category: '', 
                subject: '', 
                message: '' 
              }}
              enableReinitialize={true} 
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, handleChange, handleBlur, errors, touched, isSubmitting }) => (
                <Form>
                  <TextField
                    fullWidth size="small" label="Full Name" name="fullName" margin="dense" variant="outlined"
                    value={values.fullName} onChange={handleChange} onBlur={handleBlur}
                    disabled={!!user} 
                    error={touched.fullName && !!errors.fullName} helperText={touched.fullName && errors.fullName}
                  />

                  <TextField
                    fullWidth size="small" label="Email Address" name="email" margin="dense" variant="outlined"
                    value={values.email} onChange={handleChange} onBlur={handleBlur}
                    disabled={!!user}
                    error={touched.email && !!errors.email} helperText={touched.email && errors.email}
                  />

                  <TextField
                    select fullWidth size="small" label="Category" name="category" margin="dense" variant="outlined"
                    value={values.category} onChange={handleChange} onBlur={handleBlur}
                    error={touched.category && !!errors.category} helperText={touched.category && errors.category}
                  >
                    {categories.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    fullWidth size="small" label="Subject" name="subject" margin="dense" variant="outlined"
                    value={values.subject} onChange={handleChange} onBlur={handleBlur}
                    error={touched.subject && !!errors.subject} helperText={touched.subject && errors.subject}
                  />

                  <TextField
                    fullWidth multiline rows={3} label="Message" name="message" margin="dense" variant="outlined"
                    value={values.message} onChange={handleChange} onBlur={handleBlur}
                    error={touched.message && !!errors.message} helperText={touched.message && errors.message}
                  />

                  <Button
                    type="submit" variant="contained" fullWidth 
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    disabled={isSubmitting}
                    sx={{ mt: 3, py: 1, borderRadius: 2, fontWeight: 'bold' }}
                  >
                    {isSubmitting ? "Sending..." : "Submit Ticket"}
                  </Button>
                </Form>
              )}
            </Formik>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SupportPage;