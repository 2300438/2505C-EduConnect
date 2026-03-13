import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${id}`);
        const data = await response.json();

        if (response.ok) {
          setCourse(data);
        } else {
          setError(data.message || 'Failed to load course.');
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Error loading course.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <ul className="sidebar-menu">
          <li>
            <button onClick={() => navigate('/instructor-dashboard')}>
              👨‍🏫 Instructor Home
            </button>
          </li>
          <li>
            <button onClick={() => navigate(`/course/edit/${id}`)}>
              ✏️ Edit Course
            </button>
          </li>
          <li>
            <button onClick={() => navigate('/profile')}>
              👤 Profile
            </button>
          </li>
        </ul>
      </aside>

      <main className="main-content">
        {loading ? (
          <p>Loading course...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : !course ? (
          <p>Course not found.</p>
        ) : (
          <>
            <header className="dashboard-header">
              <h2>{course.title}</h2>
              <p>{course.description}</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
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
                <p><strong>Instructor:</strong> {course.instructor?.fullName || user?.fullName || 'Instructor'}</p>
                {course.category && <p><strong>Category:</strong> {course.category}</p>}
                {course.thumbnail && (
                  <div style={{ marginTop: '15px' }}>
                    <img
                      src={course.thumbnail}
                      alt="Course thumbnail"
                      style={{ maxWidth: '250px', borderRadius: '10px' }}
                    />
                  </div>
                )}
              </div>

              <h3>Topics & Lessons</h3>

              {!course.topics || course.topics.length === 0 ? (
                <p>No topics added yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {course.topics.map((topic, topicIndex) => (
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
                        Topic {topicIndex + 1}: {topic.title}
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
                                {topicIndex + 1}.{subIndex + 1} {subtopic.title}
                              </div>

                              {subtopic.videoUrl ? (
                                <div style={{ marginTop: '8px' }}>
                                  <a
                                    href={subtopic.videoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: '#27ae60', textDecoration: 'none', fontWeight: 600 }}
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
          </>
        )}
      </main>
    </div>
  );
};

export default CoursePage;