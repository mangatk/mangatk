'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCreditCard, FaCheck, FaPercent, FaTimes, FaStar } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    duration_type: 'monthly' | 'yearly' | 'lifetime';
    duration_display: string;
    discount_percentage: number;
    discounted_price: string;
    point_multiplier: number;
    ads_enabled: boolean;
    monthly_free_translations: number;
    features: string[];
    description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const DURATION_LABELS: Record<string, string> = {
    monthly: 'شهري',
    yearly: 'سنوي',
    lifetime: 'لا محدود',
};

export default function SubscriptionsPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    async function fetchPlans() {
        try {
            const res = await fetch(`${API_URL}/subscriptions/`);
            if (res.ok) {
                const data = await res.json();
                setPlans(Array.isArray(data) ? data : data.results || []);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    }

    async function deletePlan(id: string) {
        if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;

        try {
            await fetch(`${API_URL}/subscriptions/${id}/`, { method: 'DELETE' });
            setPlans(plans.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting plan:', error);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">خطط الاشتراك</h1>
                <button
                    onClick={() => { setEditingPlan(null); setShowModal(true); }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <FaPlus /> إضافة خطة
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`bg-gray-800 rounded-xl p-6 border-2 relative ${plan.point_multiplier >= 2 ? 'border-yellow-500' :
                            plan.point_multiplier >= 1.5 ? 'border-blue-500' : 'border-gray-700'
                            } ${!plan.is_active ? 'opacity-60' : ''}`}
                    >
                        {/* Status Badge */}
                        {!plan.is_active && (
                            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                                غير مفعلة
                            </div>
                        )}

                        {/* Discount Badge */}
                        {plan.discount_percentage > 0 && (
                            <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                <FaPercent className="text-[10px]" />
                                خصم {plan.discount_percentage}%
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-4 mt-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${plan.point_multiplier >= 2 ? 'bg-yellow-600/20' :
                                    plan.point_multiplier >= 1.5 ? 'bg-blue-600/20' : 'bg-gray-700'
                                    }`}>
                                    <FaCreditCard className={`text-xl ${plan.point_multiplier >= 2 ? 'text-yellow-400' :
                                        plan.point_multiplier >= 1.5 ? 'text-blue-400' : 'text-gray-400'
                                        }`} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                    <span className="text-xs text-gray-400">{DURATION_LABELS[plan.duration_type]}</span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => { setEditingPlan(plan); setShowModal(true); }}
                                    className="p-2 text-blue-400 hover:bg-blue-600/20 rounded transition-colors"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => deletePlan(plan.id)}
                                    className="p-2 text-red-400 hover:bg-red-600/20 rounded transition-colors"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>

                        {/* Price Display */}
                        <div className="mb-4">
                            {plan.discount_percentage > 0 ? (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-white">${parseFloat(plan.discounted_price).toFixed(2)}</span>
                                    <span className="text-lg text-gray-500 line-through">${plan.price}</span>
                                    <span className="text-sm text-gray-400">/{plan.duration_type === 'lifetime' ? 'مدى الحياة' : plan.duration_type === 'yearly' ? 'سنة' : 'شهر'}</span>
                                </div>
                            ) : (
                                <div className="text-3xl font-bold text-white">
                                    {plan.price === 0 ? 'مجاني' : `$${plan.price}/${plan.duration_type === 'lifetime' ? 'مدى الحياة' : plan.duration_type === 'yearly' ? 'سنة' : 'شهر'}`}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {plan.description && (
                            <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                        )}

                        {/* Benefits */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-300">
                                <FaStar className="text-yellow-400" />
                                <span>مضاعف النقاط: x{plan.point_multiplier}</span>
                            </div>
                            {plan.monthly_free_translations > 0 && (
                                <div className="flex items-center gap-2 text-gray-300">
                                    <FaCheck className="text-green-400" />
                                    <span>{plan.monthly_free_translations} ترجمة مجانية/شهر</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-300">
                                {plan.ads_enabled ? (
                                    <>
                                        <FaTimes className="text-red-400" />
                                        <span>يحتوي على إعلانات</span>
                                    </>
                                ) : (
                                    <>
                                        <FaCheck className="text-green-400" />
                                        <span>بدون إعلانات</span>
                                    </>
                                )}
                            </div>
                            {/* Custom Features */}
                            {plan.features && plan.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-gray-300">
                                    <FaCheck className="text-green-400" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {plans.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <FaCreditCard className="text-4xl mx-auto mb-4 opacity-50" />
                    <p>لا توجد خطط اشتراك</p>
                    <p className="text-sm mt-2">اضغط على "إضافة خطة" لإنشاء خطة جديدة</p>
                </div>
            )}

            {showModal && (
                <PlanModal
                    plan={editingPlan}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); fetchPlans(); }}
                />
            )}
        </div>
    );
}

function PlanModal({ plan, onClose, onSuccess }: { plan: SubscriptionPlan | null; onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: plan?.name || '',
        price: plan?.price || 0,
        duration_type: plan?.duration_type || 'monthly',
        discount_percentage: plan?.discount_percentage || 0,
        point_multiplier: plan?.point_multiplier || 1.0,
        ads_enabled: plan?.ads_enabled ?? true,
        monthly_free_translations: plan?.monthly_free_translations || 0,
        features: plan?.features || [],
        description: plan?.description || '',
        is_active: plan?.is_active ?? true,
    });
    const [newFeature, setNewFeature] = useState('');
    const [loading, setLoading] = useState(false);

    function addFeature() {
        if (newFeature.trim()) {
            setFormData({ ...formData, features: [...formData.features, newFeature.trim()] });
            setNewFeature('');
        }
    }

    function removeFeature(idx: number) {
        setFormData({ ...formData, features: formData.features.filter((_, i) => i !== idx) });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const url = plan ? `${API_URL}/subscriptions/${plan.id}/` : `${API_URL}/subscriptions/`;

            const res = await fetch(url, {
                method: plan ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                onSuccess();
            } else {
                const error = await res.json();
                console.error('Error:', error);
                alert('حدث خطأ أثناء الحفظ');
            }
        } catch (error) {
            console.error('Error saving plan:', error);
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                    {plan ? 'تعديل الخطة' : 'إضافة خطة جديدة'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Plan Name */}
                    <div>
                        <label className="text-gray-400 text-sm">اسم الخطة *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="مثال: الخطة الذهبية"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Price & Duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-sm">السعر ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm">المدة</label>
                            <select
                                value={formData.duration_type}
                                onChange={(e) => setFormData({ ...formData, duration_type: e.target.value as 'monthly' | 'yearly' | 'lifetime' })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="monthly">شهري</option>
                                <option value="yearly">سنوي</option>
                                <option value="lifetime">لا محدود</option>
                            </select>
                        </div>
                    </div>

                    {/* Discount */}
                    <div>
                        <label className="text-gray-400 text-sm">نسبة الخصم (%)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.discount_percentage}
                                onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            />
                            <span className="text-gray-400">%</span>
                        </div>
                        {formData.discount_percentage > 0 && formData.price > 0 && (
                            <p className="text-green-400 text-sm mt-1">
                                السعر بعد الخصم: ${(formData.price * (1 - formData.discount_percentage / 100)).toFixed(2)}
                            </p>
                        )}
                    </div>

                    {/* Point Multiplier */}
                    <div>
                        <label className="text-gray-400 text-sm">مضاعف النقاط</label>
                        <input
                            type="number"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={formData.point_multiplier}
                            onChange={(e) => setFormData({ ...formData, point_multiplier: parseFloat(e.target.value) || 1 })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-gray-500 text-xs mt-1">مثال: 1.5 = تحصل على 50% نقاط إضافية</p>
                    </div>

                    {/* Free Translations */}
                    <div>
                        <label className="text-gray-400 text-sm">ترجمات مجانية شهرياً</label>
                        <input
                            type="number"
                            min="0"
                            value={formData.monthly_free_translations}
                            onChange={(e) => setFormData({ ...formData, monthly_free_translations: parseInt(e.target.value) || 0 })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Ads Toggle */}
                    <div className="flex items-center justify-between">
                        <label className="text-gray-400 text-sm">يحتوي على إعلانات</label>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, ads_enabled: !formData.ads_enabled })}
                            className={`w-12 h-6 rounded-full transition-colors ${formData.ads_enabled ? 'bg-red-600' : 'bg-green-600'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.ads_enabled ? 'translate-x-1' : 'translate-x-6'}`} />
                        </button>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between">
                        <label className="text-gray-400 text-sm">الخطة مفعلة</label>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                            className={`w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-green-600' : 'bg-gray-600'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Features */}
                    <div>
                        <label className="text-gray-400 text-sm">الميزات الإضافية</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                placeholder="أضف ميزة جديدة..."
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={addFeature}
                                className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <FaPlus />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded-lg">
                                    <span className="text-gray-300">{feature}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFeature(idx)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-gray-400 text-sm">وصف الخطة</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="وصف مختصر للخطة..."
                            rows={3}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                        >
                            {loading ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
