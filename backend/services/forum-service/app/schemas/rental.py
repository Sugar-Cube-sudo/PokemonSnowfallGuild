#!/usr/bin/env python3
"""
Rental Pydantic Schemas

Defines Pydantic schemas for Pokémon rental functionality.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator

from .common import BaseTimestampSchema, UserInfo


class PokemonInfo(BaseModel):
    """Schema for Pokémon information."""
    pokemon_id: int = Field(..., description="Pokémon species ID")
    pokemon_name: str = Field(..., min_length=1, max_length=100, description="Pokémon name")
    pokemon_level: int = Field(..., ge=1, le=100, description="Pokémon level")
    pokemon_nature: Optional[str] = Field(None, max_length=50, description="Pokémon nature")
    pokemon_ability: Optional[str] = Field(None, max_length=100, description="Pokémon ability")
    pokemon_moves: Optional[List[str]] = Field(None, description="List of Pokémon moves")
    pokemon_stats: Optional[Dict[str, Any]] = Field(None, description="IV/EV stats")
    pokemon_items: Optional[List[str]] = Field(None, description="Held items")
    pokemon_description: Optional[str] = Field(None, description="Additional description")
    
    @field_validator('pokemon_moves')
    @classmethod
    def validate_moves(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate Pokémon moves."""
        if v is None:
            return v
        if len(v) > 4:
            raise ValueError("Pokémon can have at most 4 moves")
        return [move.strip() for move in v if move.strip()]
    
    @field_validator('pokemon_items')
    @classmethod
    def validate_items(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate held items."""
        if v is None:
            return v
        return [item.strip() for item in v if item.strip()]


class RentalTerms(BaseModel):
    """Schema for rental terms."""
    rental_type: str = Field(default="daily", description="Rental type")
    rental_price: Optional[float] = Field(None, ge=0, description="Rental price")
    rental_currency: str = Field(default="coins", description="Currency type")
    min_rental_duration: Optional[int] = Field(None, ge=1, description="Minimum rental duration in hours")
    max_rental_duration: Optional[int] = Field(None, ge=1, description="Maximum rental duration in hours")
    is_negotiable: bool = Field(default=True, description="Whether price is negotiable")
    requires_deposit: bool = Field(default=False, description="Whether deposit is required")
    deposit_amount: Optional[float] = Field(None, ge=0, description="Deposit amount")
    
    @field_validator('rental_type')
    @classmethod
    def validate_rental_type(cls, v: str) -> str:
        """Validate rental type."""
        allowed_types = ["hourly", "daily", "weekly", "monthly", "fixed_duration"]
        if v not in allowed_types:
            raise ValueError(f"Rental type must be one of: {', '.join(allowed_types)}")
        return v
    
    @field_validator('rental_currency')
    @classmethod
    def validate_currency(cls, v: str) -> str:
        """Validate currency type."""
        allowed_currencies = ["coins", "points", "credits", "real_money"]
        if v not in allowed_currencies:
            raise ValueError(f"Currency must be one of: {', '.join(allowed_currencies)}")
        return v


class RentalConditions(BaseModel):
    """Schema for rental conditions."""
    rental_conditions: Optional[str] = Field(None, description="General rental conditions")
    renter_requirements: Optional[str] = Field(None, description="Requirements for renters")
    usage_restrictions: Optional[List[str]] = Field(None, description="Usage restrictions")
    contact_method: Optional[str] = Field(None, description="Preferred contact method")
    contact_info: Optional[str] = Field(None, description="Contact information")
    auto_accept_rentals: bool = Field(default=False, description="Auto-accept rental requests")
    
    @field_validator('contact_method')
    @classmethod
    def validate_contact_method(cls, v: Optional[str]) -> Optional[str]:
        """Validate contact method."""
        if v is None:
            return v
        allowed_methods = ["in_game", "discord", "email", "forum_message", "other"]
        if v not in allowed_methods:
            raise ValueError(f"Contact method must be one of: {', '.join(allowed_methods)}")
        return v


class RentalInfoBase(PokemonInfo, RentalTerms, RentalConditions):
    """Base rental information schema."""
    pass


class RentalInfoCreate(RentalInfoBase):
    """Schema for creating rental information."""
    pass


class RentalInfoUpdate(BaseModel):
    """Schema for updating rental information."""
    # Pokémon info updates
    pokemon_level: Optional[int] = Field(None, ge=1, le=100)
    pokemon_nature: Optional[str] = Field(None, max_length=50)
    pokemon_ability: Optional[str] = Field(None, max_length=100)
    pokemon_moves: Optional[List[str]] = None
    pokemon_stats: Optional[Dict[str, Any]] = None
    pokemon_items: Optional[List[str]] = None
    pokemon_description: Optional[str] = None
    
    # Rental terms updates
    rental_type: Optional[str] = None
    rental_price: Optional[float] = Field(None, ge=0)
    rental_currency: Optional[str] = None
    min_rental_duration: Optional[int] = Field(None, ge=1)
    max_rental_duration: Optional[int] = Field(None, ge=1)
    is_negotiable: Optional[bool] = None
    requires_deposit: Optional[bool] = None
    deposit_amount: Optional[float] = Field(None, ge=0)
    
    # Conditions updates
    rental_conditions: Optional[str] = None
    renter_requirements: Optional[str] = None
    usage_restrictions: Optional[List[str]] = None
    contact_method: Optional[str] = None
    contact_info: Optional[str] = None
    auto_accept_rentals: Optional[bool] = None
    
    # Status update
    status: Optional[str] = None
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        """Validate rental status."""
        if v is None:
            return v
        allowed_statuses = ["available", "pending", "rented", "completed", "cancelled", "unavailable"]
        if v not in allowed_statuses:
            raise ValueError(f"Status must be one of: {', '.join(allowed_statuses)}")
        return v


class RentalInfoResponse(RentalInfoBase, BaseTimestampSchema):
    """Schema for rental information response."""
    id: int
    post_id: int
    owner_id: int
    renter_id: Optional[int] = None
    status: str
    
    # Current rental info
    current_rental_start: Optional[datetime] = None
    current_rental_end: Optional[datetime] = None
    rental_duration_hours: Optional[int] = None
    
    # Statistics
    total_rentals: int = 0
    total_rental_hours: int = 0
    average_rating: Optional[float] = None
    last_rented_at: Optional[datetime] = None
    
    # Related data
    owner: Optional[UserInfo] = None
    renter: Optional[UserInfo] = None
    
    model_config = ConfigDict(from_attributes=True)


class RentalRequestCreate(BaseModel):
    """Schema for creating a rental request."""
    rental_id: int = Field(..., description="Rental ID")
    duration_hours: int = Field(..., ge=1, description="Requested duration in hours")
    message: Optional[str] = Field(None, max_length=1000, description="Message to owner")
    offered_price: Optional[float] = Field(None, ge=0, description="Offered price (if negotiable)")
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v: Optional[str]) -> Optional[str]:
        """Validate request message."""
        return v.strip() if v else v


class RentalRequestUpdate(BaseModel):
    """Schema for updating a rental request."""
    status: str = Field(..., description="Request status")
    response_message: Optional[str] = Field(None, max_length=1000, description="Response message")
    counter_offer_price: Optional[float] = Field(None, ge=0, description="Counter offer price")
    counter_offer_duration: Optional[int] = Field(None, ge=1, description="Counter offer duration")
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Validate request status."""
        allowed_statuses = ["pending", "approved", "rejected", "cancelled", "completed"]
        if v not in allowed_statuses:
            raise ValueError(f"Status must be one of: {', '.join(allowed_statuses)}")
        return v


class RentalRequestResponse(BaseModel):
    """Schema for rental request response."""
    id: int
    rental_id: int
    requester_id: int
    owner_id: int
    status: str
    duration_hours: int
    message: Optional[str] = None
    offered_price: Optional[float] = None
    response_message: Optional[str] = None
    counter_offer_price: Optional[float] = None
    counter_offer_duration: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    # Related data
    requester: Optional[UserInfo] = None
    owner: Optional[UserInfo] = None
    rental_info: Optional[RentalInfoResponse] = None
    
    model_config = ConfigDict(from_attributes=True)


class RentalStatsResponse(BaseModel):
    """Schema for rental statistics."""
    rental_id: int
    total_requests: int
    approved_requests: int
    total_rental_time: int
    total_earnings: float
    average_rating: Optional[float] = None
    popularity_score: float
    
    model_config = ConfigDict(from_attributes=True)


class RentalSearchParams(BaseModel):
    """Schema for rental search parameters."""
    pokemon_name: Optional[str] = Field(None, description="Search by Pokémon name")
    pokemon_id: Optional[int] = Field(None, description="Filter by Pokémon ID")
    min_level: Optional[int] = Field(None, ge=1, le=100, description="Minimum level")
    max_level: Optional[int] = Field(None, ge=1, le=100, description="Maximum level")
    nature: Optional[str] = Field(None, description="Filter by nature")
    ability: Optional[str] = Field(None, description="Filter by ability")
    rental_type: Optional[str] = Field(None, description="Filter by rental type")
    max_price: Optional[float] = Field(None, ge=0, description="Maximum price")
    currency: Optional[str] = Field(None, description="Filter by currency")
    status: Optional[str] = Field(None, description="Filter by status")
    owner_id: Optional[int] = Field(None, description="Filter by owner")
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$", description="Sort order")
    
    @field_validator('sort_by')
    @classmethod
    def validate_sort_by(cls, v: str) -> str:
        """Validate sort field."""
        allowed_fields = [
            "created_at", "updated_at", "pokemon_level", "rental_price", 
            "total_rentals", "average_rating", "last_rented_at"
        ]
        if v not in allowed_fields:
            raise ValueError(f"Sort field must be one of: {', '.join(allowed_fields)}")
        return v