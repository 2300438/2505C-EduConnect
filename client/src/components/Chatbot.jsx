import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/style.css';

const Chatbot = () => {
    const { user } = useAuth();
    const location = useLocation();

    const chatKey = user ? `chatMessages_${user.id}` : "chatMessages";

    // 1. Create a dynamic default message based on the user's name
    const defaultMessage = useMemo(() => [{ 
        role: 'ai', 
        text: user?.fullName 
            ? `Hi ${user.fullName.split(' ')[0]}! How can I help you with your studies today?` 
            : "Hi! How can I help you with your studies today?" 
    }], [user]);

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        const savedMessages = localStorage.getItem(chatKey);
        return savedMessages ? JSON.parse(savedMessages) : defaultMessage;
    });
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef(null);

    const handleClearChat = () => {
        setMessages(defaultMessage);
        localStorage.setItem(chatKey, JSON.stringify(defaultMessage));
    };

    useEffect(() => {
        localStorage.setItem(chatKey, JSON.stringify(messages));
    }, [messages, chatKey]);

    useEffect(() => {
        const savedMessages = localStorage.getItem(chatKey);
        setMessages(savedMessages ? JSON.parse(savedMessages) : defaultMessage);
    }, [chatKey, defaultMessage]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const placeholder = useMemo(() => {
        if (!user) return "Ask anything...";
        if (location.pathname.startsWith("/courses/")) return "Ask about this course or lesson...";
        if (location.pathname.startsWith("/course/edit/")) return "Ask how to improve or organise this course...";
        if (location.pathname === "/instructor-dashboard") return "Ask about managing your courses...";
        if (location.pathname === "/dashboard") return "Ask about your learning progress...";
        if (user.role === "instructor") return "Ask about teaching, lessons, or course design...";
        return "Ask about your lesson, assignment, or studies...";
    }, [location.pathname, user]);

    const suggestions = useMemo(() => {
        if (!user) return [];
        if (location.pathname.startsWith("/courses/")) {
            return ["Summarise this course", "Explain this topic simply", "What should I study next?"];
        }
        if (location.pathname.startsWith("/course/edit/")) {
            return ["How can I improve this course?", "Suggest better topic names", "How should I organise these lessons?"];
        }
        if (location.pathname === "/instructor-dashboard") {
            return ["How can I improve student engagement?", "Suggest a better course structure", "What should I add to my lesson plan?"];
        }
        if (location.pathname === "/dashboard") {
            return ["What should I revise today?", "Explain my current topic simply", "Help me plan my study"];
        }
        if (user.role === "instructor") {
            return ["Suggest teaching ideas", "How can I improve my course?", "Help me create lesson content"];
        }
        return ["Summarise my topic", "Explain this simply", "Help me prepare for class"];
    }, [location.pathname, user]);

    const handleSend = async (textToSend = input) => {
        if (!textToSend.trim()) return;

        const userText = textToSend;
        const updatedMessages = [...messages, { role: 'user', text: userText }];

        setMessages(updatedMessages);
        setInput("");
        setIsTyping(true);

        try {
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: userText,
                    history: updatedMessages.slice(-8),
                    page: window.location.pathname,
                    courseId: location.pathname.startsWith("/courses/")
                        ? location.pathname.split("/")[2]
                        : location.pathname.startsWith("/course/edit/")
                            ? location.pathname.split("/")[3]
                            : null,
                    // 2. Pass the user object to the backend so the AI has context
                    userContext: user 
                })
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessages(prev => [...prev, { role: 'ai', text: "Please log in to use the AI assistant." }]);
                return;
            }

            if (response.status === 429) {
                setMessages(prev => [...prev, { role: 'ai', text: data.reply || "AI usage limit reached. Please try again shortly." }]);
                return;
            }

            setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "Connection error. Is the server running?" }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="chat-widget">
            {isOpen && (
                <div className="chat-box" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="chat-header">
                        <h4>EduConnect Assistant</h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleClearChat}>🗑</button>
                            <button onClick={() => setIsOpen(false)}>✖</button>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`message ${msg.role}-message`}
                                style={{ whiteSpace: 'pre-wrap' }}
                            >
                                {msg.text}
                            </div>
                        ))}

                        {messages.length === 1 && (
                            <div style={{ marginTop: '10px' }}>
                                <p className="chat-helper-text">Try asking:</p>
                                <div className="chat-suggestions">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            className="chat-suggestion-btn"
                                            onClick={() => handleSend(suggestion)}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isTyping && (
                            <div className="message ai-message">
                                Thinking...
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <input
                            value={input}
                            placeholder={placeholder}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
                            disabled={isTyping}
                        />
                        <button onClick={() => handleSend()} disabled={isTyping}>
                            ➤
                        </button>
                    </div>
                </div>
            )}

            {!isOpen && (
                <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
                    ✨ Ask AI
                </button>
            )}
        </div>
    );
};

export default Chatbot;