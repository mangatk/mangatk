'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function OneSignalInit() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) return;

    (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
    (window as any).OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId,
        // لأن ملف الـworker في الجذر
        serviceWorkerPath: 'OneSignalSDKWorker.js',
        notifyButton: { enable: true },
      });
    });
  }, []);

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  );
}
