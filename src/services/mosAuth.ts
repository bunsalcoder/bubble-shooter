interface MOSLoginResponse {
  code: string;
}

interface LoginAPIResponse {
  data: {
    token: string;
  };
}

declare global {
  interface Window {
    mos: {
      login: (appKey: string) => Promise<MOSLoginResponse>;
    };
  }
}

const APP_KEY = process.env.NEXT_PUBLIC_MOS_APP_KEY || '1aaa7a1d0319427ba5314254f0fb3897'
const BASE_URL = process.env.NEXT_PUBLIC_MOS_API_BASE_URL || 'https://mp-test.mos.me/api/games'

let isInitializing = false;
let refreshPromise: Promise<string> | null = null;

const waitForMOSSDK = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const maxAttempts = 50; // 5 seconds max wait
    let attempts = 0;

    const checkSDK = () => {
      attempts++;
      
      if (typeof window !== 'undefined' && window.mos) {
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error('MOS SDK failed to load'));
      } else {
        setTimeout(checkSDK, 100);
      }
    };

    checkSDK();
  });
};

const verifyCodeWithBackend = async (code: string): Promise<string> => {
  try {
    const response = await fetch(`${BASE_URL}/login/bubbleShooter/miniAppLogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`Backend verification failed: ${response.status}`);
    }

    const data: LoginAPIResponse = await response.json();
    return data.data.token;
  } catch (error) {
    console.error('Backend verification failed:', error);
    throw error;
  }
};

const performBackgroundLogin = async (): Promise<string> => {
  try {
    await waitForMOSSDK();

    const mosResponse = await window.mos.login(APP_KEY);
    
    if (!mosResponse?.code) {
      throw new Error('No code received from MOS login');
    }

    const token = await verifyCodeWithBackend(mosResponse.code);

    localStorage.setItem('bubble_token', token);
    localStorage.setItem('bubble_token_timestamp', Date.now().toString());
    
    return token;
  } catch (error) {
    console.error('Background login failed:', error);
    throw error;
  }
};

export const initializeAuth = async (): Promise<string | null> => {
  if (isInitializing) {
    return refreshPromise;
  }

  isInitializing = true;
  
  try {
    const existingToken = getToken();
    if (existingToken) {
      isInitializing = false;
      return existingToken;
    }

    const token = await performBackgroundLogin();
    isInitializing = false;
    return token;
  } catch (error) {
    isInitializing = false;
    return null;
  }
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bubble_token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const refreshTokenIfNeeded = async (): Promise<string | null> => {
  const token = getToken();
  
  if (!token) {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = performBackgroundLogin();
    const newToken = await refreshPromise;
    refreshPromise = null;
    return newToken;
  }

  return token;
};

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await refreshTokenIfNeeded();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const logout = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('bubble_token');
  localStorage.removeItem('bubble_token_timestamp');
};

export const authenticatedRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = await getAuthHeaders();
  
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  let response = await fetch(url, requestOptions);

  if (response.status === 401) {
    console.log('Token expired, refreshing...');
    
    try {
      localStorage.removeItem('bubble_token');
      localStorage.removeItem('bubble_token_timestamp');

      const newToken = await performBackgroundLogin();
      
      if (newToken) {
        const newHeaders = await getAuthHeaders();
        const retryOptions: RequestInit = {
          ...options,
          headers: {
            ...newHeaders,
            ...options.headers,
          },
        };
        
        response = await fetch(url, retryOptions);
        console.log('Request retried with new token');
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
  }

  return response;
};

export const saveGameAPI = async (gameData: any, highestScore: number): Promise<any> => {
  try {
    const response = await authenticatedRequest(`${BASE_URL}/progress/bubbleShooter/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bubbleShooterGame:gameData,
        bubbleShooterHighestScore: highestScore
      }),
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Save game request failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Save game API error:', error);
    throw error;
  }
};

export const getGameAPI = async (): Promise<any> => {
  try {
    const response = await authenticatedRequest(`${BASE_URL}/progress/bubbleShooter/get`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Get game request failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Get game API error:', error);
    throw error;
  }
};

export const clearGameAPI = async (): Promise<any> => {
  try {
    const response = await authenticatedRequest(`${BASE_URL}/progress/bubbleShooter/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Clear game request failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Clear game API error:', error);
    throw error;
  }
};
