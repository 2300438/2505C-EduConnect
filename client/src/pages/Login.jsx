import React, { useState, useEffect } from 'react';
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

  // 1. Initialize role safely from navigation state
  const [role, setRole] = useState(location.state?.role || 'student');

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      role: location.state?.role || 'student', // Keep Formik in sync with state
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters').required('Required'),
    }),
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
            role: role // Use the local state role for the request
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // 2. data.user and data.accessToken must exist from your backend
          login(data.user, data.accessToken);

          // 3. Navigate based on the current active role
          navigate(data.user.role === 'instructor' ? '/instructor-dashboard' : '/dashboard');
        } else {
          setStatus(data.message || "Invalid credentials");
        }
      } catch (error) {
        setStatus("Server error. Check your backend connection.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // 4. Sync role if user toggles login type from the Navbar/Home
  useEffect(() => {
    if (location.state?.role) {
      setRole(location.state.role);
      formik.setFieldValue('role', location.state.role);
    }
  }, [location.state]);

  return (
    <Box sx={{
      height: '100vh', width: '100vw', display: 'flex',
      alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5'
    }}>
      <Container maxWidth="xs">
        <Paper elevation={6} sx={{ borderRadius: 4, overflow: 'hidden' }}>

          {/* Header Section: Dynamically changes color/icon */}
          <Box sx={{
            p: 4, textAlign: 'center',
            bgcolor: role === 'student' ? 'primary.main' : 'success.main',
            color: 'white', transition: 'background-color 0.3s ease'
          }}>
            {role === 'student' ? <MenuBookIcon sx={{ fontSize: 48 }} /> : <SchoolIcon sx={{ fontSize: 48 }} />}
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>Welcome Back</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Please sign in to continue</Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {/* Role Toggle */}
            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={(e, next) => {
                if (next) {
                  setRole(next);
                  formik.setFieldValue('role', next);
                }
              }}
              fullWidth sx={{ mb: 3 }}
              color={role === 'student' ? "primary" : "success"}
            >
              <ToggleButton value="student">Student</ToggleButton>
              <ToggleButton value="instructor">Instructor</ToggleButton>
            </ToggleButtonGroup>

            <form onSubmit={formik.handleSubmit} autoComplete="off">
              {formik.status && <Alert severity="error" sx={{ mb: 2 }}>{formik.status}</Alert>}

              <TextField
                fullWidth label="Email Address" name="email" margin="normal"
                autoComplete="email"
                {...formik.getFieldProps('email')}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputProps={{ startAdornment: <InputAdornment position="start"><MailOutlineIcon color="action" /></InputAdornment> }}
              />

              <TextField
                fullWidth label="Password" name="password" type="password" margin="normal"
                autoComplete="current-password"
                {...formik.getFieldProps('password')}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon color="action" /></InputAdornment> }}
              />

              {/* REGISTER LINK: Added per your request */}
              <Box sx={{ mt: 1.5, mb: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    state={{ role: role }}
                    style={{
                      color: role === 'student' ? '#1976d2' : '#2e7d32',
                      textDecoration: 'none', fontWeight: 'bold'
                    }}
                  >
                    Register here
                  </Link>
                </Typography>
              </Box>
              <Box sx={{ mt: 1.5, mb: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Forgot you password?{' '}
                  <Link
                    to="/forgot-password"
                    state={{ role: role }}
                    style={{
                      color: role === 'student' ? '#1976d2' : '#2e7d32',
                      textDecoration: 'none', fontWeight: 'bold'
                    }}
                  >
                    Reset it here
                  </Link>
                </Typography>
              </Box>

              <Button
                fullWidth type="submit" variant="contained" size="large"
                disabled={formik.isSubmitting}
                sx={{
                  mt: 2, py: 1.5, borderRadius: 2, fontWeight: 'bold',
                  bgcolor: role === 'student' ? 'primary.main' : 'success.main',
                  '&:hover': { bgcolor: role === 'student' ? 'primary.dark' : 'success.dark' }
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