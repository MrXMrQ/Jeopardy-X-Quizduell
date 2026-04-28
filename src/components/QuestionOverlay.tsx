import React from 'react';

interface QuestionOverlayProps {
  gameState: any;
  role: string;
  socket: any;
}

const QuestionOverlay: React.FC<QuestionOverlayProps> = ({ gameState, role, socket }) => {
  const isPlayerActive = !!gameState.active_player;

  return (
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
              {/* Arm Buzzer: Disabled if someone is already answering */}
              <button 
                className="control-btn"
                style={{ 
                  backgroundColor: gameState.buzzer_locked ? '#3f3f46' : '#22c55e',
                  boxShadow: !gameState.buzzer_locked ? '0 0 15px #22c55e' : 'none',
                  opacity: isPlayerActive ? 0.5 : 1
                }} 
                onClick={() => socket.emit('arm_buzzer')}
                disabled={!gameState.buzzer_locked || isPlayerActive}
              >
                {gameState.buzzer_locked ? '🔓 Freigeben' : '✅ Aktiv'}
              </button>

              {/* Resolve Buttons: Only enabled if someone buzzed */}
              <button 
                className="control-btn" 
                style={{ background: '#16a34a' }} 
                onClick={() => socket.emit('resolve_question', { correct: true })} 
                disabled={!isPlayerActive}
              >
                Richtig (+)
              </button>
              
              <button 
                className="control-btn" 
                style={{ background: '#dc2626' }} 
                onClick={() => socket.emit('resolve_question', { correct: false })} 
                disabled={!isPlayerActive}
              >
                Falsch (-)
              </button>

              {/* Close Question: Disabled if someone is currently answering */}
              <button 
                className="control-btn" 
                style={{ 
                  background: '#52525b',
                  opacity: isPlayerActive ? 0.5 : 1 
                }} 
                onClick={() => socket.emit('close_question')}
                disabled={isPlayerActive}
              >
                Niemand wusste es
              </button>
            </div>
          </div>
        )}

        {role === 'player' && !gameState.buzzer_locked && !isPlayerActive && (
          <button className="buzzer-btn" onClick={() => socket.emit('buzz')}>JETZT BUZZERN!</button>
        )}

        {isPlayerActive && (
          <div style={{ color: '#fbbf24', fontSize: '2.2rem', marginTop: '30px', fontWeight: 'bold' }}>
            📢 {gameState.active_player.name} antwortet...
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionOverlay;