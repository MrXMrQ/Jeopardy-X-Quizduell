import React from 'react';
import '../css/GameBoard.css';

interface BoardProps {
  boardData: any;
  openedQuestions: string[];
  isModerator: boolean;
  onSelectQuestion: (id: string) => void;
}

const GameBoard: React.FC<BoardProps> = ({ boardData, openedQuestions, isModerator, onSelectQuestion }) => {
  return (
    <div className="board-grid">
      {boardData.categories.map((cat: any, i: number) => (
        <div key={i} className="board-column">
          <div className="category-header">{cat.name}</div>
          {cat.questions.map((q: any) => {
            const isPlayed = openedQuestions.includes(q.id);
            const isSelectable = isModerator && !isPlayed;

            const cellClass = `question-cell ${isPlayed ? 'played' : ''} ${isSelectable ? 'selectable' : ''}`;

            return (
              <div
                key={q.id}
                onClick={() => isSelectable && onSelectQuestion(q.id)}
                className={cellClass}
              >
                {q.value}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GameBoard;