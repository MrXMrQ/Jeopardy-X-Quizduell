import React from 'react';
import '../css/GameBoard.css';


interface GameBoardProps {
  gameState: any;
  role: string;
  socket: any;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, role, socket }) => {
  // Check if we are in the final 5 questions
  const remainingQuestions = gameState.remaining_questions || 0;
  const isDoublePhase = remainingQuestions <= 5 && remainingQuestions > 0;

  return (
    <div className="board-grid">
      {gameState.board.categories.map((cat: any) => (
        <div key={cat.name} className="board-column">
          <div className="category-header">{cat.name}</div>
          {cat.questions.map((q: any) => {
            const isPlayed = gameState.opened_questions.includes(q.id);
            
            // Add final-countdown highlight class if double phase is active
            const cardClass = `question-card ${isPlayed ? 'played' : 'active'} ${
              isDoublePhase && !isPlayed ? 'final-countdown' : ''
            }`;
            
            return (
              <div 
                key={q.id}
                className={cardClass}
                style={{ 
                  cursor: (role === 'moderator' && !isPlayed) ? 'pointer' : 'default',
                  position: 'relative' // Needed for absolute positioning of the badge
                }}
                onClick={() => role === 'moderator' && !isPlayed && socket.emit('open_question', { question_id: q.id })}
              >
                {isPlayed ? "X" : q.value}
                
                {/* Badge for Double Points */}
                {isDoublePhase && !isPlayed && (
                  <div className="double-badge">x2</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GameBoard;