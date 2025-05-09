import React from 'react';
import './styles.css';

const VoiceControl = ({ enabled, onToggle }) => {
  return (
    <div className="voice-control">
      <button
        className={`voice-toggle ${enabled ? 'voice-on' : 'voice-off'}`}
        onClick={onToggle}
        aria-label={enabled ? 'Desactivar voz' : 'Activar voz'}
        title={enabled ? 'Desactivar voz' : 'Activar voz'}
      >
        {enabled ? (
          <span role="img" aria-label="Voz activada">🔊</span>
        ) : (
          <span role="img" aria-label="Voz desactivada">🔇</span>
        )}
      </button>
      <span className="voice-label">
        {enabled ? 'Voz: Activada' : 'Voz: Desactivada'}
      </span>
    </div>
  );
};

export default VoiceControl; 