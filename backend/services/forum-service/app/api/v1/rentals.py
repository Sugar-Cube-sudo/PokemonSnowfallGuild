#!/usr/bin/env python3
"""
Pokemon Rentals API Routes

This module provides REST API endpoints for managing Pokemon rentals.
Includes operations for creating, reading, updating rental information,
and managing rental requests and transactions.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import get_current_user, require_auth
from app.models.forum_post import ForumPost, PostType, PostStatus
from app.models.rental_info import RentalInfo, RentalType, RentalStatus
from app.schemas.rental import (
    RentalInfoCreate,
    RentalInfoUpdate,
    RentalInfoResponse,
    RentalRequestCreate,
    RentalRequestUpdate,
    RentalRequestResponse,
    RentalStatsResponse,
    RentalSearchParams
)
from app.schemas.common import (
    PaginationParams,
    SuccessResponse,
    ErrorResponse
)

router = APIRouter()


@router.get("/", response_model=List[RentalInfoResponse])
async def get_rentals(
    search_params: RentalSearchParams = Depends(),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get list of available Pokemon rentals with filtering and pagination.
    """
    query = db.query(RentalInfo).join(ForumPost).filter(
        ForumPost.status == PostStatus.PUBLISHED,
        ForumPost.post_type == PostType.RENTAL
    )
    
    # Apply availability filter
    if search_params.available_only:
        query = query.filter(RentalInfo.is_available == True)
    
    # Apply rental type filter
    if search_params.rental_type:
        query = query.filter(RentalInfo.rental_type == search_params.rental_type)
    
    # Apply Pokemon name filter
    if search_params.pokemon_name:
        query = query.filter(RentalInfo.pokemon_name.ilike(f"%{search_params.pokemon_name}%"))
    
    # Apply level range filter
    if search_params.min_level:
        query = query.filter(RentalInfo.pokemon_level >= search_params.min_level)
    if search_params.max_level:
        query = query.filter(RentalInfo.pokemon_level <= search_params.max_level)
    
    # Apply price range filter
    if search_params.min_price:
        query = query.filter(RentalInfo.price >= search_params.min_price)
    if search_params.max_price:
        query = query.filter(RentalInfo.price <= search_params.max_price)
    
    # Apply currency filter
    if search_params.currency:
        query = query.filter(RentalInfo.currency == search_params.currency)
    
    # Apply nature filter
    if search_params.nature:
        query = query.filter(RentalInfo.pokemon_nature.ilike(f"%{search_params.nature}%"))
    
    # Apply ability filter
    if search_params.ability:
        query = query.filter(RentalInfo.pokemon_ability.ilike(f"%{search_params.ability}%"))
    
    # Apply owner filter
    if search_params.owner_id:
        query = query.filter(RentalInfo.owner_id == search_params.owner_id)
    
    # Apply sorting
    if search_params.sort_by == 'price':
        order_field = RentalInfo.price
    elif search_params.sort_by == 'level':
        order_field = RentalInfo.pokemon_level
    elif search_params.sort_by == 'created_at':
        order_field = RentalInfo.created_at
    elif search_params.sort_by == 'rental_count':
        order_field = RentalInfo.total_rentals
    else:
        order_field = RentalInfo.created_at
    
    if search_params.sort_order == 'desc':
        query = query.order_by(order_field.desc())
    else:
        query = query.order_by(order_field.asc())
    
    # Apply pagination
    rentals = query.offset(pagination.skip).limit(pagination.limit).all()
    
    # Convert to response format
    rental_responses = []
    for rental in rentals:
        # Get post info
        post = db.query(ForumPost).filter(ForumPost.id == rental.post_id).first()
        
        rental_response = RentalInfoResponse(
            **rental.to_dict(),
            post_title=post.title if post else None,
            post_summary=post.summary if post else None,
            owner_username=None,  # Will be populated by user service
            renter_username=None,  # Will be populated by user service
            is_owner=current_user and current_user['id'] == rental.owner_id,
            is_renter=current_user and current_user['id'] == rental.renter_id,
            can_request=current_user and current_user['id'] != rental.owner_id and rental.is_available
        )
        rental_responses.append(rental_response)
    
    return rental_responses


