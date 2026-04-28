import React, { useEffect, useRef } from 'react';
import '../css/PlayerCard.css';

interface PlayerCardProps {
  name: string;
  points: number;
  isBuzzed: boolean;
  stream?: MediaStream | null;
  isLocalPlayer?: boolean; 
  onToggleCam?: () => void;
  hidePoints?: boolean;
}

/**
 * PlayerCard Component
 * Displays participant video feed, status badges, and points.
 * Automatically handles the attachment of MediaStream to the video element.
 */
const PlayerCard: React.FC<PlayerCardProps> = ({ 
  name, 
  points, 
  isBuzzed, 
  stream, 
  isLocalPlayer, 
  onToggleCam, 
  hidePoints 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Effect: Binds the MediaStream to the video DOM element whenever it changes.
   */
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Construct dynamic class names based on state
  const containerClasses = [
    'player-card',
    isBuzzed ? 'is-buzzed' : '',
    hidePoints ? 'is-moderator-view' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <header className="card-video-container">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={true} // Always muted to avoid echo in P2P mesh
            className={`video-element ${isLocalPlayer ? 'mirrored' : ''}`}
          />
        ) : (
          <div className="camera-placeholder">
            <span className="placeholder-icon">
              {hidePoints ? '👑' : '👤'}
            </span>
            <span className="placeholder-text">Camera Off</span>
          </div>
        )}
        
        {isBuzzed && (
          <div className="buzzer-status-badge">
            <span className="badge-icon">🔔</span> 
            ACTIVE
          </div>
        )}

        {isLocalPlayer && (
          <button 
            onClick={onToggleCam} 
            className={`cam-control-btn ${stream ? 'stop' : 'start'}`}
            aria-label={stream ? "Stop Camera" : "Start Camera"}
          >
            {stream ? '📷 Stop' : '📷 Start'}
          </button>
        )}
      </header>

      <footer className="card-info-bar">
        <span className="display-name">{name}</span>
        
        {!hidePoints && (
          <div className="points-container">
            <span className="separator">|</span>
            <span className="score-value">{points}</span>
          </div>
        )}
      </footer>
    </div>
  );
};

export default PlayerCard;