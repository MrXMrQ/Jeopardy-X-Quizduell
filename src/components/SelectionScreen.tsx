import React, { useState } from 'react';

interface Props {
  onJoin: (name: string, role: 'player' | 'moderator') => void;
}

const SelectionScreen: React.FC<Props> = ({ onJoin }) => {
  const [name, setName] = useState('');

  // Hilfsfunktion, um leere Namen zu verhindern
  const handleJoinAsPlayer = () => {
    if (name.trim()) {
      onJoin(name, 'player');
    } else {
      alert("Bitte gib einen Namen ein!");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={{ color: '#a855f7' }}>QUIZ DUELL SETUP</h1>
        <input 
          style={styles.input} 
          placeholder="Dein Name..." 
          value={name}
          onChange={(e) => setName(e.target.value)} 
          // NEU: Enter-Taste abfangen
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleJoinAsPlayer();
            }
          }}
          autoFocus // Cursor direkt im Feld beim Laden
        />
        <button style={styles.btnPlayer} onClick={handleJoinAsPlayer}>
          Als Spieler beitreten (Enter)
        </button>
        
        <button style={styles.btnMod} onClick={() => onJoin(name, 'moderator')}>
          Als Moderator beitreten
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121212' },
  card: { padding: '40px', background: '#1e1e1e', borderRadius: '20px', display: 'flex', flexDirection: 'column' as const, gap: '15px', width: '350px' },
  input: { padding: '15px', borderRadius: '10px', border: 'none', fontSize: '1rem', outline: 'none' },
  btnPlayer: { padding: '15px', background: '#a855f7', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  btnMod: { padding: '15px', background: '#444', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }
};

export default SelectionScreen;