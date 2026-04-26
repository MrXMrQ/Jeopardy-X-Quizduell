import React from 'react';

interface OverlayProps {
  question: any;
  isModerator: boolean;
  showAnswer: boolean;
  activePlayer: any;
  buzzerLocked: boolean;
  socket: any;
}

const QuestionOverlay: React.FC<OverlayProps> = ({ question, isModerator, showAnswer, activePlayer, buzzerLocked, socket }) => {
  return (
    <div style={styles.overlay}>
      <h2 style={styles.value}>{question.value} Punkte</h2>
      <p style={styles.text}>{question.text}</p>
      
      {showAnswer && <p style={styles.answer}>Antwort: {question.answer}</p>}

      {activePlayer && (
        <div style={styles.buzzerInfo}>
          🔔 {activePlayer.name} hat gebuzzert!
        </div>
      )}

      <div style={styles.controls}>
        {isModerator ? (
          <>
            <button onClick={() => socket.emit('arm_buzzer')}>Buzzer Freischalten</button>
            <button onClick={() => socket.emit('toggle_answer')}>Antwort zeigen</button>
            <button onClick={() => socket.emit('resolve_question', { correct: true })} style={{backgroundColor: 'green'}}>Richtig</button>
            <button onClick={() => socket.emit('resolve_question', { correct: false })} style={{backgroundColor: 'red'}}>Falsch</button>
            <button onClick={() => socket.emit('close_question')}>Frage überspringen</button>
          </>
        ) : (
          !activePlayer && !buzzerLocked && (
            <button style={styles.bigBuzzer} onClick={() => socket.emit('buzz')}>BUZZ</button>
          )
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 100 },
  value: { fontSize: '2rem', color: '#fbbf24' },
  text: { fontSize: '3rem', textAlign: 'center', maxWidth: '80%' },
  answer: { fontSize: '2rem', color: '#22c55e', marginTop: '20px' },
  buzzerInfo: { fontSize: '2rem', backgroundColor: '#ef4444', padding: '10px 40px', borderRadius: '50px', margin: '20px' },
  controls: { marginTop: '40px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' },
  bigBuzzer: { width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'red', fontSize: '2rem', cursor: 'pointer', border: 'none', color: 'white', fontWeight: 'bold' }
} as const;

export default QuestionOverlay;