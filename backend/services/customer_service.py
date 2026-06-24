"""
Customer service - CRUD operations for customers.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models.customer import Customer
from schemas.customer import CustomerCreate, CustomerUpdate


def get_customers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
) -> list[Customer]:
    """Retrieve customers with optional search by name, email, or company."""
    query = db.query(Customer)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Customer.name.ilike(search_pattern),
                Customer.email.ilike(search_pattern),
                Customer.company.ilike(search_pattern),
            )
        )

    return query.order_by(Customer.created_at.desc()).offset(skip).limit(limit).all()


def get_customer_by_id(db: Session, customer_id: int) -> Customer:
    """Retrieve a single customer by ID. Raises HTTP 404 if not found."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {customer_id} not found",
        )
    return customer


def create_customer(db: Session, customer_data: CustomerCreate) -> Customer:
    """Create a new customer from the provided data."""
    new_customer = Customer(**customer_data.model_dump())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer


def update_customer(db: Session, customer_id: int, customer_data: CustomerUpdate) -> Customer:
    """Update an existing customer. Only non-None fields are updated. Raises 404 if not found."""
    customer = get_customer_by_id(db, customer_id)
    update_data = customer_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer
