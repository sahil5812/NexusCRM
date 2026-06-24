'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function AgentLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentFilter, setAgentFilter] = useState('All');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const data = await api.getAgentLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const getAgentColor = (name) => {
    if (name.includes('Lead')) return 'var(--accent-blue)';
    if (name.includes('Communication')) return 'var(--accent-purple)';
    if (name.includes('Support')) return 'var(--accent-rose)';
    if (name.includes('Analytics')) return 'var(--accent-emerald)';
    return 'var(--accent-amber)';
  };

  const filteredLogs = logs.filter((log) => {
    if (agentFilter === 'All') return true;
    return log.agent.toLowerCase().includes(agentFilter.toLowerCase());
  });

  const totalQueries = filteredLogs.length;
  const avgDuration =
    totalQueries > 0
      ? Math.round(
          filteredLogs.reduce((sum, log) => sum + (parseInt(log.duration, 10) || 0), 0) / totalQueries
        )
      : 0;
  const totalTokens = filteredLogs.reduce((sum, log) => sum + (log.tokens || 0), 0);

  if (loading) {
    return <div className="anim-pulse">Loading agent activity logs...</div>;
  }

  return (
    <div className="agent-log-viewer">
      <div className="logs-stats-grid">
        <div className="glass-card metric-card">
          <div className="metric-title">Total Actions</div>
          <div className="metric-value">{totalQueries}</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-title">Avg Duration</div>
          <div className="metric-value">{avgDuration}ms</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-title">Tokens Used</div>
          <div className="metric-value">{totalTokens.toLocaleString()}</div>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: '16px' }}>
        <select
          className="form-control"
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          style={{ maxWidth: '240px' }}
        >
          <option value="All">All Agents</option>
          <option value="Lead">Lead Agent</option>
          <option value="Communication">Communication Agent</option>
          <option value="Support">Support Agent</option>
          <option value="Analytics">Analytics Agent</option>
          <option value="Orchestrator">Orchestrator</option>
        </select>
        <button type="button" className="btn btn-secondary" onClick={loadLogs}>
          Refresh
        </button>
      </div>

      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Agent</th>
              <th>Task</th>
              <th>Query</th>
              <th>Duration</th>
              <th>Tokens</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id ?? log.timestamp}>
                <td>{log.timestamp}</td>
                <td style={{ color: getAgentColor(log.agent), fontWeight: 600 }}>{log.agent}</td>
                <td>{log.task}</td>
                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.query}</td>
                <td>{log.duration}</td>
                <td>{log.tokens || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
