import React from 'react';

interface Props {
  name: string;
  points: number;
  isBuzzed: boolean;
}

const PlayerCard: React.FC<Props> = ({ name, points, isBuzzed }) => {
  return (
    <div style={{
      ...styles.card,
      border: isBuzzed ? '4px solid #22c55e' : '2px solid #333'
    }}>
      <div style={styles.videoPlaceholder}>
        {isBuzzed && <div style={styles.buzzerBadge}>🔔 GEBUZZERT</div>}
      </div>
      <div style={styles.statsBar}>
        <span style={styles.name}>{name}:</span>
        <span style={styles.points}>{points}</span>
      </div>
    </div>
  );
};

const styles = {
  card: { width: '280px', borderRadius: '12px', overflow: 'hidden', background: '#000', transition: 'all 0.2s' },
  videoPlaceholder: { height: '160px', background: '#111', position: 'relative' as const, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  buzzerBadge: { position: 'absolute' as const, top: '10px', background: '#22c55e', color: 'white', padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '0.8rem' },
  statsBar: { height: '45px', background: '#581c87', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'white', fontWeight: 'bold', fontSize: '1.1rem' },
  name: { color: '#fff' },
  points: { color: '#a855f7', background: '#fff', padding: '2px 8px', borderRadius: '5px' }
};

export default PlayerCard;