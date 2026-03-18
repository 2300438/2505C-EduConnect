import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/dashboard.css';

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [enrollmentMessage, setEnrollmentMessage] = useState('');


  const isInstructor = user?.role === 'instructor' && course && course.instructorId === user.id;
  const canViewTopics = course && (isInstructor || enrollmentStatus === 'approved');
  const getThumbnailSrc = (thumbnail) => {
    if (!thumbnail) return null;

    if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) {
      return thumbnail;
    }

    return `http://localhost:3001${thumbnail}`;
  };

  const fetchTopics = async (courseId) => {
    try {
      setTopicsLoading(true);
      const response = await api.get(`/courses/${courseId}/topics`);
      setTopics(response.data);
    } catch (err) {
      console.error("Error fetching topics:", err);
    } finally {
      setTopicsLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrollmentMessage("");
      await api.post(`/courses/${id}/enroll`);
      setEnrollmentStatus("pending");
      setEnrollmentMessage("Enrollment request submitted successfully.");
    } catch (err) {
      console.error("Error enrolling:", err);
      setEnrollmentMessage(err.response?.data?.message || "Failed to enroll.");
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError('');
        setEnrollmentMessage('');

        const response = await api.get(`/courses/${id}`);
        const data = response.data;

        setCourse(data);

        const isCourseInstructor =
          user?.role === 'instructor' && data?.instructorId === user?.id;

        if (isCourseInstructor) {
          await fetchTopics(id);
        } else if (user?.role === 'student') {
          const enrollmentRes = await api.get(`/courses/${id}/my-enrollment`);
          const status = enrollmentRes.data?.status || null;

          setEnrollmentStatus(status);

          if (status === 'approved') {
            await fetchTopics(id);
          }
        }

      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err.response?.data?.message || 'Failed to load course.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, user]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <main className="main-content">
          <p>Loading course...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <main className="main-content">
          <p style={{ color: 'red' }}>{error}</p>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="dashboard-container">
        <main className="main-content">
          <p>Course not found.</p>
        </main>
      </div>
    );
  }

  return (

      <main className="main-content">
        <header className="dashboard-header">
          <h2>{course.title || 'Untitled Course'}</h2>
          <p>{course.description || 'No description available.'}</p>

          {enrollmentMessage && (
            <p style={{ marginTop: '10px', color: '#1976d2', fontWeight: 600 }}>
              {enrollmentMessage}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>

            {isInstructor && (
              <>
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/course/edit/${course.id}`)}
                >
                  Edit Course
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => navigate('/instructor-dashboard')}
                >
                  Back to Dashboard
                </button>
              </>
            )}

            {!isInstructor && user?.role === 'student' && enrollmentStatus === null && (
              <button className="btn-primary" onClick={handleEnroll}>
                Enroll
              </button>
            )}

            {!isInstructor && user?.role === 'student' && enrollmentStatus === 'pending' && (
              <button className="btn-secondary" disabled>
                Pending Approval
              </button>
            )}

            {!isInstructor && user?.role === 'student' && enrollmentStatus === 'approved' && (
              <button className="btn-primary" disabled>
                Approved
              </button>
            )}

            {!isInstructor && user?.role === 'student' && enrollmentStatus === 'rejected' && (
              <button className="btn-secondary" disabled>
                Enrollment Rejected
              </button>
            )}

            {!user && (
              <button className="btn-primary" onClick={() => navigate('/login')}>
                Login to Enroll
              </button>
            )}

          </div>
        </header>

        <section className="enrolled-courses">
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '20px'
            }}
          >
            <h3 style={{ marginBottom: '10px' }}>Course Information</h3>

            <p>
              <strong>Instructor:</strong>{' '}
              {course.instructor?.fullName || user?.fullName || 'Instructor'}
            </p>

            {course.category && (
              <p>
                <strong>Category:</strong> {course.category}
              </p>
            )}

            {course.thumbnail && (
              <div style={{ marginTop: '15px' }}>
                <img
                  src={getThumbnailSrc(course.thumbnail)}
                  alt="Course thumbnail"
                  style={{ maxWidth: '250px', borderRadius: '10px' }}
                />
              </div>
            )}
          </div>

          <h3>Topics & Lessons</h3>

          {!topics || topics.length === 0 ? (
            <p>No topics added yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {topics.map((topic, topicIndex) => (
                <div
                  key={topic.id || topicIndex}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  <h4 style={{ marginBottom: '12px', color: '#1976d2' }}>
                    Topic {topicIndex + 1}: {topic.title || 'Untitled Topic'}
                  </h4>

                  {!topic.subtopics || topic.subtopics.length === 0 ? (
                    <p style={{ color: '#666' }}>No subtopics yet.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {topic.subtopics.map((subtopic, subIndex) => (
                        <div
                          key={subtopic.id || subIndex}
                          style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '10px',
                            padding: '14px',
                            background: '#fafafa'
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>
                            {topicIndex + 1}.{subIndex + 1}{' '}
                            {subtopic.title || 'Untitled Subtopic'}
                          </div>

                          {subtopic.fileUrl ? (
                            <div style={{ marginTop: '8px' }}>
                              <a
                                href={subtopic.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: '#27ae60',
                                  textDecoration: 'none',
                                  fontWeight: 600
                                }}
                              >
                                Open Lesson File
                              </a>
                            </div>
                          ) : (
                            <div style={{ marginTop: '8px', color: '#888' }}>
                              No file attached
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
  );
};

export default CoursePage;