import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

// Core viewer items
import { Worker, Viewer } from '@react-pdf-viewer/core';
// Default layout plugin (includes toolbar, sidebar, etc.)
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

// Import necessary styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const SubtopicPage = () => {
    const { id, subtopicId } = useParams();
    const [subtopic, setSubtopic] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize the plugin
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    useEffect(() => {
        const fetchSubtopic = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/courses/${id}/subtopics/${subtopicId}`);
                setSubtopic(res.data);
            } catch (err) {
                console.error("Error loading subtopic:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSubtopic();
    }, [id, subtopicId]);

    if (loading) return <div style={{ padding: '20px' }}>Loading lesson...</div>;
    if (!subtopic) return <div style={{ padding: '20px' }}>Content not found.</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#2c3e50' }}>{subtopic.title}</h1>
                <p style={{ color: '#7f8c8d' }}>{subtopic.description || 'Lesson Material'}</p>
            </div>

            {/* THE PDF VIEWER CONTAINER */}
            <div style={{ 
                flex: 1, 
                border: '1px solid rgba(0, 0, 0, 0.1)', 
                borderRadius: '8px', 
                overflow: 'hidden',
                backgroundColor: '#eee',
                height: '80vh' // Set a fixed height or use flex
            }}>
                {subtopic.fileUrl ? (
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                        <Viewer
                            fileUrl={subtopic.fileUrl}
                            plugins={[defaultLayoutPluginInstance]}
                        />
                    </Worker>
                ) : (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100%',
                        color: '#666' 
                    }}>
                        <p>No PDF file attached to this lesson.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubtopicPage;