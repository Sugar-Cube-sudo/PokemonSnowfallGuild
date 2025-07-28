#!/usr/bin/env python3
"""
User Service API Package

This package contains all API routes and endpoints for the user service.
"""

from .v1 import api_router

__all__ = ["api_router"]