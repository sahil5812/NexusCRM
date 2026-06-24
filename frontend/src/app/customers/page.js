'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    value: '',
    status: 'Active'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
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

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const customerVal = parseFloat(formData.value) || 0;
      await api.createCustomer({
        ...formData,
        value: customerVal
      });
      setIsAddModalOpen(false);
      setFormData({ name: '', email: '', company: '', phone: '', value: '', status: 'Active' });
      loadCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  // Format currency helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getBadgeClass = (status) => {
    return status === 'Active' ? 'badge-success' : 'badge-neutral';
  };

  // Filter Logic
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="page-layout anim-fade-in">
      {/* Page Header */}
      <div className="flex-between">
        <div>
          <h2>Customer Directory</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Manage active client partnerships, contract metrics, and value pipelines</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          Add Customer Profile
        </button>
      </div>

      {/* Filters Card */}
      <div className="glass-card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input 
              type="text" 
              placeholder="Search customers by name, company, or domain..." 
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
              <option value="All">All Accounts</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Retrieving customer portfolio...
          </div>
        ) : currentCustomers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No customer accounts found matching search filters.
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Account ID</th>
                    <th>Customer Name</th>
                    <th>Company</th>
                    <th>Contract Value</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.map((c) => (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedCustomer(c)}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>{c.id}</td>
                      <td>{c.name}</td>
                      <td style={{ fontWeight: 500 }}>{c.company}</td>
                      <td style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        {formatCurrency(c.value)}
                      </td>
                      <td>
                        <span className={`badge ${getBadgeClass(c.status)}`}>{c.status}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{c.createdAt}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="btn btn-ghost"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          onClick={() => setSelectedCustomer(c)}
                        >
                          Profile Details
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
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} accounts
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

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>×</button>
            <h3 style={{ marginBottom: '24px' }}>Add Customer Profile</h3>
            
            <form onSubmit={handleCreateCustomer}>
              <div className="form-group">
                <label>Customer Name</label>
                <input 
                  type="text" 
                  name="name"
                  className="form-control" 
                  placeholder="e.g. Vikram Singh"
                  value={formData.name}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  name="company"
                  className="form-control" 
                  placeholder="e.g. Singh Logistics"
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
                  placeholder="e.g. contact@singhlogistics.com"
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
                  placeholder="e.g. +91 94567 89012"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Contract Value (INR)</label>
                <input 
                  type="number" 
                  name="value"
                  className="form-control" 
                  placeholder="e.g. 1250000"
                  value={formData.value}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Account Status</label>
                <select 
                  name="status"
                  className="form-control"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Customer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Profile Details Modal */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={() => setSelectedCustomer(null)}>×</button>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
              <div 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '12px', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'var(--accent-emerald)'
                }}
              >
                C
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{selectedCustomer.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{selectedCustomer.company}</p>
              </div>
            </div>

            <div className="glass-card" style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Contract Metrics</span>
                <span className={`badge ${getBadgeClass(selectedCustomer.status)}`}>{selectedCustomer.status}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account Contract Value (ACV)</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  {formatCurrency(selectedCustomer.value)}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{selectedCustomer.email}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Number</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{selectedCustomer.phone}</p>
              </div>
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Client Since</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{selectedCustomer.createdAt}</p>
              </div>
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Priority Level</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  {selectedCustomer.value > 1000000 ? 'Enterprise VIP' : 'Standard Growth'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>
                Dismiss
              </button>
              <a 
                href={`mailto:${selectedCustomer.email}`} 
                className="btn btn-primary"
              >
                Launch Mailer
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
