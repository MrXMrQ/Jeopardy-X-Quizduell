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
  is_resolved?: boolean;
}

export const useGameEffects = (gameState: GameState | null, masterVolume: number) => {
  const prevGameState = useRef<GameState | null>(null);
  
  // Refs for audio objects
  const sfxRef = useRef<Record<string, HTMLAudioElement>>({});
  const waitMusicRef = useRef<HTMLAudioElement | null>(null);
  const thinkMusicRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
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
    }
  }, []);

  // Sync volumes
  useEffect(() => {
    Object.values(sfxRef.current).forEach(audio => {
      audio.volume = masterVolume;
    });
    if (waitMusicRef.current) waitMusicRef.current.volume = 0.3 * masterVolume;
    if (thinkMusicRef.current) thinkMusicRef.current.volume = 0.4 * masterVolume;
  }, [masterVolume]);

  /**
   * Helper: Only stops loopable background music.
   * Does NOT touch the SFX objects.
   */
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

  const playSfx = (name: string) => {
    const sound = sfxRef.current[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.warn(`SFX play failed: ${name}`, e));
    }
  };

  useEffect(() => {
    if (!gameState) return;
    const prev = prevGameState.current;

    // 1. Question opened
    if (gameState.current_question && !prev?.current_question) {
      playSfx('open');
    }

    // 2. DETECT CORRECT ANSWER (The trigger for your sound)
    const isNowResolved = gameState.is_resolved && !prev?.is_resolved;
    
    // Check if points increased for the player who was just active
    let wasCorrect = false;
    if (prev?.active_player) {
      const sid = prev.active_player.sid;
      if ((gameState.players[sid]?.points || 0) > (prev.players[sid]?.points || 0)) {
        wasCorrect = true;
      }
    }

    if (isNowResolved || wasCorrect) {
      // ORDER IS KEY: Stop music first, then play SFX
      stopAmbientMusic();
      playSfx('correct');
      prevGameState.current = gameState; // Update prev early to prevent double triggers
      return; // Exit here so we don't trigger other music phases in the same cycle
    }

    // 3. Phase: Waiting for buzzer
    const isWaitingForBuzzer = !gameState.buzzer_locked && !gameState.active_player && !gameState.is_resolved;
    if (isWaitingForBuzzer) {
      if (waitMusicRef.current?.paused) {
        if (thinkMusicRef.current) {
          thinkMusicRef.current.pause();
          thinkMusicRef.current.currentTime = 0;
        }
        waitMusicRef.current.play().catch(() => {});
      }
    }

    // 4. Phase: Player buzzed
    if (gameState.active_player && !prev?.active_player) {
      waitMusicRef.current?.pause(); // Don't reset time, we might need to continue later
      playSfx('buzzer');
      thinkMusicRef.current?.play().catch(() => {});
    }

    // 5. Evaluation: WRONG answer
    // We check for 'gameState.current_question' to prevent a jumpscare when closing the overlay
    if (gameState.current_question && !gameState.active_player && prev?.active_player && !wasCorrect) {
      playSfx('wrong');
      // Stop think music, let Phase 3 restart wait music
      if (thinkMusicRef.current) {
        thinkMusicRef.current.pause();
        thinkMusicRef.current.currentTime = 0;
      }
    }

    // 6. Reset when closing the overlay
    if (!gameState.current_question && prev?.current_question) {
      stopAmbientMusic();
    }

    prevGameState.current = gameState;
  }, [gameState]);
};