@router.get("/{rental_id}", response_model=RentalInfoResponse)
async def get_rental(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get a specific Pokemon rental by ID.
    """
    rental = db.query(RentalInfo).filter(RentalInfo.id == rental_id).first()
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Check if associated post is published
    post = db.query(ForumPost).filter(
        ForumPost.id == rental.post_id,
        ForumPost.status == PostStatus.PUBLISHED
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental post not found or not published"
        )
    
    return RentalInfoResponse(
        **rental.to_dict(),
        post_title=post.title,
        post_summary=post.summary,
        owner_username=None,  # Will be populated by user service
        renter_username=None,  # Will be populated by user service
        is_owner=current_user and current_user['id'] == rental.owner_id,
        is_renter=current_user and current_user['id'] == rental.renter_id,
        can_request=current_user and current_user['id'] != rental.owner_id and rental.is_available
    )


@router.put("/{rental_id}", response_model=RentalInfoResponse)
async def update_rental(
    rental_id: int,
    rental_data: RentalInfoUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Update a Pokemon rental. Requires authentication and ownership.
    """
    rental = db.query(RentalInfo).filter(RentalInfo.id == rental_id).first()
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Check ownership
    if current_user['id'] != rental.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this rental"
        )
    
    # Update rental fields
    update_data = rental_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rental, field, value)
    
    db.commit()
    db.refresh(rental)
    
    return await get_rental(rental.id, db, current_user)


@router.delete("/{rental_id}", response_model=SuccessResponse)
async def delete_rental(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Delete a Pokemon rental. Requires authentication and ownership.
    """
    rental = db.query(RentalInfo).filter(RentalInfo.id == rental_id).first()
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Check ownership
    if current_user['id'] != rental.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this rental"
        )
    
    # Check if rental is currently active
    if rental.current_rental_start and not rental.current_rental_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete rental while it's currently active"
        )
    
    db.delete(rental)
    db.commit()
    
    return SuccessResponse(message="Rental deleted successfully")


@router.post("/{rental_id}/request", response_model=RentalRequestResponse)
async def create_rental_request(
    rental_id: int,
    request_data: RentalRequestCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Create a rental request for a Pokemon. Requires authentication.
    """
    rental = db.query(RentalInfo).filter(RentalInfo.id == rental_id).first()
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Check if rental is available
    if not rental.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rental is not available"
        )
    
    # Check if user is not the owner
    if current_user['id'] == rental.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot request your own rental"
        )
    
    # Validate rental duration
    if request_data.duration_days < rental.min_rental_duration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum rental duration is {rental.min_rental_duration} days"
        )
    
    if request_data.duration_days > rental.max_rental_duration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum rental duration is {rental.max_rental_duration} days"
        )
    
    # Calculate total cost
    total_cost = rental.calculate_rental_cost(request_data.duration_days)
    
    # Create rental request (this would typically be stored in a separate table)
    # For now, we'll return the request information
    return RentalRequestResponse(
        rental_id=rental_id,
        requester_id=current_user['id'],
        duration_days=request_data.duration_days,
        message=request_data.message,
        total_cost=total_cost,
        currency=rental.currency,
        status="pending",
        created_at=datetime.utcnow()
    )


@router.post("/{rental_id}/approve", response_model=RentalInfoResponse)
async def approve_rental_request(
    rental_id: int,
    renter_id: int,
    duration_days: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Approve a rental request and start the rental. Requires ownership.
    """
    rental = db.query(RentalInfo).filter(RentalInfo.id == rental_id).first()
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Check ownership
    if current_user['id'] != rental.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve requests for this rental"
        )
    
    # Check if rental is available
    if not rental.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rental is not available"
        )
    
    # Start the rental
    rental.renter_id = renter_id
    rental.current_rental_start = datetime.utcnow()
    rental.current_rental_end = datetime.utcnow() + timedelta(days=duration_days)
    rental.current_rental_duration = duration_days
    rental.is_available = False
    rental.total_rentals += 1
    
    db.commit()
    db.refresh(rental)
    
    return await get_rental(rental.id, db, current_user)


@router.post("/{rental_id}/return", response_model=RentalInfoResponse)
async def return_rental(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Return a rented Pokemon. Can be called by owner or renter.
    """
    rental = db.query(RentalInfo).filter(RentalInfo.id == rental_id).first()
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Check if user is owner or current renter
    if current_user['id'] not in [rental.owner_id, rental.renter_id]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to return this rental"
        )
    
    # Check if rental is currently active
    if not rental.current_rental_start or rental.current_rental_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active rental to return"
        )
    
    # End the rental
    rental.current_rental_end = datetime.utcnow()
    rental.renter_id = None
    rental.is_available = True
    
    db.commit()
    db.refresh(rental)
    
    return await get_rental(rental.id, db, current_user)


