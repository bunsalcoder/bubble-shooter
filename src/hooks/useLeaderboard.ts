import { useState, useEffect, useRef } from 'react';
import { getLeaderboardAPI } from '@/services/mosAuth';

interface LeaderboardPlayer {
  avatarUrl: string;
  id: string;
  name: string;
  rank: number;
  score: number;
}

interface UseLeaderboardReturn {
  currentUserRank: LeaderboardPlayer | null;
  topPlayers: LeaderboardPlayer[];
  isLoading: boolean;
  error: string | null;
  refreshLeaderboard: () => Promise<void>;
}

export const useLeaderboard = (): UseLeaderboardReturn => {
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardPlayer | null>(null);
  const [topPlayers, setTopPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getLeaderboardAPI();
      
      if (response.code === 0 || response.code === 200) {
        setCurrentUserRank(response.data.currentUserRank);
        setTopPlayers(response.data.topPlayers);
      } else {
        throw new Error(response.message || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLeaderboard = async () => {
    await fetchLeaderboard();
  };

  return {
    currentUserRank,
    topPlayers,
    isLoading,
    error,
    refreshLeaderboard,
  };
}; 