import React, { useMemo } from 'react';
import '../css/QuestionOverlay.css';

/**
 * Interface for the active player data structure
 */
interface ActivePlayer {
  sid: string;
  name: string;
}

/**
 * Interface for the question data structure
 */
interface Question {
  id: string;
  text: string;
  answer: string;
  value: number;
}

interface OverlayProps {
  question: Question;
  isModerator: boolean;
  activePlayer: ActivePlayer | null;
  buzzerLocked: boolean;
  socket: any;
}

/**
 * QuestionOverlay component displays the current question, 
 * provides moderator controls, and the player buzzer.
 */
const QuestionOverlay: React.FC<OverlayProps> = ({ 
  question, 
  isModerator, 
  activePlayer, 
  buzzerLocked, 
  socket 
}) => {

  /**
   * Determine the visual state of the question text.
   * Blurs the text for players until the moderator arms the buzzers.
   */
  const textStyle = useMemo(() => ({
    filter: (!isModerator && buzzerLocked) ? 'blur(15px)' : 'none',
    transition: 'filter 0.4s ease-in-out',
    userSelect: 'none' as const
  }), [isModerator, buzzerLocked]);

  return (
    <div className="question-overlay">
      <header className="overlay-header">
        <h2 className="question-value">{question.value} Points</h2>
      </header>

      <main className="overlay-content">
        <p className="question-text" style={textStyle}>
          {question.text}
        </p>

        {/* The answer is always visible to the moderator for reading out loud */}
        {isModerator && (
          <div className="moderator-answer">
            <strong>Correct Answer:</strong> {question.answer}
          </div>
        )}

        {activePlayer && (
          <div className="buzzer-announcement">
            <span className="buzzer-icon">🔔</span>
            <span className="buzzer-name">{activePlayer.name} is answering!</span>
          </div>
        )}
      </main>

      <footer className="overlay-controls">
        {isModerator ? (
          <div className="admin-actions">
            <button 
              className={`btn-arm ${!buzzerLocked ? 'active' : ''}`}
              onClick={() => socket.emit('arm_buzzer')}
              disabled={!buzzerLocked}
            >
              {buzzerLocked ? '🔓 Open Buzzers' : '✅ Buzzers Active'}
            </button>

            <div className="resolution-group">
              <button 
                className="btn-correct" 
                onClick={() => socket.emit('resolve_question', { correct: true })}
                disabled={!activePlayer}
              >
                Correct (+)
              </button>
              
              <button 
                className="btn-wrong" 
                onClick={() => socket.emit('resolve_question', { correct: false })}
                disabled={!activePlayer}
              >
                Wrong (-)
              </button>
            </div>

            <button 
              className="btn-skip" 
              onClick={() => socket.emit('close_question')}
            >
              Nobody Knew
            </button>
          </div>
        ) : (
          /* Player View: Only show buzzer if unlocked and no one has buzzed yet */
          !activePlayer && !buzzerLocked && (
            <button className="big-buzzer" onClick={() => socket.emit('buzz')}>
              BUZZ NOW!
            </button>
          )
        )}
      </footer>
    </div>
  );
};

export default QuestionOverlay;