@router.get("/{rental_id}/stats", response_model=RentalStatsResponse)
async def get_rental_stats(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get detailed statistics for a specific rental.
    """
    rental = db.query(RentalInfo).filter(RentalInfo.id == rental_id).first()
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Calculate additional stats
    total_revenue = rental.total_rentals * rental.price  # Simplified calculation
    average_rating = 4.5  # This would come from a ratings system
    
    return RentalStatsResponse(
        rental_id=rental_id,
        total_rentals=rental.total_rentals,
        total_revenue=total_revenue,
        average_rating=average_rating,
        is_currently_rented=rental.current_rental_start is not None and rental.current_rental_end is None,
        created_at=rental.created_at,
        last_rented_at=rental.current_rental_start
    )


@router.get("/user/{user_id}/owned", response_model=List[RentalInfoResponse])
async def get_user_owned_rentals(
    user_id: int,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get all rentals owned by a specific user.
    """
    query = db.query(RentalInfo).join(ForumPost).filter(
        RentalInfo.owner_id == user_id,
        ForumPost.status == PostStatus.PUBLISHED
    ).order_by(RentalInfo.created_at.desc())
    
    # Apply pagination
    rentals = query.offset(pagination.skip).limit(pagination.limit).all()
    
    # Convert to response format
    rental_responses = []
    for rental in rentals:
        post = db.query(ForumPost).filter(ForumPost.id == rental.post_id).first()
        
        rental_response = RentalInfoResponse(
            **rental.to_dict(),
            post_title=post.title if post else None,
            post_summary=post.summary if post else None,
            owner_username=None,
            renter_username=None,
            is_owner=current_user and current_user['id'] == rental.owner_id,
            is_renter=current_user and current_user['id'] == rental.renter_id,
            can_request=False  # Can't request your own rentals
        )
        rental_responses.append(rental_response)
    
    return rental_responses


@router.get("/user/{user_id}/rented", response_model=List[RentalInfoResponse])
async def get_user_rented_pokemon(
    user_id: int,
    active_only: bool = Query(False, description="Only return currently active rentals"),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get all Pokemon currently or previously rented by a specific user.
    """
    query = db.query(RentalInfo).join(ForumPost).filter(
        RentalInfo.renter_id == user_id,
        ForumPost.status == PostStatus.PUBLISHED
    )
    
    if active_only:
        query = query.filter(
            RentalInfo.current_rental_start.isnot(None),
            RentalInfo.current_rental_end.is_(None)
        )
    
    query = query.order_by(RentalInfo.current_rental_start.desc())
    
    # Apply pagination
    rentals = query.offset(pagination.skip).limit(pagination.limit).all()
    
    # Convert to response format
    rental_responses = []
    for rental in rentals:
        post = db.query(ForumPost).filter(ForumPost.id == rental.post_id).first()
        
        rental_response = RentalInfoResponse(
            **rental.to_dict(),
            post_title=post.title if post else None,
            post_summary=post.summary if post else None,
            owner_username=None,
            renter_username=None,
            is_owner=current_user and current_user['id'] == rental.owner_id,
            is_renter=current_user and current_user['id'] == rental.renter_id,
            can_request=False  # Already renting
        )
        rental_responses.append(rental_response)
    
    return rental_responses


@router.patch("/{rental_id}/toggle-availability", response_model=RentalInfoResponse)
async def toggle_rental_availability(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Toggle the availability status of a rental. Requires ownership.
    """
    rental = db.query(RentalInfo).filter(RentalInfo.id == rental_id).first()
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Check ownership
    if current_user['id'] != rental.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this rental"
        )
    
    # Can't make available if currently rented
    if not rental.is_available and rental.current_rental_start and not rental.current_rental_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot make rental available while it's currently rented"
        )
    
    rental.is_available = not rental.is_available
    db.commit()
    db.refresh(rental)
    
    return await get_rental(rental.id, db, current_user)