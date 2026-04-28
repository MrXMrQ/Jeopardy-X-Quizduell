import { useEffect, useRef } from 'react';

// --- Types ---
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

export const useGameEffects = (gameState: GameState | null, socketId: string) => {
  const prevGameState = useRef<GameState | null>(null);
  
  // Sound effects
  const sfxRef = useRef<Record<string, HTMLAudioElement>>({});
  
  // Two phases of background music
  const waitMusicRef = useRef<HTMLAudioElement | null>(null);  // Phase 1: Waiting for buzzer
  const thinkMusicRef = useRef<HTMLAudioElement | null>(null); // Phase 2: Player is answering

  useEffect(() => {
    // 1. Load short sound effects
    sfxRef.current = {
      open: new Audio('/sounds/question_open.mp3'),
      buzzer: new Audio('/sounds/buzzer.mp3'),
      correct: new Audio('/sounds/correct.mp3'),
      wrong: new Audio('/sounds/wrong.mp3')
    };

    // 2. Load Phase 1 music (Tick-Tack / Tension)
    const waitMusic = new Audio('/sounds/tension_wait.mp3');
    waitMusic.loop = true;
    waitMusic.volume = 0.3;
    waitMusicRef.current = waitMusic;

    // 3. Load Phase 2 music (Heartbeat / Focus)
    const thinkMusic = new Audio('/sounds/tension_think.mp3');
    thinkMusic.loop = true;
    thinkMusic.volume = 0.4; // Slightly louder presence during the answer phase
    thinkMusicRef.current = thinkMusic;

    // Cleanup: Stop all music and clear sources on unmount
    return () => {
      waitMusic.pause();
      waitMusic.src = '';
      thinkMusic.pause();
      thinkMusic.src = '';
    };
  }, []);

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

    // 1. MODERATOR OPENS QUESTION
    if (gameState.current_question && (!prev || !prev.current_question)) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      playSfx('open');
    }

    // 2. PHASE 1: BUZZER UNLOCKED (Waiting for players)
    // Starts when initially unlocked OR re-unlocked after a wrong answer
    const isWaitingForBuzzer = !gameState.buzzer_locked && !gameState.active_player;
    const wasNotWaiting = prev?.buzzer_locked || prev?.active_player;
    
    if (isWaitingForBuzzer && wasNotWaiting) {
      thinkMusicRef.current?.pause(); // Ensure think music is off
      waitMusicRef.current?.play().catch(e => console.warn("Autoplay blocked:", e));
    }

    // 3. PHASE 2: SOMEONE BUZZED (Player is answering)
    if (gameState.active_player && (!prev || !prev.active_player)) {
      if (navigator.vibrate) navigator.vibrate(300);
      playSfx('buzzer');
      
      // Stop "Tick-Tack", start "Heartbeat"!
      waitMusicRef.current?.pause();
      thinkMusicRef.current?.play().catch(e => console.warn("Autoplay blocked:", e));
    }

    // 4. ANSWER EVALUATED
    if (!gameState.active_player && prev?.active_player) {
      const activeSid = prev.active_player.sid;
      const oldPoints = prev.players[activeSid]?.points || 0;
      const newPoints = gameState.players[activeSid]?.points || 0;

      // Stop heartbeat music as the answering phase is over
      if (thinkMusicRef.current) {
        thinkMusicRef.current.pause();
        thinkMusicRef.current.currentTime = 0;
      }

      if (newPoints > oldPoints) {
        playSfx('correct');
        // Music stays off until the next question is opened
      } else if (newPoints < oldPoints) {
        playSfx('wrong');
        // On "wrong", the backend automatically unlocks the buzzer.
        // This causes Phase 1 (Step 2 above) to trigger, restarting the wait music!
      }
    }

    // 5. QUESTION FULLY CLOSED (Nobody knew it, or it was solved)
    if (!gameState.current_question && prev?.current_question) {
      if (waitMusicRef.current) {
        waitMusicRef.current.pause();
        waitMusicRef.current.currentTime = 0;
      }
      if (thinkMusicRef.current) {
        thinkMusicRef.current.pause();
        thinkMusicRef.current.currentTime = 0;
      }
    }

    prevGameState.current = gameState;
  }, [gameState]);
};