"""
Seed script - populates the database with realistic sample data.
Run with: python seed_data.py
"""

from datetime import datetime, timedelta

from database import Base, engine, SessionLocal
from models.user import User
from models.lead import Lead
from models.customer import Customer
from models.interaction import Interaction
from models.ticket import Ticket
from models.email_model import EmailRecord
from models.followup import FollowUp
from utils.security import hash_password


def seed():
    """Create all tables and populate with sample data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if data already exists
        if db.query(User).first():
            print("Database already contains data. Skipping seed.")
            return

        # ─────────────────────────────────────────────
        # USERS (3)
        # ─────────────────────────────────────────────
        users = [
            User(
                name="Rajesh Kumar",
                email="rajesh@crm.com",
                password_hash=hash_password("admin123"),
                role="admin",
            ),
            User(
                name="Priya Sharma",
                email="priya@crm.com",
                password_hash=hash_password("sales123"),
                role="sales",
            ),
            User(
                name="Amit Patel",
                email="amit@crm.com",
                password_hash=hash_password("support123"),
                role="support",
            ),
        ]
        db.add_all(users)
        db.flush()
        print(f"Created {len(users)} users")

        # ─────────────────────────────────────────────
        # LEADS (15)
        # ─────────────────────────────────────────────
        leads = [
            Lead(name="Vikram Mehta", email="vikram@tataconsulting.com", phone="+91-9876543210",
                 company="Tata Consultancy Services", status="qualified", score=85,
                 source="linkedin", notes="Interested in enterprise CRM solution", assigned_to=users[1].id),
            Lead(name="Ananya Reddy", email="ananya@infosys.com", phone="+91-9876543211",
                 company="Infosys Ltd", status="proposal", score=92,
                 source="referral", notes="Looking for AI-powered analytics dashboard", assigned_to=users[1].id),
            Lead(name="Suresh Nair", email="suresh@wipro.com", phone="+91-9876543212",
                 company="Wipro Technologies", status="new", score=35,
                 source="website", notes="Downloaded whitepaper on CRM automation"),
            Lead(name="Deepika Iyer", email="deepika@reliance.com", phone="+91-9876543213",
                 company="Reliance Industries", status="contacted", score=60,
                 source="cold_call", notes="Scheduled initial discovery call", assigned_to=users[1].id),
            Lead(name="Arjun Singh", email="arjun@mahindra.com", phone="+91-9876543214",
                 company="Mahindra Group", status="won", score=95,
                 source="referral", notes="Signed 2-year enterprise contract", assigned_to=users[1].id),
            Lead(name="Kavita Joshi", email="kavita@airtel.com", phone="+91-9876543215",
                 company="Bharti Airtel", status="new", score=20,
                 source="website", notes="Visited pricing page twice"),
            Lead(name="Rohit Bansal", email="rohit@hcltech.com", phone="+91-9876543216",
                 company="HCL Technologies", status="qualified", score=75,
                 source="linkedin", notes="Attended product demo webinar", assigned_to=users[1].id),
            Lead(name="Meera Gupta", email="meera@techm.com", phone="+91-9876543217",
                 company="Tech Mahindra", status="lost", score=40,
                 source="cold_call", notes="Chose competitor solution - budget constraints"),
            Lead(name="Sanjay Deshmukh", email="sanjay@ltimindtree.com", phone="+91-9876543218",
                 company="LTIMindtree", status="contacted", score=55,
                 source="referral", notes="Referred by Vikram from TCS"),
            Lead(name="Priyanka Chopra", email="priyanka@adani.com", phone="+91-9876543219",
                 company="Adani Group", status="proposal", score=88,
                 source="linkedin", notes="Proposal sent for multi-department CRM rollout", assigned_to=users[1].id),
            Lead(name="Karan Malhotra", email="karan@bajaj.com", phone="+91-9876543220",
                 company="Bajaj Finserv", status="new", score=15,
                 source="website", notes="Filled out contact form"),
            Lead(name="Nisha Agarwal", email="nisha@godrej.com", phone="+91-9876543221",
                 company="Godrej Industries", status="qualified", score=70,
                 source="other", notes="Met at CII business summit", assigned_to=users[1].id),
            Lead(name="Rahul Verma", email="rahul@zomato.com", phone="+91-9876543222",
                 company="Zomato Ltd", status="won", score=90,
                 source="referral", notes="Closed deal - startup tier package"),
            Lead(name="Sneha Patil", email="sneha@persistent.com", phone="+91-9876543223",
                 company="Persistent Systems", status="lost", score=30,
                 source="cold_call", notes="No current budget allocation"),
            Lead(name="Aditya Bhat", email="aditya@mphasis.com", phone="+91-9876543224",
                 company="Mphasis Ltd", status="contacted", score=50,
                 source="linkedin", notes="Responded to LinkedIn outreach"),
        ]
        db.add_all(leads)
        db.flush()
        print(f"Created {len(leads)} leads")

        # ─────────────────────────────────────────────
        # CUSTOMERS (8)
        # ─────────────────────────────────────────────
        customers = [
            Customer(name="Arjun Singh", email="arjun@mahindra.com", phone="+91-9876543214",
                     company="Mahindra Group", address="Gateway Building, Apollo Bunder, Mumbai 400001",
                     notes="Enterprise client - 2 year contract"),
            Customer(name="Rahul Verma", email="rahul@zomato.com", phone="+91-9876543222",
                     company="Zomato Ltd", address="Ground Floor, 12A, Megacity, Sector 25, Gurugram 122002",
                     notes="Startup tier - monthly billing"),
            Customer(name="Pooja Krishnan", email="pooja@bharatpe.com", phone="+91-9812345678",
                     company="BharatPe", address="Tower B, Unitech Cyber Park, Sector 39, Gurugram 122003",
                     notes="Fintech client - custom integration"),
            Customer(name="Manish Tiwari", email="manish@dream11.com", phone="+91-9898765432",
                     company="Dream11", address="One BKC, Bandra Kurla Complex, Mumbai 400051",
                     notes="Gaming platform - high volume API usage"),
            Customer(name="Lakshmi Sundaram", email="lakshmi@freshworks.com", phone="+91-9845123456",
                     company="Freshworks Inc", address="Global Infocity, OMR, Chennai 600119",
                     notes="SaaS partner - reseller agreement"),
            Customer(name="Vivek Ramaswamy", email="vivek@ola.com", phone="+91-9871234567",
                     company="Ola Cabs", address="Pritech Park, Outer Ring Road, Bangalore 560103",
                     notes="Mobility sector - driver CRM module"),
            Customer(name="Anjali Menon", email="anjali@swiggy.com", phone="+91-9823456789",
                     company="Swiggy", address="Tower D, IBC Knowledge Park, Bangalore 560029",
                     notes="Food-tech - customer support integration"),
            Customer(name="Devesh Khanna", email="devesh@paytm.com", phone="+91-9834567890",
                     company="Paytm", address="One97 Communications, Sector 1, Noida 201301",
                     notes="Payments vertical - ticketing system"),
        ]
        db.add_all(customers)
        db.flush()
        print(f"Created {len(customers)} customers")

        # ─────────────────────────────────────────────
        # INTERACTIONS (10)
        # ─────────────────────────────────────────────
        now = datetime.utcnow()
        interactions = [
            Interaction(lead_id=leads[0].id, type="call", subject="Discovery call with TCS",
                        content="Discussed requirements for 500+ user CRM deployment. Budget approved.",
                        date=now - timedelta(days=5), created_by=users[1].id),
            Interaction(lead_id=leads[1].id, type="meeting", subject="Product demo for Infosys",
                        content="Presented AI analytics features. Very positive response from CTO.",
                        date=now - timedelta(days=3), created_by=users[1].id),
            Interaction(lead_id=leads[3].id, type="email", subject="Follow-up email to Reliance",
                        content="Sent product brochure and pricing details as discussed.",
                        date=now - timedelta(days=7), created_by=users[1].id),
            Interaction(customer_id=customers[0].id, type="call", subject="Quarterly review with Mahindra",
                        content="Reviewed usage metrics and discussed renewal. Client satisfied.",
                        date=now - timedelta(days=2), created_by=users[0].id),
            Interaction(customer_id=customers[1].id, type="email", subject="Onboarding checklist for Zomato",
                        content="Sent welcome email with setup guide and API documentation.",
                        date=now - timedelta(days=10), created_by=users[1].id),
            Interaction(customer_id=customers[2].id, type="meeting", subject="Integration planning with BharatPe",
                        content="Technical deep-dive on payment gateway integration requirements.",
                        date=now - timedelta(days=1), created_by=users[0].id),
            Interaction(lead_id=leads[6].id, type="call", subject="Webinar follow-up with HCL",
                        content="Called to discuss specific features shown during product demo webinar.",
                        date=now - timedelta(days=4), created_by=users[1].id),
            Interaction(customer_id=customers[3].id, type="note", subject="Dream11 support escalation",
                        content="Client reported API latency issues during IPL season. Escalated to engineering.",
                        date=now - timedelta(hours=12), created_by=users[2].id),
            Interaction(lead_id=leads[9].id, type="meeting", subject="Proposal presentation to Adani Group",
                        content="Presented comprehensive CRM solution. Awaiting board approval.",
                        date=now - timedelta(days=6), created_by=users[1].id),
            Interaction(customer_id=customers[4].id, type="email", subject="Freshworks partnership renewal",
                        content="Sent updated reseller agreement for FY26. Terms improved.",
                        date=now - timedelta(days=8), created_by=users[0].id),
        ]
        db.add_all(interactions)
        db.flush()
        print(f"Created {len(interactions)} interactions")

        # ─────────────────────────────────────────────
        # TICKETS (5)
        # ─────────────────────────────────────────────
        tickets = [
            Ticket(customer_id=customers[3].id, subject="API response time degradation",
                   description="Dream11 reporting 2x increase in API response times during peak hours. Need immediate investigation.",
                   status="open", priority="urgent", assigned_to=users[2].id),
            Ticket(customer_id=customers[1].id, subject="Data export not working",
                   description="Zomato unable to export customer data in CSV format. Error 500 on export endpoint.",
                   status="in_progress", priority="high", assigned_to=users[2].id),
            Ticket(customer_id=customers[6].id, subject="Dashboard loading slowly",
                   description="Swiggy analytics dashboard takes 15+ seconds to load. Performance optimization needed.",
                   status="open", priority="medium"),
            Ticket(customer_id=customers[7].id, subject="Login SSO integration issue",
                   description="Paytm SSO integration failing intermittently. SAML assertion errors in logs.",
                   status="resolved", priority="high", assigned_to=users[2].id,
                   resolved_at=now - timedelta(days=1)),
            Ticket(customer_id=customers[4].id, subject="Feature request: bulk import",
                   description="Freshworks requesting bulk contact import via CSV with field mapping.",
                   status="open", priority="low"),
        ]
        db.add_all(tickets)
        db.flush()
        print(f"Created {len(tickets)} tickets")

        # ─────────────────────────────────────────────
        # EMAIL RECORDS (5)
        # ─────────────────────────────────────────────
        email_records = [
            EmailRecord(lead_id=leads[0].id, subject="CRM Enterprise Solution Overview",
                        body="Dear Vikram,\n\nThank you for your interest in our enterprise CRM solution. Attached is a comprehensive overview of our platform capabilities, including AI-powered lead scoring, automated workflows, and multi-channel engagement tools.\n\nBest regards,\nPriya Sharma",
                        status="sent", tone="formal", sent_at=now - timedelta(days=5)),
            EmailRecord(lead_id=leads[3].id, subject="Following Up on Our Conversation",
                        body="Hi Deepika,\n\nIt was great speaking with you yesterday. As discussed, I'm sharing our pricing structure and ROI calculator. Would love to schedule a deeper dive into your specific requirements.\n\nWarm regards,\nPriya",
                        status="sent", tone="friendly", sent_at=now - timedelta(days=6)),
            EmailRecord(lead_id=leads[9].id, subject="Urgent: Proposal Deadline Approaching",
                        body="Dear Priyanka,\n\nI wanted to bring to your attention that the special pricing we discussed is valid until the end of this month. I'd recommend we finalize the terms at the earliest to lock in these rates.\n\nBest,\nPriya Sharma",
                        status="sent", tone="urgent", sent_at=now - timedelta(days=2)),
            EmailRecord(customer_id=customers[0].id, subject="Quarterly Business Review Summary",
                        body="Dear Arjun,\n\nPlease find attached the summary of our quarterly business review. Key highlights include 30% increase in team productivity and 45% reduction in response times.\n\nLooking forward to continued partnership.\n\nRegards,\nRajesh Kumar",
                        status="draft", tone="formal"),
            EmailRecord(lead_id=leads[8].id, subject="Quick Check-in",
                        body="Hi Sanjay,\n\nJust checking in to see if you had a chance to review the materials I sent over last week. Happy to hop on a quick call to address any questions.\n\nCheers,\nPriya",
                        status="draft", tone="followup"),
        ]
        db.add_all(email_records)
        db.flush()
        print(f"Created {len(email_records)} email records")

        # ─────────────────────────────────────────────
        # FOLLOW-UPS (3)
        # ─────────────────────────────────────────────
        followups = [
            FollowUp(lead_id=leads[3].id, type="call",
                     notes="Call Deepika at Reliance to discuss proposal timeline",
                     due_date=now + timedelta(days=2), completed=False),
            FollowUp(lead_id=leads[1].id, type="meeting",
                     notes="Schedule on-site demo at Infosys Bangalore campus",
                     due_date=now + timedelta(days=5), completed=False),
            FollowUp(lead_id=leads[8].id, type="email",
                     notes="Send case study to Sanjay at LTIMindtree",
                     due_date=now - timedelta(days=1), completed=True),
        ]
        db.add_all(followups)
        db.flush()
        print(f"Created {len(followups)} follow-ups")

        # Commit everything
        db.commit()

        print("\n" + "=" * 50)
        print("Database seeded successfully!")
        print("=" * 50)
        print(f"\nSummary:")
        print(f"   Users:        {len(users)}")
        print(f"   Leads:        {len(leads)}")
        print(f"   Customers:    {len(customers)}")
        print(f"   Interactions: {len(interactions)}")
        print(f"   Tickets:      {len(tickets)}")
        print(f"   Emails:       {len(email_records)}")
        print(f"   Follow-ups:   {len(followups)}")
        print(f"\nLogin Credentials:")
        print(f"   Admin:   rajesh@crm.com / admin123")
        print(f"   Sales:   priya@crm.com  / sales123")
        print(f"   Support: amit@crm.com   / support123")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
