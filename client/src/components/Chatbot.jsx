import React, { useState, useEffect, useRef } from 'react';
import '../styles/style.css'; 

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hi Yazid! Ready to work on ICT2503, 2504, or 2505?" }
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
            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userText, 
                    profile: { name: "Muhammad Yazid", role: "Student", courses: ["ICT2503", "ICT2504", "ICT2505"] }
                })
            });
            const data = await response.json();
            setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "Connection error." }]);
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
                        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                        <button onClick={handleSend}>➤</button>
                    </div>
                </div>
            )}
            {!isOpen && <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>✨ Ask AI</button>}
        </div>
    );
};

export default Chatbot;