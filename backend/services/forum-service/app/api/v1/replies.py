#!/usr/bin/env python3
"""
Forum Replies API Routes

This module provides REST API endpoints for managing forum replies.
Includes operations for creating, reading, updating, and deleting replies,
as well as reply interactions like likes and moderation.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc

from app.core.database import get_db
from app.core.auth import get_current_user, require_auth, require_admin
from app.models.forum_post import ForumPost, PostStatus
from app.models.forum_reply import ForumReply, ReplyStatus
from app.models.reply_like import ReplyLike
from app.models.moderation_log import ModerationLog
from app.schemas.forum_reply import (
    ForumReplyCreate,
    ForumReplyUpdate,
    ForumReplyResponse,
    ForumReplySummary,
    ForumReplyListResponse,
    ReplyQueryParams,
    ReplyLikeResponse,
    ReplyModerationRequest,
    ReplyThreadResponse,
    ReplyStatsResponse
)
from app.schemas.common import (
    PaginationParams,
    SuccessResponse,
    ErrorResponse
)

router = APIRouter()


@router.get("/", response_model=ForumReplyListResponse)
async def get_replies(
    query_params: ReplyQueryParams = Depends(),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get list of forum replies with filtering, sorting, and pagination.
    """
    query = db.query(ForumReply)
    
    # Apply post filter
    if query_params.post_id:
        query = query.filter(ForumReply.post_id == query_params.post_id)
    
    # Apply author filter
    if query_params.author_id:
        query = query.filter(ForumReply.author_id == query_params.author_id)
    
    # Apply parent reply filter
    if query_params.parent_id:
        query = query.filter(ForumReply.parent_id == query_params.parent_id)
    
    # Apply status filter (default to published for non-admin users)
    if query_params.status:
        if current_user and current_user.get('is_admin'):
            query = query.filter(ForumReply.status == query_params.status)
        else:
            query = query.filter(ForumReply.status == ReplyStatus.PUBLISHED)
    else:
        query = query.filter(ForumReply.status == ReplyStatus.PUBLISHED)
    
    # Apply top-level filter
    if query_params.top_level_only:
        query = query.filter(ForumReply.parent_id.is_(None))
    
    # Apply search filter
    if query_params.search:
        search_term = f"%{query_params.search}%"
        query = query.filter(ForumReply.content.ilike(search_term))
    
    # Apply sorting
    if query_params.sort_by == 'created_at':
        order_field = ForumReply.created_at
    elif query_params.sort_by == 'updated_at':
        order_field = ForumReply.updated_at
    elif query_params.sort_by == 'like_count':
        order_field = ForumReply.like_count
    else:
        order_field = ForumReply.created_at
    
    if query_params.sort_order == 'desc':
        query = query.order_by(order_field.desc())
    else:
        query = query.order_by(order_field.asc())
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    replies = query.offset(pagination.skip).limit(pagination.limit).all()
    
    # Convert to summary format
    reply_summaries = []
    for reply in replies:
        # Check if current user liked this reply
        user_liked = False
        if current_user:
            like = db.query(ReplyLike).filter(
                ReplyLike.reply_id == reply.id,
                ReplyLike.user_id == current_user['id']
            ).first()
            user_liked = like is not None
        
        reply_summary = ForumReplySummary(
            **reply.to_dict(),
            author_username=None,  # Will be populated by user service
            user_liked=user_liked
        )
        reply_summaries.append(reply_summary)
    
    return ForumReplyListResponse(
        items=reply_summaries,
        total=total,
        page=pagination.page,
        per_page=pagination.limit,
        pages=(total + pagination.limit - 1) // pagination.limit
    )


