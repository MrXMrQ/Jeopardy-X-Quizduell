import React from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  volume: number;
  setVolume: (v: number) => void;
}

const SettingsMenu: React.FC<SettingsProps> = ({ isOpen, onClose, volume, setVolume }) => {
  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginTop: 0, color: '#a855f7', textAlign: 'center' }}>⚙️ Einstellungen</h2>
        
        <div style={{ margin: '30px 0' }}>
          <label style={{ display: 'block', marginBottom: '10px', color: 'white', fontWeight: 'bold' }}>
            Master-Lautstärke: {Math.round(volume * 100)}%
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume} 
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        <button 
          className="control-btn" 
          style={{ background: '#52525b', width: '100%', marginTop: '10px' }} 
          onClick={onClose}
        >
          Schließen
        </button>
      </div>
    </div>
  );
};

// --- Styles ---
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.8)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 9999
};

const modalStyle: React.CSSProperties = {
  background: '#18181b', padding: '30px', borderRadius: '15px',
  width: '300px', border: '2px solid #a855f7',
  boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
};

export default SettingsMenu;