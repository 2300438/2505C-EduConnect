import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  ToggleButton, 
  ToggleButtonGroup, 
  InputAdornment, 
  Paper, 
  Alert,
  CircularProgress
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [role, setRole] = useState('student');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Formik Logic
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters').required('Required'),
    }),
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      try {
        // FIX 1: Pointing to /auth/login instead of just /login
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: values.email, password: values.password }),
        });

        const data = await response.json();

        // FIX 2: Checking response.ok because your backend doesn't send a "success" boolean
        if (response.ok) {
          // FIX 3: Using data.accessToken to match your backend's exact variable name
          login(data.user, data.accessToken);
          navigate(role === 'instructor' ? '/instructor-dashboard' : '/student-dashboard');
        } else {
          setStatus(data.message || "Invalid credentials");
        }
      } catch (error) {
        setStatus("Server is offline. Check your backend connection.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box 
      sx={{ 
        height: '100vh', 
        width: '100vw',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        bgcolor: '#ffffff', // Pure white background
        position: 'fixed', // Ensures it covers everything
        top: 0,
        left: 0
      }}
    >
      <Container maxWidth="xs">
        <Paper 
          elevation={6} 
          sx={{ 
            borderRadius: 4, 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header Section: Colors change based on role */}
          <Box sx={{ 
            p: 4, 
            textAlign: 'center', 
            bgcolor: role === 'student' ? 'primary.main' : 'success.main',
            color: 'white',
            transition: 'background-color 0.4s ease'
          }}>
            {role === 'student' ? (
              <MenuBookIcon sx={{ fontSize: 48, mb: 1 }} />
            ) : (
              <SchoolIcon sx={{ fontSize: 48, mb: 1 }} />
            )}
            
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Please sign in to continue
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {/* Role Toggle */}
            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={(e, next) => next && setRole(next)}
              fullWidth
              sx={{ mb: 3 }}
              color={role === 'student' ? "primary" : "success"}
            >
              <ToggleButton value="student" sx={{ fontWeight: 'bold' }}>Student</ToggleButton>
              <ToggleButton value="instructor" sx={{ fontWeight: 'bold' }}>Instructor</ToggleButton>
            </ToggleButtonGroup>

            <form onSubmit={formik.handleSubmit}>
              {formik.status && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {formik.status}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Email Address"
                name="email"
                margin="normal"
                variant="outlined"
                {...formik.getFieldProps('email')}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                margin="normal"
                variant="outlined"
                {...formik.getFieldProps('password')}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={formik.isSubmitting}
                endIcon={!formik.isSubmitting && <ChevronRightIcon />}
                sx={{ 
                  mt: 4, 
                  py: 1.8, 
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  bgcolor: role === 'student' ? 'primary.main' : 'success.main',
                  '&:hover': {
                    bgcolor: role === 'student' ? 'primary.dark' : 'success.dark',
                  }
                }}
              >
                {formik.isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Login'}
              </Button>
            </form>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;