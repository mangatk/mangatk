// src/mocks/MSWProvider.tsx
'use client'

import { useEffect, useState } from 'react'

export function MSWProvider({ children }: { children: React.ReactNode }) {
    const [mswReady, setMswReady] = useState(false)

    useEffect(() => {
        const initMSW = async () => {
            // Only initialize MSW in development and when explicitly enabled
            if (
                process.env.NODE_ENV === 'development' &&
                process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
            ) {
                try {
                    const { worker } = await import('./browser')

                    await worker.start({
                        onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
                        quiet: false, // Show MSW logs in console
                    })

                    console.log('[MSW] 🎭 Mock Service Worker started successfully')
                    console.log('[MSW] 📡 Intercepting API calls to:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
                    console.log('[MSW] 💡 To disable mocks, set NEXT_PUBLIC_USE_MOCKS=false in .env.local')

                    setMswReady(true)
                } catch (error) {
                    console.error('[MSW] Failed to start Mock Service Worker:', error)
                    setMswReady(true) // Continue anyway
                }
            } else {
                // MSW not enabled - continue normally
                setMswReady(true)
            }
        }

        initMSW()
    }, [])

    // Show loading indicator only if MSW is enabled
    if (!mswReady && process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                fontFamily: 'system-ui, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎭</div>
                    <div style={{ fontSize: '18px', marginBottom: '8px' }}>Initializing MSW...</div>
                    <div style={{ fontSize: '14px', color: '#888' }}>Mock Service Worker is starting up</div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
