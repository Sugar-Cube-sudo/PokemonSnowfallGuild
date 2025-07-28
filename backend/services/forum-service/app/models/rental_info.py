#!/usr/bin/env python3
"""
Rental Info Model

Defines the database model for Pokémon rental information.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, Numeric, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class RentalType(str, enum.Enum):
    """Rental type enumeration."""
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    FIXED_DURATION = "fixed_duration"


class RentalStatus(str, enum.Enum):
    """Rental status enumeration."""
    AVAILABLE = "available"
    PENDING = "pending"
    RENTED = "rented"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    UNAVAILABLE = "unavailable"


class RentalInfo(Base):
    """Rental information model for Pokémon rentals."""
    
    __tablename__ = "rental_info"
    
    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    post_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("forum_posts.id", ondelete="CASCADE"), 
        nullable=False,
        unique=True,
        index=True
    )
    owner_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # References users.id
    renter_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)  # References users.id
    
    # Pokémon information
    pokemon_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # Pokémon species ID
    pokemon_name: Mapped[str] = mapped_column(String(100), nullable=False)
    pokemon_level: Mapped[int] = mapped_column(Integer, nullable=False)
    pokemon_nature: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    pokemon_ability: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pokemon_moves: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # List of move names
    pokemon_stats: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # IV/EV stats
    pokemon_items: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # Held items
    pokemon_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Rental terms
    rental_type: Mapped[RentalType] = mapped_column(
        Enum(RentalType), 
        default=RentalType.DAILY, 
        nullable=False
    )
    rental_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    rental_currency: Mapped[str] = mapped_column(String(10), default="coins", nullable=False)
    min_rental_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # In hours
    max_rental_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # In hours
    
    # Rental status and conditions
    status: Mapped[RentalStatus] = mapped_column(
        Enum(RentalStatus), 
        default=RentalStatus.AVAILABLE, 
        nullable=False,
        index=True
    )
    is_negotiable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    requires_deposit: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deposit_amount: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Rental conditions and requirements
    rental_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    renter_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    usage_restrictions: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    
    # Current rental information
    current_rental_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    current_rental_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rental_duration_hours: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Rental history and statistics
    total_rentals: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_rental_hours: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    average_rating: Mapped[Optional[float]] = mapped_column(Numeric(3, 2), nullable=True)
    
    # Contact and communication
    contact_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    contact_info: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    auto_accept_rentals: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    last_rented_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    post: Mapped["ForumPost"] = relationship(
        "ForumPost", 
        back_populates="rental_info"
    )
    
    def __repr__(self) -> str:
        return f"<RentalInfo(id={self.id}, pokemon_name='{self.pokemon_name}', status='{self.status}')>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "post_id": self.post_id,
            "owner_id": self.owner_id,
            "renter_id": self.renter_id,
            "pokemon_id": self.pokemon_id,
            "pokemon_name": self.pokemon_name,
            "pokemon_level": self.pokemon_level,
            "pokemon_nature": self.pokemon_nature,
            "pokemon_ability": self.pokemon_ability,
            "pokemon_moves": self.pokemon_moves,
            "pokemon_stats": self.pokemon_stats,
            "pokemon_items": self.pokemon_items,
            "pokemon_description": self.pokemon_description,
            "rental_type": self.rental_type.value if self.rental_type else None,
            "rental_price": float(self.rental_price) if self.rental_price else None,
            "rental_currency": self.rental_currency,
            "min_rental_duration": self.min_rental_duration,
            "max_rental_duration": self.max_rental_duration,
            "status": self.status.value if self.status else None,
            "is_negotiable": self.is_negotiable,
            "requires_deposit": self.requires_deposit,
            "deposit_amount": float(self.deposit_amount) if self.deposit_amount else None,
            "rental_conditions": self.rental_conditions,
            "renter_requirements": self.renter_requirements,
            "usage_restrictions": self.usage_restrictions,
            "current_rental_start": self.current_rental_start.isoformat() if self.current_rental_start else None,
            "current_rental_end": self.current_rental_end.isoformat() if self.current_rental_end else None,
            "rental_duration_hours": self.rental_duration_hours,
            "total_rentals": self.total_rentals,
            "total_rental_hours": self.total_rental_hours,
            "average_rating": float(self.average_rating) if self.average_rating else None,
            "contact_method": self.contact_method,
            "contact_info": self.contact_info,
            "auto_accept_rentals": self.auto_accept_rentals,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_rented_at": self.last_rented_at.isoformat() if self.last_rented_at else None,
        }
    
    def is_available_for_rental(self) -> bool:
        """Check if Pokémon is available for rental."""
        return self.status == RentalStatus.AVAILABLE
    
    def is_currently_rented(self) -> bool:
        """Check if Pokémon is currently rented."""
        return self.status == RentalStatus.RENTED and self.renter_id is not None
    
    def calculate_rental_cost(self, duration_hours: int) -> float:
        """Calculate rental cost based on duration."""
        if not self.rental_price:
            return 0.0
        
        if self.rental_type == RentalType.HOURLY:
            return float(self.rental_price) * duration_hours
        elif self.rental_type == RentalType.DAILY:
            days = max(1, duration_hours / 24)
            return float(self.rental_price) * days
        elif self.rental_type == RentalType.WEEKLY:
            weeks = max(1, duration_hours / (24 * 7))
            return float(self.rental_price) * weeks
        elif self.rental_type == RentalType.MONTHLY:
            months = max(1, duration_hours / (24 * 30))
            return float(self.rental_price) * months
        else:
            return float(self.rental_price)