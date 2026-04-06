import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams, Outlet } from 'react-router-dom';
import api from '../services/api'; // Ensure this points to your axios instance
import '../styles/dashboard.css';

const SidebarLayout = () => {
    const { id } = useParams(); // 'id' from /courses/:id
    const location = useLocation();
    const [topics, setTopics] = useState([]);

    // Only show sidebar if we have a course ID in the URL
    const isViewingCourse = location.pathname.includes('/courses/') && id;

    useEffect(() => {
        if (isViewingCourse) {
            const fetchSidebarTopics = async () => {
                try {
                    const response = await api.get(`/courses/${id}/topics`);
                    setTopics(response.data);
                } catch (err) {
                    console.error("Sidebar fetch error:", err);
                }
            };
            fetchSidebarTopics();
        }
    }, [id, isViewingCourse]);

    return (
        <div className="dashboard-container" style={{ display: 'flex', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
            {isViewingCourse && (
                <aside className="sidebar" style={{ width: '280px', height: '100%', overflowY: 'auto', backgroundColor: '#2c3e50', color: 'white' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #34495e' }}>
                        <Link to={`/courses/${id}`} style={{ color: 'white', textDecoration: 'none' }}>
                            <h3 style={{ fontSize: '1rem' }}>📌 Course Overview</h3>
                        </Link>
                    </div>
                    <ul className="sidebar-menu" style={{ listStyle: 'none', padding: 0 }}>
                        {topics.map((topic, tIdx) => (
                            <li key={topic.id} style={{ padding: '10px 20px', borderBottom: '1px solid #34495e' }}>
                                <div style={{ fontSize: '0.85rem', color: '#95a5a6', marginBottom: '5px' }}>
                                    TOPIC {tIdx + 1}: {topic.title}
                                </div>
                                {topic.subtopics?.map((sub, sIdx) => (
                                    <Link 
                                        key={sub.id}
                                        // Navigate to a specific subtopic route
                                        to={`/courses/${id}/subtopic/${sub.id}`}
                                        className={location.pathname.includes(sub.id) ? 'active' : ''}
                                        style={{ 
                                            display: 'block', 
                                            padding: '8px 10px', 
                                            fontSize: '0.9rem', 
                                            color: '#ecf0f1', 
                                            textDecoration: 'none' 
                                        }}
                                    >
                                        📄 {sub.title}
                                    </Link>
                                ))}
                            </li>
                        ))}
                    </ul>
                </aside>
            )}

            <main className="main-content" style={{ flex: 1, overflowY: 'auto', padding: '30px', backgroundColor: '#f4f7f6' }}>
                <Outlet context={{ topics }} /> 
            </main>
        </div>
    );
};

export default SidebarLayout;