'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    customer: '',
    priority: 'Medium',
    status: 'Open'
  });

  useEffect(() => {
    loadTicketsAndCustomers();
  }, []);

  async function loadTicketsAndCustomers() {
    try {
      const ticketsList = await api.getTickets();
      setTickets(ticketsList);
      
      const customersList = await api.getCustomers();
      setCustomers(customersList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!formData.customer) {
      alert('Please select a customer for this ticket.');
      return;
    }

    try {
      await api.createTicket(formData);
      setIsAddModalOpen(false);
      setFormData({ title: '', customer: '', priority: 'Medium', status: 'Open' });
      loadTicketsAndCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const updateTicketStatus = async (id, newStatus) => {
    try {
      await api.updateTicket(id, { status: newStatus });
      
      // Auto-log agent work based on resolution
      if (newStatus === 'Resolved') {
        const t = tickets.find(ticket => ticket.id === id);
        api.logActivity(t?.assignedTo || 'Support Agent', 'Ticket Resolution', `Resolved ticket ${id}: "${t?.title}"`, 110, 180);
      } else if (newStatus === 'In Progress') {
        const t = tickets.find(ticket => ticket.id === id);
        api.logActivity(t?.assignedTo || 'Support Agent', 'Ticket Assignment', `Started work on ticket ${id}: "${t?.title}"`, 75, 120);
      }

      loadTicketsAndCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityBadgeClass = (p) => {
    switch (p) {
      case 'High': return 'badge-danger';
      case 'Medium': return 'badge-warning';
      case 'Low': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  };

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case 'Open': return 'badge-info';
      case 'In Progress': return 'badge-warning';
      case 'Resolved': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  // Filter Logic
  const filteredTickets = tickets.filter(t => {
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  // Calculate metrics
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <div className="page-layout anim-fade-in">
      {/* Page Title & Add Button */}
      <div className="flex-between">
        <div>
          <h2>Support Ticketing</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            AI-orchestrated helpdesk ticketing, resolution queues, and agent routing logs
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          Lodge Support Ticket
        </button>
      </div>

      {/* Metric Cards Summary */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="glass-card blue-glow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Open Tickets</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>{openCount}</div>
          </div>
          <span style={{ fontSize: '2rem' }}>⊞</span>
        </div>

        <div className="glass-card amber-glow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>In Progress</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>{inProgressCount}</div>
          </div>
          <span style={{ fontSize: '2rem' }}>⛭</span>
        </div>

        <div className="glass-card emerald-glow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Resolved Tickets</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>{resolvedCount}</div>
          </div>
          <span style={{ fontSize: '2rem' }}>✓</span>
        </div>
      </div>

      {/* Filter and Search Row */}
      <div className="glass-card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ width: '180px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Status</label>
            <select 
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Priority</label>
            <select 
              className="form-control"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List Table */}
      <div className="glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Retrieving active support queues...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No support tickets match the current selection.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Problem Title</th>
                  <th>Customer Account</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Agent</th>
                  <th>Logged Date</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-rose)' }}>{t.id}</td>
                    <td style={{ fontWeight: 500 }}>{t.title}</td>
                    <td>{t.customer}</td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{t.assignedTo}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.createdAt}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {t.status === 'Open' && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                            onClick={() => updateTicketStatus(t.id, 'In Progress')}
                          >
                            Work
                          </button>
                        )}
                        {t.status !== 'Resolved' && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)' }}
                            onClick={() => updateTicketStatus(t.id, 'Resolved')}
                          >
                            Resolve
                          </button>
                        )}
                        {t.status === 'Resolved' && (
                          <button 
                            className="btn btn-ghost" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', cursor: 'default' }}
                            disabled
                          >
                            Archived
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lodging Ticket Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>×</button>
            <h3 style={{ marginBottom: '24px' }}>Lodge Support Ticket</h3>

            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label>Problem Statement / Summary</label>
                <input 
                  type="text" 
                  name="title"
                  className="form-control" 
                  placeholder="e.g. Invoices export generating 500 error page"
                  value={formData.title}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Select Impacted Customer</label>
                <select 
                  name="customer"
                  className="form-control"
                  value={formData.customer}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Choose Account --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.company}>
                      {c.company} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Severity Priority</label>
                  <select 
                    name="priority"
                    className="form-control"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="High">High Severity</option>
                    <option value="Medium">Medium Severity</option>
                    <option value="Low">Low Severity</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Current Status</label>
                  <select 
                    name="status"
                    className="form-control"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Lodge & Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
