'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

const SUGGESTED_PROMPTS = [
  { label: 'Analyze Leads Pipeline', query: 'Show me details about our current leads pipeline and who is our best lead.' },
  { label: 'Draft Follow-up Emails', query: 'Draft follow-up emails for our top qualified leads.' },
  { label: 'Support Queue Status', query: 'Check current support ticket queue status and active tasks.' },
  { label: 'Generate Revenue Report', query: 'What is our current pipeline conversion rate and sales report?' },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingAgent, setTypingAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingAgent]);

  async function loadChatHistory() {
    try {
      const history = await api.getChatMessages();
      setMessages(history);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      sender: 'user',
      message: text,
      timestamp: new Date().toTimeString().substring(0, 5),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setTypingAgent('CRM Orchestrator');

    try {
      const response = await api.sendChatMessage(text);
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          name: 'CRM Orchestrator',
          message: `Error: ${err.message}. Ensure the backend is running and you are logged in.`,
          timestamp: new Date().toTimeString().substring(0, 5),
        },
      ]);
    } finally {
      setTypingAgent(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <div className="anim-pulse">Connecting to Orchestrator Agent...</div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty-state">
            <h3>AI Console — Multi-Agent Orchestrator</h3>
            <p>Ask anything about leads, emails, support tickets, or analytics.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'agent-bubble'}`}>
            {msg.sender === 'agent' && (
              <div className="chat-agent-name">{msg.name || 'CRM Orchestrator'}</div>
            )}
            <div className="chat-text">{msg.message}</div>
            <div className="chat-time">{msg.timestamp}</div>
          </div>
        ))}

        {typingAgent && (
          <div className="chat-bubble agent-bubble typing-indicator">
            <div className="chat-agent-name">{typingAgent}</div>
            <div className="typing-dots"><span></span><span></span><span></span></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-prompt-chips">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt.label}
            type="button"
            className="prompt-chip"
            onClick={() => handleSendMessage(prompt.query)}
          >
            {prompt.label}
          </button>
        ))}
      </div>

      <form
        className="chat-input-bar"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
      >
        <input
          type="text"
          className="form-control"
          placeholder="Ask the Orchestrator anything..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Send</button>
      </form>
    </div>
  );
}
