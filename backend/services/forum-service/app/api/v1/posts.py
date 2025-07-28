#!/usr/bin/env python3
"""
Forum Posts API Routes

This module provides REST API endpoints for managing forum posts.
Includes operations for creating, reading, updating, and deleting posts,
as well as post interactions like likes, views, and moderation.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc

from app.core.database import get_db
from app.core.auth import get_current_user, require_auth, require_admin
from app.models.forum_category import ForumCategory
from app.models.forum_post import ForumPost, PostType, PostStatus
from app.models.forum_reply import ForumReply
from app.models.post_like import PostLike
from app.models.post_tag import PostTag
from app.models.rental_info import RentalInfo
from app.models.moderation_log import ModerationLog
from app.schemas.forum_post import (
    ForumPostCreate,
    ForumPostUpdate,
    ForumPostResponse,
    ForumPostSummary,
    ForumPostListResponse,
    PostQueryParams,
    PostLikeResponse,
    PostStatsResponse,
    PostModerationRequest
)
from app.schemas.common import (
    PaginationParams,
    SuccessResponse,
    ErrorResponse
)

router = APIRouter()


@router.get("/", response_model=ForumPostListResponse)
async def get_posts(
    query_params: PostQueryParams = Depends(),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get list of forum posts with filtering, sorting, and pagination.
    """
    query = db.query(ForumPost)
    
    # Apply category filter
    if query_params.category_id:
        query = query.filter(ForumPost.category_id == query_params.category_id)
    
    # Apply author filter
    if query_params.author_id:
        query = query.filter(ForumPost.author_id == query_params.author_id)
    
    # Apply post type filter
    if query_params.post_type:
        query = query.filter(ForumPost.post_type == query_params.post_type)
    
    # Apply status filter (default to published for non-admin users)
    if query_params.status:
        if current_user and current_user.get('is_admin'):
            query = query.filter(ForumPost.status == query_params.status)
        else:
            query = query.filter(ForumPost.status == 'published')
    else:
        query = query.filter(ForumPost.status == 'published')
    
    # Apply pinned filter
    if query_params.is_pinned is not None:
        query = query.filter(ForumPost.is_pinned == query_params.is_pinned)
    
    # Apply featured filter
    if query_params.is_featured is not None:
        query = query.filter(ForumPost.is_featured == query_params.is_featured)
    
    # Apply rental filter
    if query_params.is_rental is not None:
        if query_params.is_rental:
            query = query.filter(ForumPost.post_type == PostType.RENTAL)
        else:
            query = query.filter(ForumPost.post_type != PostType.RENTAL)
    
    # Apply tag filter
    if query_params.tags:
        tag_list = [tag.strip() for tag in query_params.tags.split(',')]
        query = query.join(PostTag).filter(PostTag.tag_name.in_(tag_list))
    
    # Apply search filter
    if query_params.search:
        search_term = f"%{query_params.search}%"
        query = query.filter(
            or_(
                ForumPost.title.ilike(search_term),
                ForumPost.content.ilike(search_term),
                ForumPost.summary.ilike(search_term)
            )
        )
    
    # Apply sorting
    if query_params.sort_by == 'created_at':
        order_field = ForumPost.created_at
    elif query_params.sort_by == 'updated_at':
        order_field = ForumPost.updated_at
    elif query_params.sort_by == 'view_count':
        order_field = ForumPost.view_count
    elif query_params.sort_by == 'like_count':
        order_field = ForumPost.like_count
    elif query_params.sort_by == 'reply_count':
        order_field = ForumPost.reply_count
    else:
        order_field = ForumPost.created_at
    
    if query_params.sort_order == 'desc':
        query = query.order_by(order_field.desc())
    else:
        query = query.order_by(order_field.asc())
    
    # Handle pinned posts (always show first if not specifically filtered)
    if query_params.is_pinned is None:
        query = query.order_by(ForumPost.is_pinned.desc(), order_field.desc())
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    posts = query.offset(pagination.skip).limit(pagination.limit).all()
    
    # Convert to summary format
    post_summaries = []
    for post in posts:
        # Get category info
        category = db.query(ForumCategory).filter(ForumCategory.id == post.category_id).first()
        
        # Check if current user liked this post
        user_liked = False
        if current_user:
            like = db.query(PostLike).filter(
                PostLike.post_id == post.id,
                PostLike.user_id == current_user['id']
            ).first()
            user_liked = like is not None
        
        # Get tags
        tags = db.query(PostTag).filter(PostTag.post_id == post.id).all()
        
        post_summary = ForumPostSummary(
            **post.to_dict(),
            category_name=category.name if category else None,
            category_slug=category.slug if category else None,
            author_username=None,  # Will be populated by user service
            user_liked=user_liked,
            tags=[{"name": tag.tag_name, "color": tag.tag_color} for tag in tags]
        )
        post_summaries.append(post_summary)
    
    return ForumPostListResponse(
        items=post_summaries,
        total=total,
        page=pagination.page,
        per_page=pagination.limit,
        pages=(total + pagination.limit - 1) // pagination.limit
    )


