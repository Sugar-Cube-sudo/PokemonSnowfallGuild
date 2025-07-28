#!/usr/bin/env python3
"""
Forum Moderation API Routes

This module provides REST API endpoints for forum moderation.
Includes operations for managing moderation logs, bulk actions,
and administrative oversight of forum content.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import get_current_user, require_admin
from app.models.forum_post import ForumPost, PostStatus
from app.models.forum_reply import ForumReply, ReplyStatus
from app.models.forum_category import ForumCategory
from app.models.moderation_log import ModerationLog, ModerationAction, ModerationTarget, ModerationSeverity
from app.schemas.common import (
    PaginationParams,
    SuccessResponse,
    ErrorResponse
)
from pydantic import BaseModel
from enum import Enum

router = APIRouter()


# Moderation Schemas
class ModerationLogResponse(BaseModel):
    id: int
    action: str
    target_type: str
    target_id: int
    moderator_id: int
    affected_user_id: Optional[int]
    reason: Optional[str]
    details: Optional[str]
    severity: str
    context: Optional[dict]
    previous_state: Optional[dict]
    new_state: Optional[dict]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ModerationStatsResponse(BaseModel):
    total_actions: int
    actions_today: int
    actions_this_week: int
    actions_this_month: int
    top_moderators: List[dict]
    action_breakdown: dict
    severity_breakdown: dict


class BulkModerationRequest(BaseModel):
    target_type: str  # 'post' or 'reply'
    target_ids: List[int]
    action: str
    reason: Optional[str] = None


class ModerationQueueItem(BaseModel):
    id: int
    type: str  # 'post' or 'reply'
    title: Optional[str]
    content: str
    author_id: int
    author_username: Optional[str]
    created_at: datetime
    reports_count: int
    priority: str


class ModerationQueueResponse(BaseModel):
    items: List[ModerationQueueItem]
    total: int
    page: int
    per_page: int
    pages: int


@router.get("/logs", response_model=List[ModerationLogResponse])
async def get_moderation_logs(
    pagination: PaginationParams = Depends(),
    moderator_id: Optional[int] = Query(None, description="Filter by moderator ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    target_type: Optional[str] = Query(None, description="Filter by target type (post/reply)"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    start_date: Optional[datetime] = Query(None, description="Filter from date"),
    end_date: Optional[datetime] = Query(None, description="Filter to date"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Get moderation logs with filtering and pagination. Requires admin privileges.
    """
    query = db.query(ModerationLog)
    
    # Apply filters
    if moderator_id:
        query = query.filter(ModerationLog.moderator_id == moderator_id)
    
    if action:
        query = query.filter(ModerationLog.action == action)
    
    if target_type:
        query = query.filter(ModerationLog.target_type == target_type)
    
    if severity:
        query = query.filter(ModerationLog.severity == severity)
    
    if start_date:
        query = query.filter(ModerationLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(ModerationLog.created_at <= end_date)
    
    # Order by most recent first
    query = query.order_by(ModerationLog.created_at.desc())
    
    # Apply pagination
    logs = query.offset(pagination.skip).limit(pagination.limit).all()
    
    return [ModerationLogResponse.from_orm(log) for log in logs]


@router.get("/stats", response_model=ModerationStatsResponse)
async def get_moderation_stats(
    days: int = Query(30, ge=1, le=365, description="Number of days to include in stats"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Get moderation statistics. Requires admin privileges.
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total actions in period
    total_actions = db.query(func.count(ModerationLog.id)).filter(
        ModerationLog.created_at >= start_date
    ).scalar() or 0
    
    # Actions today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    actions_today = db.query(func.count(ModerationLog.id)).filter(
        ModerationLog.created_at >= today_start
    ).scalar() or 0
    
    # Actions this week
    week_start = datetime.utcnow() - timedelta(days=7)
    actions_this_week = db.query(func.count(ModerationLog.id)).filter(
        ModerationLog.created_at >= week_start
    ).scalar() or 0
    
    # Actions this month
    month_start = datetime.utcnow() - timedelta(days=30)
    actions_this_month = db.query(func.count(ModerationLog.id)).filter(
        ModerationLog.created_at >= month_start
    ).scalar() or 0
    
    # Top moderators
    top_moderators_query = db.query(
        ModerationLog.moderator_id,
        func.count(ModerationLog.id).label('action_count')
    ).filter(
        ModerationLog.created_at >= start_date
    ).group_by(ModerationLog.moderator_id).order_by(
        func.count(ModerationLog.id).desc()
    ).limit(5).all()
    
    top_moderators = [
        {"moderator_id": mod_id, "action_count": count, "username": None}
        for mod_id, count in top_moderators_query
    ]
    
    # Action breakdown
    action_breakdown_query = db.query(
        ModerationLog.action,
        func.count(ModerationLog.id).label('count')
    ).filter(
        ModerationLog.created_at >= start_date
    ).group_by(ModerationLog.action).all()
    
    action_breakdown = {action: count for action, count in action_breakdown_query}
    
    # Severity breakdown
    severity_breakdown_query = db.query(
        ModerationLog.severity,
        func.count(ModerationLog.id).label('count')
    ).filter(
        ModerationLog.created_at >= start_date
    ).group_by(ModerationLog.severity).all()
    
    severity_breakdown = {severity: count for severity, count in severity_breakdown_query}
    
    return ModerationStatsResponse(
        total_actions=total_actions,
        actions_today=actions_today,
        actions_this_week=actions_this_week,
        actions_this_month=actions_this_month,
        top_moderators=top_moderators,
        action_breakdown=action_breakdown,
        severity_breakdown=severity_breakdown
    )


@router.get("/queue", response_model=ModerationQueueResponse)
async def get_moderation_queue(
    pagination: PaginationParams = Depends(),
    priority: Optional[str] = Query(None, description="Filter by priority (high/medium/low)"),
    content_type: Optional[str] = Query(None, description="Filter by content type (post/reply)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Get items in the moderation queue. Requires admin privileges.
    
    This endpoint returns content that needs moderation attention,
    such as reported posts/replies or content pending approval.
    """
    queue_items = []
    
    # Get posts pending moderation
    if not content_type or content_type == 'post':
        pending_posts = db.query(ForumPost).filter(
            ForumPost.status.in_([PostStatus.PENDING, PostStatus.REPORTED])
        ).order_by(ForumPost.created_at.desc()).all()
        
        for post in pending_posts:
            # Calculate priority based on reports, content, etc.
            reports_count = 0  # This would come from a reports system
            priority_level = "medium"
            
            if priority and priority_level != priority:
                continue
            
            queue_items.append(ModerationQueueItem(
                id=post.id,
                type="post",
                title=post.title,
                content=post.content[:500] + "..." if len(post.content) > 500 else post.content,
                author_id=post.author_id,
                author_username=None,  # Will be populated by user service
                created_at=post.created_at,
                reports_count=reports_count,
                priority=priority_level
            ))
    
    # Get replies pending moderation
    if not content_type or content_type == 'reply':
        pending_replies = db.query(ForumReply).filter(
            ForumReply.status.in_([ReplyStatus.PENDING, ReplyStatus.REPORTED])
        ).order_by(ForumReply.created_at.desc()).all()
        
        for reply in pending_replies:
            reports_count = 0  # This would come from a reports system
            priority_level = "low"
            
            if priority and priority_level != priority:
                continue
            
            queue_items.append(ModerationQueueItem(
                id=reply.id,
                type="reply",
                title=None,
                content=reply.content[:500] + "..." if len(reply.content) > 500 else reply.content,
                author_id=reply.author_id,
                author_username=None,  # Will be populated by user service
                created_at=reply.created_at,
                reports_count=reports_count,
                priority=priority_level
            ))
    
    # Sort by priority and date
    priority_order = {"high": 3, "medium": 2, "low": 1}
    queue_items.sort(
        key=lambda x: (priority_order.get(x.priority, 0), x.created_at),
        reverse=True
    )
    
    # Apply pagination
    total = len(queue_items)
    start_idx = pagination.skip
    end_idx = start_idx + pagination.limit
    paginated_items = queue_items[start_idx:end_idx]
    
    return ModerationQueueResponse(
        items=paginated_items,
        total=total,
        page=pagination.page,
        per_page=pagination.limit,
        pages=(total + pagination.limit - 1) // pagination.limit
    )


@router.post("/bulk-action", response_model=SuccessResponse)
async def perform_bulk_moderation(
    bulk_request: BulkModerationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Perform bulk moderation actions. Requires admin privileges.
    """
    if not bulk_request.target_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No target IDs provided"
        )
    
    if len(bulk_request.target_ids) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot perform bulk action on more than 100 items at once"
        )
    
    success_count = 0
    error_count = 0
    
    for target_id in bulk_request.target_ids:
        try:
            if bulk_request.target_type == 'post':
                target = db.query(ForumPost).filter(ForumPost.id == target_id).first()
                if not target:
                    error_count += 1
                    continue
                
                previous_state = {'status': target.status.value}
                
                # Apply action
                if bulk_request.action == 'approve':
                    target.status = PostStatus.PUBLISHED
                elif bulk_request.action == 'reject':
                    target.status = PostStatus.REJECTED
                elif bulk_request.action == 'hide':
                    target.status = PostStatus.HIDDEN
                elif bulk_request.action == 'delete':
                    db.delete(target)
                    success_count += 1
                    continue
                
                new_state = {'status': target.status.value}
                
            elif bulk_request.target_type == 'reply':
                target = db.query(ForumReply).filter(ForumReply.id == target_id).first()
                if not target:
                    error_count += 1
                    continue
                
                previous_state = {'status': target.status.value}
                
                # Apply action
                if bulk_request.action == 'approve':
                    target.status = ReplyStatus.PUBLISHED
                elif bulk_request.action == 'reject':
                    target.status = ReplyStatus.REJECTED
                elif bulk_request.action == 'hide':
                    target.status = ReplyStatus.HIDDEN
                elif bulk_request.action == 'delete':
                    db.delete(target)
                    success_count += 1
                    continue
                
                new_state = {'status': target.status.value}
            
            else:
                error_count += 1
                continue
            
            # Log the action
            ModerationLog.create_log(
                db=db,
                action=bulk_request.action,
                target_type=bulk_request.target_type,
                target_id=target_id,
                moderator_id=current_user['id'],
                affected_user_id=target.author_id,
                reason=bulk_request.reason,
                previous_state=previous_state,
                new_state=new_state
            )
            
            success_count += 1
            
        except Exception as e:
            error_count += 1
            continue
    
    db.commit()
    
    return SuccessResponse(
        message=f"Bulk action completed. {success_count} successful, {error_count} failed."
    )


@router.post("/posts/{post_id}/approve", response_model=SuccessResponse)
async def approve_post(
    post_id: int,
    reason: Optional[str] = Query(None, description="Reason for approval"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Approve a pending post. Requires admin privileges.
    """
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    previous_state = {'status': post.status.value}
    post.status = PostStatus.PUBLISHED
    new_state = {'status': post.status.value}
    
    # Log the action
    ModerationLog.create_log(
        db=db,
        action='approve',
        target_type='post',
        target_id=post_id,
        moderator_id=current_user['id'],
        affected_user_id=post.author_id,
        reason=reason,
        previous_state=previous_state,
        new_state=new_state
    )
    
    db.commit()
    
    return SuccessResponse(message="Post approved successfully")


@router.post("/posts/{post_id}/reject", response_model=SuccessResponse)
async def reject_post(
    post_id: int,
    reason: Optional[str] = Query(None, description="Reason for rejection"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Reject a pending post. Requires admin privileges.
    """
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    previous_state = {'status': post.status.value}
    post.status = PostStatus.REJECTED
    new_state = {'status': post.status.value}
    
    # Log the action
    ModerationLog.create_log(
        db=db,
        action='reject',
        target_type='post',
        target_id=post_id,
        moderator_id=current_user['id'],
        affected_user_id=post.author_id,
        reason=reason,
        previous_state=previous_state,
        new_state=new_state
    )
    
    db.commit()
    
    return SuccessResponse(message="Post rejected successfully")


@router.post("/replies/{reply_id}/approve", response_model=SuccessResponse)
async def approve_reply(
    reply_id: int,
    reason: Optional[str] = Query(None, description="Reason for approval"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Approve a pending reply. Requires admin privileges.
    """
    reply = db.query(ForumReply).filter(ForumReply.id == reply_id).first()
    
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )
    
    previous_state = {'status': reply.status.value}
    reply.status = ReplyStatus.PUBLISHED
    new_state = {'status': reply.status.value}
    
    # Log the action
    ModerationLog.create_log(
        db=db,
        action='approve',
        target_type='reply',
        target_id=reply_id,
        moderator_id=current_user['id'],
        affected_user_id=reply.author_id,
        reason=reason,
        previous_state=previous_state,
        new_state=new_state
    )
    
    db.commit()
    
    return SuccessResponse(message="Reply approved successfully")


@router.post("/replies/{reply_id}/reject", response_model=SuccessResponse)
async def reject_reply(
    reply_id: int,
    reason: Optional[str] = Query(None, description="Reason for rejection"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Reject a pending reply. Requires admin privileges.
    """
    reply = db.query(ForumReply).filter(ForumReply.id == reply_id).first()
    
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )
    
    previous_state = {'status': reply.status.value}
    reply.status = ReplyStatus.REJECTED
    new_state = {'status': reply.status.value}
    
    # Log the action
    ModerationLog.create_log(
        db=db,
        action='reject',
        target_type='reply',
        target_id=reply_id,
        moderator_id=current_user['id'],
        affected_user_id=reply.author_id,
        reason=reason,
        previous_state=previous_state,
        new_state=new_state
    )
    
    db.commit()
    
    return SuccessResponse(message="Reply rejected successfully")


@router.get("/user/{user_id}/actions", response_model=List[ModerationLogResponse])
async def get_user_moderation_history(
    user_id: int,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Get moderation history for a specific user. Requires admin privileges.
    """
    logs = db.query(ModerationLog).filter(
        ModerationLog.affected_user_id == user_id
    ).order_by(ModerationLog.created_at.desc()).offset(
        pagination.skip
    ).limit(pagination.limit).all()
    
    return [ModerationLogResponse.from_orm(log) for log in logs]


@router.delete("/logs/{log_id}", response_model=SuccessResponse)
async def delete_moderation_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Delete a moderation log entry. Requires admin privileges.
    Use with caution as this removes audit trail.
    """
    log = db.query(ModerationLog).filter(ModerationLog.id == log_id).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Moderation log not found"
        )
    
    db.delete(log)
    db.commit()
    
    return SuccessResponse(message="Moderation log deleted successfully")