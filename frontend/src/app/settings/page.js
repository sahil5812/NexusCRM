'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [llmModel, setLlmModel] = useState('gemini-1.5-pro');
  const [temperature, setTemperature] = useState(0.2);
  const [apiKey, setApiKey] = useState('••••••••••••••••••••••••');
  const [leadThreshold, setLeadThreshold] = useState(70);
  const [autoEmail, setAutoEmail] = useState(true);

  // Profile states
  const [adminName, setAdminName] = useState('Jay Dev');
  const [adminEmail, setAdminEmail] = useState('admin@nexus.ai');
  const [adminRole, setAdminRole] = useState('Administrator');

  useEffect(() => {
    loadSettings();
  }, []);

  function loadSettings() {
    try {
      const config = api.getSettings();
      setSettings(config);
      setLlmModel(config.llmModel || 'gemini-1.5-pro');
      setTemperature(parseFloat(config.temperature) || 0.2);
      setApiKey(config.apiKey || '••••••••••••••••••••••••');
      setLeadThreshold(parseInt(config.leadThreshold) || 70);
      setAutoEmail(config.autoEmail !== undefined ? config.autoEmail : true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveSettings = (e) => {
    e.preventDefault();
    try {
      const updated = {
        llmModel,
        temperature: temperature.toString(),
        apiKey,
        leadThreshold: leadThreshold.toString(),
        autoEmail
      };
      api.saveSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ justifyContent: 'center', height: '60vh', flexDirection: 'column' }}>
        <div className="anim-pulse" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
          Loading system parameters...
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout anim-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Title Header */}
      <div className="flex-between">
        <div>
          <h2>System Configuration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Configure autonomous thresholds, LLM endpoints, credentials, and user permissions
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div 
          className="glass-card emerald-glow anim-slide-up" 
          style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid var(--accent-emerald)', 
            color: 'var(--text-primary)', 
            padding: '12px 24px',
            borderRadius: '10px'
          }}
        >
          <strong>Configuration Synchronized:</strong> Swarm has reloaded settings with new parameter weights.
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Swarm AI Configuration */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            Swarm AI Parameters
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Default LLM Model</label>
              <select 
                className="form-control"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
              >
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Latency Optimized)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="gpt-4o">GPT-4o (Standard)</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Auto-Promote Lead Score Threshold: <strong>{leadThreshold}%</strong></label>
              <input 
                type="range" 
                min="50" 
                max="95" 
                step="5" 
                className="form-control"
                value={leadThreshold}
                onChange={(e) => setLeadThreshold(parseInt(e.target.value))}
                style={{ padding: '8px 0', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Leads scoring above this threshold will automatically get marked as Qualified.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>LLM System Temperature: <strong>{temperature}</strong></label>
              <input 
                type="range" 
                min="0.0" 
                max="1.0" 
                step="0.1" 
                className="form-control"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                style={{ padding: '8px 0', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Lower values trigger consistent, analytical content; higher values increase creativity.
              </span>
            </div>

            <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                <input 
                  type="checkbox" 
                  checked={autoEmail}
                  onChange={(e) => setAutoEmail(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--accent-purple)' }}
                />
                <div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>Auto-Draft Email Follow-ups</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Automatically trigger Communication Agent draft emails upon lead scoring events.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Credentials & Integrations */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            Credentials & Keys
          </h3>
          
          <div className="form-group">
            <label>Gemini API Key</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Enter api key..." 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Keys are stored locally in secure browser sandboxes and never transmitted outside CRM APIs.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Webhook Integration Endpoint</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="https://api.yourdomain.com/crm/webhooks" 
                disabled
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Postgres Connection String</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="postgresql://db_user:***@localhost:5432/nexus_db" 
                disabled
              />
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            Operator Profile
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '24px', alignItems: 'center' }}>
            <div 
              style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '2.5rem',
                color: 'white',
                boxShadow: 'var(--glow-purple)',
                fontWeight: 600
              }}
            >
              JD
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Operator Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={adminName} 
                  onChange={(e) => setAdminName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Billing Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={adminEmail} 
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                <label>Assigned Permission Role</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={adminRole} 
                  disabled 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '24px' }}>
          <button type="button" className="btn btn-secondary" onClick={loadSettings}>
            Revert Changes
          </button>
          <button type="submit" className="btn btn-primary">
            Sync & Save Configurations
          </button>
        </div>
      </form>
    </div>
  );
}
