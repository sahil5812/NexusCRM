'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function EmailStudioPage() {
  const [emails, setEmails] = useState([]);
  const [leadsAndCustomers, setLeadsAndCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  // Active email editor state
  const [activeEmail, setActiveEmail] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [context, setContext] = useState('');
  const [tone, setTone] = useState('Formal');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    loadEmailsAndContacts();
  }, []);

  async function loadEmailsAndContacts() {
    try {
      const emailHistory = await api.getEmails();
      setEmails(emailHistory);
      
      const leadsList = await api.getLeads();
      const customersList = await api.getCustomers();
      
      // Combine contacts for recipient dropdown selector
      const contacts = [
        ...leadsList.map(l => ({ name: l.name, email: l.email, type: 'Lead' })),
        ...customersList.map(c => ({ name: c.name, email: c.email, type: 'Customer' }))
      ];
      setLeadsAndCustomers(contacts);
      
      if (emailHistory.length > 0) {
        selectEmail(emailHistory[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const selectEmail = (email) => {
    setActiveEmail(email);
    setRecipient(email.recipient);
    setContext(email.context || '');
    setTone(email.tone || 'Formal');
    setSubject(email.subject);
    setContent(email.content);
  };

  const startNewDraft = () => {
    setActiveEmail(null);
    setRecipient('');
    setContext('');
    setTone('Formal');
    setSubject('');
    setContent('');
  };

  // Generate Email using AI Helper
  const handleGenerateAI = async () => {
    if (!recipient) {
      alert('Please specify a recipient email address.');
      return;
    }
    if (!context) {
      alert('Please enter a brief context for the AI prompt.');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.generateEmailAI(recipient, context, tone);
      setSubject(response.subject);
      setContent(response.content);
      // Refresh list to show new draft
      const history = await api.getEmails();
      setEmails(history);
      setActiveEmail(response);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  // Send Email
  const handleSendEmail = async () => {
    const idToSend = activeEmail?.id;
    if (!idToSend) {
      alert('Please generate or select a draft email to send.');
      return;
    }

    setSending(true);
    try {
      // First save changes made in editor
      const savedEmails = JSON.parse(localStorage.getItem('emails')) || [];
      const idx = savedEmails.findIndex(e => e.id === idToSend);
      if (idx !== -1) {
        savedEmails[idx].subject = subject;
        savedEmails[idx].content = content;
        localStorage.setItem('emails', JSON.stringify(savedEmails));
      }

      await api.sendEmail(idToSend);
      // Reload history
      const history = await api.getEmails();
      setEmails(history);
      const updated = history.find(e => e.id === idToSend);
      if (updated) {
        selectEmail(updated);
      }
      alert(`Email dispatched successfully to ${recipient}!`);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const getToneBadgeClass = (emailTone) => {
    switch (emailTone) {
      case 'Formal': return 'badge-info';
      case 'Friendly': return 'badge-success';
      case 'Urgent': return 'badge-danger';
      case 'Follow-up': return 'badge-warning';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="page-layout anim-fade-in">
      <div className="flex-between">
        <div>
          <h2>AI Email Studio</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Draft, refine, and queue hyper-personalized emails leveraging AI agent synthesis
          </p>
        </div>
        <button className="btn btn-primary" onClick={startNewDraft}>
          + Create New Draft
        </button>
      </div>

      <div className="email-studio-grid">
        {/* Left Side: Email List */}
        <div className="email-list-panel">
          <div className="email-list-header flex-between">
            <span>Communication Logs</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emails.length} total</span>
          </div>
          
          <div className="email-items">
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading logs...
              </div>
            ) : emails.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active emails.
              </div>
            ) : (
              emails.map((email) => {
                const isActive = activeEmail?.id === email.id;
                return (
                  <div 
                    key={email.id} 
                    className={`email-item ${isActive ? 'active' : ''}`}
                    onClick={() => selectEmail(email)}
                  >
                    <div className="email-item-meta">
                      <span>{email.recipient}</span>
                      <span className={`badge ${email.status === 'Sent' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.65rem', padding: '2px 4px' }}>
                        {email.status}
                      </span>
                    </div>
                    <div className="email-item-subject">{email.subject}</div>
                    <div className="email-item-preview">{email.content.replace(/\n/g, ' ')}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Compiler Editor */}
        <div className="email-compiler-panel">
          <h3>AI Compiler Workspace</h3>
          
          {/* Recipient Dropdown / Input */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Recipient Email</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="e.g. client@domain.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label>Quick Address Book</label>
              <select 
                className="form-control"
                onChange={(e) => setRecipient(e.target.value)}
                value={recipient}
              >
                <option value="">-- Choose Contact --</option>
                {leadsAndCustomers.map((contact, i) => (
                  <option key={i} value={contact.email}>
                    {contact.name} ({contact.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Context & Tone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Brief Context / Objective</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Schedule quick 15 min pricing follow-up call"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label>AI Writing Tone</label>
              <select 
                className="form-control"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="Formal">Formal & Professional</option>
                <option value="Friendly">Friendly & Warm</option>
                <option value="Urgent">Urgent Follow-up</option>
                <option value="Follow-up">Standard Follow-up</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleGenerateAI}
              disabled={generating}
            >
              {generating ? 'Agents composing draft...' : 'Generate with AI'}
            </button>
          </div>

          <hr style={{ borderColor: 'var(--border)' }} />

          {/* Email Subject */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Subject</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Email subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Email Body */}
          <div className="form-group" style={{ margin: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label>Email Body</label>
            <textarea 
              className="form-control" 
              style={{ flex: 1, minHeight: '200px', fontFamily: 'monospace', fontSize: '0.88rem' }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {activeEmail && (
                <span className={`badge ${getToneBadgeClass(activeEmail.tone)}`}>
                  Tone: {activeEmail.tone}
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary"
                onClick={startNewDraft}
              >
                Clear Workspace
              </button>
              
              <button 
                className="btn btn-primary"
                onClick={handleSendEmail}
                disabled={sending || !content}
                style={{ background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-blue))', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)' }}
              >
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
