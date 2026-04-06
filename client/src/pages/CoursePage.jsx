import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topics, setTopics] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data);

        if (user?.role === 'student') {
          const enrollRes = await api.get(`/courses/${id}/my-enrollment`);
          setEnrollmentStatus(enrollRes.data?.status || null);
        }

        // Fetch topics for the summary list
        const topicRes = await api.get(`/courses/${id}/topics`);
        setTopics(topicRes.data);
      } catch (err) {
        setError('Failed to load course.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [id, user]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <header className="dashboard-header">
        <h2>{course.title}</h2>
        <p>{course.description}</p>
        
        {/* Enrollment Logic (Kept from your original code) */}
        {user?.role === 'student' && !enrollmentStatus && (
            <button className="btn-primary" onClick={() => {/* handleEnroll */}}>Enroll Now</button>
        )}
      </header>

      <section style={{ marginTop: '20px' }}>
        <h3>Course Syllabus</h3>
        <div style={{ display: 'grid', gap: '15px' }}>
          {topics.map((topic, idx) => (
            <div key={topic.id} style={{ background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <h4>{idx + 1}. {topic.title}</h4>
              <ul style={{ listStyle: 'none', paddingLeft: '10px' }}>
                {topic.subtopics?.map(sub => (
                  <li key={sub.id} style={{ margin: '5px 0' }}>
                    {/* These links navigate to the content viewer */}
                    <Link to={`/courses/${id}/subtopic/${sub.id}`} style={{ color: '#1976d2', textDecoration: 'none' }}>
                       ▶ {sub.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CoursePage;