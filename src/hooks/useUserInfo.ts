import { useState, useEffect, useRef } from "react";
import {
    getUserInfoAPI,
    saveUserInfoAPI,
    getMOSUserInfo,
    isAuthenticated,
} from "@/services/mosAuth";

interface UserInfo {
    authResult: boolean;
    firstName: string;
    lastName: string;
    headPortrait: string;
}

interface UseUserInfoReturn {
    userInfo: UserInfo | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
}

export const useUserInfo = (): UseUserInfoReturn => {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [userAuthenticated, setUserAuthenticated] = useState<boolean>(false);
    const isInitialized = useRef(false);

    useEffect(() => {
        if (isInitialized.current) {
            return;
        }

        const initializeUserInfo = async () => {
            try {
                isInitialized.current = true;

                setIsLoading(true);
                setError(null);

                let attempts = 0;
                const maxAttempts = 50;

                while (!isAuthenticated() && attempts < maxAttempts) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    attempts++;
                }

                if (!isAuthenticated()) {
                    throw new Error("Background authentication not completed");
                }

                const userInfoResponse = await getUserInfoAPI();

                if (userInfoResponse.code === 0 || userInfoResponse.code === 200) {
                    const { authResult, firstName, lastName, headPortrait } =
                        userInfoResponse.data;

                    if (authResult) {
                        setUserInfo({ authResult, firstName, lastName, headPortrait });
                        setUserAuthenticated(true);
                        setIsLoading(false);
                        return;
                    }
                }

                const mosUserInfo = await getMOSUserInfo();
                const savePayload = {
                    authResult: mosUserInfo.authorized === 1,
                    firstName: mosUserInfo.firstName,
                    lastName: mosUserInfo.lastName,
                    headPortrait: mosUserInfo.headPortrait,
                };

                await saveUserInfoAPI(savePayload);

                setUserInfo(savePayload);
                setUserAuthenticated(savePayload.authResult);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to initialize user info"
                );
                setUserAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        initializeUserInfo();
    }, []);

    return {
        userInfo,
        isLoading,
        error,
        isAuthenticated: userAuthenticated,
    };
};
