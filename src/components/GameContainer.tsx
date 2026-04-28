import React, { useEffect, useState } from 'react';
import PlayerCard from './PlayerCard';
import GameBoard from './GameBoard';             // Neu zu erstellende Komponente
import QuestionOverlay from './QuestionOverlay'; // Neu zu erstellende Komponente
import WinnerOverlay from './WinnerOverlay';     // Neu zu erstellende Komponente
import { useWebRTC } from '../hooks/useWebRTC';
import { useBuzzer } from '../hooks/useBuzzer';
import '../css/GameContainer.css';

interface Props {
  socket: any;
  role: string;
  userName: string;
}

const GameContainer: React.FC<Props> = ({ socket, role, userName }) => {
  const [gameState, setGameState] = useState<any>(null);

  // 1. Socket Listener
  useEffect(() => {
    socket.on('state_update', (state: any) => setGameState(state));
    return () => { socket.off('state_update'); };
  }, [socket]);

  // 2. Custom Hooks für komplexe Logik
  const { myStream, remoteStreams, handleToggleCam } = useWebRTC(socket, gameState);
  useBuzzer(socket, role, gameState);

  // 3. Helper-Funktionen
  const allQuestionsOpened = gameState?.board?.categories?.every((cat: any) => 
    cat.questions.every((q: any) => gameState.opened_questions.includes(q.id))
  );

  const getWinner = () => {
    if (!gameState) return null;
    const playersArray = Object.entries(gameState.players).map(([sid, p]: any) => ({ sid, ...p }));
    if (playersArray.length === 0) return null;
    return playersArray.reduce((prev, current) => (prev.points > current.points) ? prev : current);
  };

  const winner = allQuestionsOpened ? getWinner() : null;

  // 4. Render
  if (!gameState) return <div style={{ color: 'white' }}>Lade...</div>;

  return (
    <div className="game-page">
      {/* --- HEADER --- */}
      <div className="top-section">
        <div className="mod-box">
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#a855f7' }}>Angemeldet als:</p>
          <strong style={{ fontSize: '1.1rem' }}>{userName}</strong>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.7rem', opacity: 0.7 }}>
            {role === 'moderator' ? '👑 SPIELLEITUNG' : '🕹️ SPIELER'}
          </p>
        </div>

        <div className="logo-container">
          <h1 className="logo-text">QUIZ DUELL</h1>
          {!gameState.current_question && (
            <div className="turn-banner">
              <span className="turn-text">✨ {gameState.current_chooser} sucht aus! ✨</span>
            </div>
          )}
        </div>

        <div className="moderator-stream-container">
          {gameState.moderator_sid ? (
            <PlayerCard
              key={gameState.moderator_sid}
              name="MODERATOR"
              points={0}
              isBuzzed={false}
              stream={socket.id === gameState.moderator_sid ? myStream : remoteStreams[gameState.moderator_sid]}
              isLocalPlayer={socket.id === gameState.moderator_sid}
              onToggleCam={handleToggleCam}
              hidePoints={true}
            />
          ) : (
            <div className="no-mod-text">Warten auf Moderator...</div>
          )}
        </div>
      </div>

      {/* --- SPIELFELD --- */}
      <GameBoard 
        gameState={gameState} 
        role={role} 
        socket={socket} 
      />

      {/* --- SPIELER-REIHE --- */}
      <div className="player-row">
        {Object.entries(gameState.players)
          .filter(([sid]) => sid !== gameState.moderator_sid)
          .map(([sid, p]: any) => (
          <PlayerCard
            key={sid}
            name={p.name}
            points={p.points}
            isBuzzed={gameState.active_player?.sid === sid}
            stream={sid === socket.id ? myStream : remoteStreams[sid]}
            isLocalPlayer={sid === socket.id}
            onToggleCam={handleToggleCam}
          />
        ))}
      </div>

      {/* --- OVERLAYS --- */}
      {gameState.current_question && (
        <QuestionOverlay 
          gameState={gameState} 
          role={role} 
          socket={socket} 
        />
      )}

      {winner && (
        <WinnerOverlay 
          winner={winner} 
          gameState={gameState} 
          role={role} 
          socket={socket} 
        />
      )}
    </div>
  );
};

export default GameContainer;