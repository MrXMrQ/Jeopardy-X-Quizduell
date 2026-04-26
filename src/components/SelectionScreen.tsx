import React, { useState } from 'react';

interface Props {
  onJoin: (name: string, role: 'player' | 'moderator') => void;
}

const SelectionScreen: React.FC<Props> = ({ onJoin }) => {
  const [name, setName] = useState('');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={{ color: '#a855f7' }}>QUIZ DUELL SETUP</h1>
        <input 
          style={styles.input} 
          placeholder="Dein Name..." 
          onChange={(e) => setName(e.target.value)} 
        />
        <button style={styles.btnPlayer} onClick={() => onJoin(name, 'player')}>Als Spieler beitreten</button>
        <button style={styles.btnMod} onClick={() => onJoin(name, 'moderator')}>Als Moderator beitreten</button>
      </div>
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121212' },
  card: { padding: '40px', background: '#1e1e1e', borderRadius: '20px', display: 'flex', flexDirection: 'column' as const, gap: '15px', width: '350px' },
  input: { padding: '15px', borderRadius: '10px', border: 'none', fontSize: '1rem' },
  btnPlayer: { padding: '15px', background: '#a855f7', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  btnMod: { padding: '15px', background: '#444', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }
};

export default SelectionScreen;