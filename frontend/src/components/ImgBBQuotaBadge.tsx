'use client';

import { useState, useEffect } from 'react';
import { FaCloudUploadAlt, FaHistory } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

export function ImgBBQuotaBadge() {
    const { token } = useAuth();
    const [stats, setStats] = useState({ today: 0, yesterday: 0, two_days_ago: 0 });
    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (!token) return;
                
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
                const res = await fetch(`${API_URL}/imgbb/stats/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch ImgBB stats', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        // Refresh every 2 minutes for accuracy
        const interval = setInterval(fetchStats, 120000);
        return () => clearInterval(interval);
    }, [token]);

    if (loading) {
        return <div className="animate-pulse w-24 h-9 bg-slate-800 border border-white/5 rounded-xl hidden sm:block"></div>;
    }

    return (
        <div className="relative hidden sm:block">
            <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl transition-colors shadow-sm"
                title="سعة رفع ImgBB"
            >
                <FaCloudUploadAlt className="text-blue-400 text-lg" />
                <span className="text-sm font-bold text-slate-200" dir="ltr">
                    {stats.today} <span className="text-xs text-slate-400 font-normal">/اليوم</span>
                </span>
            </button>

            {showDropdown && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                    <div className="absolute top-full mt-2 left-0 z-50 w-56 bg-slate-800 border border-white/10 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 mb-3 text-slate-300 border-b border-white/10 pb-2">
                            <FaHistory className="text-blue-400" />
                            <h4 className="font-bold text-sm">سجل الرفع (ImgBB)</h4>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-blue-400 font-medium">اليوم:</span>
                                <span className="font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded" dir="ltr">{stats.today}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">أمس:</span>
                                <span className="font-bold text-slate-200" dir="ltr">{stats.yesterday}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">قبل يومين:</span>
                                <span className="font-bold text-slate-300" dir="ltr">{stats.two_days_ago}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
