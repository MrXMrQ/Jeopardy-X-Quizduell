import React from 'react';
import '../css/QuestionOverlay.css';

interface OverlayProps {
  question: any;
  isModerator: boolean;
  showAnswer: boolean;
  activePlayer: any;
  buzzerLocked: boolean;
  socket: any;
}

const QuestionOverlay: React.FC<OverlayProps> = ({ 
  question, 
  isModerator, 
  showAnswer, 
  activePlayer, 
  buzzerLocked, 
  socket 
}) => {
  return (
    <div className="question-overlay">
      <h2 className="question-value">{question.value} Punkte</h2>
      <p className="question-text">{question.text}</p>
      
      {showAnswer && <p className="question-answer">Antwort: {question.answer}</p>}

      {activePlayer && (
        <div className="buzzer-info">
          🔔 {activePlayer.name} hat gebuzzert!
        </div>
      )}

      <div className="controls">
        {isModerator ? (
          <>
            <button onClick={() => socket.emit('arm_buzzer')}>Buzzer Freischalten</button>
            <button onClick={() => socket.emit('toggle_answer')}>Antwort zeigen</button>
            <button 
              className="btn-correct" 
              onClick={() => socket.emit('resolve_question', { correct: true })}
            >
              Richtig
            </button>
            <button 
              className="btn-wrong" 
              onClick={() => socket.emit('resolve_question', { correct: false })}
            >
              Falsch
            </button>
            <button onClick={() => socket.emit('close_question')}>Frage überspringen</button>
          </>
        ) : (
          !activePlayer && !buzzerLocked && (
            <button className="big-buzzer" onClick={() => socket.emit('buzz')}>
              BUZZ
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default QuestionOverlay;