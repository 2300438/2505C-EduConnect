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
import PersonIcon from '@mui/icons-material/Person';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Initialize role from navigation state or default to student
  const [role, setRole] = useState(location.state?.role || 'student');

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      role: location.state?.role || 'student',
    },
    validationSchema: Yup.object({
      fullName: Yup.string().min(2, 'Name too short').required('Full name is required'),
      email: Yup.string().email('Invalid email').required('Required'),
      password: Yup.string().min(6, 'Minimum 6 characters').required('Required'),
      role: Yup.string().required()
    }),
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        
        const data = await response.json();

        if (response.ok && data.token) {
          login(data.user, data.token);
          // Navigate based on the role stored in Formik values
          navigate(values.role === 'instructor' ? '/instructor-dashboard' : '/dashboard');
        } else {
          setStatus(data.message || "Registration failed. Email might already be in use.");
        }
      } catch (err) {
        setStatus("Server error. Please ensure your backend is running.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Sync role if user clicks "Instructor Login" from Navbar while on this page
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
          
          {/* Header Section */}
          <Box sx={{ 
            p: 4, textAlign: 'center', 
            bgcolor: formik.values.role === 'student' ? 'primary.main' : 'success.main',
            color: 'white', transition: '0.3s'
          }}>
            {formik.values.role === 'student' ? <MenuBookIcon sx={{ fontSize: 48 }} /> : <SchoolIcon sx={{ fontSize: 48 }} />}
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>Create Account</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Join the EduConnect community</Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {/* Role Toggle */}
            <ToggleButtonGroup
              value={formik.values.role}
              exclusive
              fullWidth
              onChange={(e, next) => {
                if (next) formik.setFieldValue('role', next);
              }}
              sx={{ mb: 3 }}
              color={formik.values.role === 'student' ? "primary" : "success"}
            >
              <ToggleButton value="student">Student</ToggleButton>
              <ToggleButton value="instructor">Instructor</ToggleButton>
            </ToggleButtonGroup>

            <form onSubmit={formik.handleSubmit} autoComplete="off">
              {formik.status && <Alert severity="error" sx={{ mb: 2 }}>{formik.status}</Alert>}

              <TextField
                fullWidth label="Full Name" name="fullName" margin="normal"
                {...formik.getFieldProps('fullName')}
                error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                helperText={formik.touched.fullName && formik.errors.fullName}
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> }}
              />

              <TextField
                fullWidth label="Email Address" name="email" margin="normal"
                {...formik.getFieldProps('email')}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputProps={{ startAdornment: <InputAdornment position="start"><MailOutlineIcon color="action" /></InputAdornment> }}
              />

              <TextField
                fullWidth label="Password" name="password" type="password" margin="normal"
                {...formik.getFieldProps('password')}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon color="action" /></InputAdornment> }}
              />

              {/* Login Redirect Link */}
              <Box sx={{ mt: 1.5, mb: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    state={{ role: formik.values.role }} 
                    style={{ 
                      color: formik.values.role === 'student' ? '#1976d2' : '#2e7d32', 
                      textDecoration: 'none', fontWeight: 'bold' 
                    }}
                  >
                    Login here
                  </Link>
                </Typography>
              </Box>

              <Button
                fullWidth type="submit" variant="contained" size="large"
                disabled={formik.isSubmitting}
                sx={{ 
                  mt: 2, py: 1.5, borderRadius: 2, fontWeight: 'bold',
                  bgcolor: formik.values.role === 'student' ? 'primary.main' : 'success.main',
                  '&:hover': { bgcolor: formik.values.role === 'student' ? 'primary.dark' : 'success.dark' }
                }}
              >
                {formik.isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Register'}
              </Button>
            </form>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;