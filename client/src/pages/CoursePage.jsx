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
  
  // NEW: State to manage the active tab
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'assessment', or 'discussion'

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch main course details
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data);

        // 2. Fetch enrollment status (and save it to a variable so we can check it immediately)
        let currentStatus = null;
        if (user?.role === 'student') {
          const enrollRes = await api.get(`/courses/${id}/my-enrollment`);
          currentStatus = enrollRes.data?.status || null;
          setEnrollmentStatus(currentStatus);
        }

        // 3. ONLY fetch topics if they are an Instructor OR an Approved Student
        if (user?.role === 'instructor' || currentStatus === 'approved') {
          const topicRes = await api.get(`/courses/${id}/topics`);
          setTopics(topicRes.data);
        } else {
          // If not approved, just leave topics empty so the page still loads!
          setTopics([]); 
        }

      } catch (err) {
        console.error(err);
        setError('Failed to load course.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [id, user]);

  if (loading) return <div className="p-5">Loading Course...</div>;
  if (error) return <div className="p-5 text-danger">{error}</div>;

  // Render logic for the different tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case 'content':
        return (
          <section className="course-syllabus" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>Course Syllabus</h3>
            {topics.length === 0 ? (
              <p className="text-muted">No content has been added to this course yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {topics.map((topic, idx) => (
                  <div key={topic.id} style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #ecf0f1' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#34495e' }}>Topic {idx + 1}: {topic.title}</h4>
                    <ul style={{ listStyle: 'none', paddingLeft: '0', margin: 0 }}>
                      {topic.subtopics?.map(sub => (
                        <li key={sub.id} style={{ margin: '8px 0', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                          <Link 
                            to={`/courses/${id}/subtopic/${sub.id}`} 
                            style={{ color: '#2980b9', textDecoration: 'none', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}
                          >
                            📄 {sub.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      case 'assessment':
        const quizzes = course?.quizzes || []; // Safely extract quizzes from the fetched course
        
        return (
          <section className="course-assessments" style={{ animation: 'fadeIn 0.3s ease-in-out', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Assessments & Quizzes</h3>
            
            {quizzes.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px', color: '#7f8c8d' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📝</span>
                <p>No assessments are currently available for this course.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {quizzes.map((quiz, idx) => (
                  <div key={quiz.id} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ecf0f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '1.2rem' }}>
                        {quiz.title}
                      </h4>
                      {quiz.description && (
                        <p style={{ margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '0.95rem' }}>
                          {quiz.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        <span style={{ color: '#3498db' }}>
                          {quiz.questions?.length || 0} Questions
                        </span>
                        {quiz.requiresPassword ? (
                          <span style={{ color: '#e74c3c' }}>🔒 Password Required</span>
                        ) : (
                          <span style={{ color: '#27ae60' }}>🔓 Open Access</span>
                        )}
                      </div>
                    </div>

                    <div>
                      {/* Navigate the student to the "Take Quiz" page */}
                      <button 
                        className="btn-primary"
                        onClick={() => navigate(`/courses/${id}/quiz/${quiz.id}`)}
                        style={{ padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', border: 'none', backgroundColor: '#9b59b6', color: 'white', fontWeight: 'bold' }}
                      >
                        Take Quiz
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>
        );
     case 'discussion':
        const discussions = course?.discussions || [];

        return (
          <section className="course-discussions" style={{ animation: 'fadeIn 0.3s ease-in-out', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Discussion Boards</h3>
            
            {discussions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px', color: '#7f8c8d' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>💬</span>
                <p>No discussion boards are currently available for this course.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {discussions.map((disc) => (
                  <div key={disc.id} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ecf0f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '1.2rem' }}>{disc.title}</h4>
                      <p style={{ margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '0.95rem' }}>{disc.prompt}</p>
                    </div>
                    <button 
                      className="btn-primary"
                      onClick={() => navigate(`/courses/${id}/discussion/${disc.id}`)}
                      style={{ padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', border: 'none', backgroundColor: '#2ecc71', color: 'white', fontWeight: 'bold' }}
                    >
                      Join Discussion
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* 1. COURSE HEADER */}
      <header className="dashboard-header" style={{ marginBottom: '30px', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '10px' }}>{course.title}</h2>
        <p style={{ fontSize: '1.1rem', color: '#7f8c8d', lineHeight: '1.6' }}>{course.description}</p>
        
        {/* Enrollment Logic */}
        <div style={{ marginTop: '20px' }}>
          {user?.role === 'student' && !enrollmentStatus && (
              <button 
                className="btn-primary" 
                onClick={() => {/* handleEnroll implementation */}}
                style={{ padding: '10px 24px', fontSize: '1rem', fontWeight: 'bold' }}
              >
                Enroll Now
              </button>
          )}
          {user?.role === 'student' && enrollmentStatus === 'pending' && (
              <span style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#f39c12', color: 'white', borderRadius: '6px', fontWeight: 'bold' }}>
                Enrollment Pending
              </span>
          )}
          {user?.role === 'student' && enrollmentStatus === 'approved' && (
              <span style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#27ae60', color: 'white', borderRadius: '6px', fontWeight: 'bold' }}>
                Currently Enrolled
              </span>
          )}
        </div>
      </header>

      {/* 2. TAB NAVIGATION */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px', 
        borderBottom: '2px solid #ecf0f1',
        paddingBottom: '1px' 
      }}>
        <button 
          onClick={() => setActiveTab('content')}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'content' ? '3px solid #3498db' : '3px solid transparent',
            color: activeTab === 'content' ? '#3498db' : '#7f8c8d',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
        >
          📚 Content
        </button>
        <button 
          onClick={() => setActiveTab('assessment')}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'assessment' ? '3px solid #9b59b6' : '3px solid transparent',
            color: activeTab === 'assessment' ? '#9b59b6' : '#7f8c8d',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
        >
          📝 Assessment
        </button>
        <button 
          onClick={() => setActiveTab('discussion')}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'discussion' ? '3px solid #2ecc71' : '3px solid transparent',
            color: activeTab === 'discussion' ? '#2ecc71' : '#7f8c8d',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
        >
          💬 Discussion Board
        </button>
      </div>

      {/* 3. TAB CONTENT RENDERING */}
      <div style={{ minHeight: '400px' }}>
        {renderTabContent()}
      </div>

    </div>
  );
};

export default CoursePage;