import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api'; 

const DiscussionRoom = () => {
  const { id: courseId, discId: boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [board, setBoard] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch the board and the posts when the page loads
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get(`/discussions/${boardId}/posts`);
        setBoard(res.data.board);
        setPosts(res.data.posts);
      } catch (err) {
        setError('Failed to load the discussion board.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [boardId]);

  // 2. Handle submitting a new message
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await api.post(`/discussions/${boardId}/posts`, {
        content: newMessage
      });
      
      // Add the newly created post instantly to the screen
      setPosts([...posts, res.data]);
      setNewMessage(''); // Clear the input box
    } catch (err) {
      alert("Failed to send message. Please try again.");
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Chat Room...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(`/courses/${courseId}`)}
        style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#f8f9fa' }}
      >
        ← Back to Course
      </button>

      {/* The Instructor's Prompt Area */}
      <div style={{ background: '#e8f4f8', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #3498db', marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{board.title}</h2>
        <p style={{ margin: 0, color: '#34495e', fontSize: '1.1rem' }}>{board.prompt}</p>
      </div>

      {/* The Chat History */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d', fontStyle: 'italic' }}>Be the first to reply to this discussion!</p>
        ) : (
          posts.map((post) => (
            <div 
              key={post.id} 
              style={{ 
                background: post.author.role === 'instructor' ? '#fcf3cf' : '#fff', 
                padding: '15px', 
                borderRadius: '8px', 
                border: '1px solid #ecf0f1',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', color: post.author.role === 'instructor' ? '#d35400' : '#2c3e50' }}>
                  {post.author.fullName} 
                  {post.author.role === 'instructor' && ' (Instructor)'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#bdc3c7' }}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: 0, color: '#34495e', whiteSpace: 'pre-wrap' }}>{post.content}</p>
            </div>
          ))
        )}
      </div>

      {/* The Input Form */}
      <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your reply here..."
          rows="4"
          style={{ padding: '15px', borderRadius: '8px', border: '1px solid #bdc3c7', resize: 'vertical', fontSize: '1rem', outline: 'none' }}
        />
        <button 
          type="submit"
          style={{ padding: '12px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
        >
          Post Reply
        </button>
      </form>

    </div>
  );
};

export default DiscussionRoom;