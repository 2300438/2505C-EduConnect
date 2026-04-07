import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topics, setTopics] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [viewingResult, setViewingResult] = useState(null);

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'content');
  const [viewingQuiz, setViewingQuiz] = useState(null);

  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    if (activeTab === 'students' && user?.role === 'instructor') {
      fetchEnrollments();
    }
  }, [activeTab]);

  const fetchEnrollments = async () => {
    try {
      setEnrollmentsLoading(true);
      const res = await api.get(`/courses/${id}/all-enrollments`);
      setEnrollments(res.data);
    } catch (err) {
      console.error("Failed to fetch enrollments", err);
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const handleApproveStudent = async (enrollmentId) => {
    try {
      await api.put(`/courses/enrollments/${enrollmentId}/approve`);
      fetchEnrollments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectStudent = async (enrollmentId) => {
    try {
      await api.put(`/courses/enrollments/${enrollmentId}/reject`);
      fetchEnrollments();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-5">Loading Course...</div>;
  if (error) return <div className="p-5 text-danger">{error}</div>;

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
                          <Link to={`/courses/${id}/subtopic/${sub.id}`} style={{ color: '#2980b9', textDecoration: 'none', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        const quizzes = course?.quizzes || [];
        return (
          <section className="course-assessments" style={{ animation: 'fadeIn 0.3s ease-in-out', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#2c3e50', margin: 0 }}>Assessments & Quizzes</h3>
              {user?.role === 'instructor' && (
                <button 
                  onClick={() => navigate(`/course/edit/${id}`, { state: { activeTab: 'grades' } })} 
                  style={{ padding: '8px 16px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  📊 View Student Grades
                </button>
              )}
            </div>

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
                      <h4
                        onClick={() => { if (user?.role === 'instructor') setViewingQuiz(quiz); }}
                        style={{ margin: '0 0 5px 0', color: user?.role === 'instructor' ? '#3498db' : '#2c3e50', fontSize: '1.2rem', cursor: user?.role === 'instructor' ? 'pointer' : 'default', textDecoration: user?.role === 'instructor' ? 'underline' : 'none' }}
                      >
                        {quiz.title} {user?.role === 'instructor' && '👁️'}
                      </h4>
                      {quiz.description && <p style={{ margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '0.95rem' }}>{quiz.description}</p>}
                      <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        <span style={{ color: '#3498db' }}>{quiz.questions?.length || 0} Questions</span>
                        {quiz.requiresPassword ? <span style={{ color: '#e74c3c' }}>🔒 Password Required</span> : <span style={{ color: '#27ae60' }}>🔓 Open Access</span>}
                      </div>
                    </div>
                    {user?.role === 'student' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {quiz.highestScore !== undefined && quiz.highestScore !== null && (
                          <button onClick={() => setViewingResult({ title: quiz.title, score: quiz.highestScore })} style={{ padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', border: '2px solid #2ecc71', backgroundColor: '#f4fff8', color: '#2ecc71', fontWeight: 'bold' }}>
                            View Past Result
                          </button>
                        )}
                        <button onClick={() => navigate(`/courses/${id}/quiz/${quiz.id}`)} style={{ padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', border: 'none', backgroundColor: '#9b59b6', color: 'white', fontWeight: 'bold' }}>
                          {quiz.highestScore !== undefined && quiz.highestScore !== null ? 'Retake Quiz' : 'Take Quiz'}
                        </button>
                      </div>
                    )}
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
      <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Discussion Boards</h3>
      
      {discussions.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px', color: '#7f8c8d' }}>
          <p>No discussion boards have been created for this course yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {discussions.map((disc) => (
            <div key={disc.id} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ecf0f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{disc.title}</h4>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>{disc.prompt?.substring(0, 100)}...</p>
              </div>
              <button
                onClick={() => navigate(`/courses/${id}/discussion/${disc.id}`)}
                style={{ padding: '10px 20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Join Discussion
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
      case 'students':
        const filtered = enrollments.filter(e =>
          e.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const pending = filtered.filter(e => e.status === 'pending');
        const approved = filtered.filter(e => e.status === 'approved');

        return (
          <section className="course-students" style={{ animation: 'fadeIn 0.3s ease-in-out', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#2c3e50', margin: 0 }}>Course Roster</h3>
              <input type="text" placeholder="🔍 Search name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', width: '250px' }} />
            </div>

            {enrollmentsLoading ? (
              <p>Loading students...</p>
            ) : (
              <>
                {pending.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ color: '#f39c12', borderBottom: '2px solid #f39c12', paddingBottom: '5px' }}>Pending Approvals ({pending.length})</h4>
                    <div style={{ display: 'grid', gap: '10px', marginTop: '15px' }}>
                      {pending.map(req => (
                        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fdfbf7', padding: '15px', borderRadius: '6px', border: '1px solid #fdebd0' }}>
                          <div>
                            <strong style={{ display: 'block', color: '#333' }}>{req.user?.fullName}</strong>
                            <span style={{ fontSize: '0.9rem', color: '#666' }}>{req.user?.email}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleApproveStudent(req.id)} style={{ padding: '6px 12px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
                            <button onClick={() => handleRejectStudent(req.id)} style={{ padding: '6px 12px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 style={{ color: '#27ae60', borderBottom: '2px solid #27ae60', paddingBottom: '5px' }}>Enrolled Students ({approved.length})</h4>
                  {approved.length === 0 ? (
                     <p style={{ color: '#7f8c8d', marginTop: '15px' }}>No enrolled students match your search.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px', marginTop: '15px' }}>
                      {approved.map(req => (
                        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '15px', borderRadius: '6px', border: '1px solid #eee' }}>
                          <div>
                            <strong style={{ display: 'block', color: '#333' }}>{req.user?.fullName}</strong>
                            <span style={{ fontSize: '0.9rem', color: '#666' }}>{req.user?.email}</span>
                          </div>
                          {/* REMOVE BUTTON DELETED FROM HERE: View only! */}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <header className="dashboard-header" style={{ marginBottom: '30px', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '10px' }}>{course?.title}</h2>
            <p style={{ fontSize: '1.1rem', color: '#7f8c8d', lineHeight: '1.6' }}>{course?.description}</p>
          </div>

          {/* NEW: General Edit Course Button (Only visible to Instructors) */}
          {user?.role === 'instructor' && (
            <button 
              onClick={() => navigate(`/course/edit/${id}`)} 
              style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              ✏️ Edit Course
            </button>
          )}
        </div>

        {/* Enrollment Logic (Only visible to Students) */}
        <div style={{ marginTop: '20px' }}>
          {user?.role === 'student' && !enrollmentStatus && <button className="btn-primary" onClick={() => {/* handleEnroll */ }} style={{ padding: '10px 24px', fontSize: '1rem', fontWeight: 'bold' }}>Enroll Now</button>}
          {user?.role === 'student' && enrollmentStatus === 'pending' && <span style={{ padding: '8px 16px', backgroundColor: '#f39c12', color: 'white', borderRadius: '6px', fontWeight: 'bold' }}>Enrollment Pending</span>}
          {user?.role === 'student' && enrollmentStatus === 'approved' && <span style={{ padding: '8px 16px', backgroundColor: '#27ae60', color: 'white', borderRadius: '6px', fontWeight: 'bold' }}>Currently Enrolled</span>}
        </div>
      </header>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #ecf0f1', paddingBottom: '1px' }}>
        <button onClick={() => setActiveTab('content')} style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: '600', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'content' ? '3px solid #3498db' : '3px solid transparent', color: activeTab === 'content' ? '#3498db' : '#7f8c8d', cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none' }}>📚 Content</button>
        <button onClick={() => setActiveTab('assessment')} style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: '600', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'assessment' ? '3px solid #9b59b6' : '3px solid transparent', color: activeTab === 'assessment' ? '#9b59b6' : '#7f8c8d', cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none' }}>📝 Assessment</button>
        <button onClick={() => setActiveTab('discussion')} style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: '600', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'discussion' ? '3px solid #2ecc71' : '3px solid transparent', color: activeTab === 'discussion' ? '#2ecc71' : '#7f8c8d', cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none' }}>💬 Discussion Board</button>
        {user?.role === 'instructor' && (
          <button onClick={() => setActiveTab('students')} style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: '600', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'students' ? '3px solid #e67e22' : '3px solid transparent', color: activeTab === 'students' ? '#e67e22' : '#7f8c8d', cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none' }}>👥 Students</button>
        )}
      </div>

      <div style={{ minHeight: '400px' }}>{renderTabContent()}</div>

      {viewingQuiz && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginTop: 0, color: '#2c3e50' }}>{viewingQuiz.title} Preview</h2>
            <hr style={{ margin: '20px 0', borderTop: '1px solid #ecf0f1' }} />
            {viewingQuiz.questions?.map((q, i) => (
              <div key={i} style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <strong style={{ fontSize: '1.1rem', color: '#34495e' }}>Q{i + 1}: {q.text}</strong>
                {q.type === 'MCQ' && (
                  <ul style={{ listStyleType: 'none', paddingLeft: 0, marginTop: '12px' }}>
                    {q.options?.map((opt, oIdx) => {
                      const isCorrect = q.correctAnswer === String(oIdx);
                      return <li key={oIdx} style={{ padding: '8px 12px', marginBottom: '6px', borderRadius: '4px', backgroundColor: isCorrect ? '#e8f8f5' : '#fff', border: isCorrect ? '1px solid #2ecc71' : '1px solid #e0e0e0', color: isCorrect ? '#27ae60' : '#2c3e50', fontWeight: isCorrect ? 'bold' : 'normal' }}>{opt} {isCorrect && ' ✓ (Correct)'}</li>
                    })}
                  </ul>
                )}
              </div>
            ))}
            <div style={{ textAlign: 'right', marginTop: '30px' }}><button onClick={() => setViewingQuiz(null)} style={{ padding: '10px 24px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Close Preview</button></div>
          </div>
        </div>
      )}

      {viewingResult && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ color: '#2980b9', margin: '0 0 10px 0', fontSize: '1.5rem' }}>{viewingResult.title}</h3>
            <hr style={{ margin: '15px 0', borderTop: '1px solid #ecf0f1' }} />
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Your Highest Recorded Score:</p>
            <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '120px', height: '120px', borderRadius: '50%', border: viewingResult.score >= 50 ? '4px solid #2ecc71' : '4px solid #e74c3c', marginBottom: '25px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: viewingResult.score >= 50 ? '#27ae60' : '#c0392b' }}>{viewingResult.score}%</span>
            </div>
            <div>
              <button onClick={() => setViewingResult(null)} style={{ padding: '12px 24px', backgroundColor: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '1rem' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePage;