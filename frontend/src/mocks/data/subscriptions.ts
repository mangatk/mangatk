// src/mocks/data/subscriptions.ts
export const mockSubscriptionPlans = [
    {
        id: 1,
        name: 'الباقة الأساسية',
        price: 9.99,
        duration_type: 'monthly',
        discount_percentage: 0,
        point_multiplier: 1.5,
        monthly_free_translations: 5,
        ads_enabled: false,
        is_active: true,
        features: ['قراءة بدون إعلانات', '5 ترجمات مجانية شهرياً', 'مضاعفة النقاط x1.5'],
        description: 'باقة مثالية للقراء العاديين'
    },
    {
        id: 2,
        name: 'الباقة الذهبية',
        price: 24.99,
        duration_type: 'monthly',
        discount_percentage: 10,
        point_multiplier: 2.0,
        monthly_free_translations: 15,
        ads_enabled: false,
        is_active: true,
        features: ['قراءة بدون إعلانات', '15 ترجمة مجانية شهرياً', 'مضاعفة النقاط x2', 'دعم فني أولوية'],
        description: 'للقراء المتحمسين'
    },
    {
        id: 3,
        name: 'الباقة السنوية',
        price: 99.99,
        duration_type: 'yearly',
        discount_percentage: 20,
        point_multiplier: 2.5,
        monthly_free_translations: 25,
        ads_enabled: false,
        is_active: true,
        features: ['جميع مزايا الباقة الذهبية', '25 ترجمة مجانية شهرياً', 'مضاعفة النقاط x2.5', 'خصم 20%', 'شارة خاصة'],
        description: 'أفضل قيمة مع خصم كبير'
    },
    {
        id: 4,
        name: 'الباقة الدائمة',
        price: 299.99,
        duration_type: 'lifetime',
        discount_percentage: 0,
        point_multiplier: 3.0,
        monthly_free_translations: 50,
        ads_enabled: false,
        is_active: true,
        features: ['دائمة مدى الحياة', '50 ترجمة مجانية شهرياً', 'مضاعفة النقاط x3', 'دعم فني VIP', 'شارة VIP'],
        description: 'استثمار لمرة واحدة - مدى الحياة!'
    }
];

export function getAllSubscriptions() {
    return {
        results: mockSubscriptionPlans
    };
}

export function getActiveSubscription(userId = 1) {
    // Simulate user has basic plan
    return {
        plan: mockSubscriptionPlans[0],
        expires_at: '2025-01-26T00:00:00Z',
        is_active: true
    };
}

let nextPlanId = 10;
export function createSubscriptionPlan(data: any) {
    const newPlan = {
        id: nextPlanId++,
        ...data
    };
    mockSubscriptionPlans.push(newPlan);
    return newPlan;
}