@router.get("/{post_id}", response_model=ForumPostResponse)
async def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get a specific forum post by ID.
    """
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if post is published or user has permission to view
    if post.status != PostStatus.PUBLISHED:
        if not current_user or (current_user['id'] != post.author_id and not current_user.get('is_admin')):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
    
    # Increment view count (only for published posts)
    if post.status == PostStatus.PUBLISHED:
        post.view_count += 1
        db.commit()
    
    # Get category info
    category = db.query(ForumCategory).filter(ForumCategory.id == post.category_id).first()
    
    # Check if current user liked this post
    user_liked = False
    if current_user:
        like = db.query(PostLike).filter(
            PostLike.post_id == post.id,
            PostLike.user_id == current_user['id']
        ).first()
        user_liked = like is not None
    
    # Get tags
    tags = db.query(PostTag).filter(PostTag.post_id == post.id).all()
    
    # Get rental info if it's a rental post
    rental_info = None
    if post.post_type == PostType.RENTAL:
        rental_info = db.query(RentalInfo).filter(RentalInfo.post_id == post.id).first()
    
    return ForumPostResponse(
        **post.to_dict(),
        category_name=category.name if category else None,
        category_slug=category.slug if category else None,
        author_username=None,  # Will be populated by user service
        user_liked=user_liked,
        tags=[{"name": tag.tag_name, "color": tag.tag_color} for tag in tags],
        rental_info=rental_info.to_dict() if rental_info else None,
        attachments=[],  # Will be populated by file service
        can_edit=current_user and (current_user['id'] == post.author_id or current_user.get('is_admin')),
        can_delete=current_user and (current_user['id'] == post.author_id or current_user.get('is_admin')),
        can_moderate=current_user and current_user.get('is_admin')
    )


@router.post("/", response_model=ForumPostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: ForumPostCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Create a new forum post. Requires authentication.
    """
    # Verify category exists and is active
    category = db.query(ForumCategory).filter(
        ForumCategory.id == post_data.category_id,
        ForumCategory.is_active == True
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or inactive category"
        )
    
    # Check if category requires authentication
    if category.require_auth_to_post and not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to post in this category"
        )
    
    # Create post
    post_dict = post_data.dict(exclude={'tags', 'rental_info'})
    post_dict['author_id'] = current_user['id']
    
    post = ForumPost(**post_dict)
    db.add(post)
    db.flush()  # Get the post ID
    
    # Add tags if provided
    if post_data.tags:
        for tag_data in post_data.tags:
            tag = PostTag(
                post_id=post.id,
                tag_name=tag_data['name'],
                tag_color=tag_data.get('color', '#3B82F6')
            )
            db.add(tag)
    
    # Add rental info if it's a rental post
    if post_data.post_type == PostType.RENTAL and post_data.rental_info:
        rental_dict = post_data.rental_info.dict()
        rental_dict['post_id'] = post.id
        rental_dict['owner_id'] = current_user['id']
        
        rental_info = RentalInfo(**rental_dict)
        db.add(rental_info)
    
    db.commit()
    db.refresh(post)
    
    # Return the created post
    return await get_post(post.id, db, current_user)


