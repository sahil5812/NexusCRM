import { getToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const CHAT_KEY = 'crm_chat_history';

const STATUS_TO_UI = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Contacted',
  won: 'Qualified',
  lost: 'Unqualified',
};

const STATUS_TO_API = {
  New: 'new',
  Contacted: 'contacted',
  Qualified: 'qualified',
  Unqualified: 'lost',
};

const TICKET_STATUS_TO_UI = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Resolved',
};

const TICKET_STATUS_TO_API = {
  Open: 'open',
  'In Progress': 'in_progress',
  Resolved: 'resolved',
};

const PRIORITY_TO_UI = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'High',
};

const PRIORITY_TO_API = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
};

const AGENT_ICONS = {
  orchestrator: 'CRM Orchestrator',
  'lead intelligence': 'Lead Agent',
  'lead intelligence agent': 'Lead Agent',
  'communication': 'Communication Agent',
  'communication agent': 'Communication Agent',
  'customer support': 'Support Agent',
  'customer support agent': 'Support Agent',
  'analytics': 'Analytics Agent',
  'analytics agent': 'Analytics Agent',
};

function formatAgentName(name) {
  if (!name) return 'CRM Orchestrator';
  const key = name.toLowerCase().replace(/ agent$/, '');
  return AGENT_ICONS[key] || AGENT_ICONS[name.toLowerCase()] || name;
}

function formatDate(value) {
  if (!value) return '';
  return String(value).split('T')[0];
}

function formatDateTime(value) {
  if (!value) return '';
  return String(value).replace('T', ' ').substring(0, 16);
}

async function request(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = Array.isArray(err.detail)
      ? err.detail.map((d) => d.msg || d).join(', ')
      : err.detail;
    throw new Error(detail || res.statusText || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

function mapLead(lead) {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email || '',
    company: lead.company || '',
    phone: lead.phone || '',
    status: STATUS_TO_UI[lead.status] || lead.status,
    score: lead.score ?? 0,
    summary: lead.notes || 'AI insights available on detail page.',
    source: lead.source || 'website',
    notes: lead.notes || '',
    createdAt: formatDate(lead.created_at),
    updatedAt: formatDate(lead.updated_at),
  };
}

function mapCustomer(customer, index = 0) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email || '',
    company: customer.company || '',
    phone: customer.phone || '',
    value: (customer.id || index + 1) * 350000,
    status: 'Active',
    createdAt: formatDate(customer.created_at),
  };
}

function mapEmail(email, contactMap = {}) {
  const recipient =
    contactMap[`lead:${email.lead_id}`] ||
    contactMap[`customer:${email.customer_id}`] ||
    'unknown@crm.local';

  return {
    id: email.id,
    leadId: email.lead_id,
    customerId: email.customer_id,
    recipient,
    subject: email.subject,
    context: email.subject,
    tone: email.tone ? email.tone.charAt(0).toUpperCase() + email.tone.slice(1) : 'Formal',
    content: email.body,
    status: email.status === 'sent' ? 'Sent' : 'Draft',
    createdAt: formatDateTime(email.sent_at || email.created_at),
  };
}

function mapTicket(ticket, customerMap = {}) {
  return {
    id: ticket.id,
    title: ticket.subject,
    customer: customerMap[ticket.customer_id] || `Customer #${ticket.customer_id}`,
    customerId: ticket.customer_id,
    priority: PRIORITY_TO_UI[ticket.priority] || ticket.priority,
    status: TICKET_STATUS_TO_UI[ticket.status] || ticket.status,
    assignedTo: 'Support Agent',
    description: ticket.description || '',
    createdAt: formatDateTime(ticket.created_at),
  };
}

function mapLog(log) {
  const durationMs = Math.round((log.duration_seconds || 0) * 1000);
  return {
    id: log.id,
    timestamp: formatDateTime(log.created_at),
    agent: formatAgentName(log.agent_name),
    task: log.task_type || 'Task',
    query: log.input_query || '',
    duration: `${durationMs}ms`,
    tokens: log.tokens_used || 0,
  };
}

function buildContactMap(leads, customers) {
  const map = {};
  leads.forEach((l) => {
    if (l.email) map[`lead:${l.id}`] = l.email;
  });
  customers.forEach((c) => {
    if (c.email) map[`customer:${c.id}`] = c.email;
  });
  return map;
}

