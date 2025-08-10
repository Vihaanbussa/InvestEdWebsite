import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

const GeminiChat = () => {
  const [messages, setMessages] = useState([
    { sender: 'agent', text: 'Hi! I am your financial assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages((msgs) => [...msgs, userMessage]);
    setLoading(true);
    setInput('');
    try {
      const response = await fetch('/api/financial-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await response.json();
      setMessages((msgs) => [
        ...msgs,
        { sender: 'agent', text: data.response || data.error || 'Sorry, something went wrong.' }
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { sender: 'agent', text: 'Network error. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      sendMessage();
    }
  };

  return (
    <div className="gemini-chat-container card">
      <div className="gemini-chat-messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`gemini-chat-message ${msg.sender === 'user' ? 'user' : 'agent'}`}
          >
            {msg.sender === 'agent' ? (
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            ) : (
              <span>{msg.text}</span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="gemini-chat-input-row">
        <input
          className="gemini-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          className="gemini-chat-send-btn info-button"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default GeminiChat; 