@router.put("/{post_id}", response_model=ForumPostResponse)
async def update_post(
    post_id: int,
    post_data: ForumPostUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Update a forum post. Requires authentication and ownership or admin privileges.
    """
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check permissions
    if current_user['id'] != post.author_id and not current_user.get('is_admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this post"
        )
    
    # Update post fields
    update_data = post_data.dict(exclude_unset=True, exclude={'tags'})
    for field, value in update_data.items():
        setattr(post, field, value)
    
    # Update tags if provided
    if post_data.tags is not None:
        # Remove existing tags
        db.query(PostTag).filter(PostTag.post_id == post_id).delete()
        
        # Add new tags
        for tag_data in post_data.tags:
            tag = PostTag(
                post_id=post.id,
                tag_name=tag_data['name'],
                tag_color=tag_data.get('color', '#3B82F6')
            )
            db.add(tag)
    
    db.commit()
    db.refresh(post)
    
    return await get_post(post.id, db, current_user)


@router.delete("/{post_id}", response_model=SuccessResponse)
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Delete a forum post. Requires authentication and ownership or admin privileges.
    """
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check permissions
    if current_user['id'] != post.author_id and not current_user.get('is_admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post"
        )
    
    db.delete(post)
    db.commit()
    
    return SuccessResponse(message="Post deleted successfully")


@router.post("/{post_id}/like", response_model=PostLikeResponse)
async def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Like or unlike a post. Requires authentication.
    """
    post = db.query(ForumPost).filter(
        ForumPost.id == post_id,
        ForumPost.status == PostStatus.PUBLISHED
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if user already liked this post
    existing_like = db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == current_user['id']
    ).first()
    
    if existing_like:
        # Unlike the post
        db.delete(existing_like)
        post.like_count = max(0, post.like_count - 1)
        liked = False
    else:
        # Like the post
        like = PostLike(post_id=post_id, user_id=current_user['id'])
        db.add(like)
        post.like_count += 1
        liked = True
    
    db.commit()
    
    return PostLikeResponse(
        post_id=post_id,
        liked=liked,
        like_count=post.like_count
    )


@router.get("/{post_id}/stats", response_model=PostStatsResponse)
async def get_post_stats(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get detailed statistics for a specific post.
    """
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if post is published or user has permission to view
    if post.status != PostStatus.PUBLISHED:
        if not current_user or (current_user['id'] != post.author_id and not current_user.get('is_admin')):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
    
    return PostStatsResponse(
        post_id=post_id,
        view_count=post.view_count,
        like_count=post.like_count,
        reply_count=post.reply_count,
        created_at=post.created_at,
        updated_at=post.updated_at
    )


@router.post("/{post_id}/moderate", response_model=SuccessResponse)
async def moderate_post(
    post_id: int,
    moderation_data: PostModerationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Perform moderation action on a post. Requires admin privileges.
    """
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    previous_state = {
        'status': post.status.value,
        'is_pinned': post.is_pinned,
        'is_featured': post.is_featured,
        'is_locked': post.is_locked
    }
    
    # Apply moderation action
    if moderation_data.action == 'approve':
        post.status = PostStatus.PUBLISHED
    elif moderation_data.action == 'reject':
        post.status = PostStatus.REJECTED
    elif moderation_data.action == 'hide':
        post.status = PostStatus.HIDDEN
    elif moderation_data.action == 'pin':
        post.is_pinned = True
    elif moderation_data.action == 'unpin':
        post.is_pinned = False
    elif moderation_data.action == 'feature':
        post.is_featured = True
    elif moderation_data.action == 'unfeature':
        post.is_featured = False
    elif moderation_data.action == 'lock':
        post.is_locked = True
    elif moderation_data.action == 'unlock':
        post.is_locked = False
    
    new_state = {
        'status': post.status.value,
        'is_pinned': post.is_pinned,
        'is_featured': post.is_featured,
        'is_locked': post.is_locked
    }
    
    # Log moderation action
    ModerationLog.create_log(
        db=db,
        action=moderation_data.action,
        target_type='post',
        target_id=post_id,
        moderator_id=current_user['id'],
        affected_user_id=post.author_id,
        reason=moderation_data.reason,
        previous_state=previous_state,
        new_state=new_state
    )
    
    db.commit()
    
    return SuccessResponse(message=f"Post {moderation_data.action} action completed successfully")


@router.patch("/{post_id}/toggle-pin", response_model=ForumPostResponse)
async def toggle_post_pin(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Toggle the pinned status of a post. Requires admin privileges.
    """
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    post.is_pinned = not post.is_pinned
    db.commit()
    
    return await get_post(post.id, db, current_user)


@router.patch("/{post_id}/toggle-feature", response_model=ForumPostResponse)
async def toggle_post_feature(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Toggle the featured status of a post. Requires admin privileges.
    """
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    post.is_featured = not post.is_featured
    db.commit()
    
    return await get_post(post.id, db, current_user)


@router.patch("/{post_id}/toggle-lock", response_model=ForumPostResponse)
async def toggle_post_lock(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Toggle the locked status of a post. Requires admin privileges.
    """
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    post.is_locked = not post.is_locked
    db.commit()
    
    return await get_post(post.id, db, current_user)