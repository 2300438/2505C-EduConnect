import React, { useState, useEffect, useRef } from 'react';
import '../styles/style.css'; 

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    // Initialize with a generic greeting, or pull name from localStorage if available
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hi! How can I help you with your ICT studies today?" }
    ]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userText = input;
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setInput("");

        try {
            // 1. Retrieve the JWT token saved during login
            const token = localStorage.getItem('token'); 

            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // 2. Attach the token to the Authorization header
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    message: userText
                    
                })
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessages(prev => [...prev, { role: 'ai', text: "Please log in to use the AI assistant." }]);
                return;
            }

            setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "Connection error. Is the server running?" }]);
        }
    };

    return (
        <div className="chat-widget">
            {isOpen && (
                <div className="chat-box" style={{ display: 'flex' }}>
                    <div className="chat-header">
                        <h4>EduConnect Assistant</h4>
                        <button onClick={() => setIsOpen(false)}>✖</button>
                    </div>
                    <div className="chat-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`message ${msg.role}-message`}>{msg.text}</div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input-area">
                        <input 
                            value={input} 
                            placeholder="Ask about ICT2503..."
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                        />
                        <button onClick={handleSend}>➤</button>
                    </div>
                </div>
            )}
            {!isOpen && <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>✨ Ask AI</button>}
        </div>
    );
};

export default Chatbot;