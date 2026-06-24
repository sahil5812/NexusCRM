# NexusCRM — Multi-Agent AI-Powered Customer Relationship Management

NexusCRM is a production-ready, full-stack AI Customer Relationship Management (CRM) system. It features a custom **5-Agent orchestration loop** (built natively in Python without heavy external frameworks) that operates on top of a FastAPI backend and a premium glassmorphic Next.js frontend.

---

## Key Features

* **Intelligent Orchestrator**: Uses LLM capabilities to parse user queries, determine intent, route sub-tasks to specialized agents, and aggregate responses.
* **Lead Scoring & Insights**: Auto-scores leads (1-100) based on profile metrics and engagement, categorizing them into Hot, Warm, or Cold buckets.
* **Email Studio**: Generates context-aware business drafts with configurable tones (Formal, Friendly, Urgent, Follow-up).
* **Auto-Customer Support**: Resolves common queries against a knowledge base, managing tickets dynamically.
* **Rich Analytics**: Visualizes pipeline volumes, conversion rates, and acquisition trends via gradient-filled Recharts.
* **Agent Activity logs**: Displays real-time logging of what tools each agent executed, execution latency, and token footprint.
* **Offline Resilience**: Frontend falls back gracefully to client-side localStorage synchronization if the API is offline.

---

## Tech Stack

* **Frontend**: Next.js 16 (App Router), Recharts, Vanilla CSS (Premium Glassmorphism & Animations).
* **Backend**: FastAPI, SQLAlchemy 2.0 ORM, SQLite.
* **Authentication**: JWT stateless authentication, custom Bcrypt password hashing.
* **AI/LLM**: Google Gemini API (`gemini-2.0-flash`).
* **Agent Engine**: Custom-built tool-calling protocol in native Python.

---

## Quick Start Guide

### 1. Backend API Setup
```bash
cd backend
# Install dependencies
pip install -r requirements.txt

# Seed the database (creates users, leads, customers, etc.)
# (Note: In Windows PowerShell, ensure UTF-8 encoding is enabled)
$env:PYTHONIOENCODING="utf-8"; python seed_data.py

# Start uvicorn
uvicorn main:app --reload --port 8000
```

### 2. Frontend App Setup
```bash
cd frontend
# Install packages
npm install

# Run next build check or start dev server
npm run dev
```

### Test Accounts
Log in using any of the following pre-seeded credentials:
* **Admin**: `rajesh@crm.com` / `admin123`
* **Sales**: `priya@crm.com` / `sales123`
* **Support**: `amit@crm.com` / `support123`
