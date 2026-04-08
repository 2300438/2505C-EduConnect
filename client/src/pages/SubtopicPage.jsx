import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; // <-- Imported useAuth

// PDF Viewer Imports
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

// Essential Styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const SubtopicPage = () => {
    const { id, subtopicId } = useParams();
    const { user } = useAuth(); // <-- Get current user

    const [subtopic, setSubtopic] = useState(null);
    const [pdfObjectUrl, setPdfObjectUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    useEffect(() => {
        const fetchSubtopicAndFile = async () => {
            try {
                setLoading(true);
                setError('');

                // 1. Get subtopic data
                const res = await api.get(`/courses/${id}/subtopics/${subtopicId}`);
                const data = res.data;
                setSubtopic(data);

                // 2. Fetch the actual PDF file
                if (data.fileUrl && data.fileUrl.toLowerCase().endsWith('.pdf')) {
                    try {
                        const fileResponse = await fetch(data.fileUrl, {
                            mode: 'cors',
                        });

                        if (!fileResponse.ok) throw new Error("Network response was not ok");

                        const fileBlob = await fileResponse.blob();
                        const localUrl = URL.createObjectURL(fileBlob);
                        setPdfObjectUrl(localUrl);
                    } catch (fetchErr) {
                        console.error("Fetch operation failed:", fetchErr);
                        setError("Direct file access failed. The file may be restricted.");
                    }
                }

                // 3. Mark this subtopic as viewed/completed to update progress
                if (user?.id) {
                    try {
                        // NOTE: Ensure your backend has a route to handle this request.
                        // It should find the user's enrollment for this course and update their progress.
                        await api.put(`/progress/${id}`, {
                            subtopicId: subtopicId
                        });
                    } catch (progressErr) {
                        console.error("Failed to update progress:", progressErr);
                        // We don't set the main error state here so the lesson still loads even if progress tracking fails
                    }
                }

            } catch (err) {
                console.error("Error loading subtopic content:", err);
                setError('Could not load the lesson. Please check your connection.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubtopicAndFile();

        // Cleanup function
        return () => {
            if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, subtopicId, user?.id]); // Refetch when subtopic changes

    if (loading) return <div className="p-5 text-center">Opening Lesson...</div>;
    if (error) return <div className="p-5 text-danger text-center">{error}</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="mb-3">
                <h2 style={{ fontWeight: '600', color: '#2c3e50' }}>{subtopic?.title}</h2>
                <hr />
            </div>

            <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', height: '75vh' }}>
                {pdfObjectUrl ? (
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                        <Viewer
                            fileUrl={pdfObjectUrl}
                            plugins={[defaultLayoutPluginInstance]}
                        />
                    </Worker>
                ) : (
                    <div className="d-flex flex-column justify-content-center align-items-center h-100 bg-light text-muted">
                        <span style={{ fontSize: '3rem' }}>📄</span>
                        <p className="mt-3">This lesson does not have a PDF document attached.</p>
                        {subtopic?.content && <p className="px-5 text-center">{subtopic.content}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubtopicPage;