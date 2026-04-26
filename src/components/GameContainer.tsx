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
    const peer = new Peer(); // Erzeugt eine zufällige ID
    peerInstance.current = peer;

    peer.on('open', (id) => {
      socket.emit('update_peer_id', { peerId: id });
    });

    // Eingehende Anrufe annehmen
    peer.on('call', (call) => {
      // Wir antworten mit unserem Stream (auch wenn er null ist, falls Kamera aus)
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

  // 3. Logik: Andere Spieler anrufen, sobald sie eine Peer-ID haben
  useEffect(() => {
    if (!gameState || !myStream || !peerInstance.current) return;

    Object.entries(gameState.players).forEach(([sid, p]: any) => {
      // Wenn der Spieler eine PeerId hat, nicht ich selbst ist und ich sein Video noch nicht habe:
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

  const handleToggleCam = async () => {
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
      setMyStream(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, frameRate: 15 }, // Ressourcen sparen
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
            <p style={{ fontSize: '2.5rem' }}>{gameState.current_question.text}</p>
            {role === 'moderator' && (
              <div style={styles.modControls}>
                <button style={styles.controlBtn} onClick={() => socket.emit('arm_buzzer')}>Freigeben</button>
                <button style={{...styles.controlBtn, background: 'green'}} onClick={() => socket.emit('resolve_question', { correct: true })}>Richtig</button>
                <button style={{...styles.controlBtn, background: 'red'}} onClick={() => socket.emit('resolve_question', { correct: false })}>Falsch</button>
              </div>
            )}
            {role === 'player' && !gameState.buzzer_locked && !gameState.active_player && (
              <button style={styles.buzzerBtn} onClick={() => socket.emit('buzz')}>BUZZER!</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Styles hier einfügen (wie gehabt)
const styles: Record<string, React.CSSProperties> = {
  page: { height: '100vh', width: '100vw', background: '#121212', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '10px', boxSizing: 'border-box' },
  topSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '150px' },
  modBox: { width: '250px', height: '80px', background: '#000', border: '2px solid #a855f7', borderRadius: '10px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoContainer: { textAlign: 'center' },
  logoText: { fontSize: '2.5rem', color: 'white', textShadow: '0 0 10px #a855f7', margin: 0 },
  boardGrid: { display: 'flex', gap: '15px', justifyContent: 'center', flex: 1, overflowY: 'auto' },
  column: { display: 'flex', flexDirection: 'column', gap: '8px', width: '160px' },
  categoryHeader: { background: '#a855f7', padding: '10px', borderRadius: '10px', color: 'white', textAlign: 'center', fontWeight: 'bold' },
  questionCard: { fontSize: '1.5rem', padding: '15px 0', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold' },
  playerRow: { display: 'flex', gap: '15px', justifyContent: 'center', height: '220px', borderTop: '1px solid #333', marginTop: '10px', padding: '10px' },
  overlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  questionBox: { background: '#1e1e1e', padding: '40px', borderRadius: '20px', textAlign: 'center', color: 'white', border: '2px solid #a855f7' },
  modControls: { marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' },
  controlBtn: { padding: '10px 20px', borderRadius: '5px', border: 'none', color: 'white', background: '#444', cursor: 'pointer' },
  buzzerBtn: { padding: '20px 40px', background: 'red', color: 'white', borderRadius: '50px', fontSize: '1.5rem', cursor: 'pointer' }
};

export default GameContainer;