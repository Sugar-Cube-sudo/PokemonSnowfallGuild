#!/usr/bin/env python3
"""
Forum Categories API Routes

This module provides REST API endpoints for managing forum categories.
Includes operations for creating, reading, updating, and deleting categories,
as well as retrieving category statistics and posts.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.core.database import get_db
from app.core.auth import get_current_user, require_admin
from app.models.forum_category import ForumCategory
from app.models.forum_post import ForumPost
from app.schemas.forum_category import (
    ForumCategoryCreate,
    ForumCategoryUpdate,
    ForumCategoryResponse,
    ForumCategoryWithStats,
    ForumCategoryListResponse,
    ForumCategoryStatsResponse
)
from app.schemas.common import (
    PaginationParams,
    SortParams,
    SuccessResponse,
    ErrorResponse
)

router = APIRouter()


@router.get("/", response_model=ForumCategoryListResponse)
async def get_categories(
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    include_inactive: bool = Query(False, description="Include inactive categories"),
    include_hidden: bool = Query(False, description="Include hidden categories"),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get list of forum categories with pagination and filtering.
    
    - **include_inactive**: Include inactive categories (admin only)
    - **include_hidden**: Include hidden categories (admin only)
    - **sort_by**: Sort field (name, sort_order, created_at, post_count)
    - **sort_order**: Sort direction (asc, desc)
    """
    query = db.query(ForumCategory)
    
    # Apply visibility filters
    if not include_inactive or not current_user or not current_user.get('is_admin'):
        query = query.filter(ForumCategory.is_active == True)
    
    if not include_hidden or not current_user or not current_user.get('is_admin'):
        query = query.filter(ForumCategory.is_visible == True)
    
    # Apply sorting
    sort_field = getattr(ForumCategory, sort.sort_by, ForumCategory.sort_order)
    if sort.sort_order == 'desc':
        query = query.order_by(sort_field.desc())
    else:
        query = query.order_by(sort_field.asc())
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    categories = query.offset(pagination.skip).limit(pagination.limit).all()
    
    # Convert to response format with stats
    category_responses = []
    for category in categories:
        # Get post count for this category
        post_count = db.query(func.count(ForumPost.id)).filter(
            ForumPost.category_id == category.id,
            ForumPost.status == 'published'
        ).scalar() or 0
        
        # Get latest post
        latest_post = db.query(ForumPost).filter(
            ForumPost.category_id == category.id,
            ForumPost.status == 'published'
        ).order_by(ForumPost.created_at.desc()).first()
        
        category_data = ForumCategoryWithStats(
            **category.to_dict(),
            post_count=post_count,
            reply_count=category.reply_count,
            latest_post_id=latest_post.id if latest_post else None,
            latest_post_title=latest_post.title if latest_post else None,
            latest_post_created_at=latest_post.created_at if latest_post else None,
            latest_post_author_id=latest_post.author_id if latest_post else None
        )
        category_responses.append(category_data)
    
    return ForumCategoryListResponse(
        items=category_responses,
        total=total,
        page=pagination.page,
        per_page=pagination.limit,
        pages=(total + pagination.limit - 1) // pagination.limit
    )


@router.get("/{category_id}", response_model=ForumCategoryResponse)
async def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get a specific forum category by ID.
    """
    category = db.query(ForumCategory).filter(ForumCategory.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check visibility permissions
    if not category.is_active or not category.is_visible:
        if not current_user or not current_user.get('is_admin'):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    return ForumCategoryResponse(**category.to_dict())


@router.post("/", response_model=ForumCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: ForumCategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Create a new forum category. Requires admin privileges.
    """
    # Check if slug already exists
    existing_category = db.query(ForumCategory).filter(
        ForumCategory.slug == category_data.slug
    ).first()
    
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this slug already exists"
        )
    
    # Create new category
    category = ForumCategory(**category_data.dict())
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return ForumCategoryResponse(**category.to_dict())


