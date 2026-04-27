import React, { useState } from 'react';
import '../css/SelectionScreen.css';

interface Props {
  onJoin: (name: string, role: 'player' | 'moderator') => void;
}

const SelectionScreen: React.FC<Props> = ({ onJoin }) => {
  const [name, setName] = useState('');

  const handleJoinAsPlayer = () => {
    if (name.trim()) {
      onJoin(name, 'player');
    } else {
      alert("Bitte gib einen Namen ein!");
    }
  };

  return (
    <div className="selection-container">
      <div className="selection-card">
        <h1>QUIZ DUELL SETUP</h1>
        <input 
          className="selection-input" 
          placeholder="Dein Name..." 
          value={name}
          onChange={(e) => setName(e.target.value)} 
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleJoinAsPlayer();
            }
          }}
          autoFocus 
        />
        <button className="btn-player" onClick={handleJoinAsPlayer}>
          Als Spieler beitreten (Enter)
        </button>
        
        <button className="btn-mod" onClick={() => onJoin(name, 'moderator')}>
          Als Moderator beitreten
        </button>
      </div>
    </div>
  );
};

export default SelectionScreen;