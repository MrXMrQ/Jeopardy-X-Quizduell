import { useEffect } from 'react';

export const useBuzzer = (socket: any, role: string, gameState: any) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        const canBuzz = role === 'player' && 
                        !gameState?.buzzer_locked && 
                        !gameState?.active_player && 
                        gameState?.current_question;
        
        if (canBuzz) {
          event.preventDefault();
          socket.emit('buzz');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, role, socket]);
};