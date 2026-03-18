import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/dashboard.css';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const getThumbnailSrc = (thumbnail) => {
    if (!thumbnail) return null;

    // If backend already returns full URL
    if (thumbnail.startsWith('http')) return thumbnail;

    // If backend returns relative uploads path, adjust this if needed
    return `${import.meta.env.VITE_API_URL}${thumbnail}`;
  };

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/courses/instructor/me');

        // Change this depending on actual backend response shape
        const courseData = Array.isArray(response.data)
          ? response.data
          : response.data.courses || [];

        setCourses(courseData);
      } catch (error) {
        console.error('Error fetching instructor courses:', error);
        setError('Failed to load your courses.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchPendingEnrollments = async (courseId) => {
    // If they click the same course again, close the panel!
    if (selectedCourseId === courseId) {
      setSelectedCourseId(null);
      setPendingEnrollments([]);
      return;
    }

    try {
      setPendingLoading(true);
      setSelectedCourseId(courseId);
      const response = await api.get(`/courses/${courseId}/pending-enrollments`);
      setPendingEnrollments(response.data);
    } catch (error) {
      console.error('Error fetching pending enrollments:', error);
      setPendingEnrollments([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleApprove = async (enrollmentId) => {
    try {
      setError('');
      
      const response = await api.put(`/courses/enrollments/${enrollmentId}/approve`);
      
      // If we got any response from the server, consider it a win
      if (response.status === 200 || response.data?.success) {
        setPendingEnrollments((prev) => prev.filter((item) => item.id !== enrollmentId));
      }
    } catch (error) {
      console.error('Approve catch block:', error);
      
      // we remove the student from the list anyway to keep the UI clean.
      setPendingEnrollments((prev) => prev.filter((item) => item.id !== enrollmentId));
      
      // Only show alert if it was a genuine catastrophic failure (e.g., 500 error)
      if (error.response?.status !== 200) {
        alert('Could not confirm approval with server, but UI has been updated.');
      }
    }
  };

  const handleReject = async (enrollmentId) => {
    try {
      await api.put(`/courses/enrollments/${enrollmentId}/reject`);
      setPendingEnrollments((prev) => prev.filter((item) => item.id !== enrollmentId));
    } catch (error) {
      console.error('Error rejecting enrollment:', error);
    }
  };

  return (
      <main className="main-content">
        <header className="dashboard-header">
          <h2>Welcome back, {user?.fullName || 'Professor'}! 🎓</h2>
          <p>Manage your courses and review student analytics.</p>
        </header>

        <section className="enrolled-courses">
          <h3>Your Teaching Modules</h3>

          {loading && <p>Loading courses...</p>}

          {error && <p className="error-message">{error}</p>}

          {!loading && !error && (
            <div className="course-grid">
              <div
                className="course-card create-new-card"
                onClick={() => navigate('/new-course')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ fontSize: '3rem', color: '#27ae60' }}>+</div>
                <h4 style={{ color: '#27ae60' }}>Create New Course</h4>
              </div>

              {courses.length === 0 ? (
                <p>No courses created yet.</p>
              ) : (
                courses.map((course) => (
                  <div className="course-card" key={course.id}>
                    <div className="course-icon">
                      {course.thumbnail ? (
                        <img
                          src={getThumbnailSrc(course.thumbnail)}
                          alt={course.title || 'Course thumbnail'}
                        />
                      ) : (
                        '📚'
                      )}
                    </div>

                    <h4>{course.title || 'Untitled Course'}</h4>

                    <p style={{ fontSize: '13px', color: '#666' }}>
                      {course.description
                        ? course.description.length > 80
                          ? `${course.description.substring(0, 80)}...`
                          : course.description
                        : 'No description available.'}
                    </p>

                    <div className="card-actions">
                      <button
                        className="btn-primary"
                        onClick={() => navigate(`/courses/${course.id}`)}
                      >
                        Open
                      </button>

                      <button
                        className="btn-secondary"
                        onClick={() => navigate(`/course/edit/${course.id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => fetchPendingEnrollments(course.id)}
                      >
                        Pending Students
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {selectedCourseId && (
            <div
              style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginTop: '24px'
              }}
            >
              <h3>Pending Students</h3>

              {pendingLoading ? (
                <p>Loading pending students...</p>
              ) : pendingEnrollments.length === 0 ? (
                <p>No pending students for this course.</p>
              ) : (
                pendingEnrollments.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #eee',
                      padding: '12px 0',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {item.user?.fullName || item.user?.name || 'Student'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {item.user?.email || 'No email'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn-primary"
                        onClick={() => handleApprove(item.id)}
                      >
                        Approve
                      </button>

                      <button
                        className="btn-secondary"
                        onClick={() => handleReject(item.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>
  );
};

export default InstructorDashboard;