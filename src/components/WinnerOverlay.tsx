import React from 'react';

interface WinnerOverlayProps {
  winner: any;
  gameState: any;
  role: string;
  socket: any;
}

const WinnerOverlay: React.FC<WinnerOverlayProps> = ({ winner, gameState, role, socket }) => {
  return (
    <div className="winner-overlay">
      <div className="winner-box">
        <h1 className="winner-title">🏆 SPIEL BEENDET 🏆</h1>
        <div className="winner-name">{winner.name} GEWINNT!</div>
        <div style={{ fontSize: '2.2rem', color: '#a855f7', fontWeight: 'bold', marginBottom: '40px' }}>
          {winner.points} PUNKTE
        </div>
    
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
          <button 
            className="reset-btn" 
            onClick={() => { 
              if(window.confirm("Möchtest du das Spiel wirklich zurücksetzen?")) {
                socket.emit('reset_game'); 
              }
            }}
          >
            NEUES SPIEL STARTEN
          </button>
        )}
      </div>
    </div>
  );
};

export default WinnerOverlay;