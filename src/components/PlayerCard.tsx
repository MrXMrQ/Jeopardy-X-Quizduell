import React, { useEffect, useRef } from 'react';

interface Props {
  name: string;
  points: number;
  isBuzzed: boolean;
  stream?: MediaStream | null;
  isLocalPlayer?: boolean; // Neu: Zeigt den Button nur für den Besitzer an
  onToggleCam?: () => void; // Neu: Callback für den GameContainer
}

const PlayerCard: React.FC<Props> = ({ name, points, isBuzzed, stream, isLocalPlayer, onToggleCam }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{
      ...styles.card,
      border: isBuzzed ? '4px solid #22c55e' : '2px solid #333',
      boxShadow: isBuzzed ? '0 0 20px rgba(34, 197, 94, 0.5)' : 'none'
    }}>
      <div style={styles.videoPlaceholder}>
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={true} 
            style={styles.videoElement}
          />
        ) : (
          <div style={{ color: '#444', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>👤</div>
            <div style={{ fontSize: '0.8rem' }}>Kamera aus</div>
          </div>
        )}
        
        {isBuzzed && <div style={styles.buzzerBadge}>🔔 GEBUZZERT</div>}

        {/* Kamera-Button für den lokalen Spieler */}
        {isLocalPlayer && (
          <button onClick={onToggleCam} style={styles.camBtn}>
            {stream ? '📷 Stop' : '📷 Start'}
          </button>
        )}
      </div>

      <div style={styles.statsBar}>
        <span style={styles.name}>{name}:</span>
        <span style={styles.points}>{points}</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: { 
    width: '280px', 
    borderRadius: '12px', 
    overflow: 'hidden', 
    background: '#000', 
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column'
  },
  videoPlaceholder: { 
    height: '160px', 
    background: '#111', 
    position: 'relative', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    overflow: 'hidden'
  },
  videoElement: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)' 
  },
  camBtn: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '6px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    zIndex: 20,
    transition: 'background 0.2s'
  },
  buzzerBadge: { 
    position: 'absolute', 
    top: '10px', 
    right: '10px', // Auf "right" geändert, damit es nicht mit dem Button kollidiert
    background: '#22c55e', 
    color: 'white', 
    padding: '5px 10px', 
    borderRadius: '5px', 
    fontWeight: 'bold', 
    fontSize: '0.8rem',
    zIndex: 10 
  },
  statsBar: { 
    height: '45px', 
    background: '#581c87', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '10px', 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: '1.1rem' 
  },
  name: { color: '#fff' },
  points: { 
    color: '#a855f7', 
    background: '#fff', 
    padding: '2px 8px', 
    borderRadius: '5px' 
  }
};

export default PlayerCard;