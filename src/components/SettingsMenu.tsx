import React from 'react';
import '../css/SettingsMenu.css';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  volume: number;
  setVolume: (v: number) => void;
}

const SettingsMenu: React.FC<SettingsProps> = ({ isOpen, onClose, volume, setVolume }) => {
  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      {/* stopPropagation prevents closing when clicking inside the modal */}
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="settings-title">⚙️ Einstellungen</h2>
        
        <div className="settings-group">
          <label className="settings-label">
            Master-Lautstärke: {Math.round(volume * 100)}%
          </label>
          <input 
            type="range" 
            className="volume-slider"
            min="0" 
            max="1" 
            step="0.01" 
            value={volume} 
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </div>

        <button 
          className="control-btn settings-close-btn" 
          onClick={onClose}
        >
          Schließen
        </button>
      </div>
    </div>
  );
};

export default SettingsMenu;