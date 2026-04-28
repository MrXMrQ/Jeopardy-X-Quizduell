import React, { useMemo } from 'react';
import '../css/QuestionOverlay.css';

interface Question {
  id: string;
  text: string;
  answer: string;
  value: number;
  image_main?: string;
  hints?: string[];
}

interface QuestionOverlayProps {
  gameState: {
    current_question: Question;
    buzzer_locked: boolean;
    active_player: { sid: string; name: string } | null;
    revealed_hints: number;
    question_revealed: boolean;
    is_resolved: boolean;
    remaining_questions: number; // Added from backend state
  };
  role: string;
  socket: any;
}

/**
 * QuestionOverlay Component
 * Handles the display of questions, blur effects, and the final resolution view.
 */
const QuestionOverlay: React.FC<QuestionOverlayProps> = ({ gameState, role, socket }) => {
  const question = gameState.current_question;
  const isResolved = gameState.is_resolved;
  const revealedHintsCount = gameState.revealed_hints || 0;
  const isModerator = role === 'moderator';
  const isPlayerActive = !!gameState.active_player;

  // Double Points Logic
  // The backend already decremented remaining_questions when this was opened, 
  // so if it was opened while there were 5 or fewer unplayed, we double it.
  // Actually, since the backend logic counts "unresolved" or "not in opened_questions",
  // we check if remaining <= 5.
  const isDouble = (gameState.remaining_questions || 99) <= 5;
  const displayValue = isDouble ? question.value * 2 : question.value;

  const forceShowEverything = isModerator || gameState.question_revealed || isResolved;

  const blurStyle = useMemo(() => ({
    filter: (!isModerator && !forceShowEverything) ? 'blur(25px)' : 'none',
    transition: 'filter 0.5s ease-in-out',
    userSelect: 'none' as const
  }), [isModerator, forceShowEverything]);

  return (
    <div className={`question-overlay ${isDouble ? 'double-points-active' : ''}`}>
      <div className={`question-box ${isDouble ? 'highlight-gold' : ''}`}>
        <header className="overlay-header">
          <h2 className="question-value">
            {isDouble && <span className="bonus-label">DOUBLE: </span>}
            {displayValue} Points
          </h2>
        </header>

        <main className="overlay-content">
          {/* Question Text */}
          <p className="question-text-display" style={blurStyle}>
            {question.text}
          </p>

          <div className="image-section">
            {/* Main Image */}
            {question.image_main && (
              <div className="main-image-wrapper" style={blurStyle}>
                <img src={question.image_main} className="main-quiz-image" alt="Quiz Visual" />
              </div>
            )}

            {/* Hint Gallery */}
            {question.hints && (
              <div className="hints-gallery">
                {question.hints.map((hintUrl, index) => (
                  (index < revealedHintsCount || isResolved) && (
                    <div key={index} className="hint-card fadeIn">
                      <img src={hintUrl} className="hint-image-clear" alt={`Hint ${index + 1}`} />
                      <span className="hint-label">Hint {index + 1}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Announcement when someone buzzed */}
          {isPlayerActive && !isResolved && (
            <div className="buzzer-announcement pulse">
              📢 {gameState.active_player?.name} is answering...
            </div>
          )}

          {/* Solution Banner */}
          {isResolved && (
            <div className="solution-banner fadeIn">
              <span className="solution-label">Lösung:</span>
              <span className="solution-text">{question.answer}</span>
            </div>
          )}
        </main>

        <footer className="overlay-footer">
          {isModerator ? (
            <div className="mod-controls">
              {!isResolved ? (
                <>
                  <p className="mod-answer-preview">Solution: {question.answer}</p>
                  <div className="control-group">
                    <button 
                      className={`btn-arm ${!gameState.buzzer_locked ? 'active' : ''}`}
                      onClick={() => socket.emit('arm_buzzer')}
                      disabled={!gameState.buzzer_locked || isPlayerActive}
                    >
                      {gameState.buzzer_locked ? '🔓 Unlock Buzzers' : '✅ Buzzers Armed'}
                    </button>

                    {question.hints && revealedHintsCount < question.hints.length && (
                      <button className="btn-hint" onClick={() => socket.emit('reveal_next_hint')} disabled={isPlayerActive}>
                        🔍 Reveal Hint
                      </button>
                    )}
                  </div>

                  <div className="resolution-group">
                    <button 
                      className="btn-correct" 
                      onClick={() => socket.emit('resolve_question', { correct: true })} 
                      disabled={!isPlayerActive}
                    >
                      Correct (+)
                    </button>
  
                    <button 
                      className="btn-wrong" 
                      onClick={() => socket.emit('resolve_question', { correct: false })} 
                      disabled={!isPlayerActive}
                    >
                      Wrong (-)
                    </button>

                    <button 
                      className="btn-skip" 
                      onClick={() => socket.emit('close_question')}
                      disabled={isPlayerActive}
                    >
                      Skip Question
                    </button>
                  </div>
                </>
              ) : (
                <div className="post-resolve-controls">
                  <button className="btn-close-overlay pulse" onClick={() => socket.emit('close_question')}>
                    Overlay schließen & weiter ➔
                  </button>
                </div>
              )}
            </div>
          ) : (
            (!isPlayerActive && !gameState.buzzer_locked && !isResolved) && (
              <button className="big-buzzer" onClick={() => socket.emit('buzz')}>
                BUZZ!
              </button>
            )
          )}
        </footer>
      </div>
    </div>
  );
};

export default QuestionOverlay;