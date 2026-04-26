import React from 'react';

interface BoardProps {
  boardData: any;
  openedQuestions: string[];
  isModerator: boolean;
  onSelectQuestion: (id: string) => void;
}

const GameBoard: React.FC<BoardProps> = ({ boardData, openedQuestions, isModerator, onSelectQuestion }) => {
  return (
    <div style={styles.grid}>
      {boardData.categories.map((cat: any, i: number) => (
        <div key={i} style={styles.column}>
          <div style={styles.catHeader}>{cat.name}</div>
          {cat.questions.map((q: any) => {
            const isPlayed = openedQuestions.includes(q.id);
            return (
              <div
                key={q.id}
                onClick={() => !isPlayed && isModerator && onSelectQuestion(q.id)}
                style={{
                  ...styles.questionCell,
                  opacity: isPlayed ? 0.2 : 1,
                  cursor: isModerator && !isPlayed ? 'pointer' : 'default'
                }}
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

const styles = {
  grid: { display: 'flex', gap: '15px', justifyContent: 'center', padding: '20px' },
  column: { display: 'flex', flexDirection: 'column', gap: '10px', width: '160px' },
  catHeader: { backgroundColor: '#a855f7', color: 'white', padding: '15px 5px', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem' },
  questionCell: { backgroundColor: '#4c1d95', color: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }
} as const;

export default GameBoard;