import React, { useEffect, useRef } from 'react';
import '../css/PlayerCard.css';

interface Props {
  name: string;
  points: number;
  isBuzzed: boolean;
  stream?: MediaStream | null;
  isLocalPlayer?: boolean; 
  onToggleCam?: () => void;
  hidePoints?: boolean;
}

const PlayerCard: React.FC<Props> = ({ 
  name, 
  points, 
  isBuzzed, 
  stream, 
  isLocalPlayer, 
  onToggleCam, 
  hidePoints 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const cardClasses = `player-card ${isBuzzed ? 'is-buzzed' : ''} ${hidePoints ? 'is-mod' : ''}`;
  
  return (
    <div className={cardClasses}>
      <div className="video-placeholder">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={true} 
            className={`video-element ${isLocalPlayer ? 'video-mirrored' : ''}`}
          />
        ) : (
          <div className="camera-off-text">
            <div style={{ fontSize: hidePoints ? '1.5rem' : '2rem' }}>👤</div>
            <div style={{ fontSize: '0.7rem' }}>Kamera aus</div>
          </div>
        )}
        
        {isBuzzed && <div className="buzzer-badge">🔔 GEBUZZERT</div>}

        {isLocalPlayer && (
          <button onClick={onToggleCam} className="cam-btn">
            {stream ? '📷 Stop' : '📷 Start'}
          </button>
        )}
      </div>

      <div className="stats-bar">
        <span className="player-name">{name}</span>
        {!hidePoints && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>|</span>
            <span className="player-points">{points}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;