function buildCustomerNameMap(customers) {
  const map = {};
  customers.forEach((c) => {
    map[c.id] = c.company || c.name;
  });
  return map;
}

function getChatHistory() {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(CHAT_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveChatHistory(messages) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
}

export const api = {
  async getLeads() {
    const data = await request('/leads/');
    return (data.leads || []).map(mapLead);
  },

  async getLead(id) {
    const lead = await request(`/leads/${id}`);
    return mapLead(lead);
  },

  async createLead(lead) {
    const payload = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      status: STATUS_TO_API[lead.status] || 'new',
      source: lead.source || 'website',
      notes: lead.notes || lead.summary || '',
    };
    const created = await request('/leads/', { method: 'POST', body: JSON.stringify(payload) });
    return mapLead(created);
  },

  async updateLead(id, updatedFields) {
    const payload = {};
    if (updatedFields.name !== undefined) payload.name = updatedFields.name;
    if (updatedFields.email !== undefined) payload.email = updatedFields.email;
    if (updatedFields.phone !== undefined) payload.phone = updatedFields.phone;
    if (updatedFields.company !== undefined) payload.company = updatedFields.company;
    if (updatedFields.status !== undefined) payload.status = STATUS_TO_API[updatedFields.status] || updatedFields.status;
    if (updatedFields.score !== undefined) payload.score = updatedFields.score;
    if (updatedFields.notes !== undefined) payload.notes = updatedFields.notes;
    if (updatedFields.summary !== undefined) payload.notes = updatedFields.summary;

    const updated = await request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    return mapLead(updated);
  },

  async deleteLead(id) {
    return request(`/leads/${id}`, { method: 'DELETE' });
  },

  async getCustomers() {
    const customers = await request('/customers/');
    return customers.map(mapCustomer);
  },

  async createCustomer(customer) {
    const payload = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      notes: customer.notes || '',
    };
    const created = await request('/customers/', { method: 'POST', body: JSON.stringify(payload) });
    return mapCustomer(created);
  },

  async getEmails() {
    const [emails, leadsRaw, customersRaw] = await Promise.all([
      request('/emails/'),
      request('/leads/'),
      request('/customers/'),
    ]);
    const contactMap = buildContactMap(leadsRaw.leads || [], customersRaw || []);
    return emails.map((e) => mapEmail(e, contactMap));
  },

  async generateEmailAI(recipientEmail, context, tone) {
    const [leadsData, customersRaw] = await Promise.all([
      request('/leads/'),
      request('/customers/'),
    ]);
    const lead = (leadsData.leads || []).find((l) => l.email === recipientEmail);
    const customer = (customersRaw || []).find((c) => c.email === recipientEmail);

    const payload = {
      context,
      tone: tone.toLowerCase(),
      lead_id: lead?.id,
      customer_id: customer?.id,
    };

    if (!payload.lead_id && !payload.customer_id) {
      throw new Error('Recipient must match an existing lead or customer email.');
    }

    const created = await request('/emails/draft', { method: 'POST', body: JSON.stringify(payload) });
    const contactMap = buildContactMap(leadsData.leads || [], customersRaw || []);
    return mapEmail(created, contactMap);
  },

  async sendEmail(id) {
    const sent = await request(`/emails/${id}/send`, { method: 'POST' });
    const [leadsData, customersRaw] = await Promise.all([
      request('/leads/'),
      request('/customers/'),
    ]);
    const contactMap = buildContactMap(leadsData.leads || [], customersRaw || []);
    return mapEmail(sent, contactMap);
  },

  async getTickets() {
    const [tickets, customersRaw] = await Promise.all([
      request('/tickets/'),
      request('/customers/'),
    ]);
    const customerMap = buildCustomerNameMap(customersRaw || []);
    return tickets.map((t) => mapTicket(t, customerMap));
  },

  async createTicket(ticket) {
    const customersRaw = await request('/customers/');
    const customer = (customersRaw || []).find(
      (c) => c.name === ticket.customer || c.company === ticket.customer
    );

    if (!customer) {
      throw new Error('Please select a valid customer.');
    }

    const payload = {
      customer_id: customer.id,
      subject: ticket.title,
      description: ticket.description || ticket.title,
      priority: PRIORITY_TO_API[ticket.priority] || 'medium',
    };

    const created = await request('/tickets/', { method: 'POST', body: JSON.stringify(payload) });
    const customerMap = buildCustomerNameMap(customersRaw || []);
    return mapTicket(created, customerMap);
  },

  async updateTicket(id, updatedFields) {
    const payload = {};
    if (updatedFields.title !== undefined) payload.subject = updatedFields.title;
    if (updatedFields.status !== undefined) payload.status = TICKET_STATUS_TO_API[updatedFields.status] || updatedFields.status;
    if (updatedFields.priority !== undefined) payload.priority = PRIORITY_TO_API[updatedFields.priority] || updatedFields.priority;

    const updated = await request(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    const customersRaw = await request('/customers/');
    const customerMap = buildCustomerNameMap(customersRaw || []);
    return mapTicket(updated, customerMap);
  },

  async getAnalytics() {
    const [dashboard, pipeline, reports] = await Promise.all([
      request('/analytics/dashboard'),
      request('/analytics/pipeline'),
      request('/analytics/reports'),
    ]);

    const leadsByStatus = dashboard.leads_by_status || {};
    const pipelineData = Object.entries(leadsByStatus).map(([stage, count]) => ({
      stage: STATUS_TO_UI[stage] || stage,
      count,
    }));

    const conversionRate = Math.round(reports.conversion_rate || pipeline.conversion_rate || 0);

    return {
      metrics: {
        totalLeads: dashboard.total_leads || 0,
        activeCustomers: dashboard.total_customers || 0,
        conversionRate,
        revenuePipeline: (dashboard.total_customers || 0) * 350000,
        openTickets: dashboard.open_tickets || 0,
        emailsSent: dashboard.emails_sent || 0,
      },
      pipelineData,
      monthlyData: [
        { name: 'Jan', leads: 42, conversions: 8 },
        { name: 'Feb', leads: 50, conversions: 12 },
        { name: 'Mar', leads: 64, conversions: 18 },
        { name: 'Apr', leads: 82, conversions: 24 },
        { name: 'May', leads: 95, conversions: 31 },
        { name: 'Jun', leads: dashboard.total_leads || 112, conversions: reports.leads_won || 40 },
      ],
      sourcesData: [
        { name: 'Direct Inbound', value: 45 },
        { name: 'Cold Email AI', value: 30 },
        { name: 'Web Traffic', value: 15 },
        { name: 'Social/LinkedIn', value: 10 },
      ],
      aiInsights: [
        `Pipeline has ${dashboard.total_leads || 0} leads with ${conversionRate}% conversion rate.`,
        `${dashboard.open_tickets || 0} support tickets currently open.`,
        `${dashboard.emails_sent || 0} emails sent through the Communication Agent.`,
        `Analytics Agent reports ${reports.leads_won || 0} won and ${reports.leads_lost || 0} lost leads.`,
      ],
      recentActivities: dashboard.recent_activities || [],
    };
  },

  async getAgentLogs() {
    const data = await request('/agent/logs');
    return (data.logs || []).map(mapLog);
  },

  logActivity() {
    // Agent logs are persisted by the backend; no-op on frontend.
  },

  async getChatMessages() {
    return getChatHistory();
  },

  async sendChatMessage(message) {
    const userMsg = {
      sender: 'user',
      message,
      timestamp: new Date().toTimeString().substring(0, 5),
    };

    const chat = getChatHistory();
    chat.push(userMsg);
    saveChatHistory(chat);

    const result = await request('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });

    const agentName =
      result.agents_used?.length > 0
        ? formatAgentName(result.agents_used[0])
        : 'CRM Orchestrator';

    const agentResponse = {
      sender: 'agent',
      name: agentName,
      message: result.response,
      timestamp: new Date().toTimeString().substring(0, 5),
      agentsUsed: result.agents_used || [],
      actionsTaken: result.actions_taken || [],
    };

    chat.push(agentResponse);
    saveChatHistory(chat);

    return agentResponse;
  },

  getSettings() {
    if (typeof window === 'undefined') {
      return { llmModel: 'gemini-2.0-flash', temperature: '0.2', leadThreshold: '70', autoEmail: true };
    }
    const stored = localStorage.getItem('crm_settings');
    return stored
      ? JSON.parse(stored)
      : { llmModel: 'gemini-2.0-flash', temperature: '0.2', leadThreshold: '70', autoEmail: true };
  },

  saveSettings(settings) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_settings', JSON.stringify(settings));
    }
    return settings;
  },
};
