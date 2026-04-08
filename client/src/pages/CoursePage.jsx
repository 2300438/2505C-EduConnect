import React, { useEffect, useMemo, useState } from 'react';
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

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'content'); // 'content', 'library', 'assessment', or 'discussion'
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [librarySearch, setLibrarySearch] = useState('');

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

    if (fileType === 'PDF') {
      return {
        backgroundColor: '#fdecea',
        color: '#c0392b',
      };
    }

    if (fileType === 'VIDEO') {
      return {
        backgroundColor: '#eaf2fd',
        color: '#2980b9',
      };
    }

    if (fileType === 'DOC') {
      return {
        backgroundColor: '#eef6ff',
        color: '#1f5fae',
      };
    }

    if (fileType === 'FILE') {
      return {
        backgroundColor: '#eafaf1',
        color: '#27ae60',
      };
    }

    return {
      backgroundColor: '#fdf2e9',
      color: '#e67e22',
    };
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
                          <Link
                            to={`/courses/${id}/subtopic/${sub.id}`}
                            style={{
                              color: '#2980b9',
                              textDecoration: 'none',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
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

      case 'library':
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
                          onClick={() => navigate(`/courses/${id}/subtopic/${sub.id}`)}
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
                                navigate(`/courses/${id}/subtopic/${sub.id}`);
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
            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Assessments & Quizzes</h3>

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
                      <button
                        className="btn-primary"
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
                        Take Quiz
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      }

      case 'discussion': {
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

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <header
        className="dashboard-header"
        style={{
          marginBottom: '30px',
          background: '#fff',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}
      >
        <h2 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '10px' }}>{course.title}</h2>
        <p style={{ fontSize: '1.1rem', color: '#7f8c8d', lineHeight: '1.6' }}>{course.description}</p>

        <div style={{ marginTop: '20px' }}>
          {user?.role === 'student' && !enrollmentStatus && (
            <button
              className="btn-primary"
              onClick={() => { }}
              style={{ padding: '10px 24px', fontSize: '1rem', fontWeight: 'bold' }}
            >
              Enroll Now
            </button>
          )}
          {user?.role === 'student' && enrollmentStatus === 'pending' && (
            <span
              style={{
                display: 'inline-block',
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
            <span
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#27ae60',
                color: 'white',
                borderRadius: '6px',
                fontWeight: 'bold'
              }}
            >
              Currently Enrolled
            </span>
          )}
        </div>
      </header>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          borderBottom: '2px solid #ecf0f1',
          paddingBottom: '1px'
        }}
      >
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
          onClick={() => setActiveTab('library')}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'library' ? '3px solid #f39c12' : '3px solid transparent',
            color: activeTab === 'library' ? '#f39c12' : '#7f8c8d',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
        >
          📁 Library
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

      <div style={{ minHeight: '400px' }}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default CoursePage;