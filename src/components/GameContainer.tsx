import { useEffect, useState, useRef } from 'react';
import Peer from 'peerjs';
import PlayerCard from './PlayerCard';

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

  // 1. Game State vom Server empfangen
  useEffect(() => {
    socket.on('state_update', (state: any) => setGameState(state));
    return () => { socket.off('state_update'); };
  }, [socket]);

  // 2. PeerJS Initialisierung
  useEffect(() => {
    const peer = new Peer(); 
    peerInstance.current = peer;

    peer.on('open', (id) => {
      socket.emit('update_peer_id', { peerId: id });
    });

    peer.on('call', (call) => {
      call.answer(myStream || undefined);
      call.on('stream', (incomingStream) => {
        const callerSid = call.metadata.callerSid;
        if (callerSid) {
          setRemoteStreams(prev => ({ ...prev, [callerSid]: incomingStream }));
        }
      });
    });

    return () => {
      peer.destroy();
    };
  }, [socket, myStream]);

  // 3. Logik: Andere Spieler anrufen
  useEffect(() => {
    if (!gameState || !myStream || !peerInstance.current) return;

    Object.entries(gameState.players).forEach(([sid, p]: any) => {
      if (sid !== socket.id && p.peerId && !remoteStreams[sid]) {
        const call = peerInstance.current!.call(p.peerId, myStream, {
          metadata: { callerSid: socket.id }
        });

        call.on('stream', (incomingStream) => {
          setRemoteStreams(prev => ({ ...prev, [sid]: incomingStream }));
        });
      }
    });
  }, [gameState, myStream, remoteStreams, socket.id]);

  // --- WINNING LOGIC ---
  const allQuestionsOpened = gameState?.board?.categories?.every((cat: any) => 
    cat.questions.every((q: any) => gameState.opened_questions.includes(q.id))
  );

  const getWinner = () => {
    if (!gameState) return null;
    const playersArray = Object.entries(gameState.players).map(([sid, p]: any) => ({
      sid,
      ...p
    }));
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
    <div style={styles.page}>
      <div style={styles.topSection}>
        <div style={styles.modBox}>{role === 'moderator' ? 'MODERATOR' : 'SPIELER'}</div>
        <div style={styles.logoContainer}>
          <h1 style={styles.logoText}>QUIZ DUELL</h1>
          <p style={{ color: '#a855f7', margin: 0 }}>Spieler: {userName}</p>
        </div>
        <div style={{ width: '250px' }}></div>
      </div>

      <div style={styles.boardGrid}>
        {gameState.board.categories.map((cat: any) => (
          <div key={cat.name} style={styles.column}>
            <div style={styles.categoryHeader}>{cat.name}</div>
            {cat.questions.map((q: any) => {
              const isPlayed = gameState.opened_questions.includes(q.id);
              return (
                <div key={q.id}
                  style={{ ...styles.questionCard, backgroundColor: isPlayed ? '#2d2d2d' : '#4c1d95', color: isPlayed ? '#555' : 'white', cursor: role === 'moderator' && !isPlayed ? 'pointer' : 'default' }}
                  onClick={() => role === 'moderator' && !isPlayed && socket.emit('open_question', { question_id: q.id })}
                >
                  {isPlayed ? "X" : q.value}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={styles.playerRow}>
        {Object.entries(gameState.players).map(([sid, p]: any) => (
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
        <div style={styles.overlay}>
          <div style={styles.questionBox}>
            {/* Punkte und Frage-Text */}
            <h2 style={{ color: '#a855f7', fontSize: '1.5rem', marginBottom: '10px' }}>
              {gameState.current_question.value} Punkte
            </h2>
            <p style={{ fontSize: '2.5rem', margin: '20px 0', fontWeight: 'bold' }}>
              {gameState.current_question.text}
            </p>

            {/* MODERATOR CONTROLS */}
            {role === 'moderator' && (
              <div style={styles.modControls}>
                {/* Die richtige Antwort für den Moderator */}
                <p style={{ color: '#22c55e', fontSize: '1.8rem', marginBottom: '20px', fontWeight: 'bold' }}>
                  Lösung: {gameState.current_question.answer}
                </p>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button 
                    style={{ 
                      ...styles.controlBtn, 
                      backgroundColor: gameState.buzzer_locked ? '#3f3f46' : '#22c55e',
                      boxShadow: !gameState.buzzer_locked ? '0 0 15px #22c55e' : 'none'
                    }} 
                    onClick={() => socket.emit('arm_buzzer')}
                    disabled={!gameState.buzzer_locked}
                  >
                    {gameState.buzzer_locked ? '🔓 Freigeben' : '✅ Aktiv'}
                  </button>

                  <button 
                    style={{ ...styles.controlBtn, background: '#16a34a' }} 
                    onClick={() => socket.emit('resolve_question', { correct: true })}
                    disabled={!gameState.active_player}
                  >
                    Richtig (+)
                  </button>

                  <button 
                    style={{ ...styles.controlBtn, background: '#dc2626' }} 
                    onClick={() => socket.emit('resolve_question', { correct: false })}
                    disabled={!gameState.active_player}
                  >
                    Falsch (-)
                  </button>

                  {/* Button für "Niemand wusste es" */}
                  <button 
                    style={{ ...styles.controlBtn, background: '#52525b' }} 
                    onClick={() => socket.emit('close_question')}
                  >
                    Niemand wusste es
                  </button>
                </div>
              </div>
            )}

            {/* SPIELER CONTROLS */}
            {role === 'player' && !gameState.buzzer_locked && !gameState.active_player && (
              <button style={styles.buzzerBtn} onClick={() => socket.emit('buzz')}>
                JETZT BUZZERN!
              </button>
            )}

            {/* STATUS: Wer antwortet gerade? */}
            {gameState.active_player && (
              <div style={{ 
                color: '#fbbf24', 
                fontSize: '2.2rem', 
                marginTop: '30px', 
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(251, 191, 36, 0.5)' 
              }}>
                📢 {gameState.active_player.name} antwortet...
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- WINNER OVERLAY --- */}
      {winner && (
        <div style={styles.winnerOverlay}>
          <div style={styles.winnerBox}>
            <h1 style={styles.winnerTitle}>🏆 SPIEL BEENDET 🏆</h1>
            <div style={styles.winnerName}>{winner.name} GEWINNT!</div>
            <div style={styles.winnerPoints}>{winner.points} PUNKTE</div>
        
            <div style={styles.winnerStats}>
              <h3 style={{ borderBottom: '1px solid #a855f7', paddingBottom: '10px' }}>Endstand</h3>
              {Object.entries(gameState.players)
                .sort(([, a]: any, [, b]: any) => b.points - a.points)
                .map(([sid, p]: any) => (
                  <div key={sid} style={styles.statLine}>
                    <span>{p.name}</span>
                    <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>{p.points}</span>
                  </div>
                ))
              }
            </div>

            {role === 'moderator' && (
              <button 
                style={styles.resetBtn} 
                onClick={() => { 
                  if(window.confirm("Möchtest du das Spiel wirklich für ALLE zurücksetzen?")) {
                    socket.emit('reset_game'); 
                  }
                }}
              >
                NEUES SPIEL STARTEN
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: '100vh',
    width: '100vw',
    background: '#121212',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: '10px',
    boxSizing: 'border-box'
  },
  topSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
    height: '150px'
  },
  modBox: {
    width: '250px',
    height: '120px',
    background: '#000',
    border: '3px solid #a855f7',
    borderRadius: '15px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  },
  logoContainer: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  logoText: {
    fontSize: '2.5rem',
    color: 'white',
    fontWeight: 'bold',
    textShadow: '0 0 15px #a855f7',
    margin: 0
  },
  turnBanner: {
    marginTop: '10px',
    backgroundColor: '#581c87',
    padding: '8px 25px',
    borderRadius: '50px',
    border: '2px solid #a855f7',
    boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)'
  },
  turnText: {
    fontSize: '1.2rem',
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  boardGrid: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flex: 1, 
    padding: '10px 0',
    overflowY: 'auto', 
    minHeight: 0 
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '160px'
  },
  categoryHeader: {
    background: '#a855f7',
    padding: '10px 5px',
    borderRadius: '15px',
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    minHeight: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  questionCard: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    padding: '15px 0',
    borderRadius: '15px',
    textAlign: 'center',
    transition: 'all 0.2s',
    border: 'none'
  },
  playerRow: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px', 
    flexShrink: 0, // KORRIGIERT: Hier war der Fehler
    borderTop: '1px solid #333',
    backgroundColor: 'rgba(18, 18, 18, 0.9)',
    marginTop: '10px'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  questionBox: {
    background: '#1e1e1e',
    padding: '60px',
    borderRadius: '30px',
    textAlign: 'center',
    color: 'white',
    border: '2px solid #a855f7',
    maxWidth: '85%',
    boxShadow: '0 0 50px rgba(168, 85, 247, 0.3)'
  },
  buzzerBtn: {
    padding: '30px 60px',
    background: '#dc2626',
    color: 'white',
    borderRadius: '100px',
    fontSize: '2rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 0 30px rgba(220, 38, 38, 0.6)'
  },
  modControls: {
    marginTop: '30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  controlBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    background: '#3f3f46',
    fontWeight: 'bold'
  },
  winnerOverlay: {
    position: 'fixed', // Wichtig: Fixiert über dem gesamten Viewport
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.95)', // Fast schwarzer Hintergrund
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // Über allen anderen Overlays
    backdropFilter: 'blur(10px)', // Macht den Hintergrund verschwommen
  },
  winnerBox: {
    background: '#1a1a1a',
    padding: '60px',
    borderRadius: '30px',
    border: '4px solid #fbbf24',
    textAlign: 'center',
    color: 'white',
    boxShadow: '0 0 80px rgba(251, 191, 36, 0.3)',
    maxWidth: '600px',
    width: '90%',
  },
  winnerTitle: {
    fontSize: '3.5rem',
    color: '#fbbf24',
    margin: 0,
    textShadow: '0 0 20px rgba(251, 191, 36, 0.5)',
  },
  winnerName: {
    fontSize: '4.5rem',
    fontWeight: '900',
    margin: '20px 0',
    color: '#fff',
    textTransform: 'uppercase',
  },
  winnerPoints: {
    fontSize: '2.2rem',
    color: '#a855f7',
    fontWeight: 'bold',
    marginBottom: '40px',
  },
  winnerStats: {
    background: 'rgba(255,255,255,0.05)',
    padding: '25px',
    borderRadius: '20px',
    textAlign: 'left',
  },
  statLine: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.4rem',
    margin: '10px 0',
    padding: '5px 0',
  },
  resetBtn: {
    marginTop: '40px',
    padding: '18px 40px',
    background: 'linear-gradient(45deg, #7c3aed, #a855f7)',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    fontSize: '1.3rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
    transition: 'transform 0.2s',
  }
};

export default GameContainer;