import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Library = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('all');

    useEffect(() => {
        const fetchLibrary = async () => {
            try {
                setLoading(true);
                const res = await api.get('/library');
                setMaterials(res.data || []);
            } catch (err) {
                console.error(err);
                setError('Failed to load library.');
            } finally {
                setLoading(false);
            }
        };

        fetchLibrary();
    }, []);

    const getFileType = (url) => {
        if (!url) return 'PAGE';

        const lowerUrl = url.toLowerCase();

        if (lowerUrl.endsWith('.pdf')) return 'PDF';
        if (lowerUrl.endsWith('.mp4')) return 'VIDEO';
        if (lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx')) return 'DOC';
        if (lowerUrl.endsWith('.ppt') || lowerUrl.endsWith('.pptx')) return 'SLIDES';

        return 'FILE';
    };

    const getFileBadgeStyle = (url) => {
        const fileType = getFileType(url);

        if (fileType === 'PDF') {
            return { backgroundColor: '#fdecea', color: '#c0392b' };
        }
        if (fileType === 'VIDEO') {
            return { backgroundColor: '#eaf2fd', color: '#2980b9' };
        }
        if (fileType === 'DOC') {
            return { backgroundColor: '#eef6ff', color: '#1f5fae' };
        }
        if (fileType === 'SLIDES') {
            return { backgroundColor: '#f4ecf7', color: '#8e44ad' };
        }
        if (fileType === 'FILE') {
            return { backgroundColor: '#eafaf1', color: '#27ae60' };
        }

        return { backgroundColor: '#fdf2e9', color: '#e67e22' };
    };

    const courseOptions = useMemo(() => {
        const uniqueCourses = [];
        const seen = new Set();

        materials.forEach((item) => {
            if (!seen.has(item.courseId)) {
                seen.add(item.courseId);
                uniqueCourses.push({
                    courseId: item.courseId,
                    courseTitle: item.courseTitle,
                });
            }
        });

        return uniqueCourses.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
    }, [materials]);

    const filteredMaterials = useMemo(() => {
        return materials
            .filter((item) => {
                const matchesSearch =
                    item.title.toLowerCase().includes(search.toLowerCase()) ||
                    item.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
                    item.topicTitle.toLowerCase().includes(search.toLowerCase());

                const matchesCourse =
                    selectedCourse === 'all' || String(item.courseId) === String(selectedCourse);

                return matchesSearch && matchesCourse;
            })
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [materials, search, selectedCourse]);

    const stats = useMemo(() => {
        const totalMaterials = materials.length;
        const totalCourses = new Set(materials.map((item) => item.courseId)).size;
        const totalFiles = materials.filter((item) => item.fileUrl).length;

        return {
            totalMaterials,
            totalCourses,
            totalFiles,
        };
    }, [materials]);

    if (loading) return <div className="p-5">Loading Library...</div>;
    if (error) return <div className="p-5 text-danger">{error}</div>;

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
            <header
                style={{
                    marginBottom: '30px',
                    background: '#fff',
                    padding: '30px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                }}
            >
                <h2 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '10px' }}>Global Library</h2>
                <p style={{ fontSize: '1.05rem', color: '#7f8c8d', lineHeight: '1.6', margin: 0 }}>
                    Browse all uploaded learning materials across courses.
                </p>
            </header>

            <section style={{ display: 'grid', gap: '20px' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '15px',
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            padding: '20px',
                            borderRadius: '10px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            border: '1px solid #ecf0f1',
                        }}
                    >
                        <p style={{ margin: '0 0 8px 0', color: '#7f8c8d', fontSize: '0.9rem' }}>Courses</p>
                        <h3 style={{ margin: 0, color: '#2c3e50' }}>{stats.totalCourses}</h3>
                    </div>

                    <div
                        style={{
                            background: '#fff',
                            padding: '20px',
                            borderRadius: '10px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            border: '1px solid #ecf0f1',
                        }}
                    >
                        <p style={{ margin: '0 0 8px 0', color: '#7f8c8d', fontSize: '0.9rem' }}>Materials</p>
                        <h3 style={{ margin: 0, color: '#2c3e50' }}>{stats.totalMaterials}</h3>
                    </div>

                    <div
                        style={{
                            background: '#fff',
                            padding: '20px',
                            borderRadius: '10px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            border: '1px solid #ecf0f1',
                        }}
                    >
                        <p style={{ margin: '0 0 8px 0', color: '#7f8c8d', fontSize: '0.9rem' }}>Files Available</p>
                        <h3 style={{ margin: 0, color: '#2c3e50' }}>{stats.totalFiles}</h3>
                    </div>
                </div>

                <div
                    style={{
                        background: '#fff',
                        padding: '20px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        border: '1px solid #ecf0f1',
                        display: 'grid',
                        gridTemplateColumns: '1fr 260px',
                        gap: '15px',
                    }}
                >
                    <input
                        type="text"
                        placeholder="Search materials, topics, or courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: '1px solid #dfe6e9',
                            fontSize: '0.95rem',
                            outline: 'none',
                        }}
                    />

                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: '1px solid #dfe6e9',
                            fontSize: '0.95rem',
                            background: '#fff',
                        }}
                    >
                        <option value="all">All courses</option>
                        {courseOptions.map((course) => (
                            <option key={course.courseId} value={course.courseId}>
                                {course.courseTitle}
                            </option>
                        ))}
                    </select>
                </div>

                {filteredMaterials.length === 0 ? (
                    <div
                        style={{
                            background: '#fff',
                            padding: '40px',
                            borderRadius: '10px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            border: '1px solid #ecf0f1',
                            textAlign: 'center',
                            color: '#7f8c8d',
                        }}
                    >
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>📚</span>
                        <p style={{ margin: 0 }}>No materials found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '14px' }}>
                        {filteredMaterials.map((item) => {
                            const badgeStyle = getFileBadgeStyle(item.fileUrl);

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => navigate(`/courses/${item.courseId}/subtopic/${item.id}`)}
                                    style={{
                                        background: '#fff',
                                        padding: '18px',
                                        borderRadius: '10px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        border: '1px solid #ecf0f1',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '14px',
                                        flexWrap: 'wrap',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: '240px' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '8px',
                                                flexWrap: 'wrap',
                                                marginBottom: '10px',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '4px 10px',
                                                    borderRadius: '999px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    ...badgeStyle,
                                                }}
                                            >
                                                {getFileType(item.fileUrl)}
                                            </span>

                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '4px 10px',
                                                    borderRadius: '999px',
                                                    background: '#eef6ff',
                                                    color: '#2980b9',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                }}
                                            >
                                                {item.courseTitle}
                                            </span>
                                        </div>

                                        <h4 style={{ margin: '0 0 6px 0', color: '#2c3e50' }}>{item.title}</h4>

                                        <p style={{ margin: '0 0 6px 0', color: '#7f8c8d', fontSize: '0.92rem' }}>
                                            Topic: {item.topicTitle}
                                        </p>

                                        <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.92rem' }}>
                                            {item.fileUrl
                                                ? 'This material includes an uploaded file.'
                                                : 'This material is available as a lesson page.'}
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/courses/${item.courseId}/subtopic/${item.id}`);
                                            }}
                                            style={{
                                                padding: '10px 16px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                border: 'none',
                                                backgroundColor: '#3498db',
                                                color: 'white',
                                                fontWeight: '600',
                                            }}
                                        >
                                            Open
                                        </button>

                                        {item.fileUrl && (
                                            <a
                                                href={item.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    padding: '10px 16px',
                                                    borderRadius: '6px',
                                                    textDecoration: 'none',
                                                    backgroundColor: '#ecf0f1',
                                                    color: '#2c3e50',
                                                    fontWeight: '600',
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
            </section>
        </div>
    );
};

export default Library;