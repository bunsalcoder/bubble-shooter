import { useState, useEffect } from 'react';
import { initializeAuth } from '@/services/mosAuth';

interface UseBackgroundAuthReturn {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    token: string | null;
}

export const useBackgroundAuth = (): UseBackgroundAuthReturn => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const initAuth = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Initialize background authentication
                const authToken = await initializeAuth();

                if (authToken) {
                    setToken(authToken);
                    setIsAuthenticated(true);
                } else {
                    setError('Authentication failed');
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error('Background authentication error:', err);
                setError(err instanceof Error ? err.message : 'Authentication failed');
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    return {
        isAuthenticated,
        isLoading,
        error,
        token,
    };
}; 