@router.put("/{category_id}", response_model=ForumCategoryResponse)
async def update_category(
    category_id: int,
    category_data: ForumCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Update a forum category. Requires admin privileges.
    """
    category = db.query(ForumCategory).filter(ForumCategory.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if new slug conflicts with existing category
    if category_data.slug and category_data.slug != category.slug:
        existing_category = db.query(ForumCategory).filter(
            ForumCategory.slug == category_data.slug,
            ForumCategory.id != category_id
        ).first()
        
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this slug already exists"
            )
    
    # Update category fields
    update_data = category_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return ForumCategoryResponse(**category.to_dict())


@router.delete("/{category_id}", response_model=SuccessResponse)
async def delete_category(
    category_id: int,
    force: bool = Query(False, description="Force delete even if category has posts"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Delete a forum category. Requires admin privileges.
    
    - **force**: If true, deletes category even if it contains posts
    """
    category = db.query(ForumCategory).filter(ForumCategory.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if category has posts
    post_count = db.query(func.count(ForumPost.id)).filter(
        ForumPost.category_id == category_id
    ).scalar()
    
    if post_count > 0 and not force:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category contains {post_count} posts. Use force=true to delete anyway."
        )
    
    db.delete(category)
    db.commit()
    
    return SuccessResponse(message="Category deleted successfully")


@router.get("/{category_id}/stats", response_model=ForumCategoryStatsResponse)
async def get_category_stats(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get detailed statistics for a specific category.
    """
    category = db.query(ForumCategory).filter(ForumCategory.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check visibility permissions
    if not category.is_active or not category.is_visible:
        if not current_user or not current_user.get('is_admin'):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    # Get comprehensive stats
    total_posts = db.query(func.count(ForumPost.id)).filter(
        ForumPost.category_id == category_id,
        ForumPost.status == 'published'
    ).scalar() or 0
    
    total_replies = db.query(func.count(ForumPost.id)).filter(
        ForumPost.category_id == category_id,
        ForumPost.status == 'published'
    ).join(ForumPost.replies).count()
    
    pinned_posts = db.query(func.count(ForumPost.id)).filter(
        ForumPost.category_id == category_id,
        ForumPost.is_pinned == True,
        ForumPost.status == 'published'
    ).scalar() or 0
    
    featured_posts = db.query(func.count(ForumPost.id)).filter(
        ForumPost.category_id == category_id,
        ForumPost.is_featured == True,
        ForumPost.status == 'published'
    ).scalar() or 0
    
    # Get latest post
    latest_post = db.query(ForumPost).filter(
        ForumPost.category_id == category_id,
        ForumPost.status == 'published'
    ).order_by(ForumPost.created_at.desc()).first()
    
    return ForumCategoryStatsResponse(
        category_id=category_id,
        total_posts=total_posts,
        total_replies=total_replies,
        pinned_posts=pinned_posts,
        featured_posts=featured_posts,
        latest_post_id=latest_post.id if latest_post else None,
        latest_post_title=latest_post.title if latest_post else None,
        latest_post_created_at=latest_post.created_at if latest_post else None,
        latest_post_author_id=latest_post.author_id if latest_post else None
    )


@router.patch("/{category_id}/toggle-active", response_model=ForumCategoryResponse)
async def toggle_category_active(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Toggle the active status of a category. Requires admin privileges.
    """
    category = db.query(ForumCategory).filter(ForumCategory.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    category.is_active = not category.is_active
    db.commit()
    db.refresh(category)
    
    return ForumCategoryResponse(**category.to_dict())


@router.patch("/{category_id}/toggle-visible", response_model=ForumCategoryResponse)
async def toggle_category_visible(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Toggle the visibility of a category. Requires admin privileges.
    """
    category = db.query(ForumCategory).filter(ForumCategory.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    category.is_visible = not category.is_visible
    db.commit()
    db.refresh(category)
    
    return ForumCategoryResponse(**category.to_dict())