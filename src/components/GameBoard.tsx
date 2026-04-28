import React from 'react';

interface GameBoardProps {
  gameState: any;
  role: string;
  socket: any;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, role, socket }) => {
  return (
    <div className="board-grid">
      {gameState.board.categories.map((cat: any) => (
        <div key={cat.name} className="board-column">
          <div className="category-header">{cat.name}</div>
          {cat.questions.map((q: any) => {
            const isPlayed = gameState.opened_questions.includes(q.id);
            const cardClass = `question-card ${isPlayed ? 'played' : 'active'}`;
            
            return (
              <div 
                key={q.id}
                className={cardClass}
                style={{ 
                  cursor: (role === 'moderator' && !isPlayed) ? 'pointer' : 'default' 
                }}
                onClick={() => role === 'moderator' && !isPlayed && socket.emit('open_question', { question_id: q.id })}
              >
                {isPlayed ? "X" : q.value}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GameBoard;