@router.get("/{reply_id}", response_model=ForumReplyResponse)
async def get_reply(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get a specific forum reply by ID.
    """
    reply = db.query(ForumReply).filter(ForumReply.id == reply_id).first()
    
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )
    
    # Check if reply is published or user has permission to view
    if reply.status != ReplyStatus.PUBLISHED:
        if not current_user or (current_user['id'] != reply.author_id and not current_user.get('is_admin')):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reply not found"
            )
    
    # Check if current user liked this reply
    user_liked = False
    if current_user:
        like = db.query(ReplyLike).filter(
            ReplyLike.reply_id == reply.id,
            ReplyLike.user_id == current_user['id']
        ).first()
        user_liked = like is not None
    
    # Get child replies (nested replies)
    child_replies = db.query(ForumReply).filter(
        ForumReply.parent_id == reply.id,
        ForumReply.status == ReplyStatus.PUBLISHED
    ).order_by(ForumReply.created_at.asc()).all()
    
    nested_replies = []
    for child in child_replies:
        child_user_liked = False
        if current_user:
            child_like = db.query(ReplyLike).filter(
                ReplyLike.reply_id == child.id,
                ReplyLike.user_id == current_user['id']
            ).first()
            child_user_liked = child_like is not None
        
        nested_replies.append(ForumReplySummary(
            **child.to_dict(),
            author_username=None,
            user_liked=child_user_liked
        ))
    
    return ForumReplyResponse(
        **reply.to_dict(),
        author_username=None,  # Will be populated by user service
        user_liked=user_liked,
        attachments=[],  # Will be populated by file service
        mentions=[],  # Will be populated based on content
        nested_replies=nested_replies,
        can_edit=current_user and (current_user['id'] == reply.author_id or current_user.get('is_admin')),
        can_delete=current_user and (current_user['id'] == reply.author_id or current_user.get('is_admin')),
        can_moderate=current_user and current_user.get('is_admin')
    )


@router.post("/", response_model=ForumReplyResponse, status_code=status.HTTP_201_CREATED)
async def create_reply(
    reply_data: ForumReplyCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Create a new forum reply. Requires authentication.
    """
    # Verify post exists and allows replies
    post = db.query(ForumPost).filter(
        ForumPost.id == reply_data.post_id,
        ForumPost.status == PostStatus.PUBLISHED
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post not found or not published"
        )
    
    if not post.allow_replies or post.is_locked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Replies are not allowed on this post"
        )
    
    # Verify parent reply exists if specified
    parent_reply = None
    if reply_data.parent_id:
        parent_reply = db.query(ForumReply).filter(
            ForumReply.id == reply_data.parent_id,
            ForumReply.post_id == reply_data.post_id,
            ForumReply.status == ReplyStatus.PUBLISHED
        ).first()
        
        if not parent_reply:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent reply not found"
            )
    
    # Create reply
    reply_dict = reply_data.dict(exclude={'attachments', 'mentions'})
    reply_dict['author_id'] = current_user['id']
    
    # Set threading information
    if parent_reply:
        reply_dict['depth'] = parent_reply.depth + 1
        reply_dict['path'] = f"{parent_reply.path}.{parent_reply.id}"
    else:
        reply_dict['depth'] = 0
        reply_dict['path'] = ""
    
    reply = ForumReply(**reply_dict)
    db.add(reply)
    db.flush()  # Get the reply ID
    
    # Update materialized path
    if parent_reply:
        reply.path = f"{parent_reply.path}.{reply.id}"
    else:
        reply.path = str(reply.id)
    
    # Update post reply count
    post.reply_count += 1
    
    # Update parent reply count if this is a nested reply
    if parent_reply:
        parent_reply.reply_count += 1
    
    db.commit()
    db.refresh(reply)
    
    # Return the created reply
    return await get_reply(reply.id, db, current_user)


@router.put("/{reply_id}", response_model=ForumReplyResponse)
async def update_reply(
    reply_id: int,
    reply_data: ForumReplyUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Update a forum reply. Requires authentication and ownership or admin privileges.
    """
    reply = db.query(ForumReply).filter(ForumReply.id == reply_id).first()
    
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )
    
    # Check permissions
    if current_user['id'] != reply.author_id and not current_user.get('is_admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this reply"
        )
    
    # Update reply fields
    update_data = reply_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reply, field, value)
    
    db.commit()
    db.refresh(reply)
    
    return await get_reply(reply.id, db, current_user)


@router.delete("/{reply_id}", response_model=SuccessResponse)
async def delete_reply(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Delete a forum reply. Requires authentication and ownership or admin privileges.
    """
    reply = db.query(ForumReply).filter(ForumReply.id == reply_id).first()
    
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )
    
    # Check permissions
    if current_user['id'] != reply.author_id and not current_user.get('is_admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this reply"
        )
    
    # Update post reply count
    post = db.query(ForumPost).filter(ForumPost.id == reply.post_id).first()
    if post:
        post.reply_count = max(0, post.reply_count - 1)
    
    # Update parent reply count if this is a nested reply
    if reply.parent_id:
        parent_reply = db.query(ForumReply).filter(ForumReply.id == reply.parent_id).first()
        if parent_reply:
            parent_reply.reply_count = max(0, parent_reply.reply_count - 1)
    
    db.delete(reply)
    db.commit()
    
    return SuccessResponse(message="Reply deleted successfully")


@router.post("/{reply_id}/like", response_model=ReplyLikeResponse)
async def like_reply(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_auth)
):
    """
    Like or unlike a reply. Requires authentication.
    """
    reply = db.query(ForumReply).filter(
        ForumReply.id == reply_id,
        ForumReply.status == ReplyStatus.PUBLISHED
    ).first()
    
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )
    
    # Check if user already liked this reply
    existing_like = db.query(ReplyLike).filter(
        ReplyLike.reply_id == reply_id,
        ReplyLike.user_id == current_user['id']
    ).first()
    
    if existing_like:
        # Unlike the reply
        db.delete(existing_like)
        reply.like_count = max(0, reply.like_count - 1)
        liked = False
    else:
        # Like the reply
        like = ReplyLike(reply_id=reply_id, user_id=current_user['id'])
        db.add(like)
        reply.like_count += 1
        liked = True
    
    db.commit()
    
    return ReplyLikeResponse(
        reply_id=reply_id,
        liked=liked,
        like_count=reply.like_count
    )


