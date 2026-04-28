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
  };
  role: string;
  socket: any;
}

/**
 * QuestionOverlay Component
 * Displays the question text, blurred main image, and clear hints.
 */
const QuestionOverlay: React.FC<QuestionOverlayProps> = ({ gameState, role, socket }) => {
  const question = gameState.current_question;
  const revealedHintsCount = gameState.revealed_hints || 0;
  const isModerator = role === 'moderator';
  const isPlayerActive = !!gameState.active_player;

  /**
   * Memoized style for the main question elements (Text and Main Image).
   * Blurred for players until the moderator unlocks the buzzers.
   */
  const blurStyle = useMemo(() => ({
    filter: (!isModerator && !gameState.question_revealed) ? 'blur(20px)' : 'none',
    transition: 'filter 0.5s ease-in-out',
    userSelect: 'none' as const
  }), [isModerator, gameState.question_revealed]);

  return (
    <div className="question-overlay">
      <div className="question-box">
        <header className="overlay-header">
          <h2 className="question-value">{question.value} Points</h2>
        </header>

        <main className="overlay-content">
          {/* Question Text with Blur Logic */}
          <p className="question-text-display" style={blurStyle}>
            {question.text}
          </p>

          <div className="image-section">
            {/* Main Image with Blur Logic */}
            {question.image_main && (
              <div className="main-image-wrapper" style={blurStyle}>
                <img src={question.image_main} className="main-quiz-image" alt="Quiz Visual" />
              </div>
            )}

            {/* Hint Gallery: Revealed hints are shown CLEAR (no blur) */}
            {question.hints && (
              <div className="hints-gallery">
                {question.hints.map((hintUrl, index) => (
                  index < revealedHintsCount && (
                    <div key={index} className="hint-card fadeIn">
                      <img src={hintUrl} className="hint-image-clear" alt={`Hint ${index + 1}`} />
                      <span className="hint-label">Hint {index + 1}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          {isPlayerActive && (
            <div className="buzzer-announcement pulse">
              📢 {gameState.active_player?.name} is answering...
            </div>
          )}
        </main>

        <footer className="overlay-footer">
          {isModerator ? (
            <div className="mod-controls">
              <p className="mod-answer-preview">
                <strong>Solution:</strong> {question.answer}
              </p>

              <div className="control-group">
                <button 
                  className={`btn-arm ${!gameState.buzzer_locked ? 'active' : ''}`}
                  onClick={() => socket.emit('arm_buzzer')}
                  disabled={!gameState.buzzer_locked || isPlayerActive}
                >
                  {gameState.buzzer_locked ? '🔓 Unlock Buzzers' : '✅ Buzzers Armed'}
                </button>

                {/* Hint Button for Moderator */}
                {question.hints && revealedHintsCount < question.hints.length && (
                  <button 
                    className="btn-hint"
                    onClick={() => socket.emit('reveal_next_hint')}
                    disabled={isPlayerActive}
                  >
                    🔍 Show Next Hint ({revealedHintsCount}/{question.hints.length})
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
            </div>
          ) : (
            /* Player View: Buzzer only shown if unlocked and no one active */
            (!isPlayerActive && !gameState.buzzer_locked) && (
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