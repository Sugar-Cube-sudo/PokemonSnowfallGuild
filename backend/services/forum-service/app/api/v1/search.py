#!/usr/bin/env python3
"""
Forum Search API Routes

This module provides REST API endpoints for searching forum content.
Includes full-text search across posts, replies, categories, and rentals
with advanced filtering and sorting capabilities.
"""

from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, text
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.forum_category import ForumCategory
from app.models.forum_post import ForumPost, PostType, PostStatus
from app.models.forum_reply import ForumReply, ReplyStatus
from app.models.rental_info import RentalInfo
from app.models.post_tag import PostTag
from app.schemas.forum_post import ForumPostSummary
from app.schemas.forum_reply import ForumReplySummary
from app.schemas.forum_category import ForumCategoryResponse
from app.schemas.rental import RentalInfoResponse
from app.schemas.common import PaginationParams
from pydantic import BaseModel
from enum import Enum

router = APIRouter()


# Search Schemas
class SearchType(str, Enum):
    ALL = "all"
    POSTS = "posts"
    REPLIES = "replies"
    CATEGORIES = "categories"
    RENTALS = "rentals"
    USERS = "users"


class SearchSortBy(str, Enum):
    RELEVANCE = "relevance"
    DATE = "date"
    POPULARITY = "popularity"
    RATING = "rating"


class SearchResult(BaseModel):
    type: str
    id: int
    title: Optional[str]
    content: str
    excerpt: str
    author_id: Optional[int]
    author_username: Optional[str]
    created_at: datetime
    relevance_score: float
    url: str
    metadata: dict


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total: int
    page: int
    per_page: int
    pages: int
    search_time_ms: int
    suggestions: List[str]
    facets: dict


class SearchSuggestion(BaseModel):
    text: str
    type: str
    count: int


