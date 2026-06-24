'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    // If not authenticated, redirect to login immediately
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    async function loadData() {
      try {
        const analyticsData = await api.getAnalytics();
        const logsData = await api.getAgentLogs();
        setData(analyticsData);
        setLogs(logsData.slice(0, 4)); // Show recent 4 logs
      } catch (e) {
        console.error('Dashboard data load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  if (!mounted || loading) {
    return (
      <div className="flex-center" style={{ justifyContent: 'center', height: '60vh', flexDirection: 'column' }}>
        <div className="anim-pulse" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
          Syncing with Autonomous CRM Agents...
        </div>
      </div>
    );
  }

  // Null-safe fallback — prevents crash if API is unavailable
  const metrics = data?.metrics || {
    totalLeads: 0, activeCustomers: 0, conversionRate: 0,
    revenuePipeline: 0, openTickets: 0, emailsSent: 0,
  };
  const pipelineData = data?.pipelineData || [];
  const monthlyData = data?.monthlyData || [];

  // Format currency in INR
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="page-layout anim-fade-in">
      {/* 4 Premium Metrics Cards */}
      <div className="dashboard-grid">
        <div className="glass-card blue-glow metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Active Leads</span>
            <span className="metric-icon">✦</span>
          </div>
          <div className="metric-value">{metrics.totalLeads}</div>
          <div className="metric-trend trend-up">
            <span>↑ 18%</span> <span style={{ color: 'var(--text-muted)' }}>vs last week</span>
          </div>
        </div>

        <div className="glass-card emerald-glow metric-card">
          <div className="metric-header">
            <span className="metric-title">Active Customers</span>
            <span className="metric-icon">▲</span>
          </div>
          <div className="metric-value">{metrics.activeCustomers}</div>
          <div className="metric-trend trend-up">
            <span>↑ 8%</span> <span style={{ color: 'var(--text-muted)' }}>conversion delta</span>
          </div>
        </div>

        <div className="glass-card purple-glow metric-card">
          <div className="metric-header">
            <span className="metric-title">Lead Conversion Rate</span>
            <span className="metric-icon">●</span>
          </div>
          <div className="metric-value">{metrics.conversionRate}%</div>
          <div className="metric-trend trend-up">
            <span>↑ 4.2%</span> <span style={{ color: 'var(--text-muted)' }}>AI-driven optimization</span>
          </div>
        </div>

        <div className="glass-card amber-glow metric-card">
          <div className="metric-header">
            <span className="metric-title">Active Pipeline Value</span>
            <span className="metric-icon">◆</span>
          </div>
          <div className="metric-value" style={{ fontSize: '1.75rem' }}>
            {formatCurrency(metrics.revenuePipeline)}
          </div>
          <div className="metric-trend trend-up">
            <span>↑ 22.4%</span> <span style={{ color: 'var(--text-muted)' }}>Q2 projection</span>
          </div>
        </div>
      </div>

      {/* Quick Action Panel */}
      <div className="glass-card">
        <h3>Console Quick Actions</h3>
        <div className="quick-actions-row">
          <Link href="/leads" className="btn btn-primary">
            <span>+</span> Add Intelligent Lead
          </Link>
          <Link href="/emails" className="btn btn-secondary">
            <span>Mail</span> AI Email Studio
          </Link>
          <Link href="/support" className="btn btn-secondary">
            <span>Ticket</span> Open Support Ticket
          </Link>
          <Link href="/ai" className="btn btn-secondary">
            <span>AI</span> Wake Orchestrator
          </Link>
        </div>
      </div>

      {/* Charts Layout */}
      <div className="charts-grid">
        {/* Pipeline Performance (Area Chart) */}
        <div className="glass-card chart-card">
          <h3 style={{ marginBottom: '16px' }}>Monthly Conversion Velocity</h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="leads" name="Leads Ingested" stroke="var(--accent-blue)" fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="conversions" name="Customers Gained" stroke="var(--accent-purple)" fillOpacity={1} fill="url(#colorConv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Score Distribution (Bar Chart) */}
        <div className="glass-card chart-card">
          <h3 style={{ marginBottom: '16px' }}>Lead Distribution by Stage</h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="stage" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
                <Bar dataKey="count" name="Count" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Agent Activity Logs */}
      <div className="glass-card">
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h3>Recent Agent Operations</h3>
          <Link href="/logs" style={{ fontSize: '0.85rem', color: 'var(--accent-blue)' }}>
            View Full System Logs →
          </Link>
        </div>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Task</th>
                <th>Query / Context</th>
                <th>Timestamp</th>
                <th>Execution Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 600 }}>{log.agent}</td>
                  <td>
                    <span className="badge badge-neutral">{log.task}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{log.query}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{log.timestamp}</td>
                  <td style={{ color: 'var(--accent-emerald)', fontWeight: 500 }}>{log.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
