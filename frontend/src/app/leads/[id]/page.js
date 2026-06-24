'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ScoreGauge from '@/components/charts/ScoreGauge';

function getBadgeVariant(status) {
  switch (status) {
    case 'New': return 'info';
    case 'Contacted': return 'warning';
    case 'Qualified': return 'success';
    case 'Unqualified': return 'danger';
    default: return 'neutral';
  }
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLead() {
      try {
        const data = await api.getLead(params.id);
        setLead(data);
      } catch (err) {
        setError(err.message || 'Failed to load lead');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) loadLead();
  }, [params.id]);

  const handlePromote = async () => {
    try {
      await api.createCustomer({
        name: lead.name,
        email: lead.email,
        company: lead.company,
        phone: lead.phone,
      });
      await api.updateLead(lead.id, { status: 'Qualified' });
      router.push('/customers');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="anim-pulse" style={{ padding: '40px' }}>Loading lead profile...</div>;
  }

  if (error || !lead) {
    return (
      <div className="page-layout">
        <Card>
          <p>{error || 'Lead not found.'}</p>
          <Link href="/leads" className="btn btn-secondary" style={{ marginTop: '16px', display: 'inline-block' }}>
            Back to Leads
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-layout anim-fade-in">
      <div className="page-header">
        <div>
          <Link href="/leads" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>← Back to Leads</Link>
          <h1 className="page-title">{lead.name}</h1>
          <p className="page-subtitle">{lead.company} · {lead.email}</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => router.push(`/emails?recipient=${encodeURIComponent(lead.email)}`)}>
            Draft Email
          </Button>
          <Button onClick={handlePromote}>Convert to Customer</Button>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <Card glow="blue-glow">
          <h3 style={{ marginBottom: '16px' }}>Lead Profile</h3>
          <div className="detail-grid">
            <div><span className="detail-label">Phone</span><span>{lead.phone || '—'}</span></div>
            <div><span className="detail-label">Source</span><span>{lead.source}</span></div>
            <div><span className="detail-label">Status</span><Badge variant={getBadgeVariant(lead.status)}>{lead.status}</Badge></div>
            <div><span className="detail-label">Created</span><span>{lead.createdAt}</span></div>
          </div>
          <div style={{ marginTop: '24px' }}>
            <span className="detail-label">AI Summary</span>
            <p style={{ marginTop: '8px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {lead.summary || lead.notes || 'No AI insights generated yet. Use the AI Console to score this lead.'}
            </p>
          </div>
        </Card>

        <Card glow="emerald-glow">
          <ScoreGauge score={lead.score} />
          <div style={{ marginTop: '24px' }}>
            <span className="detail-label">Qualification</span>
            <p style={{ marginTop: '8px' }}>
              {lead.score >= 80 ? 'Hot Lead' : lead.score >= 50 ? 'Warm Lead' : 'Cold Lead'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