@router.get("/", response_model=SearchResponse)
async def search_forum(
    q: str = Query(..., min_length=2, max_length=200, description="Search query"),
    search_type: SearchType = Query(SearchType.ALL, description="Type of content to search"),
    sort_by: SearchSortBy = Query(SearchSortBy.RELEVANCE, description="Sort results by"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    author_id: Optional[int] = Query(None, description="Filter by author ID"),
    post_type: Optional[PostType] = Query(None, description="Filter by post type"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    min_likes: Optional[int] = Query(None, ge=0, description="Minimum number of likes"),
    has_replies: Optional[bool] = Query(None, description="Filter posts with/without replies"),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Search forum content with advanced filtering and sorting.
    """
    start_time = datetime.utcnow()
    
    # Sanitize search query
    search_query = q.strip().lower()
    search_terms = search_query.split()
    
    results = []
    total = 0
    
    # Search posts
    if search_type in [SearchType.ALL, SearchType.POSTS]:
        post_results, post_count = await _search_posts(
            db, search_terms, category_id, author_id, post_type,
            date_from, date_to, tags, min_likes, has_replies,
            pagination if search_type == SearchType.POSTS else None,
            current_user
        )
        results.extend(post_results)
        total += post_count
    
    # Search replies
    if search_type in [SearchType.ALL, SearchType.REPLIES]:
        reply_results, reply_count = await _search_replies(
            db, search_terms, category_id, author_id,
            date_from, date_to, min_likes,
            pagination if search_type == SearchType.REPLIES else None,
            current_user
        )
        results.extend(reply_results)
        total += reply_count
    
    # Search categories
    if search_type in [SearchType.ALL, SearchType.CATEGORIES]:
        category_results, category_count = await _search_categories(
            db, search_terms,
            pagination if search_type == SearchType.CATEGORIES else None,
            current_user
        )
        results.extend(category_results)
        total += category_count
    
    # Search rentals
    if search_type in [SearchType.ALL, SearchType.RENTALS]:
        rental_results, rental_count = await _search_rentals(
            db, search_terms, author_id, date_from, date_to,
            pagination if search_type == SearchType.RENTALS else None,
            current_user
        )
        results.extend(rental_results)
        total += rental_count
    
    # Sort results
    if sort_by == SearchSortBy.RELEVANCE:
        results.sort(key=lambda x: x.relevance_score, reverse=(sort_order == "desc"))
    elif sort_by == SearchSortBy.DATE:
        results.sort(key=lambda x: x.created_at, reverse=(sort_order == "desc"))
    elif sort_by == SearchSortBy.POPULARITY:
        results.sort(key=lambda x: x.metadata.get('like_count', 0), reverse=(sort_order == "desc"))
    
    # Apply pagination for mixed results
    if search_type == SearchType.ALL:
        start_idx = pagination.skip
        end_idx = start_idx + pagination.limit
        results = results[start_idx:end_idx]
    
    # Calculate search time
    end_time = datetime.utcnow()
    search_time_ms = int((end_time - start_time).total_seconds() * 1000)
    
    # Generate suggestions
    suggestions = await _generate_suggestions(db, search_query, search_type)
    
    # Generate facets
    facets = await _generate_facets(db, search_terms, search_type)
    
    return SearchResponse(
        query=q,
        results=results,
        total=total,
        page=pagination.page,
        per_page=pagination.limit,
        pages=(total + pagination.limit - 1) // pagination.limit,
        search_time_ms=search_time_ms,
        suggestions=suggestions,
        facets=facets
    )


@router.get("/suggestions", response_model=List[SearchSuggestion])
async def get_search_suggestions(
    q: str = Query(..., min_length=1, max_length=100, description="Partial search query"),
    limit: int = Query(10, ge=1, le=20, description="Maximum number of suggestions"),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get search suggestions based on partial query.
    """
    suggestions = []
    
    # Get popular search terms from post titles
    post_suggestions = db.query(
        ForumPost.title,
        func.count(ForumPost.view_count).label('popularity')
    ).filter(
        ForumPost.title.ilike(f"%{q}%"),
        ForumPost.status == PostStatus.PUBLISHED
    ).group_by(ForumPost.title).order_by(
        func.count(ForumPost.view_count).desc()
    ).limit(limit // 2).all()
    
    for title, popularity in post_suggestions:
        suggestions.append(SearchSuggestion(
            text=title,
            type="post_title",
            count=popularity
        ))
    
    # Get popular tags
    tag_suggestions = db.query(
        PostTag.tag_name,
        func.count(PostTag.id).label('usage_count')
    ).filter(
        PostTag.tag_name.ilike(f"%{q}%")
    ).group_by(PostTag.tag_name).order_by(
        func.count(PostTag.id).desc()
    ).limit(limit // 2).all()
    
    for tag_name, usage_count in tag_suggestions:
        suggestions.append(SearchSuggestion(
            text=tag_name,
            type="tag",
            count=usage_count
        ))
    
    return suggestions[:limit]


@router.get("/trending", response_model=List[str])
async def get_trending_searches(
    limit: int = Query(10, ge=1, le=50, description="Maximum number of trending terms"),
    hours: int = Query(24, ge=1, le=168, description="Time window in hours"),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get trending search terms based on recent activity.
    """
    # This would typically come from search analytics
    # For now, return popular tags and recent post titles
    
    since_date = datetime.utcnow() - timedelta(hours=hours)
    
    # Get popular tags from recent posts
    trending_tags = db.query(
        PostTag.tag_name,
        func.count(PostTag.id).label('usage_count')
    ).join(ForumPost).filter(
        ForumPost.created_at >= since_date,
        ForumPost.status == PostStatus.PUBLISHED
    ).group_by(PostTag.tag_name).order_by(
        func.count(PostTag.id).desc()
    ).limit(limit).all()
    
    return [tag_name for tag_name, _ in trending_tags]


# Helper functions
async def _search_posts(
    db: Session,
    search_terms: List[str],
    category_id: Optional[int],
    author_id: Optional[int],
    post_type: Optional[PostType],
    date_from: Optional[datetime],
    date_to: Optional[datetime],
    tags: Optional[str],
    min_likes: Optional[int],
    has_replies: Optional[bool],
    pagination: Optional[PaginationParams],
    current_user: Optional[dict]
) -> tuple[List[SearchResult], int]:
    """Search posts with given criteria."""
    query = db.query(ForumPost).filter(ForumPost.status == PostStatus.PUBLISHED)
    
    # Apply filters
    if category_id:
        query = query.filter(ForumPost.category_id == category_id)
    
    if author_id:
        query = query.filter(ForumPost.author_id == author_id)
    
    if post_type:
        query = query.filter(ForumPost.post_type == post_type)
    
    if date_from:
        query = query.filter(ForumPost.created_at >= date_from)
    
    if date_to:
        query = query.filter(ForumPost.created_at <= date_to)
    
    if min_likes:
        query = query.filter(ForumPost.like_count >= min_likes)
    
    if has_replies is not None:
        if has_replies:
            query = query.filter(ForumPost.reply_count > 0)
        else:
            query = query.filter(ForumPost.reply_count == 0)
    
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',')]
        query = query.join(PostTag).filter(PostTag.tag_name.in_(tag_list))
    
    # Apply text search
    if search_terms:
        search_conditions = []
        for term in search_terms:
            term_pattern = f"%{term}%"
            search_conditions.append(
                or_(
                    ForumPost.title.ilike(term_pattern),
                    ForumPost.content.ilike(term_pattern),
                    ForumPost.summary.ilike(term_pattern)
                )
            )
        query = query.filter(and_(*search_conditions))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    if pagination:
        query = query.offset(pagination.skip).limit(pagination.limit)
    else:
        query = query.limit(50)  # Default limit for mixed search
    
    posts = query.all()
    
    # Convert to search results
    results = []
    for post in posts:
        relevance_score = _calculate_post_relevance(post, search_terms)
        excerpt = _generate_excerpt(post.content, search_terms)
        
        results.append(SearchResult(
            type="post",
            id=post.id,
            title=post.title,
            content=post.content,
            excerpt=excerpt,
            author_id=post.author_id,
            author_username=None,  # Will be populated by user service
            created_at=post.created_at,
            relevance_score=relevance_score,
            url=f"/forum/posts/{post.id}",
            metadata={
                "category_id": post.category_id,
                "post_type": post.post_type.value,
                "like_count": post.like_count,
                "reply_count": post.reply_count,
                "view_count": post.view_count,
                "is_pinned": post.is_pinned,
                "is_featured": post.is_featured
            }
        ))
    
    return results, total


async def _search_replies(
    db: Session,
    search_terms: List[str],
    category_id: Optional[int],
    author_id: Optional[int],
    date_from: Optional[datetime],
    date_to: Optional[datetime],
    min_likes: Optional[int],
    pagination: Optional[PaginationParams],
    current_user: Optional[dict]
) -> tuple[List[SearchResult], int]:
    """Search replies with given criteria."""
    query = db.query(ForumReply).filter(ForumReply.status == ReplyStatus.PUBLISHED)
    
    # Join with posts for category filtering
    if category_id:
        query = query.join(ForumPost).filter(ForumPost.category_id == category_id)
    
    if author_id:
        query = query.filter(ForumReply.author_id == author_id)
    
    if date_from:
        query = query.filter(ForumReply.created_at >= date_from)
    
    if date_to:
        query = query.filter(ForumReply.created_at <= date_to)
    
    if min_likes:
        query = query.filter(ForumReply.like_count >= min_likes)
    
    # Apply text search
    if search_terms:
        search_conditions = []
        for term in search_terms:
            term_pattern = f"%{term}%"
            search_conditions.append(ForumReply.content.ilike(term_pattern))
        query = query.filter(and_(*search_conditions))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    if pagination:
        query = query.offset(pagination.skip).limit(pagination.limit)
    else:
        query = query.limit(25)  # Default limit for mixed search
    
    replies = query.all()
    
    # Convert to search results
    results = []
    for reply in replies:
        relevance_score = _calculate_reply_relevance(reply, search_terms)
        excerpt = _generate_excerpt(reply.content, search_terms)
        
        results.append(SearchResult(
            type="reply",
            id=reply.id,
            title=None,
            content=reply.content,
            excerpt=excerpt,
            author_id=reply.author_id,
            author_username=None,
            created_at=reply.created_at,
            relevance_score=relevance_score,
            url=f"/forum/posts/{reply.post_id}#reply-{reply.id}",
            metadata={
                "post_id": reply.post_id,
                "parent_id": reply.parent_id,
                "like_count": reply.like_count,
                "reply_count": reply.reply_count,
                "depth": reply.depth
            }
        ))
    
    return results, total


async def _search_categories(
    db: Session,
    search_terms: List[str],
    pagination: Optional[PaginationParams],
    current_user: Optional[dict]
) -> tuple[List[SearchResult], int]:
    """Search categories with given criteria."""
    query = db.query(ForumCategory).filter(
        ForumCategory.is_active == True,
        ForumCategory.is_visible == True
    )
    
    # Apply text search
    if search_terms:
        search_conditions = []
        for term in search_terms:
            term_pattern = f"%{term}%"
            search_conditions.append(
                or_(
                    ForumCategory.name.ilike(term_pattern),
                    ForumCategory.description.ilike(term_pattern)
                )
            )
        query = query.filter(and_(*search_conditions))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    if pagination:
        query = query.offset(pagination.skip).limit(pagination.limit)
    else:
        query = query.limit(10)  # Default limit for mixed search
    
    categories = query.all()
    
    # Convert to search results
    results = []
    for category in categories:
        relevance_score = _calculate_category_relevance(category, search_terms)
        excerpt = _generate_excerpt(category.description or "", search_terms)
        
        results.append(SearchResult(
            type="category",
            id=category.id,
            title=category.name,
            content=category.description or "",
            excerpt=excerpt,
            author_id=None,
            author_username=None,
            created_at=category.created_at,
            relevance_score=relevance_score,
            url=f"/forum/categories/{category.slug}",
            metadata={
                "slug": category.slug,
                "post_count": category.post_count,
                "reply_count": category.reply_count,
                "color": category.color,
                "icon": category.icon
            }
        ))
    
    return results, total


async def _search_rentals(
    db: Session,
    search_terms: List[str],
    author_id: Optional[int],
    date_from: Optional[datetime],
    date_to: Optional[datetime],
    pagination: Optional[PaginationParams],
    current_user: Optional[dict]
) -> tuple[List[SearchResult], int]:
    """Search rentals with given criteria."""
    query = db.query(RentalInfo).join(ForumPost).filter(
        ForumPost.status == PostStatus.PUBLISHED,
        ForumPost.post_type == PostType.RENTAL
    )
    
    if author_id:
        query = query.filter(RentalInfo.owner_id == author_id)
    
    if date_from:
        query = query.filter(RentalInfo.created_at >= date_from)
    
    if date_to:
        query = query.filter(RentalInfo.created_at <= date_to)
    
    # Apply text search
    if search_terms:
        search_conditions = []
        for term in search_terms:
            term_pattern = f"%{term}%"
            search_conditions.append(
                or_(
                    RentalInfo.pokemon_name.ilike(term_pattern),
                    RentalInfo.pokemon_nature.ilike(term_pattern),
                    RentalInfo.pokemon_ability.ilike(term_pattern),
                    RentalInfo.pokemon_description.ilike(term_pattern)
                )
            )
        query = query.filter(and_(*search_conditions))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    if pagination:
        query = query.offset(pagination.skip).limit(pagination.limit)
    else:
        query = query.limit(25)  # Default limit for mixed search
    
    rentals = query.all()
    
    # Convert to search results
    results = []
    for rental in rentals:
        relevance_score = _calculate_rental_relevance(rental, search_terms)
        excerpt = _generate_excerpt(rental.pokemon_description or "", search_terms)
        
        results.append(SearchResult(
            type="rental",
            id=rental.id,
            title=f"{rental.pokemon_name} (Level {rental.pokemon_level})",
            content=rental.pokemon_description or "",
            excerpt=excerpt,
            author_id=rental.owner_id,
            author_username=None,
            created_at=rental.created_at,
            relevance_score=relevance_score,
            url=f"/forum/rentals/{rental.id}",
            metadata={
                "post_id": rental.post_id,
                "pokemon_name": rental.pokemon_name,
                "pokemon_level": rental.pokemon_level,
                "pokemon_nature": rental.pokemon_nature,
                "pokemon_ability": rental.pokemon_ability,
                "price": rental.price,
                "currency": rental.currency,
                "rental_type": rental.rental_type.value,
                "is_available": rental.is_available
            }
        ))
    
    return results, total


async def _generate_suggestions(db: Session, query: str, search_type: SearchType) -> List[str]:
    """Generate search suggestions based on query and type."""
    suggestions = []
    
    # This would typically use a more sophisticated suggestion algorithm
    # For now, return simple suggestions based on popular content
    
    if search_type in [SearchType.ALL, SearchType.POSTS]:
        # Get similar post titles
        similar_posts = db.query(ForumPost.title).filter(
            ForumPost.title.ilike(f"%{query}%"),
            ForumPost.status == PostStatus.PUBLISHED
        ).limit(3).all()
        suggestions.extend([post.title for post in similar_posts])
    
    return suggestions[:5]


async def _generate_facets(db: Session, search_terms: List[str], search_type: SearchType) -> dict:
    """Generate search facets for filtering."""
    facets = {}
    
    if search_type in [SearchType.ALL, SearchType.POSTS]:
        # Category facets
        category_counts = db.query(
            ForumCategory.name,
            func.count(ForumPost.id).label('count')
        ).join(ForumPost).filter(
            ForumPost.status == PostStatus.PUBLISHED
        ).group_by(ForumCategory.name).all()
        
        facets['categories'] = [
            {'name': name, 'count': count} for name, count in category_counts
        ]
        
        # Post type facets
        type_counts = db.query(
            ForumPost.post_type,
            func.count(ForumPost.id).label('count')
        ).filter(
            ForumPost.status == PostStatus.PUBLISHED
        ).group_by(ForumPost.post_type).all()
        
        facets['post_types'] = [
            {'name': post_type.value, 'count': count} for post_type, count in type_counts
        ]
    
    return facets


def _calculate_post_relevance(post: ForumPost, search_terms: List[str]) -> float:
    """Calculate relevance score for a post."""
    score = 0.0
    
    for term in search_terms:
        # Title matches are more important
        if term.lower() in post.title.lower():
            score += 3.0
        
        # Content matches
        if term.lower() in post.content.lower():
            score += 1.0
        
        # Summary matches
        if post.summary and term.lower() in post.summary.lower():
            score += 2.0
    
    # Boost for popular posts
    score += post.like_count * 0.1
    score += post.view_count * 0.01
    score += post.reply_count * 0.2
    
    # Boost for pinned/featured posts
    if post.is_pinned:
        score += 5.0
    if post.is_featured:
        score += 3.0
    
    return score


def _calculate_reply_relevance(reply: ForumReply, search_terms: List[str]) -> float:
    """Calculate relevance score for a reply."""
    score = 0.0
    
    for term in search_terms:
        if term.lower() in reply.content.lower():
            score += 1.0
    
    # Boost for popular replies
    score += reply.like_count * 0.2
    score += reply.reply_count * 0.1
    
    return score


def _calculate_category_relevance(category: ForumCategory, search_terms: List[str]) -> float:
    """Calculate relevance score for a category."""
    score = 0.0
    
    for term in search_terms:
        if term.lower() in category.name.lower():
            score += 5.0
        
        if category.description and term.lower() in category.description.lower():
            score += 2.0
    
    # Boost for active categories
    score += category.post_count * 0.1
    
    return score


def _calculate_rental_relevance(rental: RentalInfo, search_terms: List[str]) -> float:
    """Calculate relevance score for a rental."""
    score = 0.0
    
    for term in search_terms:
        if term.lower() in rental.pokemon_name.lower():
            score += 5.0
        
        if rental.pokemon_nature and term.lower() in rental.pokemon_nature.lower():
            score += 3.0
        
        if rental.pokemon_ability and term.lower() in rental.pokemon_ability.lower():
            score += 3.0
        
        if rental.pokemon_description and term.lower() in rental.pokemon_description.lower():
            score += 1.0
    
    # Boost for available rentals
    if rental.is_available:
        score += 2.0
    
    return score


def _generate_excerpt(content: str, search_terms: List[str], max_length: int = 200) -> str:
    """Generate an excerpt highlighting search terms."""
    if not content:
        return ""
    
    # Find the first occurrence of any search term
    content_lower = content.lower()
    first_match_pos = len(content)
    
    for term in search_terms:
        pos = content_lower.find(term.lower())
        if pos != -1 and pos < first_match_pos:
            first_match_pos = pos
    
    # Extract excerpt around the first match
    start_pos = max(0, first_match_pos - max_length // 2)
    end_pos = min(len(content), start_pos + max_length)
    
    excerpt = content[start_pos:end_pos]
    
    # Add ellipsis if truncated
    if start_pos > 0:
        excerpt = "..." + excerpt
    if end_pos < len(content):
        excerpt = excerpt + "..."
    
    return excerpt.strip()