import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

// WICHTIG: Ersetze diese IP mit der tatsächlichen IP deines Ubuntu-Servers
const SERVER_IP = '192.168.178.250';
const SERVER_PORT = '5000';
const socket: Socket = io(`http://${SERVER_IP}:${SERVER_PORT}`);

function App() {
  // TypeScript Hilfe: Wir sagen React, dass 'count' immer eine Nummer sein muss
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    // Wir hören auf den Server: Wenn er 'count_updated' ruft, aktualisieren wir unseren State
    socket.on('count_updated', (newCount: number) => {
      setCount(newCount);
    });

    // Clean-up Funktion: Schließt den Listener, wenn die App beendet wird
    return () => {
      socket.off('count_updated');
    };
  }, []);

  const handleIncrement = () => {
    // Wir senden nur den Befehl ans Python-Backend. 
    // Wir zählen hier lokal NICHT hoch, damit alle Geräte synchron bleiben!
    socket.emit('increment');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Jeopardy Global Counter</h1>
      <p style={styles.info}>Klicke den Button – alle anderen sehen es sofort!</p>
      
      <button 
        onClick={handleIncrement} 
        style={styles.button}
      >
        Globaler Zähler: {count}
      </button>
    </div>
  );
}

// Ein bisschen Styling direkt in der Datei (CSS-in-JS)
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#1a1a1a',
    color: 'white',
  },
  title: {
    fontSize: '3rem',
    marginBottom: '10px',
  },
  info: {
    color: '#888',
    marginBottom: '30px',
  },
  button: {
    padding: '20px 40px',
    fontSize: '1.5rem',
    cursor: 'pointer',
    backgroundColor: '#646cff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    transition: 'background-color 0.25s',
  }
};

export default App;