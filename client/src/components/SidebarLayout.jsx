import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams, Outlet } from 'react-router-dom';
import api from '../services/api';
import '../styles/dashboard.css';

const SidebarLayout = () => {
    const { id, subtopicId } = useParams(); 
    const location = useLocation();
    const [topics, setTopics] = useState([]);

    // Logic: Only show the sidebar if we are explicitly on a subtopic page
    const isSubtopicPage = location.pathname.includes(`/courses/${id}/subtopic/`);

    useEffect(() => {
        if (isSubtopicPage && id) {
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
    }, [id, isSubtopicPage]);

    return (
        <div className="dashboard-container" style={{ 
            display: 'flex', 
            height: 'calc(100vh - 70px)', 
            overflow: 'hidden' 
        }}>
            {/* SIDEBAR: Only visible on Subtopic Pages */}
            {isSubtopicPage && (
                <aside className="sidebar" style={{ 
                    width: '300px', 
                    height: '100%', 
                    overflowY: 'auto', 
                    backgroundColor: '#2c3e50', 
                    color: 'white',
                    borderRight: '1px solid #1a252f'
                }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #34495e' }}>
                        <Link to={`/courses/${id}`} style={{ color: '#3498db', textDecoration: 'none', fontSize: '0.9rem' }}>
                            ← Back to Overview
                        </Link>
                        <h3 style={{ fontSize: '1.1rem', marginTop: '10px', color: 'white' }}>Course Content</h3>
                    </div>
                    
                    <ul className="sidebar-menu" style={{ listStyle: 'none', padding: 0 }}>
                        {topics.map((topic, tIdx) => (
                            <li key={topic.id} style={{ borderBottom: '1px solid #34495e' }}>
                                <div style={{ 
                                    padding: '12px 20px', 
                                    backgroundColor: '#1a252f', 
                                    fontSize: '0.8rem', 
                                    fontWeight: 'bold', 
                                    color: '#95a5a6',
                                    textTransform: 'uppercase'
                                }}>
                                    Topic {tIdx + 1}: {topic.title}
                                </div>
                                {topic.subtopics?.map((sub) => (
                                    <Link 
                                        key={sub.id}
                                        to={`/courses/${id}/subtopic/${sub.id}`}
                                        style={{ 
                                            display: 'block', 
                                            padding: '12px 25px', 
                                            fontSize: '0.9rem', 
                                            color: subtopicId === sub.id.toString() ? '#fff' : '#bdc3c7', 
                                            textDecoration: 'none',
                                            backgroundColor: subtopicId === sub.id.toString() ? '#34495e' : 'transparent',
                                            borderLeft: subtopicId === sub.id.toString() ? '4px solid #3498db' : '4px solid transparent'
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

            {/* MAIN CONTENT */}
            <main className="main-content" style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: isSubtopicPage ? '20px' : '40px', // Less padding when sidebar is open
                backgroundColor: '#f4f7f6' 
            }}>
                <Outlet />
            </main>
        </div>
    );
};

export default SidebarLayout;