import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
// Versuche es mit .tsx Endung, falls der Fehler bleibt
import SelectionScreen from './components/SelectionScreen.tsx';
import GameContainer from './components/GameContainer.tsx';

const SERVER_IP = '192.168.178.250';
const SERVER_PORT = '5000';
// Wir initialisieren den Socket außerhalb oder in einem UseEffect, 
// damit er nicht bei jedem Rerender neu erstellt wird
const socket: Socket = io(`http://${SERVER_IP}:${SERVER_PORT}`);

function App() {
  const [joined, setJoined] = useState(false);
  const [role, setRole] = useState<'player' | 'moderator'>('player');
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      console.log("Verbunden mit Server ID:", socket.id);
    });

    socket.on('disconnect', () => {
      console.log("Verbindung verloren.");
      setJoined(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const handleJoin = (name: string, selectedRole: 'player' | 'moderator') => {
    if (!name && selectedRole === 'player') {
      alert("Bitte gib einen Namen ein!");
      return;
    }

    const finalName = name || "Moderator";
    setPlayerName(finalName);
    setRole(selectedRole);

    socket.emit('join_game', {
      name: finalName,
      role: selectedRole
    });

    setJoined(true);
  };

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      {!joined ? (
        <SelectionScreen onJoin={handleJoin} />
      ) : (
        /* Wir übergeben playerName hier, damit die Warnung verschwindet */
        <GameContainer socket={socket} role={role} userName={playerName} />
      )}
    </div>
  );
}

export default App;