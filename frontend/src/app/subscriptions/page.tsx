'use client';

import { useState, useEffect } from 'react';
import { FaCheck, FaCrown, FaStar, FaInfinity } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    duration_type: 'monthly' | 'yearly' | 'lifetime';
    discount_percentage: number;
    point_multiplier: number;
    ads_enabled: boolean;
    monthly_free_translations: number;
    features: string[];
    description: string;
    is_active: boolean;
}

const DURATION_LABELS = {
    monthly: 'شهري',
    yearly: 'سنوي',
    lifetime: 'مدى الحياة'
};

const PLAN_ICONS: Record<string, any> = {
    basic: FaStar,
    gold: FaCrown,
    yearly: FaCrown,
    lifetime: FaInfinity,
};

export default function SubscriptionsPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSubscription, setCurrentSubscription] = useState<string | null>(null);
    const { user, isAuthenticated, login } = useAuth();

    useEffect(() => {
        fetchPlans();
        if (isAuthenticated) {
            fetchCurrentSubscription();
        }
    }, [isAuthenticated]);

    async function fetchPlans() {
        try {
            const res = await fetch(`${API_URL}/subscriptions/`);
            if (res.ok) {
                const data = await res.json();
                // Filter only active plans
                const activePlans = data.results?.filter((p: SubscriptionPlan) => p.is_active) || data;
                setPlans(activePlans);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchCurrentSubscription() {
        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/subscriptions/current/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.subscription) {
                    setCurrentSubscription(data.subscription.id);
                }
            }
        } catch (error) {
            console.error('Error fetching current subscription:', error);
        }
    }

    function getPlanIcon(planName: string) {
        const name = planName.toLowerCase();
        if (name.includes('ذهب') || name.includes('gold')) return FaCrown;
        if (name.includes('دائم') || name.includes('lifetime')) return FaInfinity;
        return FaStar;
    }

    function getPlanColor(planName: string) {
        const name = planName.toLowerCase();
        if (name.includes('ذهب') || name.includes('gold')) return 'from-yellow-600 to-orange-600';
        if (name.includes('دائم') || name.includes('lifetime')) return 'from-purple-600 to-pink-600';
        if (name.includes('سنوي') || name.includes('yearly')) return 'from-blue-600 to-cyan-600';
        return 'from-gray-600 to-gray-700';
    }

    function getDiscountedPrice(plan: SubscriptionPlan) {
        const price = Number(plan.price) || 0;
        if (plan.discount_percentage > 0) {
            const discount = price * (plan.discount_percentage / 100);
            return price - discount;
        }
        return price;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
                <Header />
                <div className="py-12 px-4 container mx-auto max-w-7xl">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
            <Header />
            <div className="py-12 px-4 container mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        خطط الاشتراك
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        اختر الباقة المناسبة لك واستمتع بمزايا حصرية
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                    {plans.map((plan) => {
                        const PlanIcon = getPlanIcon(plan.name);
                        const discountedPrice = getDiscountedPrice(plan);
                        const isPopular = plan.duration_type === 'yearly';
                        const originalPrice = Number(plan.price);

                        // Check if this is a free plan
                        const isFree = originalPrice === 0;
                        const isDiscountedToFree = discountedPrice === 0 && originalPrice > 0;

                        // Determine button text
                        let buttonText = 'اشترك الآن';
                        if (isFree) {
                            buttonText = 'اشترك مجاناً';
                        } else if (isDiscountedToFree) {
                            buttonText = 'احصل على الباقة المخفضة';
                        } else if (!isAuthenticated) {
                            buttonText = 'سجل دخول للاشتراك';
                        }

                        async function handleSubscribe() {
                            if (!isAuthenticated) {
                                login();
                                return;
                            }

                            // For free or discounted-to-free plans
                            if (isFree || isDiscountedToFree) {
                                try {
                                    const token = localStorage.getItem('manga_token');
                                    const res = await fetch(`${API_URL}/subscriptions/${plan.id}/subscribe/`, {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                        },
                                    });

                                    const data = await res.json();

                                    if (res.ok && data.success) {
                                        alert(data.message);
                                        // Reload page to update user data
                                        window.location.reload();
                                    } else {
                                        alert(data.error || 'حدث خطأ، حاول مرة أخرى');
                                    }
                                } catch (error) {
                                    console.error('Subscription error:', error);
                                    alert('حدث خطأ في الاتصال، حاول مرة أخرى');
                                }
                                return;
                            }

                            // For paid plans - show payment message
                            alert('سيتم إضافة نظام الدفع قريباً');
                        }

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-gray-800 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${isPopular ? 'border-yellow-500 shadow-yellow-500/20' :
                                    isFree ? 'border-green-500 shadow-green-500/20' :
                                        'border-gray-700'
                                    }`}
                            >
                                {/* Popular Badge */}
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                            الأكثر شعبية
                                        </span>
                                    </div>
                                )}

                                {/* Free Badge */}
                                {isFree && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                            مجاني
                                        </span>
                                    </div>
                                )}

                                <div className="p-6">
                                    {/* Plan Header */}
                                    <div className={`bg-gradient-to-br ${getPlanColor(plan.name)} rounded-xl p-4 mb-6`}>
                                        <div className="flex items-center justify-center mb-3">
                                            <PlanIcon className="text-4xl text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white text-center mb-1">
                                            {plan.name}
                                        </h3>
                                        <p className="text-white/80 text-sm text-center">
                                            {DURATION_LABELS[plan.duration_type]}
                                        </p>
                                    </div>

                                    {/* Description */}
                                    {plan.description && (
                                        <p className="text-gray-400 text-sm text-center mb-4">
                                            {plan.description}
                                        </p>
                                    )}

                                    {/* Price */}
                                    <div className="text-center mb-6">
                                        {plan.discount_percentage > 0 && (
                                            <div className="mb-2">
                                                <span className="text-gray-500 line-through text-lg">
                                                    ${Number(plan.price).toFixed(2)}
                                                </span>
                                                <span className="ml-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                                                    خصم {plan.discount_percentage}%
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-baseline justify-center gap-1">
                                            {isFree || isDiscountedToFree ? (
                                                <span className="text-4xl font-bold text-green-400">
                                                    مجاني
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-4xl font-bold text-white">
                                                        ${discountedPrice.toFixed(2)}
                                                    </span>
                                                    {plan.duration_type !== 'lifetime' && (
                                                        <span className="text-gray-400">
                                                            /{plan.duration_type === 'monthly' ? 'شهر' : 'سنة'}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-3 mb-6">
                                        {/* Point Multiplier */}
                                        <div className="flex items-start gap-2">
                                            <FaCheck className="text-green-400 mt-1 flex-shrink-0" />
                                            <span className="text-gray-300 text-sm">
                                                مضاعفة النقاط x{plan.point_multiplier}
                                            </span>
                                        </div>

                                        {/* Ads */}
                                        {!plan.ads_enabled && (
                                            <div className="flex items-start gap-2">
                                                <FaCheck className="text-green-400 mt-1 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">
                                                    قراءة بدون إعلانات
                                                </span>
                                            </div>
                                        )}

                                        {/* Free Translations */}
                                        {plan.monthly_free_translations > 0 && (
                                            <div className="flex items-start gap-2">
                                                <FaCheck className="text-green-400 mt-1 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">
                                                    {plan.monthly_free_translations} ترجمة مجانية شهرياً
                                                </span>
                                            </div>
                                        )}

                                        {/* Additional Features */}
                                        {plan.features && plan.features.length > 0 && plan.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <FaCheck className="text-green-400 mt-1 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">
                                                    {feature}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA Button */}
                                    {currentSubscription === plan.id ? (
                                        <div className="w-full py-3 rounded-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center shadow-lg">
                                            ✓ مشترك حالياً
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleSubscribe}
                                            className={`w-full py-3 rounded-lg font-bold transition-all duration-300 ${isFree || isDiscountedToFree
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg'
                                                : isPopular
                                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                        >
                                            {buttonText}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Benefits Section */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        لماذا الاشتراك؟
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div>
                            <div className="text-blue-400 text-3xl mb-2">🚀</div>
                            <h3 className="text-white font-bold mb-2">مضاعفة النقاط</h3>
                            <p className="text-gray-400 text-sm">
                                احصل على نقاط أكثر مع كل قراءة
                            </p>
                        </div>
                        <div>
                            <div className="text-green-400 text-3xl mb-2">✨</div>
                            <h3 className="text-white font-bold mb-2">ترجمات مجانية</h3>
                            <p className="text-gray-400 text-sm">
                                ترجم فصولك المفضلة بالمجان
                            </p>
                        </div>
                        <div>
                            <div className="text-purple-400 text-3xl mb-2">👑</div>
                            <h3 className="text-white font-bold mb-2">بدون إعلانات</h3>
                            <p className="text-gray-400 text-sm">
                                استمتع بتجربة قراءة نقية
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
