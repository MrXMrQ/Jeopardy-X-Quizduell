import React, { useEffect, useRef } from 'react';

interface Props {
  name: string;
  points: number;
  isBuzzed: boolean;
  stream?: MediaStream | null;
  isLocalPlayer?: boolean; 
  onToggleCam?: () => void;
  hidePoints?: boolean; // Neu: Um Punkte (beim Moderator) auszublenden
}

const PlayerCard: React.FC<Props> = ({ name, points, isBuzzed, stream, isLocalPlayer, onToggleCam, hidePoints }) => {
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
      boxShadow: isBuzzed ? '0 0 20px rgba(34, 197, 94, 0.5)' : 'none',
      // Falls Punkte versteckt sind (Mod), Karte etwas kompakter machen
      width: hidePoints ? '220px' : '280px'
    }}>
      <div style={{
        ...styles.videoPlaceholder,
        height: hidePoints ? '120px' : '160px' // Mod-Video etwas kleiner
      }}>
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={true} 
            style={{
              ...styles.videoElement,
              // Nur den eigenen lokalen Stream spiegeln, Remote-Streams normal zeigen
              transform: isLocalPlayer ? 'scaleX(-1)' : 'none'
            }}
          />
        ) : (
          <div style={{ color: '#444', textAlign: 'center' }}>
            <div style={{ fontSize: hidePoints ? '1.5rem' : '2rem' }}>👤</div>
            <div style={{ fontSize: '0.7rem' }}>Kamera aus</div>
          </div>
        )}
        
        {isBuzzed && <div style={styles.buzzerBadge}>🔔 GEBUZZERT</div>}

        {isLocalPlayer && (
          <button onClick={onToggleCam} style={styles.camBtn}>
            {stream ? '📷 Stop' : '📷 Start'}
          </button>
        )}
      </div>

      <div style={{
        ...styles.statsBar,
        background: hidePoints ? '#222' : '#581c87', // Mod bekommt eine neutralere Farbe
        height: hidePoints ? '35px' : '45px',
        fontSize: hidePoints ? '0.9rem' : '1.1rem'
      }}>
        <span style={styles.name}>{name}</span>
        {!hidePoints && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>|</span>
            <span style={styles.points}>{points}</span>
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: { 
    borderRadius: '12px', 
    overflow: 'hidden', 
    background: '#000', 
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column'
  },
  videoPlaceholder: { 
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
    objectFit: 'cover'
  },
  camBtn: {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '6px',
    padding: '3px 6px',
    cursor: 'pointer',
    fontSize: '0.7rem',
    zIndex: 20
  },
  buzzerBadge: { 
    position: 'absolute', 
    top: '8px', 
    right: '8px', 
    background: '#22c55e', 
    color: 'white', 
    padding: '4px 8px', 
    borderRadius: '5px', 
    fontWeight: 'bold', 
    fontSize: '0.75rem',
    zIndex: 10 
  },
  statsBar: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px', 
    color: 'white', 
    fontWeight: 'bold' 
  },
  name: { color: '#fff' },
  points: { 
    color: '#a855f7', 
    background: '#fff', 
    padding: '1px 6px', 
    borderRadius: '4px' 
  }
};

export default PlayerCard;