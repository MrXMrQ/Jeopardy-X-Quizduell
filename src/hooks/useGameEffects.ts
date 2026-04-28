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
}

// Update signature to accept masterVolume as the second argument
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
      waitMusic.pause();
      waitMusic.src = '';
      thinkMusic.pause();
      thinkMusic.src = '';
    };
  }, []);

  // Update volume in real-time whenever masterVolume changes
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
      sound.play().catch(e => console.warn(`Autoplay blocked for ${name}:`, e));
    }
  };

  useEffect(() => {
    if (!gameState) return;
    const prev = prevGameState.current;

    // 1. Question opened
    if (gameState.current_question && !prev?.current_question) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      playSfx('open');
    }

    // 2. Phase 1: Wait for buzzer
    const isWaitingForBuzzer = !gameState.buzzer_locked && !gameState.active_player;
    const wasNotWaiting = prev?.buzzer_locked || prev?.active_player;
    
    if (isWaitingForBuzzer && wasNotWaiting) {
      thinkMusicRef.current?.pause();
      waitMusicRef.current?.play().catch(e => console.warn("Autoplay blocked:", e));
    }

    // 3. Phase 2: Player buzzed
    if (gameState.active_player && !prev?.active_player) {
      if (navigator.vibrate) navigator.vibrate(300);
      playSfx('buzzer');
      waitMusicRef.current?.pause();
      thinkMusicRef.current?.play().catch(e => console.warn("Autoplay blocked:", e));
    }

    // 4. Evaluation
    if (!gameState.active_player && prev?.active_player) {
      const activeSid = prev.active_player.sid;
      const oldPoints = prev.players[activeSid]?.points || 0;
      const newPoints = gameState.players[activeSid]?.points || 0;

      if (thinkMusicRef.current) {
        thinkMusicRef.current.pause();
        thinkMusicRef.current.currentTime = 0;
      }

      if (newPoints > oldPoints) {
        playSfx('correct');
      } else if (newPoints < oldPoints) {
        playSfx('wrong');
      }
    }

    // 5. Reset
    if (!gameState.current_question && prev?.current_question) {
      waitMusicRef.current?.pause();
      thinkMusicRef.current?.pause();
      if (waitMusicRef.current) waitMusicRef.current.currentTime = 0;
      if (thinkMusicRef.current) thinkMusicRef.current.currentTime = 0;
    }

    prevGameState.current = gameState;
  }, [gameState]);
};