import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
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
  const location = useLocation();
  const { login } = useAuth();
  const navigate = useNavigate();

  // 1. Catch the state passed from the Navbar, default to 'student' if none exists
  // 1. Safe initialization
  const [role, setRole] = useState(location.state?.role || 'student');

  // 2. Listen for header clicks if the user is ALREADY on the Login page
  useEffect(() => {
    if (location.state?.role) {
      setRole(location.state.role);
    }
  }, [location.state]);

  // Formik Logic
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      role: location.state?.role || 'student', // Track role here
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters').required('Required'),
    }),
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}auth/login`, {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: values.email, password: values.password }),
          body: JSON.stringify({
            email: values.email,
            password: values.password,
            role: role // Send the role to the backend
          }),
        });

        const data = await response.json();

        if (response.ok) {
          login(data.user, data.accessToken);
          // 2. Use the current state 'role' for navigation
          navigate(role === 'instructor' ? '/instructor-dashboard' : '/dashboard');
        } else {
          setStatus(data.message || "Invalid credentials");
        }
      } catch (error) {
        setStatus("Server is offline. Check your backend connection.");
        setStatus("Server error. Check your backend connection.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // 3. Keep state in sync if navigating from elsewhere
  useEffect(() => {
    if (location.state?.role) {
      setRole(location.state.role);
      formik.setFieldValue('role', location.state.role);
    }
  }, [location.state]);

  return (
    <Box 
      sx={{ 
        height: '100vh', 
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
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
          <Box sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: formik.values.role === 'student' ? 'primary.main' : 'success.main',
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
              value={formik.values.role} // Bind to Formik
              exclusive
              onChange={(e, next) => next && setRole(next)}
              onChange={(e, next) => {
                if (next) {
                  setRole(next); // Update local state for icons
                  formik.setFieldValue('role', next); // Update Formik
                }
              }}
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
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    state={{ role: role }} // Passes the current role to the register page
                    style={{
                      color: role === 'student' ? '#1976d2' : '#2e7d32',
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    Register here
                  </Link>
                </Typography>
              </Box>

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