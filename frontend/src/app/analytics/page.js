'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Theme colors for Pie Chart Cells
  const COLORS = [
    'var(--accent-blue)',
    'var(--accent-purple)',
    'var(--accent-emerald)',
    'var(--accent-amber)'
  ];

  useEffect(() => {
    setMounted(true);
    async function loadAnalytics() {
      try {
        const analyticsData = await api.getAnalytics();
        setData(analyticsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (!mounted || loading) {
    return (
      <div className="flex-center" style={{ justifyContent: 'center', height: '60vh', flexDirection: 'column' }}>
        <div className="anim-pulse" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
          Computing agent metrics & charts...
        </div>
      </div>
    );
  }

  const { metrics, pipelineData, monthlyData, sourcesData, aiInsights } = data;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="page-layout anim-fade-in">
      <div>
        <h2>System Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Evaluate acquisition velocity, agent conversions, and pipeline valuation distributions
        </p>
      </div>

      {/* Grid of Key Performance Indicators (KPIs) */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="glass-card metric-card">
          <span className="metric-title">Lead Growth</span>
          <div className="metric-value">{metrics.totalLeads}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)' }}>Ingestion running at +14% MoM</span>
        </div>

        <div className="glass-card metric-card">
          <span className="metric-title">Active Customer Count</span>
          <div className="metric-value">{metrics.activeCustomers}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>94% account retention rate</span>
        </div>

        <div className="glass-card metric-card">
          <span className="metric-title">Agent Conversion Eff.</span>
          <div className="metric-value">{metrics.conversionRate}%</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)' }}>+5% since agent deployment</span>
        </div>

        <div className="glass-card metric-card">
          <span className="metric-title">Gross Valuation Pipeline</span>
          <div className="metric-value" style={{ fontSize: '1.5rem', lineHeight: '2.5rem' }}>
            {formatCurrency(metrics.revenuePipeline)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>Target ACV: ₹20,00,000</span>
        </div>
      </div>

      {/* Primary Graphs Row */}
      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Monthly Performance Area Chart */}
        <div className="glass-card" style={{ height: '380px' }}>
          <h3 style={{ marginBottom: '16px' }}>Monthly Conversion Velocity</h3>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="leads" name="Leads" stroke="var(--accent-blue)" fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="conversions" name="Conversions" stroke="var(--accent-purple)" fill="url(#colorConversions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Distribution Bar Chart */}
        <div className="glass-card" style={{ height: '380px' }}>
          <h3 style={{ marginBottom: '16px' }}>Pipeline Stages Volume</h3>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="stage" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Bar dataKey="count" name="Active Leads" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Row: Sources & Bulleted AI Insights */}
      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Pie Chart of Inbound Sources */}
        <div className="glass-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '16px' }}>Lead Acquisition Channels</h3>
          <div style={{ flex: 1, width: '100%', minHeight: '220px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourcesData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Legend verticalAlign="bottom" align="center" layout="horizontal" iconType="circle" fontSize={11} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Bulletins */}
        <div className="glass-card" style={{ height: '400px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span style={{ fontSize: '1.5rem' }}>[AI]</span>
            <h3>Agent Network Intelligence (AI Insights)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {aiInsights.map((insight, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  padding: '16px', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '12px',
                  lineHeight: 1.5
                }}
              >
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  background: 'rgba(139,92,246,0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'var(--accent-purple)', 
                  fontWeight: 'bold', 
                  flexShrink: 0,
                  fontSize: '0.85rem'
                }}>
                  {index + 1}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                  {insight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
