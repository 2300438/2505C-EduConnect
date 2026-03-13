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
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'student'
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required('Full name is required'),
      email: Yup.string().email('Invalid email').required('Required'),
      password: Yup.string().min(6, 'Minimum 6 characters').required('Required'),
      role: Yup.string().oneOf(['student', 'instructor']).required()
    }),
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        const data = await response.json();

        if (data.success) {
          // Auto-login after registration or redirect to login
          login(data.user, data.token);
          navigate(data.user.role === 'instructor' ? '/instructor-dashboard' : '/student-dashboard');
        } else {
          setStatus(data.message || "Registration failed");
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [role, setRole] = useState(location.state?.role || 'student');
    useEffect(() => {
        if (location.state?.role) {
            setRole(location.state.role);
        }
      } catch (err) {
        setStatus("Server error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });
    }, [location.state]);
    const formik = useFormik({
        initialValues: {
            fullName: '',
            email: '',
            password: '',
            role: location.state?.role || 'student' // Use the location state here too!
        },
        // ... validationSchema
        validationSchema: Yup.object({
            fullName: Yup.string().required('Full name is required'),
            email: Yup.string().email('Invalid email').required('Required'),
            password: Yup.string().min(6, 'Minimum 6 characters').required('Required'),
            role: Yup.string().oneOf(['student', 'instructor']).required()
        }),
        onSubmit: async (values, { setStatus, setSubmitting }) => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(values),
                });
                const data = await response.json();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#ffffff' }}>
      <Container maxWidth="sm">
        <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <PersonAddIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h4" fontWeight="bold">Create Account</Typography>
            <Typography variant="body2" color="text.secondary">Join the LMS community</Typography>
          </Box>
                if (data.success) {
                    login(data.user, data.token);
                    // Use the role from your form or state, which we know exists
                    const targetPath = role === 'instructor' ? '/instructor-dashboard' : '/dashboard';
                    navigate(targetPath);
                } else {
                    setStatus(data.message || "Registration failed");
                }
            } catch (err) {
                setStatus("Server error. Please try again.");
            } finally {
                setSubmitting(false);
            }
        },
    });

          <form onSubmit={formik.handleSubmit}>
            {formik.status && <Alert severity="error" sx={{ mb: 2 }}>{formik.status}</Alert>}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  {...formik.getFieldProps('fullName')}
                  error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                  helperText={formik.touched.fullName && formik.errors.fullName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  {...formik.getFieldProps('email')}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="I am a..."
                  name="role"
                  {...formik.getFieldProps('role')}
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
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="instructor">Instructor</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Password"
                  name="password"
                  {...formik.getFieldProps('password')}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                />
              </Grid>
            </Grid>
                    {/* Header Section: Colors change based on role */}
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
                            value={formik.values.role}
                            exclusive
                            onChange={(e, next) => {
                                if (next) {
                                    setRole(next); // Sync local state for icons/colors
                                    formik.setFieldValue('role', next); // Sync Formik for submission
                                }
                            }}
                            fullWidth
                            sx={{ mb: 3 }}
                            color={role === 'student' ? "primary" : "success"}
                        >
                            <ToggleButton value="student" sx={{ fontWeight: 'bold' }}>Student</ToggleButton>
                            <ToggleButton value="instructor" sx={{ fontWeight: 'bold' }}>Instructor</ToggleButton>
                        </ToggleButtonGroup>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={formik.isSubmitting}
              sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
            >
              {formik.isSubmitting ? 'Registering...' : 'Sign Up'}
            </Button>
                        <form onSubmit={formik.handleSubmit}>
                            {formik.status && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                    {formik.status}
                                </Alert>
                            )}
                            <TextField
                                fullWidth
                                label="Full Name"
                                name="fullName"
                                margin="normal"
                                variant="outlined"
                                {...formik.getFieldProps('fullName')}
                                error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                                helperText={formik.touched.fullName && formik.errors.fullName}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
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

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account? <Link to="/login" style={{ color: '#1976d2', fontWeight: 'bold' }}>Login here</Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
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
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    state={{ role: role }} // Passes the current role to the login page
                    style={{
                      color: role === 'student' ? '#1976d2' : '#2e7d32',
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    Login here
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

export default Register;