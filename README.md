# NexusCRM — Multi-Agent AI-Powered Customer Relationship Management

NexusCRM is a production-ready, full-stack AI-Powered Customer Relationship Management (CRM) system. It features a custom **5-Agent orchestration loop** (built natively in Python without heavy external frameworks) that operates on top of a FastAPI backend and a premium glassmorphic Next.js frontend.

This project is designed as an interview-explainable, portfolio-worthy application that showcases how to build complex multi-agent architectures, structured tool-calling protocols, and dynamic data-driven interfaces.

---

## 🔗 Live Deployments

* **Frontend Web App (Netlify)**: [https://glowing-muffin-ad2f7c.netlify.app](https://glowing-muffin-ad2f7c.netlify.app)
* **Backend REST API (Render)**: [https://nexuscrm-6nh2.onrender.com](https://nexuscrm-6nh2.onrender.com)
* **GitHub Repository**: [https://github.com/sahil5812/NexusCRM.git](https://github.com/sahil5812/NexusCRM.git)

---

## 🔑 Test Accounts (Pre-Seeded)

Log in using any of the following credentials on the live application:
* **Administrator**: `rajesh@crm.com` / `admin123`
* **Sales Specialist**: `priya@crm.com` / `sales123`
* **Support Engineer**: `amit@crm.com` / `support123`

---

## 🏗️ System Architecture & Agent Flow

Unlike boilerplate wrapper applications that use monolithic frameworks (like CrewAI or LangGraph), NexusCRM uses a **custom-built agent engine** written in native Python. This provides full visibility into prompts, reasoning traces, and database operations.

```
                    ┌────────────────────────┐
                    │      Web Browser       │
                    └───────────┬────────────┘
                                │ HTTP / JSON
                    ┌───────────▼────────────┐
                    │    FastAPI Gateway     │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │    Orchestrator Agent   │
                    └─────┬──────────────┬───┘
                          │              │
        ┌─────────────────┼──────────────┼──────────────────┐
        │                 │              │                  │
 ┌──────▼──────┐   ┌──────▼──────┐┌──────▼──────┐    ┌──────▼──────┐
 │ Lead Agent  │   │ Comms Agent ││Support Agent│    │Analytics Agt│
 └──────┬──────┘   └──────┬──────┘└──────┬──────┘    └──────┬──────┘
        │                 │              │                  │
        └─────────────────┼──────────────┼──────────────────┘
                          │              │
                    ┌─────▼──────────────▼───┐
                    │   SQLAlchemy 2.0 ORM   │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   PostgreSQL / SQLite  │
                    └────────────────────────┘
```

### The Hub-and-Spoke Agent Engine

1. **CRM Orchestrator (The Controller)**: Receives natural language queries from the frontend console. It prompts Gemini (`gemini-2.0-flash`) to parse user intent against an available agent catalogue and returns a routing plan in structured JSON. If a query requires multiple agents (e.g., "Find the best lead and write them a pitch email"), it schedules them sequentially.
2. **Lead Intelligence Agent**: Specializes in evaluating incoming prospects.
   * *Tools*: Lists leads, fetches logs, computes custom **AI Lead Scores (0-100)** based on profile metrics (company size, source, engagement), and buckets them into **Hot (>70)**, **Warm (40-70)**, or **Cold (<40)**.
3. **Communication Agent**: Manages email drafting and follow-up schedules.
   * *Tools*: Compiles drafts given client context and selectable tones (**Formal, Friendly, Urgent, Follow-up**), and automatically saves drafts to the database. Suggests follow-up intervals based on last interaction dates.
4. **Customer Support Agent**: Automates helpdesk resolution.
   * *Tools*: Manages ticket statuses and priorities. Integrates a **local FAQ knowledge base** to answer client queries directly using semantic context.
5. **Analytics Agent**: Processes raw CRM numbers.
   * *Tools*: Computes dashboard statistics, calculates pipeline conversion values, won/lost ratios, and applies LLM reasoning to summarize business trends.

---

## 🗄️ Database Schema & ORM Model

The backend leverages **SQLAlchemy 2.0** mapped columns to define relations:

* **User**: Roles (admin/sales/support), credentials (Bcrypt hashes), and status.
* **Lead**: Industry profile details, conversion status, AI score, source, and assignee.
* **Customer**: Account value metrics and contact properties.
* **Interaction**: Unified audit trail mapping calls, meetings, notes, and emails to leads or customers.
* **Ticket**: Support cases with priority (Low to Urgent) and status (Open to Closed).
* **EmailRecord**: Tracks mail history, custom tones, draft states, and dispatch times.
* **FollowUp**: Chronological reminders mapped to active sales pipelines.
* **AgentLog**: Unified observability table tracking agent name, execution duration, tokens consumed, input query, and agent output.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 16 (App Router), Recharts (Dynamic Visualization), Vanilla CSS (Custom Design System with Glassmorphism, animations, and responsive layouts).
* **Backend**: FastAPI (Python 3.11+), SQLAlchemy 2.0, Uvicorn.
* **Security**: Stateless JWT auth tokens, direct Bcrypt password verification.
* **AI Engine**: Google Gemini API, Custom JSON tool-calling parser.
* **Production Database**: Serverless PostgreSQL (via Neon / Supabase).
* **Local Database**: SQLite (`crm.db`).

---

## 🚦 Local Installation & Configuration

### 1. Prerequisites
Ensure you have Python 3.11+ and Node.js 18+ installed on your system.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables in `backend/.env`:
   ```env
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   DATABASE_URL=sqlite:///./crm.db
   GEMINI_API_KEY=your-gemini-api-key-here
   ```
4. Seed the database with sample data:
   * **On Windows (PowerShell)**:
     ```powershell
     $env:PYTHONIOENCODING="utf-8"; python seed_data.py
     ```
   * **On Mac/Linux**:
     ```bash
     PYTHONIOENCODING=utf-8 python seed_data.py
     ```
5. Start the FastAPI backend:
   ```bash
   uvicorn main:app --reload --port 8001
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Configure environment variables in `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8001/api
   ```
4. Start the Next.js dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 📈 Deployment Reference

### Backend Deployment (Render.com)
* **Root Directory**: `backend`
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
* **Env Variables**: Set `PYTHON_VERSION=3.11.9` along with keys defined in `.env`.

### Frontend Deployment (Netlify.com)
Deployments are governed by [netlify.toml](file:///C:/Users/Abusahil/OneDrive/Desktop/CRM/netlify.toml):
* **Base Directory**: `frontend`
* **Build Command**: `npm run build`
* **Publish Directory**: `.next`
* **Next.js Runtime**: Enabled via `@netlify/plugin-nextjs`.
