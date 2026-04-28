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
    is_resolved: boolean; // Flag from backend
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

  // Visual helper: Show everything clearly if moderator is viewing, 
  // if the question was revealed, or if it has been solved.
  const forceShowEverything = isModerator || gameState.question_revealed || isResolved;

  /**
   * Blur style for text and main image.
   * Stays blurred only for players until the question is revealed or resolved.
   */
  const blurStyle = useMemo(() => ({
    filter: (!isModerator && !forceShowEverything) ? 'blur(25px)' : 'none',
    transition: 'filter 0.5s ease-in-out',
    userSelect: 'none' as const
  }), [isModerator, forceShowEverything]);

  return (
    <div className="question-overlay">
      <div className="question-box">
        <header className="overlay-header">
          <h2 className="question-value">{question.value} Points</h2>
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

            {/* Hint Gallery: Shown clear if revealed manually OR if the question is resolved */}
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

          {/* Solution Banner: Only visible after moderator marked it as correct */}
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
                /* Normal Phase: Controls to arm buzzers, reveal hints or resolve */
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
                    {/* Correct/Wrong: Nur aktiv, WENN jemand gebuzzert hat */}
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

                    {/* Skip: Nur aktiv, wenn NIEMAND gebuzzert hat */}
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
                /* Resolved Phase: Only the close button to return to the board */
                <div className="post-resolve-controls">
                  <button className="btn-close-overlay pulse" onClick={() => socket.emit('close_question')}>
                    Overlay schließen & weiter ➔
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Player View: Buzzer */
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