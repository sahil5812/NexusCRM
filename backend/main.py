"""
AI-Powered CRM API - Main application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import auth, leads, customers, emails, tickets, analytics, interactions
from routers.agent import router as agent_router

app = FastAPI(
    title="AI-Powered CRM API",
    description="Multi-Agent CRM System Backend",
    version="1.0.0",
)

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with API prefixes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(emails.router, prefix="/api/emails", tags=["Emails"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(interactions.router, prefix="/api/interactions", tags=["Interactions"])
app.include_router(agent_router, prefix="/api/agent", tags=["AI Agent"])


@app.on_event("startup")
def on_startup():
    """Create all database tables on application startup."""
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    """Root endpoint - API health check."""
    return {"message": "AI CRM API", "version": "1.0.0"}
