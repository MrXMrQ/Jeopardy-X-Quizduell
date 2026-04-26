import { useEffect, useState } from 'react';
import PlayerCard from './PlayerCard';

interface Props {
  socket: any;
  role: string;
  userName: string;
}

const GameContainer: React.FC<Props> = ({ socket, role, userName }) => {
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    socket.on('state_update', (state: any) => setGameState(state));
    return () => {
      socket.off('state_update');
    };
  }, [socket]);

  if (!gameState) return <div style={{ color: 'white', padding: '20px' }}>Lade Spielfeld...</div>;

  return (
    <div style={styles.page}>
      {/* 1. TOP: Moderator, Logo & Turn-Banner */}
      <div style={styles.topSection}>
        <div style={styles.modBox}>
          {role === 'moderator' ? 'DU BIST MODERATOR' : 'MODERATOR'}
        </div>
        <div style={styles.logoContainer}>
          <h1 style={styles.logoText}>QUIZ DUELL</h1>
  
          {/* Hier nutzen wir userName, um die Warnung zu löschen */}
          <p style={{ color: '#a855f7', margin: 0, fontWeight: 'bold' }}>
            Spieler: {userName}
          </p>

          {/* GROSSES TURN BANNER: Wer darf wählen? */}
          {!gameState.current_question && (
          <div style={styles.turnBanner}>
            <span style={styles.turnText}>
              ✨ {gameState.current_chooser} sucht aus! ✨
            </span>
          </div>
          )}
        </div>
        <div style={styles.turnIndicator}>
        </div>
      </div>

      {/* 2. MIDDLE: Das Jeopardy Board (Einzel-Kachel Sperrung) */}
      <div style={styles.boardGrid}>
        {gameState.board.categories.map((cat: any) => (
          <div key={cat.name} style={styles.column}>
            <div style={styles.categoryHeader}>{cat.name}</div>
            {cat.questions.map((q: any) => {
              // Prüfe, ob genau diese ID bereits in opened_questions ist
              const isPlayed = gameState.opened_questions.includes(q.id);
              return (
                <div
                  key={q.id}
                  style={{
                    ...styles.questionCard,
                    backgroundColor: isPlayed ? '#2d2d2d' : '#4c1d95',
                    color: isPlayed ? '#555' : 'white',
                    cursor: role === 'moderator' && !isPlayed ? 'pointer' : 'default',
                    opacity: 1 // Wir lassen Opacity auf 1, ändern aber die Farbe
                  }}
                  onClick={() => {
                    if (role === 'moderator' && !isPlayed) {
                      socket.emit('open_question', { question_id: q.id });
                    }
                  }}
                >
                  {isPlayed ? "X" : q.value}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 3. BOTTOM: Teilnehmerleiste */}
      <div style={styles.playerRow}>
        {Object.entries(gameState.players).map(([sid, p]: any) => (
          <PlayerCard
            key={sid}
            name={p.name}
            points={p.points}
            isBuzzed={gameState.active_player?.sid === sid}
          />
        ))}
      </div>

      {/* 4. OVERLAY: Frage-Modus */}
      {gameState.current_question && (
        <div style={styles.overlay}>
          <div style={styles.questionBox}>
            <h2 style={{ color: '#a855f7', fontSize: '1.5rem' }}>
              {gameState.current_question.value} Punkte
            </h2>
            <p style={{ fontSize: '2.5rem', margin: '30px 0' }}>
              {gameState.current_question.text}
            </p>

            {role === 'moderator' && (
              <div style={styles.modControls}>
                <p style={{ color: '#22c55e', fontSize: '1.5rem', marginBottom: '20px' }}>
                  Antwort: {gameState.current_question.answer}
                </p>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button style={styles.controlBtn} onClick={() => socket.emit('arm_buzzer')}>
                    Buzzer Freischalten
                  </button>
                  <button 
                    style={{ ...styles.controlBtn, backgroundColor: '#16a34a' }} 
                    onClick={() => socket.emit('resolve_question', { correct: true })}
                    disabled={!gameState.active_player}
                  >
                    Richtig (+)
                  </button>
                  <button 
                    style={{ ...styles.controlBtn, backgroundColor: '#dc2626' }} 
                    onClick={() => socket.emit('resolve_question', { correct: false })}
                    disabled={!gameState.active_player}
                  >
                    Falsch (-)
                  </button>
                  <button style={styles.controlBtn} onClick={() => socket.emit('close_question')}>
                    Niemand wusste es
                  </button>
                </div>
              </div>
            )}

            {role === 'player' && !gameState.buzzer_locked && !gameState.active_player && (
              <button style={styles.buzzerBtn} onClick={() => socket.emit('buzz')}>
                JETZT BUZZERN!
              </button>
            )}

            {gameState.active_player && (
              <div style={{ 
                color: '#fbbf24', 
                fontSize: '2.5rem', 
                marginTop: '20px', 
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(251, 191, 36, 0.5)' 
              }}>
                📢 {gameState.active_player.name} antwortet...
              </div>
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
  }
};

export default GameContainer;