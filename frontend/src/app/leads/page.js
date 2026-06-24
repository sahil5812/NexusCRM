'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    status: 'New'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    try {
      const data = await api.getLeads();
      setLeads(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Handle Form Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Create Lead
  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      await api.createLead(formData);
      setIsAddModalOpen(false);
      setFormData({ name: '', email: '', company: '', phone: '', status: 'New' });
      loadLeads();
    } catch (err) {
      console.error(err);
    }
  };

  // Convert Lead to Customer
  const handlePromoteToCustomer = async (lead) => {
    try {
      await api.createCustomer({
        name: lead.name,
        email: lead.email,
        company: lead.company,
        phone: lead.phone,
        value: Math.floor(Math.random() * 800000) + 400000, // Random contract value
        status: 'Active'
      });
      // Delete or update lead status
      await api.updateLead(lead.id, { status: 'Qualified' });
      setSelectedLead(null);
      loadLeads();
    } catch (err) {
      console.error(err);
    }
  };

  // Get Color code for AI score
  const getScoreColorClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'New': return 'badge-info';
      case 'Contacted': return 'badge-warning';
      case 'Qualified': return 'badge-success';
      case 'Unqualified': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  // Filter logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="page-layout anim-fade-in">
      {/* Action Header */}
      <div className="flex-between">
        <div>
          <h2>Lead Pipeline</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Ingest, prioritize, and evaluate lead potentials through AI models</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          + Ingest New Lead
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search by name, company, or email..." 
              className="form-control"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          
          <div style={{ width: '180px' }}>
            <select 
              className="form-control"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">All Stages</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Polling intelligent lead agents...
          </div>
        ) : currentLeads.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No leads found matching query details.
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Lead ID</th>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Stage</th>
                    <th>AI Evaluation Score</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLeads.map((lead) => (
                    <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/leads/${lead.id}`)}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{lead.id}</td>
                      <td>{lead.name}</td>
                      <td>{lead.company}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{lead.email}</td>
                      <td>
                        <span className={`badge ${getBadgeClass(lead.status)}`}>{lead.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 700, width: '32px' }}>{lead.score}%</span>
                          <div className="score-meter-container" style={{ width: '80px', margin: 0 }}>
                            <div 
                              className={`score-meter-fill ${getScoreColorClass(lead.score)}`} 
                              style={{ width: `${lead.score}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          onClick={() => router.push(`/leads/${lead.id}`)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex-between" style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredLeads.length)} of {filteredLeads.length} leads
              </span>
              <div className="flex-center">
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  ◀ Prev
                </button>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next ▶
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Ingest Lead Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>×</button>
            <h3 style={{ marginBottom: '24px' }}>Ingest Lead Metadata</h3>
            
            <form onSubmit={handleCreateLead}>
              <div className="form-group">
                <label>Lead Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  className="form-control" 
                  placeholder="e.g. Vikram Chandra"
                  value={formData.name}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Company / Organization</label>
                <input 
                  type="text" 
                  name="company"
                  className="form-control" 
                  placeholder="e.g. Chandra Enterprises"
                  value={formData.company}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  className="form-control" 
                  placeholder="e.g. contact@chandratech.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  name="phone"
                  className="form-control" 
                  placeholder="e.g. +91 98765 12345"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Ingestion Pipeline Stage</label>
                <select 
                  name="status"
                  className="form-control"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Unqualified">Unqualified</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Evaluate & Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={() => setSelectedLead(null)}>×</button>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
              <div 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '12px', 
                  background: 'rgba(139, 92, 246, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'var(--accent-purple)'
                }}
              >
                L
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{selectedLead.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{selectedLead.company}</p>
              </div>
            </div>

            <div className="glass-card" style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>AI Scoring Engine</span>
                <span className={`badge ${getBadgeClass(selectedLead.status)}`}>{selectedLead.status}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedLead.score}%
                </div>
                <div style={{ flex: 1 }}>
                  <div className="score-meter-container" style={{ height: '10px' }}>
                    <div 
                      className={`score-meter-fill ${getScoreColorClass(selectedLead.score)}`} 
                      style={{ width: `${selectedLead.score}%` }}
                    ></div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Score calculated based on matching profile vectors.
                  </span>
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  AI Analysis Summary
                </strong>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                  "{selectedLead.summary}"
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{selectedLead.email}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Number</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{selectedLead.phone}</p>
              </div>
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lead Ingested</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{selectedLead.createdAt}</p>
              </div>
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Source Code</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Inbound CRM API</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedLead(null)}>
                Dismiss
              </button>
              {selectedLead.status !== 'Qualified' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => handlePromoteToCustomer(selectedLead)}
                >
                  Promote to Customer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
