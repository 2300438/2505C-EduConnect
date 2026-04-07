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
  
  // Pending Enrollments State
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // --- NEW: Grading State ---
  const [pendingGrades, setPendingGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [manualScore, setManualScore] = useState(0);
  const [savingGrade, setSavingGrade] = useState(false);

  const getThumbnailSrc = (thumbnail) => {
    if (!thumbnail) return null;
    if (thumbnail.startsWith('http')) return thumbnail;
    return `${import.meta.env.VITE_API_URL}${thumbnail}`;
  };

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/courses/instructor/me');
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

    // Fetch the courses and the pending grades on mount
    fetchMyCourses();
    fetchPendingGrades();
  }, []);

  // --- NEW: Fetch Pending Grades ---
  const fetchPendingGrades = async () => {
    try {
      setGradesLoading(true);
      const response = await api.get('/courses/instructor/pending-grading');
      setPendingGrades(response.data);
    } catch (err) {
      console.error('Error fetching pending grades:', err);
    } finally {
      setGradesLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchPendingEnrollments = async (courseId) => {
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
      if (response.status === 200 || response.data?.success) {
        setPendingEnrollments((prev) => prev.filter((item) => item.id !== enrollmentId));
      }
    } catch (error) {
      console.error('Approve catch block:', error);
      setPendingEnrollments((prev) => prev.filter((item) => item.id !== enrollmentId));
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

  // --- NEW: Open Grading Modal ---
  const openGradingModal = (submission) => {
    setSelectedSub(submission);
    setManualScore(0);
  };

  // --- NEW: Submit the Grade ---
  const handleSaveGrade = async () => {
    setSavingGrade(true);
    try {
      const response = await api.put(`/courses/instructor/grade-submission/${selectedSub.id}`, {
        manualScore: parseInt(manualScore) || 0
      });

      if (response.status === 200 || response.data?.message) {
        setPendingGrades(prev => prev.filter(s => s.id !== selectedSub.id));
        setSelectedSub(null);
      }
    } catch (err) {
      console.error("Failed to save grade", err);
      alert("An error occurred while saving the grade.");
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <main className="main-content">
      <header className="dashboard-header">
        <h2>Welcome back, {user?.fullName || 'Professor'}! 🎓</h2>
        <p>Manage your courses and review student analytics.</p>
      </header>

      {/* --- COURSES SECTION --- */}
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

                  <div style={{
                    fontSize: '12px', color: '#27ae60', backgroundColor: '#eafaf1',
                    padding: '4px 10px', borderRadius: '20px', display: 'inline-block',
                    fontWeight: '600', marginBottom: '10px'
                  }}>
                    👥 {course.studentCount || 0} Students
                  </div>

                  <p style={{ fontSize: '13px', color: '#666' }}>
                    {course.description
                      ? course.description.length > 80
                        ? `${course.description.substring(0, 80)}...`
                        : course.description
                      : 'No description available.'}
                  </p>

                  <div className="card-actions">
                    <button className="btn-primary" onClick={() => navigate(`/courses/${course.id}`)}>Open</button>
                    <button className="btn-secondary" onClick={() => navigate(`/course/edit/${course.id}`)}>Edit</button>
                    <button className="btn-secondary" onClick={() => fetchPendingEnrollments(course.id)}>Pending Students</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- PENDING ENROLLMENTS EXPANDED VIEW --- */}
        {selectedCourseId && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: '24px' }}>
            <h3>Pending Students</h3>
            {pendingLoading ? (
              <p>Loading pending students...</p>
            ) : pendingEnrollments.length === 0 ? (
              <p>No pending students for this course.</p>
            ) : (
              pendingEnrollments.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '12px 0', gap: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.user?.fullName || item.user?.name || 'Student'}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{item.user?.email || 'No email'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-primary" onClick={() => handleApprove(item.id)}>Approve</button>
                    <button className="btn-secondary" onClick={() => handleReject(item.id)}>Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* --- NEW: NEEDS GRADING SECTION --- */}
      <section className="needs-grading-section" style={{ marginTop: '40px' }}>
        <h3 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '20px' }}>
          Assessments Needing Review
        </h3>

        {gradesLoading ? (
          <p>Loading pending submissions...</p>
        ) : pendingGrades.length === 0 ? (
          <div style={{ background: '#f4fff8', padding: '30px', borderRadius: '12px', textAlign: 'center', border: '1px solid #a5d6a7' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
            <h4 style={{ color: '#27ae60', margin: '0 0 5px 0' }}>You're all caught up!</h4>
            <p style={{ color: '#666', margin: 0 }}>No manual grading is required at this time.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {pendingGrades.map((sub) => (
              <div key={sub.id} style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '5px solid #f39c12', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{sub.quiz?.title || 'Quiz'}</h4>
                  <p style={{ fontSize: '13px', color: '#666', margin: '0 0 8px 0' }}>
                    <strong>Student:</strong> {sub.user?.fullName} | <strong>Course:</strong> {sub.quiz?.course?.title}
                  </p>
                  <span style={{ fontSize: '12px', background: '#fff3e0', color: '#e67e22', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    Auto-Graded Score: {sub.autoScore} points
                  </span>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ backgroundColor: '#f39c12' }}
                  onClick={() => openGradingModal(sub)}
                >
                  Grade Essays
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- NEW: GRADING MODAL OVERLAY --- */}
      {selectedSub && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', padding: '30px', borderRadius: '12px',
            maxWidth: '800px', width: '90%', maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginTop: 0 }}>
              Grading: {selectedSub.user?.fullName}'s Submission
            </h2>

            <p style={{ color: '#1976d2', fontWeight: 'bold' }}>Review Long-Answer Responses</p>

            {/* Render only LONG questions that need grading */}
            {selectedSub.quiz?.questions?.filter(q => q.type === 'LONG').map((q, index) => (
              <div key={q.id} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>Q{index + 1}: {q.text}</p>
                <p style={{ fontSize: '13px', color: '#666', margin: '0 0 5px 0' }}>Student's Answer:</p>
                <div style={{ background: '#fff', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                  {selectedSub.answers?.[q.id] || <span style={{ color: '#999', fontStyle: 'italic' }}>No answer provided.</span>}
                </div>
              </div>
            ))}

            <div style={{ background: '#f4fff8', border: '1px solid #a5d6a7', padding: '20px', borderRadius: '8px', textAlign: 'center', marginTop: '30px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Award Manual Points</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                The student already has <strong>{selectedSub.autoScore}</strong> points from auto-graded questions. Add their essay score below:
              </p>
              <input 
                type="number" 
                value={manualScore} 
                onChange={(e) => setManualScore(e.target.value)}
                style={{ padding: '10px', fontSize: '16px', width: '150px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px' }}>
              <button className="btn-secondary" onClick={() => setSelectedSub(null)}>Cancel</button>
              <button className="btn-primary" style={{ backgroundColor: '#27ae60' }} onClick={handleSaveGrade} disabled={savingGrade}>
                {savingGrade ? 'Saving...' : 'Save Final Grade'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default InstructorDashboard;