@router.get("/{reply_id}/thread", response_model=ReplyThreadResponse)
async def get_reply_thread(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get the complete thread for a reply (parent and all children).
    """
    reply = db.query(ForumReply).filter(
        ForumReply.id == reply_id,
        ForumReply.status == ReplyStatus.PUBLISHED
    ).first()
    
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )
    
    # Get the root reply of this thread
    root_reply = reply
    if reply.parent_id:
        # Find the top-level parent
        path_parts = reply.path.split('.')
        root_id = int(path_parts[0]) if path_parts[0] else reply.id
        root_reply = db.query(ForumReply).filter(ForumReply.id == root_id).first()
    
    # Get all replies in this thread
    thread_replies = db.query(ForumReply).filter(
        or_(
            ForumReply.path.like(f"{root_reply.path}.%"),
            ForumReply.id == root_reply.id
        ),
        ForumReply.status == ReplyStatus.PUBLISHED
    ).order_by(ForumReply.path.asc()).all()
    
    # Convert to response format
    thread_data = []
    for thread_reply in thread_replies:
        user_liked = False
        if current_user:
            like = db.query(ReplyLike).filter(
                ReplyLike.reply_id == thread_reply.id,
                ReplyLike.user_id == current_user['id']
            ).first()
            user_liked = like is not None
        
        thread_data.append(ForumReplySummary(
            **thread_reply.to_dict(),
            author_username=None,
            user_liked=user_liked
        ))
    
    return ReplyThreadResponse(
        root_reply_id=root_reply.id,
        current_reply_id=reply_id,
        thread=thread_data
    )


@router.get("/{reply_id}/stats", response_model=ReplyStatsResponse)
async def get_reply_stats(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get detailed statistics for a specific reply.
    """
    reply = db.query(ForumReply).filter(ForumReply.id == reply_id).first()
    
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )
    
    # Check if reply is published or user has permission to view
    if reply.status != ReplyStatus.PUBLISHED:
        if not current_user or (current_user['id'] != reply.author_id and not current_user.get('is_admin')):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reply not found"
            )
    
    return ReplyStatsResponse(
        reply_id=reply_id,
        like_count=reply.like_count,
        reply_count=reply.reply_count,
        depth=reply.depth,
        created_at=reply.created_at,
        updated_at=reply.updated_at
    )


@router.post("/{reply_id}/moderate", response_model=SuccessResponse)
async def moderate_reply(
    reply_id: int,
    moderation_data: ReplyModerationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Perform moderation action on a reply. Requires admin privileges.
    """
    reply = db.query(ForumReply).filter(ForumReply.id == reply_id).first()
    
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )
    
    previous_state = {
        'status': reply.status.value
    }
    
    # Apply moderation action
    if moderation_data.action == 'approve':
        reply.status = ReplyStatus.PUBLISHED
    elif moderation_data.action == 'reject':
        reply.status = ReplyStatus.REJECTED
    elif moderation_data.action == 'hide':
        reply.status = ReplyStatus.HIDDEN
    
    new_state = {
        'status': reply.status.value
    }
    
    # Log moderation action
    ModerationLog.create_log(
        db=db,
        action=moderation_data.action,
        target_type='reply',
        target_id=reply_id,
        moderator_id=current_user['id'],
        affected_user_id=reply.author_id,
        reason=moderation_data.reason,
        previous_state=previous_state,
        new_state=new_state
    )
    
    db.commit()
    
    return SuccessResponse(message=f"Reply {moderation_data.action} action completed successfully")


@router.get("/post/{post_id}/tree", response_model=List[ReplyThreadResponse])
async def get_post_reply_tree(
    post_id: int,
    max_depth: int = Query(3, ge=1, le=10, description="Maximum depth of nested replies to return"),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get all replies for a post organized in a tree structure.
    """
    # Verify post exists
    post = db.query(ForumPost).filter(
        ForumPost.id == post_id,
        ForumPost.status == PostStatus.PUBLISHED
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Get all replies for this post up to max_depth
    replies = db.query(ForumReply).filter(
        ForumReply.post_id == post_id,
        ForumReply.status == ReplyStatus.PUBLISHED,
        ForumReply.depth <= max_depth
    ).order_by(ForumReply.path.asc()).all()
    
    # Group replies by their root (top-level) reply
    reply_threads = {}
    for reply in replies:
        if reply.depth == 0:
            # This is a top-level reply
            root_id = reply.id
        else:
            # Find the root ID from the path
            path_parts = reply.path.split('.')
            root_id = int(path_parts[0]) if path_parts[0] else reply.id
        
        if root_id not in reply_threads:
            reply_threads[root_id] = []
        
        # Check if current user liked this reply
        user_liked = False
        if current_user:
            like = db.query(ReplyLike).filter(
                ReplyLike.reply_id == reply.id,
                ReplyLike.user_id == current_user['id']
            ).first()
            user_liked = like is not None
        
        reply_threads[root_id].append(ForumReplySummary(
            **reply.to_dict(),
            author_username=None,
            user_liked=user_liked
        ))
    
    # Convert to response format
    thread_responses = []
    for root_id, thread_replies in reply_threads.items():
        thread_responses.append(ReplyThreadResponse(
            root_reply_id=root_id,
            current_reply_id=None,
            thread=thread_replies
        ))
    
    return thread_responses