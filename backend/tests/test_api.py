import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add parent directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Base, get_db
from main import app
from utils.security import hash_password

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_crm.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables in the test database
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db():
    # Re-create tables to have a clean slate for each test
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "AI CRM API", "version": "1.0.0"}

def test_auth_flow():
    # 1. Register a user
    register_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpassword123",
        "role": "admin"
    }
    response = client.post("/api/auth/register", json=register_data)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert "id" in data

    # 2. Login with the user
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

def test_leads_crud():
    # 1. Register and Login to get token
    register_data = {
        "name": "Sales Rep",
        "email": "sales_test@example.com",
        "password": "salespassword",
        "role": "sales"
    }
    client.post("/api/auth/register", json=register_data)
    
    login_response = client.post("/api/auth/login", json={
        "email": "sales_test@example.com",
        "password": "salespassword"
    })
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a Lead
    lead_data = {
        "name": "Aarav Mehta",
        "email": "aarav@mehtaotech.com",
        "phone": "+91 98765 43210",
        "company": "Mehta Tech Solutions",
        "status": "New",
        "score": 85,
        "source": "LinkedIn",
        "notes": "Interested in cloud migration services."
    }
    response = client.post("/api/leads/", json=lead_data, headers=headers)
    assert response.status_code == 201
    created_lead = response.json()
    assert created_lead["name"] == "Aarav Mehta"
    assert created_lead["score"] == 85
    lead_id = created_lead["id"]

    # 3. Get the Lead
    response = client.get(f"/api/leads/{lead_id}", headers=headers)
    assert response.status_code == 200
    fetched_lead = response.json()
    assert fetched_lead["name"] == "Aarav Mehta"

    # 4. List Leads
    response = client.get("/api/leads/", headers=headers)
    assert response.status_code == 200
    leads_list = response.json()
    assert len(leads_list) >= 1

    # 5. Update the Lead
    update_data = {
        "status": "Contacted",
        "score": 90
    }
    response = client.put(f"/api/leads/{lead_id}", json=update_data, headers=headers)
    assert response.status_code == 200
    updated_lead = response.json()
    assert updated_lead["status"] == "Contacted"
    assert updated_lead["score"] == 90

    # 6. Delete the Lead
    response = client.delete(f"/api/leads/{lead_id}", headers=headers)
    assert response.status_code == 200
    
    # 7. Verify deletion
    response = client.get(f"/api/leads/{lead_id}", headers=headers)
    assert response.status_code == 404

def test_customers_crud():
    # 1. Login
    client.post("/api/auth/register", json={
        "name": "Admin User",
        "email": "admin_test@example.com",
        "password": "adminpassword",
        "role": "admin"
    })
    login_response = client.post("/api/auth/login", json={
        "email": "admin_test@example.com",
        "password": "adminpassword"
    })
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create customer
    customer_data = {
        "name": "Sanya Malhotra",
        "email": "sanya@malhotradesigns.com",
        "phone": "+91 91234 56789",
        "company": "Malhotra Designs",
        "address": "Mumbai, India",
        "notes": "Valued enterprise design client."
    }
    response = client.post("/api/customers/", json=customer_data, headers=headers)
    assert response.status_code == 201
    customer = response.json()
    assert customer["name"] == "Sanya Malhotra"
    assert customer["company"] == "Malhotra Designs"
