import React, { useEffect, useState, useRef } from 'react';
import Peer from 'peerjs';
import PlayerCard from './PlayerCard';
import '../css/GameContainer.css';

interface Props {
  socket: any;
  role: string;
  userName: string;
}

const GameContainer: React.FC<Props> = ({ socket, role, userName }) => {
  const [gameState, setGameState] = useState<any>(null);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  
  const peerInstance = useRef<Peer | null>(null);

  useEffect(() => {
    socket.on('state_update', (state: any) => setGameState(state));
    return () => { socket.off('state_update'); };
  }, [socket]);

  useEffect(() => {
    const peer = new Peer(); 
    peerInstance.current = peer;
    peer.on('open', (id) => {
      socket.emit('update_peer_id', { peerId: id });
    });
    peer.on('call', (call) => {
      call.answer(myStream as MediaStream); 
      call.on('stream', (incomingStream) => {
        const callerSid = call.metadata.callerSid;
        if (callerSid) {
          setRemoteStreams(prev => ({ ...prev, [callerSid]: incomingStream }));
        }
      });
    });
    return () => { peer.destroy(); };
  }, [socket, myStream]);

  useEffect(() => {
    if (!gameState || !peerInstance.current) return;
    Object.entries(gameState.players).forEach(([sid, p]: any) => {
      if (sid !== socket.id && p.peerId && !remoteStreams[sid]) {
        setTimeout(() => {
          if (!peerInstance.current || peerInstance.current.destroyed) return;
          const call = peerInstance.current.call(p.peerId, myStream as MediaStream, {
            metadata: { callerSid: socket.id }
          });
          call?.on('stream', (incomingStream) => {
            setRemoteStreams(prev => ({ ...prev, [sid]: incomingStream }));
          });
        }, 500);
      }
    });
  }, [gameState, myStream, remoteStreams, socket.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        if (role === 'player' && !gameState?.buzzer_locked && !gameState?.active_player && gameState?.current_question) {
          event.preventDefault();
          socket.emit('buzz');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, role, socket]);

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

  const handleToggleCam = async () => {
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
      setMyStream(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, frameRate: 15 },
          audio: false 
        });
        setMyStream(stream);
      } catch (err) {
        alert("Kamera-Zugriff fehlgeschlagen!");
      }
    }
  };

  if (!gameState) return <div style={{ color: 'white' }}>Lade...</div>;

  return (
  <div className="game-page">
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

    <div className="board-grid">
    {gameState.board.categories.map((cat: any) => (
      <div key={cat.name} className="board-column">
        <div className="category-header">{cat.name}</div>
        {cat.questions.map((q: any) => {
          const isPlayed = gameState.opened_questions.includes(q.id);
        
          const cardClass = `question-card ${isPlayed ? 'played' : 'active'}`;
        
          return (
            <div 
              key={q.id}
              className={cardClass}
              style={{ 
                cursor: (role === 'moderator' && !isPlayed) ? 'pointer' : 'default' 
              }}
              onClick={() => role === 'moderator' && !isPlayed && socket.emit('open_question', { question_id: q.id })}
            >
              {isPlayed ? "X" : q.value}
            </div>
          );
        })}
      </div>
    ))}
  </div>

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

    {gameState.current_question && (
      <div className="game-overlay">
        <div className="question-box">
          <h2 style={{ color: '#a855f7', fontSize: '1.5rem', marginBottom: '10px' }}>
            {gameState.current_question.value} Punkte
          </h2>
          <p className={`question-text-display ${(role === 'player' && gameState.buzzer_locked) ? 'blurred' : ''}`}>
            {gameState.current_question.text}
          </p>

          {role === 'moderator' && (
            <div className="mod-controls">
              <p style={{ color: '#22c55e', fontSize: '1.8rem', marginBottom: '20px', fontWeight: 'bold' }}>
                Lösung: {gameState.current_question.answer}
              </p>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button 
                  className="control-btn"
                  style={{ 
                    backgroundColor: gameState.buzzer_locked ? '#3f3f46' : '#22c55e',
                    boxShadow: !gameState.buzzer_locked ? '0 0 15px #22c55e' : 'none'
                  }} 
                  onClick={() => socket.emit('arm_buzzer')}
                  disabled={!gameState.buzzer_locked}
                >
                  {gameState.buzzer_locked ? '🔓 Freigeben' : '✅ Aktiv'}
                </button>

                <button className="control-btn" style={{ background: '#16a34a' }} onClick={() => socket.emit('resolve_question', { correct: true })} disabled={!gameState.active_player}>Richtig (+)</button>
                <button className="control-btn" style={{ background: '#dc2626' }} onClick={() => socket.emit('resolve_question', { correct: false })} disabled={!gameState.active_player}>Falsch (-)</button>
                <button className="control-btn" style={{ background: '#52525b' }} onClick={() => socket.emit('close_question')}>Niemand wusste es</button>
              </div>
            </div>
          )}

          {role === 'player' && !gameState.buzzer_locked && !gameState.active_player && (
            <button className="buzzer-btn" onClick={() => socket.emit('buzz')}>JETZT BUZZERN!</button>
          )}

          {gameState.active_player && (
            <div style={{ color: '#fbbf24', fontSize: '2.2rem', marginTop: '30px', fontWeight: 'bold' }}>
              📢 {gameState.active_player.name} antwortet...
            </div>
          )}
        </div>
      </div>
    )}

    {winner && (
      <div className="winner-overlay">
        <div className="winner-box">
          <h1 className="winner-title">🏆 SPIEL BEENDET 🏆</h1>
          <div className="winner-name">{winner.name} GEWINNT!</div>
          <div style={{ fontSize: '2.2rem', color: '#a855f7', fontWeight: 'bold', marginBottom: '40px' }}>{winner.points} PUNKTE</div>
      
          <div className="winner-stats">
            <h3 style={{ borderBottom: '1px solid #a855f7', paddingBottom: '10px' }}>Endstand</h3>
            {Object.entries(gameState.players)
              .sort(([, a]: any, [, b]: any) => b.points - a.points)
              .map(([sid, p]: any) => (
                <div key={sid} className="stat-line">
                  <span>{p.name}</span>
                  <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>{p.points}</span>
                </div>
              ))
            }
          </div>

          {role === 'moderator' && (
            <button className="reset-btn" onClick={() => { if(window.confirm("...")) socket.emit('reset_game'); }}>NEUES SPIEL STARTEN</button>
          )}
        </div>
      </div>
    )}
  </div>
  );
};

export default GameContainer;