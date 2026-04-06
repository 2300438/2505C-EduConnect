import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

// PDF Viewer Imports
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

// Essential Styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const SubtopicPage = () => {
    const { id, subtopicId } = useParams();
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

                // 1. Get subtopic data (which includes your Vercel Blob URL)
                const res = await api.get(`/courses/${id}/subtopics/${subtopicId}`);
                const data = res.data;
                setSubtopic(data);

                // 2. Fetch the actual PDF file from Vercel Blob
                // Converting to a local Object URL prevents CORS "Canvas" errors
                if (data.fileUrl && data.fileUrl.toLowerCase().endsWith('.pdf')) {
                    try {
                        const fileResponse = await fetch(data.fileUrl, {
                            mode: 'cors', // Ensure CORS mode is explicit
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
            } catch (err) {
                console.error("Error loading subtopic content:", err);
                setError('Could not load the lesson. Please check your connection.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubtopicAndFile();

        // Cleanup function to prevent memory leaks
        return () => {
            if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
        };
    }, [id, subtopicId]); // Refetch whenever the student clicks a new subtopic in the sidebar

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