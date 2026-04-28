import { useEffect, useRef } from 'react';

interface Player {
  sid: string;
  points: number;
}

interface GameState {
  current_question: unknown | null;
  buzzer_locked: boolean;
  active_player: Player | null;
  players: Record<string, Player>;
  is_resolved?: boolean; // Added for better detection
}

export const useGameEffects = (gameState: GameState | null, masterVolume: number) => {
  const prevGameState = useRef<GameState | null>(null);
  
  const sfxRef = useRef<Record<string, HTMLAudioElement>>({});
  const waitMusicRef = useRef<HTMLAudioElement | null>(null);
  const thinkMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    sfxRef.current = {
      open: new Audio('/sounds/question_open.mp3'),
      buzzer: new Audio('/sounds/buzzer.mp3'),
      correct: new Audio('/sounds/correct.mp3'),
      wrong: new Audio('/sounds/wrong.mp3')
    };

    const waitMusic = new Audio('/sounds/tension_wait.mp3');
    waitMusic.loop = true;
    waitMusicRef.current = waitMusic;

    const thinkMusic = new Audio('/sounds/tension_think.mp3');
    thinkMusic.loop = true;
    thinkMusicRef.current = thinkMusic;

    return () => {
      [waitMusic, thinkMusic].forEach(m => {
        m.pause();
        m.src = '';
      });
    };
  }, []);

  useEffect(() => {
    Object.values(sfxRef.current).forEach(audio => {
      audio.volume = masterVolume;
    });
    if (waitMusicRef.current) waitMusicRef.current.volume = 0.3 * masterVolume;
    if (thinkMusicRef.current) thinkMusicRef.current.volume = 0.4 * masterVolume;
  }, [masterVolume]);

  const playSfx = (name: string) => {
    const sound = sfxRef.current[name];
    if (sound) {
      sound.currentTime = 0; 
      sound.play().catch(e => console.warn(`Autoplay blocked: ${name}`, e));
    }
  };

  const stopAmbientMusic = () => {
    if (waitMusicRef.current) {
      waitMusicRef.current.pause();
      waitMusicRef.current.currentTime = 0;
    }
    if (thinkMusicRef.current) {
      thinkMusicRef.current.pause();
      thinkMusicRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (!gameState) return;
    const prev = prevGameState.current;

    // 1. Question just opened
    if (gameState.current_question && !prev?.current_question) {
      playSfx('open');
    }

    // 2. STOP MUSIC: If question was just resolved (Moderator clicked correct)
    if (gameState.is_resolved && !prev?.is_resolved) {
      stopAmbientMusic();
    }

    // 3. Phase: Waiting for buzzer
    const isWaitingForBuzzer = !gameState.buzzer_locked && !gameState.active_player && !gameState.is_resolved;
    const wasNotWaiting = prev?.buzzer_locked || prev?.active_player || prev?.is_resolved;
    
    if (isWaitingForBuzzer && wasNotWaiting) {
      stopAmbientMusic(); // Ensure everything is quiet before starting wait music
      waitMusicRef.current?.play().catch(() => {});
    }

    // 4. Phase: Player buzzed
    if (gameState.active_player && !prev?.active_player) {
      stopAmbientMusic();
      playSfx('buzzer');
      thinkMusicRef.current?.play().catch(() => {});
    }

    // 5. Evaluation: Point change detection
    if (!gameState.active_player && prev?.active_player) {
      const activeSid = prev.active_player.sid;
      const oldPoints = prev.players[activeSid]?.points || 0;
      const newPoints = gameState.players[activeSid]?.points || 0;

      // Always stop the 'think' music when the player is no longer active
      stopAmbientMusic();

      if (newPoints > oldPoints) {
        playSfx('correct');
      } else if (newPoints < oldPoints) {
        playSfx('wrong');
        // If wrong, Phase 3 will automatically restart wait music if buzzers re-arm
      }
    }

    // 6. Reset: Overlay closed
    if (!gameState.current_question && prev?.current_question) {
      stopAmbientMusic();
    }

    prevGameState.current = gameState;
  }, [gameState]);
};