# MOS Background Authentication for Bubble Shooter

## Overview
This implementation provides **completely background authentication** using the MOS SDK. No user interface is shown - authentication happens automatically when the game loads.

## How It Works

### 1. **Automatic Background Login**
- When the game loads, MOS SDK is automatically loaded
- `mos.login(appKey)` is called in the background
- Authorization code is sent to your backend API
- Token is stored in localStorage
- User never sees any login screen

### 2. **Token Management**
- Tokens are stored in localStorage with timestamps
- Automatic token validation (24-hour expiry)
- Background token refresh when expired
- No user interaction required

### 3. **API Integration**
- All API calls automatically include authentication headers
- Token refresh happens transparently
- Failed requests automatically retry with fresh tokens

## Setup

### 1. Environment Variables
Create `.env.local` file:
```env
NEXT_PUBLIC_MOS_APP_KEY=1aaa7a1d0319427ba5314254f0fb3897
NEXT_PUBLIC_MOS_API_BASE_URL=https://mp.mos.me/api/games
```

### 2. SDK Loading
The MOS SDK is automatically loaded in `_document.tsx`:
```html
<script src="https://cdn-oss.mos.me/public/js/mos-1.1.0.js"></script>
```

## Architecture

### Core Components

#### 1. **MOS Authentication Service** (`src/services/mosAuth.ts`)
```typescript
// Main authentication functions
export const initializeAuth = async (): Promise<string | null>
export const refreshTokenIfNeeded = async (): Promise<string | null>
export const getAuthHeaders = async (): Promise<Record<string, string>>
export const authenticatedRequest = async (url: string, options: RequestInit): Promise<Response>
export const getToken = (): string | null
export const isAuthenticated = (): boolean
export const logout = (): void
```

#### 2. **Background Auth Hook** (`src/hooks/useBackgroundAuth.ts`)
```typescript
// Hook for background authentication
export const useBackgroundAuth = (): {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}
```

### Authentication Flow

```
1. Game Loads
   ↓
2. MOS SDK Loads (from CDN)
   ↓
3. Background Auth Hook Initializes
   ↓
4. Check for Existing Valid Token
   ↓
5. If No Token/Expired → Call mos.login(appKey)
   ↓
6. Send Code to Backend: POST /login/bubbleShooter/miniAppLogin
   ↓
7. Store Token in localStorage
   ↓
8. Game Ready with Authentication
```

## Usage Examples

### 1. **Making Authenticated API Calls**
```typescript
import { authenticatedRequest } from '@/services/mosAuth';

// This automatically handles token refresh
const response = await authenticatedRequest(
  'https://mp.mos.me/api/games/bubbleShooter/saveScore',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score: 1000 })
  }
);
```

### 2. **Getting Auth Headers**
```typescript
import { getAuthHeaders } from '@/services/mosAuth';

const headers = await getAuthHeaders();
// Returns: { 'Authorization': 'Bearer your_token_here' }
```

### 3. **Checking Authentication Status**
```typescript
import { useBackgroundAuth } from '@/hooks/useBackgroundAuth';

const { isAuthenticated, isLoading, error } = useBackgroundAuth();
```

## API Endpoints

### Login Endpoint
- **URL**: `https://mp.mos.me/api/games/login/bubbleShooter/miniAppLogin`
- **Method**: POST
- **Body**: `{ "code": "authorization_code_from_mos" }`
- **Response**: `{ "data": "authentication_token" }`

### Example Game Endpoints
```typescript
// Save score
POST /bubbleShooter/saveScore
Body: { "score": 1000 }

// Get leaderboard
GET /bubbleShooter/leaderboard

// Save game state
POST /bubbleShooter/saveGame
Body: { "gameState": {...} }
```

## Token Management

### Storage
- **Token**: `localStorage.getItem('bubble_token')`
- **Timestamp**: `localStorage.getItem('bubble_token_timestamp')`

### Validation
- Tokens are considered valid for 24 hours
- Automatic refresh when expired
- Background refresh without user interaction

### Refresh Process
```typescript
// When token is expired:
1. Call mos.login(appKey) again
2. Get new authorization code
3. Send to backend for new token
4. Update localStorage
5. Continue with API request
```

## Error Handling

### Common Scenarios
1. **MOS SDK Not Loaded**: Retries up to 5 seconds
2. **Network Issues**: Logs error, continues without auth
3. **Backend API Down**: Logs error, game continues
4. **Token Expired**: Automatic background refresh

### Error Recovery
- Authentication failures don't block the game
- Game continues with limited functionality
- Automatic retry on next API call

## Security Features

1. **Environment Variables**: App key stored securely
2. **Token Storage**: Secure localStorage handling
3. **Automatic Cleanup**: Tokens cleared on logout
4. **Background Refresh**: No user interaction required
5. **Error Isolation**: Auth failures don't crash the game

## Integration in Game

### Current Implementation
- **Score Saving**: Example in `updateHighestScore()`
- **Background Init**: Automatic in `useBackgroundAuth()`
- **No UI Changes**: Completely transparent to user

### Adding More API Calls
```typescript
// Example: Save game state
const saveGameState = async (gameState: any) => {
  const response = await authenticatedRequest(
    `${process.env.NEXT_PUBLIC_MOS_API_BASE_URL}/bubbleShooter/saveGame`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameState })
    }
  );
};

// Example: Get leaderboard
const getLeaderboard = async () => {
  const response = await authenticatedRequest(
    `${process.env.NEXT_PUBLIC_MOS_API_BASE_URL}/bubbleShooter/leaderboard`
  );
  return response.json();
};
```

## Testing

### Development
1. Create `.env.local` with your app key
2. Start the development server
3. Check browser console for auth logs
4. Verify token storage in localStorage

### Production
1. Update environment variables for production
2. Test authentication flow
3. Verify API calls work with authentication
4. Test token refresh functionality

## Troubleshooting

### Debug Information
Check browser console for:
- MOS SDK loading status
- Authentication flow logs
- Token refresh events
- API call results

### Common Issues
1. **SDK Not Loading**: Check CDN availability
2. **Auth Failing**: Verify app key and backend API
3. **Token Issues**: Clear localStorage and retry
4. **API Errors**: Check network and backend status

## Benefits

1. **Seamless UX**: No login screens or interruptions
2. **Automatic Management**: No manual token handling
3. **Robust**: Handles failures gracefully
4. **Secure**: Proper token management
5. **Scalable**: Easy to add more authenticated endpoints 