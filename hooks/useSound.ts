
import { useCallback } from 'react';

// Sounds disabled to avoid 403 errors
const useSound = () => {
  const playSound = useCallback(() => {
    // Sound disabled
  }, []);

  return {
    playClick: playSound,
    playHover: playSound,
    playConnect: playSound,
    playDisconnect: playSound,
    playSuccess: playSound,
  };
};

export default useSound;
