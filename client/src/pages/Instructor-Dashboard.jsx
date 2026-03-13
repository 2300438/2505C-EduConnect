import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/instructor/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok) {
          setCourses(data);
        } else {
          console.error("Failed to fetch courses:", data);
        }
      } catch (error) {
        console.error("Error fetching instructor courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <ul className="sidebar-menu">
          <li>
            <button onClick={() => navigate('/instructor-dashboard')} className="active">
              👨‍🏫 Instructor Home
            </button>
          </li>
          <li><Link to="/manage-courses">📝 Manage Courses</Link></li>
          <li><button onClick={() => navigate('/profile')}>👤 Profile</button></li>
          <li style={{ marginTop: '40px' }}>
            <button onClick={() => { logout(); navigate('/'); }}>🚪 Log Out</button>
          </li>
        </ul>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <h2>Welcome back, {user?.fullName || 'Professor'}! 🎓</h2>
          <p>Manage your courses and review student analytics.</p>
        </header>

        <section className="enrolled-courses">
          <h3>Your Teaching Modules</h3>

          {loading ? (
            <p>Loading courses...</p>
          ) : (
            <div className="course-grid">
              <div
                className="course-card create-new-card"
                onClick={() => navigate('/new-course')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ fontSize: '3rem', color: '#27ae60' }}>+</div>
                <h4 style={{ color: '#27ae60' }}>Create New Course</h4>
              </div>

              {courses.map((course) => (
                <div className="course-card" key={course.id}>
                  <div className="course-icon">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt="thumb" />
                    ) : (
                      "📚"
                    )}
                  </div>

                  <h4>{course.title}</h4>

                  <p style={{ fontSize: '13px', color: '#666' }}>
                    {course.description?.length > 80
                      ? `${course.description.substring(0, 80)}...`
                      : course.description}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default InstructorDashboard;