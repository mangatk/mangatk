'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaBell } from 'react-icons/fa';

interface OneSignalToastProps {
    showOnMount?: boolean;
    delay?: number;
}

export function OneSignalToast({ showOnMount = true, delay = 2000 }: OneSignalToastProps) {
    useEffect(() => {
        if (!showOnMount) return;

        // Check if user already interacted with notification prompt
        const hasShownPrompt = localStorage.getItem('onesignal_prompt_shown');
        if (hasShownPrompt === 'true') return;

        // Check if OneSignal is loaded
        const checkOneSignal = setInterval(() => {
            if (typeof window !== 'undefined' && (window as any).OneSignal) {
                clearInterval(checkOneSignal);

                // Wait for delay then show toast
                setTimeout(async () => {
                    const OneSignal = (window as any).OneSignal;

                    try {
                        // Check if already subscribed
                        const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;

                        if (!isPushEnabled) {
                            // Show custom toast with action
                            toast(
                                (t) => (
                                    <div className="flex items-start gap-3 pr-2">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                                                <FaBell className="text-white text-lg" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 mb-1">
                                                فعّل الإشعارات
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3">
                                                احصل على تنبيهات عند نزول فصول جديدة من المانجا المفضلة!
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            // Request notification permission
                                                            await OneSignal.Slidedown.promptPush();
                                                            localStorage.setItem('onesignal_prompt_shown', 'true');
                                                            toast.dismiss(t.id);
                                                            toast.success('شكراً! سنرسل لك إشعارات عند نزول فصول جديدة 🎉', {
                                                                duration: 4000,
                                                                icon: '🔔',
                                                            });
                                                        } catch (error) {
                                                            console.error('OneSignal subscription error:', error);
                                                            toast.error('حدث خطأ، يرجى المحاولة لاحقاً');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    تفعيل الآن
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        localStorage.setItem('onesignal_prompt_shown', 'true');
                                                        toast.dismiss(t.id);
                                                    }}
                                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    ليس الآن
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ),
                                {
                                    duration: Infinity,
                                    position: 'bottom-center',
                                    style: {
                                        background: 'white',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                                        maxWidth: '500px',
                                    },
                                }
                            );
                        }
                    } catch (error) {
                        console.error('OneSignal check error:', error);
                    }
                }, delay);
            }
        }, 100);

        // Cleanup after 10 seconds
        setTimeout(() => clearInterval(checkOneSignal), 10000);

        return () => clearInterval(checkOneSignal);
    }, [showOnMount, delay]);

    return null;
}

// Function to manually trigger the notification prompt
export function showOneSignalPrompt() {
    if (typeof window === 'undefined') return;

    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) {
        console.warn('OneSignal not loaded');
        return;
    }

    OneSignal.User.PushSubscription.optedIn.then((isSubscribed: boolean) => {
        if (!isSubscribed) {
            toast(
                (t) => (
                    <div className="flex items-start gap-3 pr-2">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <FaBell className="text-white text-lg" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">
                                فعّل الإشعارات
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                احصل على تنبيهات عند نزول فصول جديدة!
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        try {
                                            await OneSignal.Slidedown.promptPush();
                                            toast.dismiss(t.id);
                                            toast.success('شكراً! سنرسل لك إشعارات عند نزول فصول جديدة 🎉', {
                                                duration: 4000,
                                            });
                                        } catch (error) {
                                            console.error('OneSignal subscription error:', error);
                                            toast.error('حدث خطأ، يرجى المحاولة لاحقاً');
                                        }
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    تفعيل الآن
                                </button>
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    ليس الآن
                                </button>
                            </div>
                        </div>
                    </div>
                ),
                {
                    duration: 10000,
                    position: 'bottom-center',
                    style: {
                        background: 'white',
                        padding: '16px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                        maxWidth: '500px',
                    },
                }
            );
        }
    });
}
