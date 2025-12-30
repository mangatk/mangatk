'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function OneSignalInit() {
    useEffect(() => {
        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
        if (!appId) {
            console.error('OneSignal App ID is missing');
            return;
        }

        (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
        (window as any).OneSignalDeferred.push(async function (OneSignal: any) {
            await OneSignal.init({
                appId: appId,
            });

            // Log initialization for debugging
            console.log('OneSignal initialized with App ID:', appId);
        });
    }, []);

    return (
        <Script
            src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
            strategy="afterInteractive"
            defer
        />
    );
}
