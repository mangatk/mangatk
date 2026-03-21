// src/context/Auth0ProviderWrapper.tsx
'use client';

import { Auth0Provider } from '@auth0/auth0-react';
import React, { useEffect, useState } from 'react';

export function Auth0ProviderWrapper({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '';
    const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '';
    const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '';

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return <>{children}</>;
    }

    if (!(domain && clientId && audience)) {
        console.error("Auth0 environment variables are missing. Authentication will not work.");
        return <>{children}</>;
    }

    return (
        <Auth0Provider
            domain={domain}
            clientId={clientId}
            authorizationParams={{
                redirect_uri: typeof window !== 'undefined' ? window.location.origin : '',
                audience: audience,
                scope: 'openid profile email',
            }}
            cacheLocation="localstorage"
        >
            {children}
        </Auth0Provider>
    );
}
