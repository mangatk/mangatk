'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaRobot, FaSave, FaTimes, FaCheckCircle } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface AIModel {
    id: string;
    name: string;
    api_endpoint: string;
    api_key?: string;
    extra_headers: Record<string, string>;
    request_template: Record<string, any>;
    response_path: string;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
}

export default function AIModelsPage() {
    const [models, setModels] = useState<AIModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingModel, setEditingModel] = useState<AIModel | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        api_endpoint: '',
        api_key: '',
        extra_headers: '{}',
        request_template: '{}',
        response_path: 'translated_image',
        is_active: true,
        is_default: false
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/translation/ai-models/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setModels(data);
            }
        } catch (error) {
            console.error('Error fetching models:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            // Validate JSON fields
            let extraHeaders = {};
            let requestTemplate = {};

            try {
                extraHeaders = JSON.parse(formData.extra_headers);
                requestTemplate = JSON.parse(formData.request_template);
            } catch {
                setError('خطأ في صيغة JSON للحقول');
                return;
            }

            const payload = {
                ...formData,
                extra_headers: extraHeaders,
                request_template: requestTemplate
            };

            const token = localStorage.getItem('manga_token');
            const url = editingModel
                ? `${API_URL}/translation/ai-models/${editingModel.id}/`
                : `${API_URL}/translation/ai-models/`;

            const method = editingModel ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess(editingModel ? 'تم تحديث النموذج بنجاح' : 'تمت إضافة النموذج بنجاح');
                resetForm();
                fetchModels();
            } else {
                const data = await res.json();
                setError(data.error || 'حدث خطأ');
            }
        } catch (error) {
            setError('فشل الاتصال بالخادم');
        }
    };

    const handleEdit = (model: AIModel) => {
        setEditingModel(model);
        setFormData({
            name: model.name,
            api_endpoint: model.api_endpoint,
            api_key: model.api_key || '',
            extra_headers: JSON.stringify(model.extra_headers, null, 2),
            request_template: JSON.stringify(model.request_template, null, 2),
            response_path: model.response_path,
            is_active: model.is_active,
            is_default: model.is_default
        });
        setShowForm(true);
    };

    const handleDelete = async (modelId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا النموذج؟')) return;

        try {
            const token = localStorage.getItem('manga_token');
            const res = await fetch(`${API_URL}/translation/ai-models/${modelId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setSuccess('تم حذف النموذج بنجاح');
                fetchModels();
            } else {
                setError('فشل حذف النموذج');
            }
        } catch (error) {
            setError('فشل الاتصال بالخادم');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            api_endpoint: '',
            api_key: '',
            extra_headers: '{}',
            request_template: '{}',
            response_path: 'translated_image',
            is_active: true,
            is_default: false
        });
        setEditingModel(null);
        setShowForm(false);
        setError('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <FaRobot className="text-purple-400" />
                    نماذج الذكاء الاصطناعي
                </h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <FaPlus />
                    إضافة نموذج
                </button>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-300 flex items-center gap-2">
                    <FaCheckCircle />
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
                    {error}
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">
                        {editingModel ? 'تعديل النموذج' : 'إضافة نموذج جديد'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">اسم النموذج *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                                placeholder="مثال: GPT-4 Vision"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-2">رابط API *</label>
                            <input
                                type="url"
                                value={formData.api_endpoint}
                                onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                                required
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                                placeholder="https://api.example.com/translate"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-2">مفتاح API (اختياري)</label>
                            <input
                                type="password"
                                value={formData.api_key}
                                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                                placeholder="sk-..."
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Headers إضافية (JSON)</label>
                            <textarea
                                value={formData.extra_headers}
                                onChange={(e) => setFormData({ ...formData, extra_headers: e.target.value })}
                                rows={3}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                                placeholder='{"Content-Type": "application/json"}'
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-2">قالب الطلب (JSON)</label>
                            <textarea
                                value={formData.request_template}
                                onChange={(e) => setFormData({ ...formData, request_template: e.target.value })}
                                rows={4}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                                placeholder='{"model": "gpt-4", "max_tokens": 1000}'
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-2">مسار الصورة في الرد *</label>
                            <input
                                type="text"
                                value={formData.response_path}
                                onChange={(e) => setFormData({ ...formData, response_path: e.target.value })}
                                required
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                                placeholder="data.image أو translated_image"
                            />
                            <p className="text-gray-500 text-xs mt-1">مسار منقط لاستخراج الصورة من رد JSON</p>
                        </div>

                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-white cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-5 h-5"
                                />
                                مفعّل
                            </label>

                            <label className="flex items-center gap-2 text-white cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_default}
                                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                    className="w-5 h-5"
                                />
                                افتراضي
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <FaSave />
                                {editingModel ? 'تحديث' : 'إضافة'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <FaTimes />
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Models List */}
            <div className="grid gap-4">
                {models.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
                        <FaRobot className="text-6xl text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">لا توجد نماذج AI بعد</p>
                        <p className="text-gray-500 text-sm mt-2">انقر على "إضافة نموذج" للبدء</p>
                    </div>
                ) : (
                    models.map((model) => (
                        <div
                            key={model.id}
                            className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        {model.name}
                                        {model.is_default && (
                                            <span className="text-xs bg-blue-600 px-2 py-1 rounded">افتراضي</span>
                                        )}
                                        {!model.is_active && (
                                            <span className="text-xs bg-red-600 px-2 py-1 rounded">معطل</span>
                                        )}
                                    </h3>
                                    <p className="text-gray-400 text-sm mt-1">{model.api_endpoint}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(model)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(model.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">مسار الرد:</span>
                                    <span className="text-white ml-2 font-mono">{model.response_path}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">تاريخ الإنشاء:</span>
                                    <span className="text-white ml-2">
                                        {new Date(model.created_at).toLocaleDateString('ar')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
