import React, { useState, useCallback } from 'react';
import '../css/SelectionScreen.css';

interface Props {
  /** Callback function to handle game entry logic */
  onJoin: (name: string, role: 'player' | 'moderator') => void;
}

/**
 * Initial landing screen where users provide their name 
 * and select their game role.
 */
const SelectionScreen: React.FC<Props> = ({ onJoin }) => {
  const [name, setName] = useState<string>('');

  /**
   * Validates input and triggers the join callback
   * @param role The chosen game role
   */
  const handleJoin = useCallback((role: 'player' | 'moderator') => {
    const trimmedName = name.trim();
    
    if (trimmedName) {
      onJoin(trimmedName, role);
    } else {
      alert("Please enter a name before joining!");
    }
  }, [name, onJoin]);

  /**
   * Keyboard handler to allow quick join via Enter key
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleJoin('player');
    }
  };

  return (
    <div className="selection-container">
      <div className="selection-card">
        <header className="selection-header">
          <h1>QUIZ DUEL SETUP</h1>
          <p>Enter your name to start the session</p>
        </header>

        <main className="selection-form">
          <input 
            className="selection-input" 
            type="text"
            placeholder="Your name..." 
            value={name}
            onChange={(e) => setName(e.target.value)} 
            onKeyDown={handleKeyDown}
            autoFocus 
            maxLength={20}
          />

          <button 
            className="btn-player" 
            onClick={() => handleJoin('player')}
            title="Join as a regular participant"
          >
            Join as Player (Enter)
          </button>
          
          <button 
            className="btn-mod" 
            onClick={() => handleJoin('moderator')}
            title="Join with administrative privileges"
          >
            Join as Moderator
          </button>
        </main>

        <footer className="selection-footer">
          <small>Ensure your camera is connected for the best experience.</small>
        </footer>
      </div>
    </div>
  );
};

export default SelectionScreen;