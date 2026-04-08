import React, { useEffect, useMemo, useState } from 'react';
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
  const [myProgress, setMyProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'content'); // 'content', 'library', 'assessment', or 'discussion'
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [librarySearch, setLibrarySearch] = useState('');

  const [viewingResults, setViewingResults] = useState(null);
  const [viewingQuiz, setViewingQuiz] = useState(null);
  const [pendingGrades, setPendingGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [manualScore, setManualScore] = useState(0);
  const [savingGrade, setSavingGrade] = useState(false);

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

        // 2. Fetch enrollment status
        let currentStatus = null;
        if (user?.role === 'student') {
          const enrollRes = await api.get(`/courses/${id}/my-enrollment`);
          currentStatus = enrollRes.data?.status || null;
          setEnrollmentStatus(currentStatus);

          if (currentStatus === 'approved') {
            const progressRes = await api.get(`/courses/${id}/my-progress`);
            setMyProgress(progressRes.data?.progressPercent || 0);
          }
        }

        // 3. Fetch topics only for instructor or approved student
        if (user?.role === 'instructor' || currentStatus === 'approved') {
          const topicRes = await api.get(`/courses/${id}/topics`);
          setTopics(topicRes.data);
        } else {
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
    if (topics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(topics[0].id);
    }
  }, [topics, selectedTopicId]);

  const selectedTopic = useMemo(() => {
    return topics.find((topic) => String(topic.id) === String(selectedTopicId)) || null;
  }, [topics, selectedTopicId]);

  const filteredMaterials = useMemo(() => {
    if (!selectedTopic?.subtopics) return [];

    return [...selectedTopic.subtopics]
      .filter((sub) =>
        sub.title.toLowerCase().includes(librarySearch.toLowerCase())
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [selectedTopic, librarySearch]);

  const libraryStats = useMemo(() => {
    const totalTopics = topics.length;
    const totalMaterials = topics.reduce(
      (count, topic) => count + (topic.subtopics?.length || 0),
      0
    );
    const totalFiles = topics.reduce(
      (count, topic) =>
        count + (topic.subtopics?.filter((sub) => sub.fileUrl)?.length || 0),
      0
    );

    return {
      totalTopics,
      totalMaterials,
      totalFiles,
    };
  }, [topics]);

  const getFileType = (url) => {
    if (!url) return 'PAGE';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.pdf')) return 'PDF';
    if (lowerUrl.endsWith('.mp4')) return 'VIDEO';
    if (lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx')) return 'DOC';
    return 'FILE';
  };

  const getFileBadgeStyle = (url) => {
    const fileType = getFileType(url);
    if (fileType === 'PDF') return { backgroundColor: '#fdecea', color: '#c0392b' };
    if (fileType === 'VIDEO') return { backgroundColor: '#eaf2fd', color: '#2980b9' };
    if (fileType === 'DOC') return { backgroundColor: '#eef6ff', color: '#1f5fae' };
    if (fileType === 'FILE') return { backgroundColor: '#eafaf1', color: '#27ae60' };
    return { backgroundColor: '#fdf2e9', color: '#e67e22' };
  };

  // --- ENROLLMENT LOGIC (From Stash) ---
  useEffect(() => {
    if (user?.role === 'instructor') {
      fetchEnrollments();
      fetchPendingGrades();
    }
  }, [user, id]);

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

  const fetchPendingGrades = async () => {
    try {
      setGradesLoading(true);
      const response = await api.get(`/courses/${id}/pending-grading`);
      setPendingGrades(response.data || []);
    } catch (err) {
      console.error('Error fetching pending grades:', err);
      setPendingGrades([]);
    } finally {
      setGradesLoading(false);
    }
  };

  const openGradingModal = (submission) => {
    setSelectedSub(submission);
    setManualScore(0);
  };

  const handleSaveGrade = async () => {
    setSavingGrade(true);
    try {
      const response = await api.put(
        `/courses/instructor/grade-submission/${selectedSub.id}`,
        {
          manualScore: parseInt(manualScore, 10) || 0,
        }
      );

      if (response.status === 200 || response.data?.message) {
        setPendingGrades((prev) => prev.filter((s) => s.id !== selectedSub.id));
        setSelectedSub(null);
      }
    } catch (err) {
      console.error('Failed to save grade', err);
      alert('An error occurred while saving the grade.');
    } finally {
      setSavingGrade(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'assessment' && user?.role === 'instructor') {
      fetchPendingGrades();
    }
  }, [activeTab, user, id]);



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

  const handleEnroll = async () => {
    try {
      await api.post(`/courses/${id}/enroll`);
      setEnrollmentStatus('pending');
      // Optional: Add a success toast or alert here
      alert("Enrollment request sent! Waiting for instructor approval.");
    } catch (err) {
      console.error("Failed to enroll", err);
      alert(err.response?.data?.message || "Failed to submit enrollment request.");
    }
  };

  const handleOpenSubtopic = async (subtopicId) => {
    try {
      if (user?.role === 'student' && enrollmentStatus === 'approved') {
        const flatSubtopics = topics.flatMap((topic) => topic.subtopics || []);
        const currentIndex = flatSubtopics.findIndex(
          (sub) => String(sub.id) === String(subtopicId)
        );

        if (currentIndex !== -1 && flatSubtopics.length > 0) {
          const progressPercent = Math.round(((currentIndex + 1) / flatSubtopics.length) * 100);

          const res = await api.patch(`/courses/${id}/progress`, {
            progressPercent,
          });

          setMyProgress(res.data?.progressPercent || progressPercent);
        }
      }
    } catch (err) {
      console.error("Failed to update progress:", err);
    } finally {
      navigate(`/courses/${id}/subtopic/${subtopicId}`);
    }
  };


  if (loading) return <div className="p-5">Loading Course...</div>;
  if (error) return <div className="p-5 text-danger">{error}</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'content':
        // --- SECURITY CHECK FOR CONTENT ---
        if (user?.role !== 'instructor' && enrollmentStatus !== 'approved') {
          return (
            <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '1px dashed #bdc3c7' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}>🔒</span>
              <h3 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>Course Locked</h3>
              <p style={{ color: '#7f8c8d', fontSize: '1.1rem', margin: 0 }}>Please enroll and wait for instructor approval to access the learning materials.</p>
            </div>
          );
        }

        return (
          <section className="course-syllabus" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>Course Syllabus</h3>
            {topics.length === 0 ? (
              <p className="text-muted">No content has been added to this course yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {topics.map((topic, idx) => (
                  <div
                    key={topic.id}
                    style={{
                      background: '#fff',
                      padding: '20px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      border: '1px solid #ecf0f1'
                    }}
                  >
                    <h4 style={{ margin: '0 0 10px 0', color: '#34495e' }}>
                      Topic {idx + 1}: {topic.title}
                    </h4>
                    <ul style={{ listStyle: 'none', paddingLeft: '0', margin: 0 }}>
                      {topic.subtopics?.map((sub) => (
                        <li
                          key={sub.id}
                          style={{
                            margin: '8px 0',
                            padding: '10px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px'
                          }}
                        >
                          <button
                            onClick={() => handleOpenSubtopic(sub.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: '#2980b9',
                              textDecoration: 'none',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            📄 {sub.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        );

      case 'library':
        // --- SECURITY CHECK FOR LIBRARY ---
        if (user?.role !== 'instructor' && enrollmentStatus !== 'approved') {
          return <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>You must be enrolled to view the library.</div>;
        }

        return (
          <section
            className="course-library"
            style={{
              animation: 'fadeIn 0.3s ease-in-out',
              display: 'grid',
              gap: '20px'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '15px'
              }}
            >
              <div
                style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  border: '1px solid #ecf0f1'
                }}
              >
                <p style={{ margin: '0 0 8px 0', color: '#7f8c8d', fontSize: '0.9rem' }}>Topics</p>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>{libraryStats.totalTopics}</h3>
              </div>

              <div
                style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  border: '1px solid #ecf0f1'
                }}
              >
                <p style={{ margin: '0 0 8px 0', color: '#7f8c8d', fontSize: '0.9rem' }}>Materials</p>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>{libraryStats.totalMaterials}</h3>
              </div>

              <div
                style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  border: '1px solid #ecf0f1'
                }}
              >
                <p style={{ margin: '0 0 8px 0', color: '#7f8c8d', fontSize: '0.9rem' }}>Files Available</p>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>{libraryStats.totalFiles}</h3>
              </div>
            </div>

            <div
              style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                border: '1px solid #ecf0f1'
              }}
            >
              <input
                type="text"
                placeholder="Search materials in this topic..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #dfe6e9',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '280px 1fr',
                gap: '20px',
                alignItems: 'start'
              }}
            >
              <div
                style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  border: '1px solid #ecf0f1'
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#2c3e50' }}>Topics</h3>

                <div style={{ display: 'grid', gap: '10px' }}>
                  {topics.length === 0 ? (
                    <p className="text-muted" style={{ margin: 0 }}>No topics available yet.</p>
                  ) : (
                    topics.map((topic) => {
                      const topicMaterialCount = topic.subtopics?.length || 0;
                      const isActive = String(topic.id) === String(selectedTopicId);

                      return (
                        <button
                          key={topic.id}
                          onClick={() => setSelectedTopicId(topic.id)}
                          style={{
                            textAlign: 'left',
                            padding: '14px',
                            borderRadius: '8px',
                            border: isActive ? '1px solid #f39c12' : '1px solid #ecf0f1',
                            background: isActive ? '#fff8ef' : '#f8f9fa',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                            {topic.title}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                            {topicMaterialCount} material{topicMaterialCount !== 1 ? 's' : ''}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div
                style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  border: '1px solid #ecf0f1'
                }}
              >
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
                    {selectedTopic ? selectedTopic.title : 'Library Materials'}
                  </h3>
                  <p style={{ margin: 0, color: '#7f8c8d' }}>
                    Browse and open learning resources for this topic.
                  </p>
                </div>

                {!selectedTopic ? (
                  <div
                    style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#7f8c8d'
                    }}
                  >
                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>📚</span>
                    <p style={{ margin: 0 }}>Select a topic to start browsing materials.</p>
                  </div>
                ) : filteredMaterials.length === 0 ? (
                  <div
                    style={{
                      padding: '30px',
                      textAlign: 'center',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      color: '#7f8c8d'
                    }}
                  >
                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>📂</span>
                    <p style={{ margin: 0 }}>No materials found for this search.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    {filteredMaterials.map((sub) => {
                      const badgeStyle = getFileBadgeStyle(sub.fileUrl);

                      return (
                        <div
                          key={sub.id}
                          onClick={() => handleOpenSubtopic(sub.id)}
                          style={{
                            padding: '16px',
                            borderRadius: '8px',
                            background: '#f8f9fa',
                            border: '1px solid #ecf0f1',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '14px',
                            flexWrap: 'wrap',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '220px' }}>
                            <div
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                marginBottom: '8px',
                                ...badgeStyle
                              }}
                            >
                              {getFileType(sub.fileUrl)}
                            </div>

                            <h4 style={{ margin: '0 0 6px 0', color: '#2c3e50' }}>{sub.title}</h4>

                            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.92rem' }}>
                              {sub.fileUrl
                                ? 'This material has an uploaded resource attached.'
                                : 'This material can still be opened as a lesson page.'}
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSubtopic(sub.id);
                              }}
                              style={{
                                padding: '10px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                border: 'none',
                                backgroundColor: '#3498db',
                                color: 'white',
                                fontWeight: '600'
                              }}
                            >
                              Open
                            </button>

                            {sub.fileUrl && (
                              <a
                                href={sub.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  padding: '10px 16px',
                                  borderRadius: '6px',
                                  textDecoration: 'none',
                                  backgroundColor: '#ecf0f1',
                                  color: '#2c3e50',
                                  fontWeight: '600'
                                }}
                              >
                                View File
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case 'assessment': {
        // --- SECURITY CHECK FOR ASSESSMENT ---
        if (user?.role !== 'instructor' && enrollmentStatus !== 'approved') {
          return <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>You must be enrolled to view assessments.</div>;
        }

        const quizzes = course?.quizzes || [];

        return (
          <section
            className="course-assessments"
            style={{
              animation: 'fadeIn 0.3s ease-in-out',
              background: '#fff',
              padding: '30px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#2c3e50', margin: 0 }}>Assessments & Quizzes</h3>
              {user?.role === 'instructor' && (
                <button
                  onClick={() => navigate(`/course/edit/${id}`, { state: { activeTab: 'grades' } })}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f39c12',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  📊 View Student Grades
                </button>
              )}
            </div>

            {user?.role === 'instructor' && (
              <div style={{ marginBottom: '30px' }}>
                <h4
                  style={{
                    color: '#e67e22',
                    borderBottom: '2px solid #f39c12',
                    paddingBottom: '8px',
                    marginBottom: '15px'
                  }}
                >
                  Assessments Needing Review
                </h4>

                {gradesLoading ? (
                  <p>Loading pending submissions...</p>
                ) : pendingGrades.length === 0 ? (
                  <div
                    style={{
                      background: '#f4fff8',
                      padding: '20px',
                      borderRadius: '10px',
                      border: '1px solid #a5d6a7',
                      color: '#27ae60'
                    }}
                  >
                    ✅ No manual grading is needed for this course right now.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                    {pendingGrades.map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          background: '#fffaf3',
                          padding: '18px',
                          borderRadius: '8px',
                          border: '1px solid #f8d9a0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '15px'
                        }}
                      >
                        <div>
                          <h4 style={{ margin: '0 0 6px 0', color: '#333' }}>
                            {sub.quiz?.title || 'Quiz'}
                          </h4>
                          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>
                            <strong>Student:</strong> {sub.student?.fullName}
                          </p>
                          <span
                            style={{
                              fontSize: '12px',
                              background: '#fff3e0',
                              color: '#e67e22',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontWeight: 'bold'
                            }}
                          >
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
              </div>
            )}

            {quizzes.length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  color: '#7f8c8d'
                }}
              >
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📝</span>
                <p>No assessments are currently available for this course.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid #ecf0f1',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4
                        onClick={() => {
                          if (user?.role === 'instructor') setViewingQuiz(quiz);
                        }}
                        style={{
                          margin: '0 0 5px 0',
                          color: user?.role === 'instructor' ? '#3498db' : '#2c3e50',
                          fontSize: '1.2rem',
                          cursor: user?.role === 'instructor' ? 'pointer' : 'default',
                          textDecoration: user?.role === 'instructor' ? 'underline' : 'none'
                        }}
                      >
                        {quiz.title} {user?.role === 'instructor' && '👁️'}
                      </h4>

                      {quiz.description && (
                        <p style={{ margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '0.95rem' }}>
                          {quiz.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        <span style={{ color: '#3498db' }}>{quiz.questions?.length || 0} Questions</span>
                        {quiz.requiresPassword ? (
                          <span style={{ color: '#e74c3c' }}>🔒 Password Required</span>
                        ) : (
                          <span style={{ color: '#27ae60' }}>🔓 Open Access</span>
                        )}
                      </div>
                    </div>

                    {user?.role === 'student' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {quiz.pastResults && quiz.pastResults.length > 0 && (
                          <button
                            onClick={() =>
                              setViewingResults({
                                title: quiz.title,
                                attempts: quiz.pastResults
                              })
                            }
                            style={{
                              padding: '10px 20px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: '2px solid #2ecc71',
                              backgroundColor: '#f4fff8',
                              color: '#2ecc71',
                              fontWeight: 'bold'
                            }}
                          >
                            View Past Results
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/courses/${id}/quiz/${quiz.id}`)}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: 'none',
                            backgroundColor: '#9b59b6',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        >
                          {quiz.pastResults && quiz.pastResults.length > 0 ? 'Retake Quiz' : 'Take Quiz'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      }

      case 'discussion': {
        // --- SECURITY CHECK FOR DISCUSSION ---
        if (user?.role !== 'instructor' && enrollmentStatus !== 'approved') {
          return <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>You must be enrolled to view discussion boards.</div>;
        }

        const discussions = course?.discussions || [];

        return (
          <section
            className="course-discussions"
            style={{
              animation: 'fadeIn 0.3s ease-in-out',
              background: '#fff',
              padding: '30px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Discussion Boards</h3>

            {discussions.length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  color: '#7f8c8d'
                }}
              >
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>💬</span>
                <p>No discussion boards are currently available for this course.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {discussions.map((disc) => (
                  <div
                    key={disc.id}
                    style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid #ecf0f1',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '1.2rem' }}>
                        {disc.title}
                      </h4>
                      <p style={{ margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '0.95rem' }}>
                        {disc.prompt}
                      </p>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => navigate(`/courses/${id}/discussion/${disc.id}`)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: '#2ecc71',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      Join Discussion
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      }
      case 'students': {
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
      }
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
          {user?.role === 'student' && !enrollmentStatus && (
            <button
              className="btn-primary"
              onClick={handleEnroll}
              style={{ padding: '10px 24px', fontSize: '1rem', fontWeight: 'bold' }}
            >
              Enroll Now
            </button>
          )}

          {user?.role === 'student' && enrollmentStatus === 'pending' && (
            <span
              style={{
                padding: '8px 16px',
                backgroundColor: '#f39c12',
                color: 'white',
                borderRadius: '6px',
                fontWeight: 'bold'
              }}
            >
              Enrollment Pending
            </span>
          )}

          {user?.role === 'student' && enrollmentStatus === 'approved' && (
            <>
              <span
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  display: 'inline-block'
                }}
              >
                Currently Enrolled
              </span>

              <div style={{ marginTop: '16px', maxWidth: '420px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600', color: '#2c3e50' }}>Your Progress</span>
                  <span style={{ fontWeight: '600', color: '#27ae60' }}>{myProgress}%</span>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: '12px',
                    backgroundColor: '#ecf0f1',
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${myProgress}%`,
                      height: '100%',
                      backgroundColor: '#27ae60',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 1. Define who gets full access */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #ecf0f1', paddingBottom: '1px' }}>
        
        {/* Only show learning tabs if Instructor OR Approved Student */}
        {(user?.role === 'instructor' || enrollmentStatus === 'approved') && (
          <>
            <button onClick={() => setActiveTab('content')} style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: '600', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'content' ? '3px solid #3498db' : '3px solid transparent', color: activeTab === 'content' ? '#3498db' : '#7f8c8d', cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none' }}>
              📚 Content
            </button>
            <button onClick={() => setActiveTab('library')} style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: '600', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'library' ? '3px solid #f39c12' : '3px solid transparent', color: activeTab === 'library' ? '#f39c12' : '#7f8c8d', cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none' }}>
              📁 Library
            </button>
            
            {/* Assessment Tab with Dynamic Badge */}
            <button onClick={() => setActiveTab('assessment')} style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: '600', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'assessment' ? '3px solid #9b59b6' : '3px solid transparent', color: activeTab === 'assessment' ? '#9b59b6' : '#7f8c8d', cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📝 Assessment
              {user?.role === 'instructor' && pendingGrades.length > 0 && (
                <span style={{ background: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {pendingGrades.length}
                </span>
              )}
            </button>

            <button onClick={() => setActiveTab('discussion')} style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: '600', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'discussion' ? '3px solid #2ecc71' : '3px solid transparent', color: activeTab === 'discussion' ? '#2ecc71' : '#7f8c8d', cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none' }}>
              💬 Discussion Board
            </button>
          </>
        )}

        {/* Students Tab with Dynamic Badge */}
        {user?.role === 'instructor' && (
          <button onClick={() => setActiveTab('students')} style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: '600', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'students' ? '3px solid #e67e22' : '3px solid transparent', color: activeTab === 'students' ? '#e67e22' : '#7f8c8d', cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👥 Students
            {enrollments.filter(e => e.status === 'pending').length > 0 && (
              <span style={{ background: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {enrollments.filter(e => e.status === 'pending').length}
              </span>
            )}
          </button>
        )}
      </div>

      <div style={{ minHeight: '400px' }}>
        {renderTabContent()}
      </div>

      {/* Pop-up Modals for Quizzes and Results */}
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
                      return (
                        <li key={oIdx} style={{ padding: '8px 12px', marginBottom: '6px', borderRadius: '4px', backgroundColor: isCorrect ? '#e8f8f5' : '#fff', border: isCorrect ? '1px solid #2ecc71' : '1px solid #e0e0e0', color: isCorrect ? '#27ae60' : '#2c3e50', fontWeight: isCorrect ? 'bold' : 'normal' }}>
                          {opt} {isCorrect && ' ✓ (Correct)'}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
            <div style={{ textAlign: 'right', marginTop: '30px' }}>
              <button onClick={() => setViewingQuiz(null)} style={{ padding: '10px 24px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Close Preview</button>
            </div>
          </div>
        </div>
      )}

      {viewingResults && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '700px',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>
              Past Results — {viewingResults.title}
            </h3>

            {viewingResults.attempts.length === 0 ? (
              <p style={{ color: '#7f8c8d' }}>No past attempts found.</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px', marginTop: '20px' }}>
                {viewingResults.attempts.map((attempt, index) => (
                  <div
                    key={attempt.id}
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #ecf0f1',
                      borderRadius: '8px',
                      padding: '18px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        gap: '15px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <strong style={{ color: '#2c3e50' }}>
                        Attempt {viewingResults.attempts.length - index}
                      </strong>
                      <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                        {new Date(attempt.submittedAt).toLocaleString()}
                      </span>
                    </div>

                    {attempt.isGraded ? (
                      <>
                        <p style={{ margin: '6px 0', color: '#34495e' }}>
                          Auto Score: <strong>{attempt.autoScore}</strong>
                        </p>
                        <p style={{ margin: '6px 0', color: '#34495e' }}>
                          Essay Score: <strong>{attempt.manualScore}</strong>
                        </p>
                        <p
                          style={{
                            margin: '10px 0 0 0',
                            color: '#27ae60',
                            fontWeight: 'bold',
                            fontSize: '1.05rem'
                          }}
                        >
                          Final Score: {attempt.totalScore}%
                        </p>
                      </>
                    ) : (
                      <>
                        <p style={{ margin: '6px 0', color: '#34495e' }}>
                          Auto Score So Far: <strong>{attempt.autoScore}</strong>
                        </p>
                        <p style={{ margin: '10px 0 0 0', color: '#f39c12', fontWeight: 'bold' }}>
                          Pending instructor review
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '25px', textAlign: 'right' }}>
              <button
                onClick={() => setViewingResults(null)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#ecf0f1',
                  color: '#2c3e50',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSub && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
          >
            <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginTop: 0 }}>
              Grading: {selectedSub.student?.fullName}'s Submission
            </h2>

            <p style={{ color: '#1976d2', fontWeight: 'bold' }}>Review Long-Answer Responses</p>

            {selectedSub.quiz?.questions?.filter((q) => q.type === 'LONG').map((q, index) => (
              <div
                key={q.id}
                style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}
              >
                <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>
                  Q{index + 1}: {q.text}
                </p>
                <p style={{ fontSize: '13px', color: '#666', margin: '0 0 5px 0' }}>
                  Student's Answer:
                </p>
                <div
                  style={{
                    background: '#fff',
                    padding: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {selectedSub.answers?.[q.id] || (
                    <span style={{ color: '#999', fontStyle: 'italic' }}>No answer provided.</span>
                  )}
                </div>
              </div>
            ))}

            <div
              style={{
                background: '#f4fff8',
                border: '1px solid #a5d6a7',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center',
                marginTop: '30px'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0' }}>Award Manual Points</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                The student already has <strong>{selectedSub.autoScore}</strong> points from auto-graded questions.
                Add essay marks below.
              </p>

              <input
                type="number"
                value={manualScore}
                onChange={(e) => setManualScore(e.target.value)}
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  width: '150px',
                  textAlign: 'center',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />

              <p style={{ marginTop: '12px', fontWeight: 'bold', color: '#27ae60' }}>
                Final score preview: {(selectedSub.autoScore || 0) + (parseInt(manualScore, 10) || 0)}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px' }}>
              <button className="btn-secondary" onClick={() => setSelectedSub(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ backgroundColor: '#27ae60' }}
                onClick={handleSaveGrade}
                disabled={savingGrade}
              >
                {savingGrade ? 'Saving...' : 'Save Final Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default CoursePage;