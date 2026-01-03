"""
Subscription Management Views
==============================

Handles subscription operations including free subscriptions
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from decimal import Decimal

from .models import SubscriptionPlan, User


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe_to_plan(request, plan_id):
    """
    Subscribe user to a subscription plan
    
    Logic:
    - Original price = 0: Auto-subscribe (free plan)
    - Discounted to 0: Create subscription request
    - Paid: Return error (payment required)
    """
    user = request.user
    plan = get_object_or_404(SubscriptionPlan, id=plan_id, is_active=True)
    
    original_price = Decimal(str(plan.price))
    
    # Calculate discounted price
    if plan.discount_percentage > 0:
        discount_amount = original_price * (Decimal(str(plan.discount_percentage)) / Decimal('100'))
        discounted_price = original_price - discount_amount
    else:
        discounted_price = original_price
    
    # Case 1: Original price is 0 - Auto subscribe
    if original_price == 0:
        # Check if already subscribed to this plan
        if user.subscription_plan and user.subscription_plan.id == plan.id:
            return Response({
                'success': True,
                'message': 'أنت مشترك بالفعل في هذه الباقة',
                'already_subscribed': True
            })
        
        # Subscribe user
        user.subscription_plan = plan
        user.is_premium = True
        user.save()
        
        return Response({
            'success': True,
            'message': 'تم الاشتراك في الباقة المجانية بنجاح! 🎉',
            'subscribed': True
        })
    
    # Case 2: Discounted to 0 - Request subscription
    if discounted_price == 0:
        # TODO: Implement subscription request/approval system
        # For now, auto-subscribe with notification
        user.subscription_plan = plan
        user.is_premium = True
        user.save()
        
        return Response({
            'success': True,
            'message': 'تم الاشتراك في الباقة المخفضة بنجاح! 🎉',
            'subscribed': True,
            'note': 'هذه باقة مخفضة بنسبة 100%'
        })
    
    # Case 3: Paid plan - Payment required
    return Response({
        'error': 'هذه الباقة مدفوعة، يرجى إكمال عملية الدفع',
        'requires_payment': True
    }, status=status.HTTP_402_PAYMENT_REQUIRED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_subscription(request):
    """Get user's current subscription details"""
    user = request.user
    
    if user.subscription_plan:
        from .serializers import SubscriptionPlanSerializer
        return Response({
            'success': True,
            'subscription': SubscriptionPlanSerializer(user.subscription_plan).data,
            'is_premium': user.is_premium
        })
    
    return Response({
        'success': True,
        'subscription': None,
        'is_premium': False
    })
